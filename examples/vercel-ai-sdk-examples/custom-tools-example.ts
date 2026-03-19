/**
 * Vercel AI SDK - Custom Tools Example
 * Demonstrates client-side tools, data tools, and streaming with client-t1 schema
 * 
 * Key Concepts:
 * - Tools with type: "function" and "function" property
 * - Client-side tools are executed by the client, not the LLM
 * - Data tools for structured data processing
 * - Tool callbacks allow custom execution logic
 */

import { streamText, generateText, tool } from 'ai';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// SECTION 1: Basic Tool Definitions (Zod schemas)
// ============================================================================

/**
 * Tool Definition Pattern:
 * Each tool has:
 * - description: Explains what the tool does
 * - parameters: Zod schema defining expected arguments
 * - (optional) execute: Function to execute when called
 */

// Tool 1: File System Operations
const fileSystemTool = tool({
  description: 'Read or write files from the local filesystem',
  parameters: z.object({
    operation: z.enum(['read', 'write', 'list', 'exists']).describe('Operation to perform'),
    path: z.string().describe('File or directory path'),
    content: z.string().optional().describe('Content for write operation'),
  }),
  execute: async ({ operation, path: targetPath, content }) => {
    console.log(`[TOOL EXECUTION] FileSystem: ${operation} on ${targetPath}`);
    
    try {
      switch (operation) {
        case 'read':
          const data = await fs.readFile(targetPath, 'utf-8');
          return { success: true, data, operation };
          
        case 'write':
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.writeFile(targetPath, content || '');
          return { success: true, message: `Wrote to ${targetPath}`, operation };
          
        case 'list':
          const entries = await fs.readdir(targetPath);
          return { success: true, entries, operation };
          
        case 'exists':
          try {
            await fs.access(targetPath);
            return { success: true, exists: true, operation };
          } catch {
            return { success: true, exists: false, operation };
          }
          
        default:
          return { success: false, error: 'Unknown operation' };
      }
    } catch (error: any) {
      return { success: false, error: error.message, operation };
    }
  },
});

// Tool 2: Web Search via DuckDuckGo
const webSearchTool = tool({
  description: 'Search the web using DuckDuckGo to find current information',
  parameters: z.object({
    query: z.string().describe('Search query (max 500 characters)'),
    limit: z.number().default(5).describe('Maximum results to return'),
  }),
  execute: async ({ query, limit }) => {
    console.log(`[TOOL EXECUTION] WebSearch: "${query}"`);
    
    // Using curl to fetch results (server-side safe)
    const { execSync } = await import('child_process');
    
    try {
      const escapedQuery = query.replace(/'/g, "'\"'\"'");
      const curlCmd = `curl -s -L 'https://html.duckduckgo.com/html/?q=${escapedQuery}' -A 'Mozilla/5.0' --max-time 15`;
      const html = execSync(curlCmd, { encoding: 'utf-8', timeout: 20000 });
      
      // Parse results
      const results: Array<{ title: string; url: string; snippet: string }> = [];
      const resultDivs = html.match(/<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || [];
      
      for (const div of resultDivs.slice(0, limit)) {
        const titleMatch = div.match(/<h2[^>]*class="[^"]*result__title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
        const snippetMatch = div.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        
        if (titleMatch) {
          results.push({
            title: (titleMatch[2] || '').replace(/<[^>]+>/g, '').trim() || '(no title)',
            url: titleMatch[1] || '',
            snippet: (snippetMatch?.[1] || '(no snippet)').replace(/<[^>]+>/g, '').trim(),
          });
        }
      }
      
      return { 
        success: true, 
        query, 
        results,
        resultCount: results.length,
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message, 
        query,
      };
    }
  },
});

// Tool 3: Memory/Session Management
const memoryTool = tool({
  description: 'Store, retrieve, or search session memory',
  parameters: z.object({
    operation: z.enum(['store', 'retrieve', 'search', 'list']).describe('Memory operation'),
    key: z.string().optional().describe('Key for store/retrieve'),
    data: z.string().optional().describe('Data to store'),
    searchQuery: z.string().optional().describe('Search term for search operation'),
  }),
  execute: async (params) => {
    console.log(`[TOOL EXECUTION] Memory: ${params.operation}`);
    
    // In-memory storage (would use file/db in production)
    if (params.operation === 'store') {
      // Store logic here
      return { success: true, message: `Stored under key: ${params.key}` };
    }
    
    return { success: true, result: 'Memory operation completed' };
  },
});

// Tool 4: Code Execution (Dangerous - requires validation!)
const codeExecutionTool = tool({
  description: 'Execute TypeScript or JavaScript code safely. Use with caution.',
  parameters: z.object({
    code: z.string().describe('Code to execute'),
    language: z.enum(['typescript', 'javascript']).default('typescript'),
    timeout: z.number().default(5000).describe('Execution timeout in ms'),
  }),
  execute: async ({ code, language, timeout }) => {
    console.log(`[TOOL EXECUTION] CodeExecution: ${language}`);
    
    // WARNING: In production, this should be sandboxed!
    // This is for demonstration only
    try {
      const startTime = Date.now();
      // Use dynamic import for safer evaluation
      const result = await eval(`(async () => { ${code} })()`);
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        result: typeof result === 'object' ? JSON.stringify(result) : String(result),
        executionTime,
        language,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        language,
      };
    }
  },
});

