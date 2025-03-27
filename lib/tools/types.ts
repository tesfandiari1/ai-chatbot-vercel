import type { z } from 'zod';

/**
 * Base interface for all tools
 */
export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
}

/**
 * Base response structure for tool execution
 */
export interface ToolResponse {
  status: 'success' | 'error';
  message?: string;
  [key: string]: any;
}
