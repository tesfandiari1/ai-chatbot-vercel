import { z } from 'zod';
import { initializeMcpApiHandler } from '../../lib/mcp/mcp-api-handler';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * MCP Server handler
 * This initializes a Model Context Protocol server with tools and capabilities
 * following best practices from the MCP TypeScript SDK
 */
const handler = initializeMcpApiHandler(
  (server: McpServer) => {
    // Add echo tool with zod schema validation
    server.tool(
      'echo',
      {
        message: z.string().min(1, 'Message cannot be empty'),
      },
      async ({ message }) => {
        try {
          return {
            content: [{ type: 'text', text: `Tool echo: ${message}` }],
          };
        } catch (error) {
          console.error(
            `Error in echo tool: ${error instanceof Error ? error.message : String(error)}`,
          );
          return {
            content: [
              {
                type: 'text',
                text: 'An error occurred while processing your request',
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Add document search tool with more comprehensive parameter validation
    server.tool(
      'searchDocuments',
      {
        query: z.string().min(2, 'Search query must be at least 2 characters'),
        maxResults: z.number().optional().default(10),
        filters: z
          .object({
            dateRange: z
              .object({
                start: z.string().optional(),
                end: z.string().optional(),
              })
              .optional(),
            categories: z.array(z.string()).optional(),
          })
          .optional(),
      },
      async ({ query, maxResults, filters }) => {
        try {
          // Mock implementation - in production, this would call your actual search service
          console.log(
            `Searching for "${query}" with max results: ${maxResults}`,
          );
          if (filters) {
            console.log('Applied filters:', JSON.stringify(filters));
          }

          return {
            content: [
              {
                type: 'text',
                text: `Found ${maxResults} results for: ${query}`,
              },
            ],
          };
        } catch (error) {
          console.error(
            `Error in searchDocuments tool: ${error instanceof Error ? error.message : String(error)}`,
          );
          return {
            content: [
              {
                type: 'text',
                text: 'An error occurred while searching documents',
              },
            ],
            isError: true,
          };
        }
      },
    );

    // Add weather information tool
    server.tool(
      'getWeather',
      {
        location: z.string().min(2, 'Location must be specified'),
        units: z.enum(['metric', 'imperial']).optional().default('metric'),
      },
      async ({ location, units }) => {
        try {
          // Mock implementation - would call a weather API in production
          return {
            content: [
              {
                type: 'text',
                text: `Weather for ${location} (${units}): 22°C, Partly Cloudy`,
              },
            ],
          };
        } catch (error) {
          console.error(
            `Error in getWeather tool: ${error instanceof Error ? error.message : String(error)}`,
          );
          return {
            content: [
              { type: 'text', text: 'Unable to retrieve weather information' },
            ],
            isError: true,
          };
        }
      },
    );

    // Add a static resource example with proper error handling
    server.resource('info', 'info://app', async (uri) => {
      try {
        return {
          contents: [
            {
              uri: uri.href,
              text: 'This is information about the application. The app provides various AI-assisted tools and access to resources.',
            },
          ],
        };
      } catch (error) {
        console.error(
          `Error in info resource: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error; // Re-throw to let the MCP framework handle the error
      }
    });

    // Add dynamic resources with proper parameter validation via ResourceTemplate
    server.resource(
      'user-profile',
      new ResourceTemplate('users://{userId}/profile', { list: undefined }),
      async (uri, variables) => {
        try {
          const userId = variables.userId;
          // Validate userId parameter
          if (!userId || typeof userId !== 'string' || userId.length < 3) {
            throw new Error('Invalid user ID: must be at least 3 characters');
          }

          // In a real implementation, this would fetch from a database
          return {
            contents: [
              {
                uri: uri.href,
                text: `Profile data for user ${userId}: Name: User ${userId}, Email: user${userId}@example.com`,
              },
            ],
          };
        } catch (error) {
          console.error(
            `Error in user-profile resource: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error; // Re-throw to let the MCP framework handle the error
        }
      },
    );

    // Add resource list capability
    server.resource('users-list', 'users://profiles', async (uri) => {
      try {
        return {
          contents: [
            {
              uri: uri.href,
              text: 'Available user profiles: user123, user456, user789',
            },
          ],
        };
      } catch (error) {
        console.error(
          `Error in users-list resource: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    });

    // Add document resource with parameter validation
    server.resource(
      'document',
      new ResourceTemplate('documents://{docId}', { list: undefined }),
      async (uri, variables) => {
        try {
          const docId = variables.docId;
          // Validate docId parameter
          if (
            !docId ||
            typeof docId !== 'string' ||
            !docId.match(/^[a-zA-Z0-9-]+$/)
          ) {
            throw new Error(
              'Invalid document ID: must contain only alphanumeric characters and hyphens',
            );
          }

          // In a real implementation, this would fetch from a document store
          return {
            contents: [
              {
                uri: uri.href,
                text: `Content of document ${docId}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
              },
            ],
          };
        } catch (error) {
          console.error(
            `Error in document resource: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      },
    );
  },
  {
    // Server configuration with full capabilities specification
    name: 'ChatbotMCP',
    version: '1.0.0',
    capabilities: {
      tools: {
        echo: {
          description: 'Echo a message back to the user',
          arguments: {
            message: {
              type: 'string',
              description: 'The message to echo back',
            },
          },
        },
        searchDocuments: {
          description: 'Search documents with a query and optional filters',
          arguments: {
            query: {
              type: 'string',
              description: 'Search query term',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return',
              optional: true,
            },
            filters: {
              type: 'object',
              description: 'Optional filters to apply to the search',
              optional: true,
            },
          },
        },
        getWeather: {
          description: 'Get weather information for a location',
          arguments: {
            location: {
              type: 'string',
              description: 'Location to get weather for (city name)',
            },
            units: {
              type: 'string',
              description: 'Units for temperature (metric or imperial)',
              optional: true,
            },
          },
        },
      },
      resources: {
        info: {
          description: 'General application information',
          uriPatterns: ['info://app'],
        },
        'user-profile': {
          description: 'Access user profile information by user ID',
          uriPatterns: ['users://{userId}/profile'],
        },
        'users-list': {
          description: 'List of all available user profiles',
          uriPatterns: ['users://profiles'],
        },
        document: {
          description: 'Access document content by document ID',
          uriPatterns: ['documents://{docId}'],
        },
      },
    },
  },
);

export const GET = handler;
export const POST = handler;
export const config = {
  regions: ['iad1'], // Specify deployment regions if needed
};