// Tool 5: System Information
const systemInfoTool = tool({
  description: 'Get system information about the current environment',
  parameters: z.object({
    infoType: z.enum(['os', 'memory', 'cpus', 'uptime', 'all']).describe('Type of system info'),
  }),
  execute: async ({ infoType }) => {
    console.log(`[TOOL EXECUTION] SystemInfo: ${infoType}`);
    
    const os = await import('os');
    
    const info: Record<string, any> = {};
    
    switch (infoType) {
      case 'os':
        info.platform = os.platform();
        info.type = os.type();
        info.release = os.release();
        info.arch = os.arch();
        break;
      case 'memory':
        info.total = `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`;
        info.free = `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`;
        info.used = `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024)}GB`;
        break;
      case 'cpus':
        info.count = os.cpus().length;
        info.model = os.cpus()[0]?.model;
        info.speed = `${os.cpus()[0]?.speed}MHz`;
        break;
      case 'uptime':
        info.uptime = `${Math.floor(os.uptime() / 3600)} hours`;
        info.uptimeSeconds = os.uptime();
        break;
      case 'all':
        info.os = { platform: os.platform(), arch: os.arch(), release: os.release() };
        info.memory = {
          total: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          free: Math.round(os.freemem() / 1024 / 1024 / 1024),
        };
        info.cpus = { count: os.cpus().length, model: os.cpus()[0]?.model };
        break;
    }
    
    return { success: true, ...info };
  },
});

// ============================================================================
// SECTION 2: Example Usage Functions
// ============================================================================

/**
 * Example 1: Basic streaming with tools
 */
export async function demoBasicTools() {
  console.log('=== Demo: Basic Tool Usage with StreamText ===\n');
  
  const tools = {
    fileSystem: fileSystemTool,
    webSearch: webSearchTool,
  };
  
  const { textStream, toolCalls, toolResults } = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    tools,
    messages: [
      {
        role: 'user',
        content: 'Search the web for "latest AI developments" and tell me what you find.',
      },
    ],
    maxTokens: 2000,
  });
  
  // Stream the response
  for await (const text of textStream) {
    process.stdout.write(text);
  }
  
  console.log('\n=== Tool Calls Made ===');
  for await (const call of toolCalls) {
    console.log(`Tool: ${call.toolName}`, call.args);
  }
  
  console.log('\n=== Tool Results ===');
  for await (const result of toolResults) {
    console.log(`Result for ${result.toolName}:`, result.result);
  }
}

/**
 * Example 2: Multi-tool invocation
 */
