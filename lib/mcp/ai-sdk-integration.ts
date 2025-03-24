/**
 * AI SDK Integration for MCP
 *
 * This file integrates the MCP client with the AI SDK to enable context-aware AI interactions.
 */

import { createAI } from 'ai/rsc';
import { createMcpContextProvider } from './client';

export function createMcpAI() {
  // Create an MCP context provider
  const mcpContextProvider = createMcpContextProvider({
    serverUrl: process.env.MCP_SERVER_URL || '/api/mcp/server',
  });

  // Create an AI instance with MCP integration
  return createAI({
    actions: {
      // Call a tool in the MCP server
      callTool: async (
        name: string,
        args: Record<string, any>,
        conversationId: string,
      ) => {
        // Get the MCP client for this conversation
        const mcpClient = await mcpContextProvider.getContext(conversationId);

        try {
          // Call the tool using the MCP client
          const response = await mcpClient.callTool({
            name,
            arguments: args,
          });

          return response;
        } catch (error) {
          console.error(`Error calling MCP tool ${name}:`, error);
          throw new Error(
            `Failed to call tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },

      // Get information from a resource
      getResource: async (uri: string, conversationId: string) => {
        // Get the MCP client for this conversation
        const mcpClient = await mcpContextProvider.getContext(conversationId);

        try {
          // Read the resource using the MCP client with properly formatted URI object
          const resource = await mcpClient.readResource({
            uri: uri,
            _meta: {}, // Include empty metadata object as required by the MCP protocol
          });
          return resource;
        } catch (error) {
          console.error(`Error reading MCP resource ${uri}:`, error);
          throw new Error(
            `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },

      // List available resources
      listResources: async (conversationId: string) => {
        // Get the MCP client for this conversation
        const mcpClient = await mcpContextProvider.getContext(conversationId);

        try {
          // List resources using the MCP client
          const resources = await mcpClient.listResources();
          return resources;
        } catch (error) {
          console.error('Error listing MCP resources:', error);
          throw new Error(
            `Failed to list resources: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },

      // Cleanup when the conversation is done
      cleanup: async (conversationId: string) => {
        await mcpContextProvider.deleteContext(conversationId);
      },
    },
  });
}

// Export a default instance for easier importing
export const mcpAI = createMcpAI();
