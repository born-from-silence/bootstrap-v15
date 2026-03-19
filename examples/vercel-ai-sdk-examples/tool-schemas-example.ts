/**
 * Vercel AI SDK v4 - Tool Schemas Comprehensive Example
 * 
 * DEMONSTRATES:
 * - function tools (with execute) vs data tools (without execute)
 * - Zod schema patterns for type-safe tool definitions
 * - streamText vs generateText usage patterns
 * - Multi-tool coordination and conversation handling
 * 
 * KEY CONCEPTS:
 * - Function tools: The model CALLS these and the SDK automatically executes them
 * - Data tools: The model SEES these schemas but execution happens elsewhere
 */

import { streamText, generateText, tool, CoreMessage, ToolResult } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-haiku-20240307';

// ============================================================================
// SECTION 1: FUNCTION TOOLS (With execute - SDK handles execution automatically)
// ============================================================================

/**
 * UTILITY TOOL: Temperature Converter
 * Converting Celsius to Fahrenheit and vice versa
 */
const temperatureConverterTool = tool({
  description: 'Convert temperature between Celsius and Fahrenheit',
  parameters: z.object({
    value: z.number().describe('Temperature value to convert'),
    from: z.enum(['celsius', 'fahrenheit']).describe('Source unit'),
    to: z.enum(['celsius', 'fahrenheit']).describe('Target unit'),
  }),
  execute: async ({ value, from, to }) => {
    if (from === to) return { value, unit: to };
    
    let result: number;
    if (from === 'celsius' && to === 'fahrenheit') {
      result = (value * 9/5) + 32;
    } else {
      result = (value - 32) * 5/9;
    }
    
    return { 
      original: { value, unit: from },
      converted: { value: Math.round(result * 100) / 100, unit: to },
      formula: from === 'celsius' ? '(C × 9/5) + 32' : '(F - 32) × 5/9',
    };
  },
});

/**
 * NETWORK TOOL: HTTP Request Client
 * Using fetch for network operations
 */
const httpRequestTool = tool({
  description: 'Make HTTP requests to external APIs. Returns JSON response or error.',
  parameters: z.object({
    url: z.string().describe('URL to fetch'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional().describe('Optional headers'),
    body: z.string().optional().describe('Optional body for POST/PUT'),
  }),
  execute: async ({ url, method, headers, body }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
        ...(body && { body }),
      });
      
      const data = await response.json().catch(() => null);
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        url,
      };
    }
  },
});

/**
 * VALIDATION TOOL: Email Validator
 * Checking if an email is valid format
 */
const emailValidatorTool = tool({
  description: 'Validate email address format using regex pattern',
  parameters: z.object({
    email: z.string().describe('Email address to validate'),
  }),
  execute: async ({ email }) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    const domain = email.split('@')[1] || '';
    
    return {
      email,
      isValid,
      domain,
      message: isValid ? 'Valid email format' : 'Invalid email format',
    };
  },
});

/**
 * DOMAIN-SPECIFIC: Sleep Quality Calculator
 * For childcare/health applications
 */
const sleepQualityTool = tool({
  description: 'Calculate sleep quality score based on duration, interruptions, and wake time',
  parameters: z.object({
    sleepHours: z.number().min(0).max(24).describe('Hours of sleep'),
    interruptions: z.number().min(0).describe('Number of times woken up'),
    wakeUpTime: z.string().regex(/^\d{1,2}:\d{2}$/).describe('Wake time (HH:MM)'),
  }),
  execute: async ({ sleepHours, interruptions, wakeUpTime }) => {
    // Calculate quality score (0-100)
    let score = 100;
    
    // Deduct for insufficient sleep
    if (sleepHours < 7) score -= (7 - sleepHours) * 10;
    
    // Deduct for interruptions
    score -= interruptions * 15;
    
    // Parse wake time
    const [hours, minutes] = wakeUpTime.split(':').map(Number);
    const wakeHour = hours + minutes / 60;
    
    // Bonus for waking before 8 AM (optimal sleep schedule)
    if (wakeHour < 8) score += 5;
    if (wakeHour > 10) score -= 10;
    
    score = Math.max(0, Math.min(100, score));
    
    let quality = 'excellent';
    if (score < 90) quality = 'good';
    if (score < 70) quality = 'fair';
    if (score < 50) quality = 'poor';
    
    return {
      score,
      quality,
      recommendations: [
        sleepHours < 7 ? 'Consider extending sleep duration' : null,
        interruptions > 2 ? 'Create a quieter sleep environment' : null,
        wakeHour > 9 ? 'Try waking up earlier for better routine' : null,
      ].filter(Boolean),
    };
  },
});

/**
 * DATA TRANSFORMATION: JSON Parser
 * Safely parsing and validating JSON
 */