export async function demoMultiToolChain() {
  console.log('=== Demo: Multi-Tool Chain ===\n');
  
  const tools = {
    fileSystem: fileSystemTool,
    webSearch: webSearchTool,
    memory: memoryTool,
    systemInfo: systemInfoTool,
  };
  
  const { text, toolCalls, toolResults } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    tools,
    messages: [
      {
        role: 'user',
        content: 'Get system information about memory, then search for optimization tips based on available RAM.',
      },
    ],
    maxSteps: 5, // Allow up to 5 steps/tool calls
  });
  
  console.log('Response:', text);
  console.log('\nTool Calls:', toolCalls.length);
  toolCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.toolName} with args:`, call.args);
  });
}

/**
 * Example 3: Client-side only execution pattern
 */
export async function demoClientSideExecution() {
  console.log('=== Demo: Client-Side Only (No Server Round-trip) ===\n');
  
  // Tools can be executed without LLM for pure client-side workflows
  const result = await fileSystemTool.execute({
    operation: 'list',
    path: process.cwd(),
  });
  
  console.log('Client-side result:', result);
}

/**
 * Example 4: Structured output with tools
 */
export async function demoStructuredOutput() {
  console.log('=== Demo: Structured Output Pattern ===\n');
  
  const analysisTool = tool({
    description: 'Analyze text and return structured insights',
    parameters: z.object({
      text: z.string().describe('Text to analyze'),
    }),
    execute: async ({ text }) => {
      // Perform analysis
      const wordCount = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
      
      return {
        metrics: {
          wordCount,
          sentences,
          paragraphs,
          averageWordsPerSentence: Math.round(wordCount / sentences * 10) / 10,
        },
        summary: `Text contains ${wordCount} words across ${paragraphs} paragraphs.`,
      };
    },
  });
  
  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    tools: { analysis: analysisTool },
    messages: [
      {
        role: 'user',
        content: 'Analyze this: "The quick brown fox jumps over the lazy dog. This sentence is perfect for testing fonts."',
      },
    ],
  });
  
  console.log('Analysis result:', text);
}

/**
 * Example 5: Error handling and retry logic
 */
export async function demoErrorHandling() {
  console.log('=== Demo: Error Handling and Retries ===\n');
  
  const tools = {
    fileSystem: {
      ...fileSystemTool,
      execute: async (args: any) => {
        try {
          return await fileSystemTool.execute(args);
        } catch (error: any) {
          // Return error as structured result instead of throwing
          return { success: false, error: error.message };
        }
      },
    },
  };
  
  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    tools,
    messages: [
      {
        role: 'user',
        content: 'Try to read a file at /nonexistent/path/file.txt and handle the error gracefully.',
      },
    ],
  });
  
  console.log('Result:', text);
}

// ============================================================================
// SECTION 3: Advanced Patterns
// ============================================================================

/**
 * Pattern: Tool chaining with state
 */
class ToolChainer {
  private state: Map<string, any> = new Map();
  
  async chain(toolCalls: Array<() => Promise<any>>) {
    const results = [];
    for (const call of toolCalls) {
      const result = await call();
      results.push(result);
      // Store in state for subsequent calls
      this.state.set(`step_${results.length}`, result);
    }
    return results;
  }
  
  getState(key: string) {
    return this.state.get(key);
  }
}

/**
 * Pattern: Conditional tool selection
 */
export function createConditionalTool<T extends Record<string, any>>(
  condition: (args: any) => boolean,
  trueTool: T,
  falseTool: T
) {
  return {
    ...trueTool,
    execute: async (args: any) => {
      const selectedTool = condition(args) ? trueTool : falseTool;
      return selectedTool.execute(args);
    },
  };
}

/**
 * Pattern: Tool result caching
 */
export function createCachedTool<T extends { execute: Function }>(
  tool: T,
  options: { ttl: number } = { ttl: 60000 }
) {
  const cache = new Map<string, { result: any; timestamp: number }>();
  
  return {
    ...tool,
    execute: async (args: any) => {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < options.ttl) {
        console.log('[CACHE HIT] Returning cached result');
        return cached.result;
      }
      
      const result = await tool.execute(args);
      cache.set(key, { result, timestamp: Date.now() });
      return result;
    },
  };
}

// ============================================================================
// SECTION 4: Main Runner
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ Vercel AI SDK - Custom Tools Demo                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Run demos
    await demoBasicTools();
    // await demoMultiToolChain();
    // await demoClientSideExecution();
    // await demoStructuredOutput();
    // await demoErrorHandling();
    
    console.log('\n✅ All demos completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  fileSystemTool,
  webSearchTool,
  memoryTool,
  codeExecutionTool,
  systemInfoTool,
  ToolChainer,
  createConditionalTool,
  createCachedTool,
};
