import getRawBody from 'raw-body';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  IncomingMessage,
  type ServerResponse,
  type IncomingHttpHeaders,
} from 'node:http';
import { Redis } from '@upstash/redis';
import { Socket } from 'node:net';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import {
  createRedisClient,
  validateRedisConnection,
} from '../redis/redis-client';

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

export async function initializeMcpApiHandler(
  initializeServer: (server: McpServer) => void,
  serverOptions: Record<string, unknown> = {},
) {
  // Read max duration from environment or use default
  const maxDuration = Number.parseInt(
    process.env.MCP_MAX_DURATION || String(DEFAULT_MAX_DURATION),
    10,
  );

  // Initialize Redis client using our factory
  console.log('Initializing Redis for MCP state management...');
  let redis: ReturnType<typeof createRedisClient>;
  let redisPublisher: ReturnType<typeof createRedisClient>;

  try {
    // Create main Redis client with fallback for development
    redis = createRedisClient({
      allowFallback: process.env.NODE_ENV === 'development',
      retries: 3,
    });

    // Create publisher client (for pub/sub if needed)
    redisPublisher = createRedisClient({
      allowFallback: process.env.NODE_ENV === 'development',
      retries: 3,
    });

    // For Redis client (not in-memory fallback), validate connection
    if (redis instanceof Redis) {
      const isValid = await validateRedisConnection(redis);
      if (!isValid && process.env.NODE_ENV !== 'development') {
        throw new Error('Redis connection validation failed');
      }
    }

    console.log('Redis initialization complete');
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Redis initialization failed in development mode, using in-memory store:',
        error instanceof Error ? error.message : String(error),
      );
      // Will use in-memory fallback
    } else {
      // In production, fail if Redis is not available
      console.error('Redis initialization failed:', error);
      throw new Error(
        `Failed to initialize Redis for MCP: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

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
      const logContext = '[SSE]';
      try {
        console.log(`${logContext} Starting SSE connection setup...`);
        await authenticate(req);

        // Add proper headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        // Generate proper connection ID using UUIDs
        const connectionId = crypto.randomUUID();
        console.log(
          `${logContext} New SSE connection with ID: ${connectionId}`,
        );

        // Create transport with post message endpoint for better SDK compliance
        const transport = new SSEServerTransport('/api/mcp/server', res);

        // Define connectionLogContext at the top level of the try block
        const connectionLogContext = `[${connectionId}]`;

        try {
          // Store in Redis for state persistence
          await redis.hset(`mcp:connections:${connectionId}`, {
            createdAt: Date.now(),
            active: true,
          });

          // Log setup
          console.log(`${connectionLogContext} Setting up SSE connection`);

          // Create an MCP server instance with required parameters
          const server = new McpServer({
            name: 'MCP-Server',
            version: '1.0.0',
            capabilities: {
              resources: {},
              tools: {},
              prompts: {},
            },
            ...serverOptions,
          });

          // Set up the server with provided configuration
          try {
            initializeServer(server);
            console.log(
              `${connectionLogContext} Server initialized successfully`,
            );
          } catch (initError) {
            console.error(
              `${connectionLogContext} Server initialization failed:`,
              initError,
            );
            throw new Error(
              `Server initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`,
            );
          }

          // Store the connection
          activeConnections.set(connectionId, { server, transport });
          console.log(
            `${connectionLogContext} Connection stored in active connections`,
          );

          // Set up Redis channel for this connection's context
          const contextKey = `mcp:context:${connectionId}`;

          // Implement proper state management
          const saveState = async (data: unknown) => {
            try {
              await redis.set(contextKey, JSON.stringify(data));
              console.log(`${connectionLogContext} State saved successfully`);
            } catch (error) {
              console.error(
                `${connectionLogContext} Error saving state:`,
                error,
              );
              throw error;
            }
          };

          const loadState = async () => {
            try {
              const state = await redis.get(contextKey);
              return state ? JSON.parse(state as string) : null;
            } catch (error) {
              console.error(
                `${connectionLogContext} Error loading state:`,
                error,
              );
              return null;
            }
          };

          // Load previous state if needed
          const previousState = await loadState();
          if (previousState) {
            console.log(
              `${connectionLogContext} Previous state found and loaded`,
            );
          }

          // Connect the server to the transport
          try {
            await server.connect(transport);
            console.log(
              `${connectionLogContext} Server connected to transport successfully`,
            );
          } catch (connectError) {
            console.error(
              `${connectionLogContext} Failed to connect server to transport:`,
              connectError,
            );
            throw new Error(
              `Transport connection failed: ${connectError instanceof Error ? connectError.message : String(connectError)}`,
            );
          }

          // Set up cleanup on connection close
          const cleanup = async () => {
            try {
              console.log(
                `${connectionLogContext} Starting connection cleanup`,
              );

              // Remove from active connections
              activeConnections.delete(connectionId);
              console.log(
                `${connectionLogContext} Removed from active connections`,
              );

              // Clean up Redis context
              await redis.del(contextKey);
              console.log(`${connectionLogContext} Redis context cleaned up`);

              console.log(
                `${connectionLogContext} Connection cleanup completed successfully`,
              );
            } catch (error) {
              console.error(
                `${connectionLogContext} Error during cleanup:`,
                error,
              );
            }
          };

          // Handle connection close
          req.socket?.on('close', cleanup);

          // Keep connection alive with heartbeats
          const heartbeatInterval = setInterval(() => {
            try {
              res.write(': heartbeat\n\n');
            } catch (error) {
              console.error(
                `${connectionLogContext} Error sending heartbeat:`,
                error,
              );
              clearInterval(heartbeatInterval);
            }
          }, 30000);

          // Clean up interval on close
          req.socket?.on('close', () => {
            clearInterval(heartbeatInterval);
            console.log(`${connectionLogContext} Heartbeat interval cleared`);
          });

          console.log(
            `${connectionLogContext} SSE connection established successfully`,
          );
        } catch (error) {
          console.error(
            `${connectionLogContext} Error setting up SSE connection:`,
            error,
          );
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'Error setting up SSE connection',
              details: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            }),
          );
        }

        return;
      } catch (error) {
        console.error(`${logContext} Authentication error:`, error);
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Unauthorized',
            details: error instanceof Error ? error.message : String(error),
          }),
        );
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
