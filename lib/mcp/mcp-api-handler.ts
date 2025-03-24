import getRawBody from 'raw-body';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { IncomingHttpHeaders } from 'node:http';
import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Redis } from '@upstash/redis';
import { Socket } from 'node:net';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import * as http from 'node:http';

// Default max duration for the function (in seconds)
const DEFAULT_MAX_DURATION = 60;

interface SerializedRequest {
  requestId: string;
  url: string;
  method: string;
  body: string;
  headers: IncomingHttpHeaders;
}

/**
 * Validates the authentication token
 * In a production environment, this would validate against a secure token store
 */
async function validateToken(token: string): Promise<boolean> {
  // For development, you can return true or use a simple validation
  // In production, implement proper token validation
  return (
    token === process.env.MCP_AUTH_TOKEN ||
    process.env.NODE_ENV !== 'production'
  );
}

export function initializeMcpApiHandler(
  initializeServer: (server: McpServer) => void,
  serverOptions: Record<string, unknown> = {},
) {
  // Read max duration from environment or use default
  const maxDuration = Number.parseInt(
    process.env.MCP_MAX_DURATION || String(DEFAULT_MAX_DURATION),
    10,
  );

  // Get Redis URL from environment variables
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl) {
    throw new Error(
      'Redis URL environment variable (REDIS_URL or UPSTASH_REDIS_REST_URL) is not set',
    );
  }

  if (!redisToken) {
    throw new Error(
      'Redis token (KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN) is not set',
    );
  }

  // Initialize Redis clients
  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  // Create a second client for publishing
  const redisPublisher = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  // Store active servers and transports
  const activeConnections = new Map<
    string,
    { server: McpServer; transport: SSEServerTransport }
  >();

  // Add authentication middleware
  const authenticate = async (req: IncomingMessage) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Validate token
    const isValid = await validateToken(token);

    if (!isValid) {
      throw new Error('Invalid authentication token');
    }

    return true;
  };

  // Function to manually store server state in Redis
  const storeServerState = async (connectionId: string, data: unknown) => {
    await redis.set(`mcp:state:${connectionId}`, JSON.stringify(data));
  };

  return async function mcpApiHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    const url = new URL(req.url || '', 'https://example.com');

    // Handle SSE connections (connect to the server)
    if (url.pathname === '/sse') {
      try {
        await authenticate(req);
        // Add proper headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        // Generate proper connection ID using UUIDs
        const connectionId = crypto.randomUUID();

        // Create transport with post message endpoint for better SDK compliance
        const transport = new SSEServerTransport('/api/mcp/server', res);

        // Store in Redis for state persistence
        await redis.hset(`mcp:connections:${connectionId}`, {
          createdAt: Date.now(),
          active: true,
        });

        // Log setup
        const logContext = `[${connectionId}]`;
        console.log(`${logContext} Setting up SSE connection`);

        try {
          // Create an MCP server instance with required parameters
          const server = new McpServer({
            name: 'MCP-Server',
            version: '1.0.0',
            ...serverOptions,
          });

          // Set up the server with provided configuration
          initializeServer(server);

          // Store the connection
          activeConnections.set(connectionId, { server, transport });

          // Set up Redis channel for this connection's context
          const contextKey = `mcp:context:${connectionId}`;

          // Implement proper state management
          const saveState = async (data: unknown) => {
            await redis.set(contextKey, JSON.stringify(data));
          };

          const loadState = async () => {
            const state = await redis.get(contextKey);
            return state ? JSON.parse(state as string) : null;
          };

          // Load previous state if needed - manual approach
          // Since the SDK doesn't expose direct state management methods,
          // we'll use Redis to track session state independently
          const previousState = await loadState();
          if (previousState) {
            // We can't directly load state into the server
            // We can use this data for application-specific state management
            console.log(`${logContext} Previous state found`);
          }

          // Connect the server to the transport
          await server.connect(transport);

          // Set up cleanup on connection close
          const cleanup = async () => {
            try {
              console.log(`${logContext} Cleaning up connection`);

              // Remove from active connections
              activeConnections.delete(connectionId);

              // Clean up Redis context
              await redis.del(contextKey);

              console.log(`${logContext} Connection cleaned up`);
            } catch (error) {
              console.error(`${logContext} Error during cleanup:`, error);
            }
          };

          // Handle connection close
          req.socket?.on('close', cleanup);

          // Keep connection alive with heartbeats
          const heartbeatInterval = setInterval(() => {
            res.write(': heartbeat\n\n');
          }, 30000);

          // Clean up interval on close
          req.socket?.on('close', () => clearInterval(heartbeatInterval));

          console.log(`${logContext} SSE connection established`);
        } catch (error) {
          console.error(`Error setting up SSE connection:`, error);
          res.statusCode = 500;
          res.end('Error setting up SSE connection');
        }

        return;
      } catch (error) {
        console.error(`Error setting up SSE connection:`, error);
        res.statusCode = 401;
        res.end('Unauthorized');
        return;
      }
    }

    // Handle message requests (for SSE client messages)
    if (req.method === 'POST') {
      try {
        // Parse the request body
        const body = await getRawBody(req);
        const messageText = body.toString();

        try {
          // Parse the message
          const message = JSON.parse(messageText);

          // Extract connection ID from headers or query
          // In a real implementation, you would use a proper session/connection ID system
          const connectionId =
            (req.headers['x-connection-id'] as string) ||
            url.searchParams.get('connectionId') ||
            'default';

          // Get the active connection for this ID
          const connection = activeConnections.get(connectionId);

          if (!connection) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Connection not found' }));
            return;
          }

          // Process the message through the transport
          await connection.transport.handlePostMessage(req, res);
        } catch (parseError) {
          console.error('Error parsing message:', parseError);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
        }
      } catch (error) {
        console.error('Error handling message request:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }

      return;
    }

    // For other requests, return method not allowed
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  };
}

interface FakeIncomingMessageOptions {
  method?: string;
  url?: string;
  headers?: IncomingHttpHeaders;
  body?: string | Buffer | Record<string, any> | null;
  socket?: Socket;
}

// Helper to create a fake IncomingMessage for SSE transport
function createFakeIncomingMessage(
  options: FakeIncomingMessageOptions = {},
): IncomingMessage {
  const { method = 'GET', url = '/', headers = {}, body = null } = options;

  // Create a readable stream for the request body
  const bodyStream = new Readable();
  bodyStream._read = () => {};

  if (body) {
    const bodyString =
      typeof body === 'object' && !(body instanceof Buffer)
        ? JSON.stringify(body)
        : body instanceof Buffer
          ? body.toString()
          : String(body);
    bodyStream.push(bodyString);
  }

  bodyStream.push(null);

  // Create a socket if not provided
  const socket = options.socket || new Socket();

  // Create and return a fake IncomingMessage
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = url;

  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    req.headers[key.toLowerCase()] = value;
  });

  return req;
}