const jsonParserTool = tool({
  description: 'Parse JSON string and validate against expected structure',
  parameters: z.object({
    jsonString: z.string().describe('JSON string to parse'),
    expectedType: z.enum(['object', 'array', 'string', 'number']).describe('Expected data type'),
  }),
  execute: async ({ jsonString, expectedType }) => {
    try {
      const parsed = JSON.parse(jsonString);
      const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;
      
      return {
        success: true,
        data: parsed,
        type: actualType,
        valid: actualType === expectedType,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        hint: 'Ensure JSON is properly formatted with quotes around keys and strings',
      };
    }
  },
});

// ============================================================================
// SECTION 2: DATA TOOLS (Without execute - Model sees schema, execution is manual)
// ============================================================================

/**
 * DATA TOOL: User Context
 * Provides user information to the model without automatic execution
 * This is useful for: RAG context, user profiles, system state, etc.
 */
const userContextTool = tool({
  description: 'Current user information and preferences. IMPORTANT: Call this to get user context before providing recommendations.',
  parameters: z.object({
    userId: z.string().describe('User ID to fetch context for'),
  }),
  // NO EXECUTE - This is a data tool. The model will "see" that it needs to
  // provide userId, and the calling code handles the data retrieval.
});

/**
 * DATA TOOL: Product Catalog
 * Product information for recommendations
 */
const productCatalogTool = tool({
  description: 'Product catalog search. Returns available products matching criteria.',
  parameters: z.object({
    category: z.enum(['electronics', 'clothing', 'home', 'food', 'toys']).describe('Product category'),
    maxPrice: z.number().optional().describe('Maximum price filter'),
  }),
  // NO EXECUTE - Data returned from external database/API
});

/**
 * DATA TOOL: Document Search
 * Semantic search over documents
 */
const documentSearchTool = tool({
  description: 'Search through document corpus using semantic similarity',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().default(5).describe('Number of results'),
  }),
  // NO EXECUTE - Results come from vector database
});

// ============================================================================
// SECTION 3: REAL-WORLD USAGE PATTERNS
// ============================================================================

/**
 * Pattern: Streaming with tool callbacks
 */
export async function demoStreamingWithTools() {
  console.log('=== Demo: Streaming with Tools ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'What is 25°C in Fahrenheit? Also validate "test@example.com"',
    },
  ];
  
  const { textStream, toolCalls, toolResults, text } = streamText({
    model: anthropic(MODEL),
    messages,
    tools: {
      temperatureConverter: temperatureConverterTool,
      emailValidator: emailValidatorTool,
    },
    // Callbacks for monitoring tool execution
    onChunk: (chunk) => {
      if (chunk.type === 'tool-call') {
        console.log(`[CB] Tool called: ${chunk.toolCall.toolName}`, chunk.toolCall.args);
      }
    },
    onFinish: ({ toolCalls, toolResults: results }) => {
      console.log(`\n[CB] Stream finished with ${toolCalls.length} tool calls`);
      console.log('[CB] Results:', results.length);
    },
  });
  
  // Stream text output
  process.stdout.write('Response: ');
  for await (const delta of textStream) {
    process.stdout.write(delta);
  }
  
  // Get tool results
  const calls = await toolCalls;
  const results = await toolResults;
  
  console.log('\n\nTool Calls Made:');
  calls.forEach((call) => {
    console.log(`  - ${call.toolName}:`, call.args);
  });
  
  console.log('\nTool Results:');
  results.forEach((result) => {
    console.log(`  - ${result.toolName}:`, result.result);
  });
  
  const finalText = await text;
  console.log('\nFinal text length:', finalText.length);
}

/**
 * Pattern: GenerateText with multi-turn conversation
 */
export async function demoMultiTurnConversation() {
  console.log('=== Demo: Multi-Turn Conversation ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'Check sleep quality for 6 hours of sleep with 2 interruptions, waking at 07:30',
    },
  ];
  
  // First turn
  const result1 = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: {
      sleepQuality: sleepQualityTool,
    },
    maxSteps: 3, // Allow up to 3 steps of tool calling
  });
  
  console.log('First response:', result1.text);
  console.log('Tool calls:', result1.toolCalls.length);
  
  // Add follow-up question
  messages.push({ role: 'assistant', content: result1.text });
  messages.push({
    role: 'user',
    content: 'Now convert my wake time to a 12-hour format. What time is 07:30 in AM/PM?',
  });
  
  // Second turn - note: we don't have a time converter tool, so this
  // tests the model's ability to reason without tools
  const result2 = await generateText({
    model: anthropic(MODEL),
    messages,
  });
  
  console.log('\nSecond response:', result2.text);
}

/**
 * Pattern: Conditional tool execution with maxRetries
 */
