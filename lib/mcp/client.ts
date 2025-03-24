import {
  Client,
  ClientOptions,
} from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import crypto from 'node:crypto';

export interface MCPClientOptions {
  serverUrl?: string;
  fetch?: typeof fetch;
}

/**
 * Creates an MCP client that can be used to connect to an MCP server
 */
export function createMcpClient(options: MCPClientOptions = {}) {
  const serverUrl =
    options.serverUrl || process.env.MCP_SERVER_URL || '/api/mcp/server';
  const fetchFn = options.fetch || fetch;

  /**
   * Factory function that creates a new MCP client instance for each conversation
   */
  return async function createClientForConversation(conversationId: string) {
    try {
      // Make location detection isomorphic
      const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      };

      // Create the MCP client with SSE transport
      const transport = new SSEClientTransport(
        new URL(`${serverUrl}/sse`, getBaseUrl()),
        // The SSEClientTransport does not accept options in the constructor
      );

      // Create client with required options
      const client = new Client(
        {
          name: 'MCP-Client',
          version: '1.0.0',
        },
        {
          capabilities: {
            resources: {},
            tools: {},
            prompts: {},
          },
        },
      );

      // Connect to the transport
      await client.connect(transport);

      return client;
    } catch (error) {
      console.error('Error creating MCP client:', error);
      throw new Error(
        `Failed to create MCP client: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}

/**
 * Create a context provider that can be used with the AI SDK
 */
export function createMcpContextProvider(options: MCPClientOptions = {}) {
  const clientFactory = createMcpClient(options);

  // Map to store MCP clients by conversation ID
  const clientsMap = new Map<string, Client>();

  return {
    /**
     * Get or create an MCP client for a conversation
     */
    getContext: async (conversationId: string) => {
      // Check if we already have a client for this conversation
      if (!clientsMap.has(conversationId)) {
        const client = await clientFactory(conversationId);
        clientsMap.set(conversationId, client);
      }

      const client = clientsMap.get(conversationId);
      if (!client) {
        throw new Error(`Client not found for conversation: ${conversationId}`);
      }
      return client;
    },

    /**
     * Clean up resources when conversation is done
     */
    deleteContext: async (conversationId: string) => {
      const client = clientsMap.get(conversationId);
      if (client) {
        try {
          await client.close();
        } catch (error) {
          console.error(
            `Error closing MCP client for conversation ${conversationId}:`,
            error,
          );
        }
        clientsMap.delete(conversationId);
      }
    },
  };
}
