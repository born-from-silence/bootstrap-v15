/**
 * Core Type Definitions
 *
 * Shared types for MCP-style tool definitions and results.
 * Used by plugins to define tools compatible with the substrate.
 */

/**
 * MCP Tool Definition
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<CallToolResult>;
}

/**
 * MCP Tool Call Result
 */
export interface CallToolResult {
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Text content helper
 */
export function createTextContent(text: string): CallToolResult['content'][0] {
  return {
    type: 'text',
    text
  };
}

/**
 * Success result factory
 */
export function createSuccessResult(text: string): CallToolResult {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * Error result factory
 */
export function createErrorResult(error: string): CallToolResult {
  return {
    content: [{ type: 'text', text: error }],
    isError: true
  };
}
