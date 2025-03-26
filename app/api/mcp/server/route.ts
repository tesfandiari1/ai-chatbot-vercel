import { z } from 'zod';
import { type NextRequest, NextResponse } from 'next/server';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';

export const runtime = 'nodejs';
export const preferredRegion = 'iad1'; // Specify deployment region if needed
export const dynamic = 'force-dynamic';

// Create an MCP server instance
const createMcpServer = () => {
  const server = new McpServer({
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
  });

  // Add tools and resources to the server
  addToolsToServer(server);
  addResourcesToServer(server);

  return server;
};

// Add tools to the MCP server
function addToolsToServer(server: McpServer) {
  // Echo tool
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

  // Search documents tool
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
        console.log(`Searching for "${query}" with max results: ${maxResults}`);
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

  // Get weather tool
  server.tool(
    'getWeather',
    {
      location: z.string().min(2, 'Location must be specified'),
      units: z.enum(['metric', 'imperial']).optional().default('metric'),
    },
    async ({ location, units }) => {
      try {
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
}

// Add resources to the MCP server
function addResourcesToServer(server: McpServer) {
  // Add app info resource
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
      throw error;
    }
  });

  // Add user profile resource
  server.resource(
    'user-profile',
    new ResourceTemplate('users://{userId}/profile', { list: undefined }),
    async (uri, variables) => {
      try {
        const userId = variables.userId;
        if (!userId || typeof userId !== 'string' || userId.length < 3) {
          throw new Error('Invalid user ID: must be at least 3 characters');
        }

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
        throw error;
      }
    },
  );

  // Add users list resource
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

  // Add document resource
  server.resource(
    'document',
    new ResourceTemplate('documents://{docId}', { list: undefined }),
    async (uri, variables) => {
      try {
        const docId = variables.docId;
        if (
          !docId ||
          typeof docId !== 'string' ||
          !docId.match(/^[a-zA-Z0-9-]+$/)
        ) {
          throw new Error(
            'Invalid document ID: must contain only alphanumeric characters and hyphens',
          );
        }

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
}

export async function GET(request: NextRequest) {
  try {
    // In real implementation, use proper MCP server with SSE transport
    const mcpServer = createMcpServer();

    // Return capabilities information
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error handling MCP GET request:', error);
    return NextResponse.json(
      { error: 'Failed to process MCP request' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mcpServer = createMcpServer();

    // Process the request based on request type
    const responseData = await processMcpRequest(mcpServer, body);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error processing MCP message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    );
  }
}

// Process MCP requests based on type
async function processMcpRequest(server: McpServer, request: any) {
  // This is a simplified implementation
  // In production, implement proper request handling based on MCP spec

  if (request.type === 'tool_call') {
    const { tool, arguments: args } = request;

    // Handle tool calls
    switch (tool) {
      case 'echo':
        return {
          content: [{ type: 'text', text: `Echo: ${args.message}` }],
        };
      case 'searchDocuments':
        return {
          content: [
            { type: 'text', text: `Search results for: ${args.query}` },
          ],
        };
      case 'getWeather':
        return {
          content: [
            { type: 'text', text: `Weather for ${args.location}: Sunny, 22°C` },
          ],
        };
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  } else if (request.type === 'resource_fetch') {
    const { uri } = request;

    // This is a simplified implementation
    return {
      contents: [
        {
          uri,
          text: `Resource content for: ${uri}`,
        },
      ],
    };
  }

  throw new Error(`Unsupported request type: ${request.type}`);
}
