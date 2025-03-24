import { z } from 'zod';
import { initializeMcpApiHandler } from '../../lib/mcp/mcp-api-handler';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * MCP Server handler
 * This initializes a Model Context Protocol server with tools and capabilities
 */
const handler = initializeMcpApiHandler(
  (server) => {
    // Add echo tool - a simple example tool
    server.tool('echo', { message: z.string() }, async ({ message }) => ({
      content: [{ type: 'text', text: `Tool echo: ${message}` }],
    }));

    // Add a static resource example
    server.resource('info', 'info://app', async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: 'This is information about the application',
        },
      ],
    }));

    // Add more tools following SDK documentation
    server.tool('searchDocuments', { query: z.string() }, async ({ query }) => {
      // Implement document search logic
      return {
        content: [{ type: 'text', text: `Results for: ${query}` }],
      };
    });

    // Add dynamic resources
    server.resource(
      'user-profile',
      new ResourceTemplate('users://{userId}/profile', { list: undefined }),
      async (uri, params) => ({
        contents: [
          {
            uri: uri.href,
            text: `Profile data for user ${params.userId}`,
          },
        ],
      }),
    );

    // Add more tools and resources as needed
  },
  {
    // Server configuration
    name: 'ChatbotMCP',
    version: '1.0.0',
    capabilities: {
      tools: {
        echo: {
          description: 'Echo a message back to the user',
        },
        searchDocuments: {
          description: 'Search documents with a query',
        },
      },
      resources: {
        info: {
          description: 'General application information',
        },
        'user-profile': {
          description: 'Access user profile information',
        },
      },
    },
  },
);

export const GET = handler;
export const POST = handler;
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Specify deployment regions if needed
};