export async function demoConditionalTools() {
  console.log('=== Demo: Conditional Tool Execution ===\n');
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages: [
      {
        role: 'user',
        content: 'Parse this JSON and tell me if it contains valid user data: {"name": "Alice", "age": 30}',
      },
    ],
    tools: {
      jsonParser: jsonParserTool,
    },
    maxSteps: 5,
    maxRetries: 3, // Retry up to 3 times on failure
    onStepFinish: ({ toolCalls }) => {
      console.log(`[Step] ${toolCalls.length} tool calls completed`);
    },
  });
  
  console.log('Result:', result.text);
}

/**
 * Pattern: HTTP requests with error handling
 */
export async function demoHttpTool() {
  console.log('=== Demo: HTTP Request Tool ===\n');
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages: [
      {
        role: 'user',
        content: 'Fetch data from https://api.github.com/octocat and tell me what you received',
      },
    ],
    tools: {
      httpRequest: httpRequestTool,
    },
  });
  
  console.log('Response:', result.text);
}

/**
 * Pattern: Mixed function and data tools
 */
export async function demoMixedTools() {
  console.log('=== Demo: Mixed Function + Data Tools ===\n');
  
  // For data tools, we manually provide the data after the model
  // indicates which data it needs
  let userProvidedData = false;
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages: [
      {
        role: 'system',
        content: 'You have access to user context and sleep analysis tools. Get user context first.',
      },
      {
        role: 'user',
        content: 'Please analyze my situation. My user ID is "user123".',
      },
    ],
    tools: {
      // Function tool - executes automatically
      sleepQuality: sleepQualityTool,
      // Data tool - requires manual data injection
      userContext: userContextTool,
    },
    onStepFinish: ({ toolCalls, toolResults }) => {
      // Here we'd check for userContext calls and inject data
      toolCalls.forEach((call, i) => {
        if (call.toolName === 'userContext' && !userProvidedData) {
          console.log('[Inject] Would provide user data here for userId:', call.args.userId);
          userProvidedData = true;
        }
      });
    },
  });
  
  console.log('Result:', result.text);
}

/**
 * Pattern: Batch tool execution
 */
export async function demoBatchTools() {
  console.log('=== Demo: Batch Tool Execution ===\n');
  
  const conversions = [
    { value: 0, from: 'celsius', to: 'fahrenheit' },
    { value: 100, from: 'celsius', to: 'fahrenheit' },
    { value: 32, from: 'fahrenheit', to: 'celsius' },
    { value: 212, from: 'fahrenheit', to: 'celsius' },
  ] as const;
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: `Convert these temperatures: ${conversions.map(c => 
        `${c.value}°${c.from === 'celsius' ? 'C' : 'F'} to ${c.to}`
      ).join(', ')}`,
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: {
      temperatureConverter: temperatureConverterTool,
    },
    maxSteps: 5, // Allow multiple tool calls
  });
  
  console.log('Response:', result.text);
  console.log('Tool calls:', result.toolCalls.map(t => t.toolName));
}

// ============================================================================
// SECTION 4: ERROR HANDLING PATTERNS
// ============================================================================

/**
 * Pattern: Safe tool execution with error recovery
 */
export async function demoErrorHandling() {
  console.log('=== Demo: Error Handling ===\n');
  
  const safeHttpTool = {
    ...httpRequestTool,
    execute: async (args: any) => {
      try {
        const result = await httpRequestTool.execute(args);
        return result;
      } catch (error: any) {
        // Return error as structured result instead of throwing
        return {
          success: false,
          error: error.message,
          fallback: 'Please try again or check the URL',
        };
      }
    },
  };
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages: [
      {
        role: 'user',
        content: 'Try to fetch from https://invalid-url-12345.xyz',
      },
    ],
    tools: {
      httpRequest: safeHttpTool,
    },
    maxRetries: 2, // Retry twice on API errors
  });
  
  console.log('Result:', result.text);
}

// ============================================================================
// SECTION 5: MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ Vercel AI SDK v4 - Tool Schemas Demo                       ║');
  console.log('║ Function vs Data Tools                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Uncomment the demos you want to run
    // await demoStreamingWithTools();
    await demoMultiTurnConversation();
    // await demoConditionalTools();
    // await demoHttpTool();
    // await demoMixedTools();
    // await demoBatchTools();
    // await demoErrorHandling();
    
    console.log('\n✅ Demos completed!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

// Export for testing and individual use
export {
  // Tools
  temperatureConverterTool,
  httpRequestTool,
  emailValidatorTool,
  sleepQualityTool,
  jsonParserTool,
  userContextTool,
  productCatalogTool,
  documentSearchTool,
  // Demos
  demoStreamingWithTools,
  demoMultiTurnConversation,
  demoConditionalTools,
  demoHttpTool,
  demoMixedTools,
  demoBatchTools,
  demoErrorHandling,
};

if (require.main === module) {
  main();
}
