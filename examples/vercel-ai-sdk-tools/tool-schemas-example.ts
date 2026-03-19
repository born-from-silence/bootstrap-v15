/**
 * VERCEL AI SDK TOOL SCHEMAS EXAMPLE
 * 
 * DEMOS:
 * 1. FUNCTION TOOLS - with execute() - auto-called when LLM invokes them
 * 2. DATA TOOLS - without execute() - you provide data manually
 * 
 * KEY DIFFERENCES:
 * 
 * FUNCTION TOOLS (With Execute):
 *   - Automatically executed when LLM calls them
 *   - Return structure you define (primitives, objects, arrays)
 *   - No void returns allowed
 *   - The LLM sees the result
 * 
 * DATA TOOLS (No Execute):
 *   - Provide schema to LLM
 *   - YOU manually fetch data from DB/API and inject
 *   - Perfect for RAG, user profiles, search results
 *   - LLM sees the schema but doesn't execute
 */

import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';

// ============================================================================
// PART 1: FUNCTION TOOLS (With execute)
// These auto-execute when the LLM calls them
// ============================================================================

/**
 * FUNCTION TOOL 1: Temperature Converter
 * Auto-executes conversion between units
 */
export const temperatureTool = tool({
  description: 'Convert temperature between Celsius, Fahrenheit, and Kelvin',
  parameters: z.object({
    value: z.number().describe('Temperature value'),
    from: z.enum(['celsius', 'fahrenheit', 'kelvin']).describe('Source unit'),
    to: z.enum(['celsius', 'fahrenheit', 'kelvin']).describe('Target unit'),
  }),
  execute: async ({ value, from, to }) => {
    let celsius: number;
    if (from === 'celsius') celsius = value;
    else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15;
    
    let result: number;
    if (to === 'celsius') result = celsius;
    else if (to === 'fahrenheit') result = (celsius * 9 / 5) + 32;
    else result = celsius + 273.15;
    
    return {
      original: { value, unit: from },
      converted: { value: Math.round(result * 100) / 100, unit: to },
      formula: getFormula(from, to),
    };
  },
});

function getFormula(from: string, to: string): string {
  const formulas: Record<string, string> = {
    'celsius-fahrenheit': '(C × 9/5) + 32',
    'fahrenheit-celsius': '(F - 32) × 5/9',
    'celsius-kelvin': 'C + 273.15',
    'kelvin-celsius': 'K - 273.15',
    'fahrenheit-kelvin': '(F - 32) × 5/9 + 273.15',
    'kelvin-fahrenheit': '(K - 273.15) × 9/5 + 32',
  };
  return formulas[`${from}-${to}`] || 'Direct conversion';
}

/**
 * FUNCTION TOOL 2: String Validator
 * Validates various string formats
 */
export const validatorTool = tool({
  description: 'Validate string formats: email, URL, phone, UUID, credit card',
  parameters: z.object({
    type: z.enum(['email', 'url', 'phone', 'uuid', 'credit_card']),
    value: z.string().describe('String to validate'),
  }),
  execute: async ({ type, value }) => {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/.+/,
      phone: /^\+?[\d\s\-\(\)]+$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      credit_card: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
    };
    
    const isValid = patterns[type].test(value);
    return {
      type,
      value,
      isValid,
      message: isValid ? `Valid ${type} format` : `Invalid ${type} format`,
    };
  },
});

/**
 * FUNCTION TOOL 3: Date Time Operations
 * Calculate time differences and format dates
 */
export const dateTimeTool = tool({
  description: 'Calculate time differences, add/subtract time, format dates',
  parameters: z.object({
    operation: z.enum(['diff', 'add', 'format', 'now']),
    date1: z.string().optional(),
    date2: z.string().optional(),
    value: z.number().optional(),
    unit: z.enum(['minutes', 'hours', 'days', 'weeks']).optional(),
  }),
  execute: async ({ operation, date1, date2, value, unit }) => {
    switch (operation) {
      case 'now':
        return { now: new Date().toISOString() };
        
      case 'diff':
        const d1 = new Date(date1!);
        const d2 = new Date(date2!);
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        return {
          milliseconds: diffMs,
          seconds: Math.floor(diffMs / 1000),
          minutes: Math.floor(diffMs / (1000 * 60)),
          hours: Math.floor(diffMs / (1000 * 60 * 60)),
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        };
        
      case 'add':
        const base = new Date(date1!);
        if (unit === 'days') base.setDate(base.getDate() + value!);
        if (unit === 'hours') base.setHours(base.getHours() + value!);
        return { result: base.toISOString() };
        
      case 'format':
        const d = new Date(date1!);
        return {
          iso: d.toISOString(),
          local: d.toLocaleString(),
          date: d.toLocaleDateString(),
          time: d.toLocaleTimeString(),
        };
        
      default:
        return { error: 'Invalid operation' };
    }
  },
});

/**
 * FUNCTION TOOL 4: File System Operations
 * Read/write files (with caution!)
 */
export const fileSystemTool = tool({
  description: 'Read or write text files to the file system',
  parameters: z.object({
    operation: z.enum(['read', 'write']),
    path: z.string(),
    content: z.string().optional(),
  }),
  execute: async ({ operation, path: filePath, content }) => {
    try {
      if (operation === 'read') {
        const data = await fs.readFile(filePath, 'utf-8');
        return { success: true, data, filePath };
      } else {
        await fs.writeFile(filePath, content || '', 'utf-8');
        return { success: true, message: 'File written', filePath };
      }
    } catch (error: any) {
      return { success: false, error: error.message, filePath };
    }
  },
});

/**
 * FUNCTION TOOL 5: JSON Parser
 * Parse and validate JSON
 */
export const jsonParserTool = tool({
  description: 'Parse JSON strings and validate structure',
  parameters: z.object({
    jsonString: z.string(),
    expectedType: z.enum(['object', 'array', 'string', 'number'])
      .optional()
      .describe('Expected top-level type'),
  }),
  execute: async ({ jsonString, expectedType }) => {
    try {
      const parsed = JSON.parse(jsonString);
      const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;
      
      return {
        success: true,
        data: parsed,
        type: actualType,
        typeMatch: !expectedType || actualType === expectedType,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message,
        hint: 'Check for syntax errors: quotes around keys/values, no trailing commas',
      };
    }
  },
});

/**
 * FUNCTION TOOL 6: HTTP Request
 * Make HTTP requests (browser-safe)
 */
export const httpRequestTool = tool({
  description: 'Make HTTP requests to external APIs',
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    body: z.string().optional(),
    headers: z.record(z.string()).optional(),
  }),
  execute: async ({ url, method, body, headers }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body || undefined,
      });
      
      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') 
        ? await response.json() 
        : await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

// ============================================================================
// PART 2: DATA TOOLS (No execute)
// These provide schemas but YOU fetch the data manually
// ============================================================================

/**
 * DATA TOOL 1: User Profile
 * Get user information - YOU fetch from database
 * 
 * HOW IT WORKS:
 * 1. LLM sees this tool and may call it when it needs user context
 * 2. You get the tool call (toolCallId, args)
 * 3. YOU fetch the data from your database/API
 * 4. You inject the data back into the conversation
 * 
 * NO AUTO-EXECUTION - Return type doesn't matter for data tools
 */
export const userProfileDataTool = tool({
  description: 'Get user profile information for personalization',
  parameters: z.object({
    userId: z.string().describe('User ID to look up'),
    includePreferences: z.boolean().default(true),
    includeHistory: z.boolean().default(false),
  }),
  // NO execute! This is a data tool
  // YOU fetch data with: await db.users.findById(args.userId)
});

/**
 * DATA TOOL 2: Product Catalog
 * Search products - YOU query your product database
 */
export const productCatalogDataTool = tool({
  description: 'Search product catalog',
  parameters: z.object({
    category: z.enum(['electronics', 'clothing', 'food', 'home']),
    maxPrice: z.number().optional(),
    query: z.string().optional(),
  }),
  // NO execute! YOU query your database
});

/**
 * DATA TOOL 3: Document Search
 * RAG retrieval - YOU query your vector database
 */
export const documentSearchDataTool = tool({
  description: 'Search documents using semantic similarity',
  parameters: z.object({
    query: z.string(),
    limit: z.number().default(5),
    threshold: z.number().min(0).max(1).default(0.7),
  }),
  // NO execute! YOU query your vector store (Pinecone, Weaviate, etc.)
});

/**
 * DATA TOOL 4: Conversation History
 * Load previous messages - YOU fetch from chat history
 */
export const conversationHistoryDataTool = tool({
  description: 'Get conversation history for context',
  parameters: z.object({
    conversationId: z.string(),
    limit: z.number().default(20),
  }),
  // NO execute! YOU fetch from your chat database
});

/**
 * DATA TOOL 5: External API Health
 * Check service status
 */
export const apiHealthDataTool = tool({
  description: 'Check health status of external services',
  parameters: z.object({
    service: z.enum(['payment', 'email', 'database', 'cache']),
  }),
  // NO execute! YOU check your service health
});

/**
 * DATA TOOL 6: Analytics
 * Get usage metrics - YOU query your analytics DB
 */
export const analyticsDataTool = tool({
  description: 'Get analytics and metrics data',
  parameters: z.object({
    metric: z.enum(['users', 'requests', 'errors']),
    period: z.enum(['day', 'week', 'month']),
  }),
  // NO execute! YOU query your analytics database
});

// ============================================================================
// PART 3: USAGE EXAMPLES
// ============================================================================

// Example 1: Function Tools auto-execute
async function demoFunctionTools() {
  console.log('=== DEMO: Function Tools (Auto-Execute) ===\n');
  
  // These automatically execute when LLM calls them
  const tools = [
    temperatureTool,
    validatorTool,
    dateTimeTool,
    jsonParserTool,
  ];
  
  // Simulate LLM calling temperature conversion
  console.log('Tool: temperatureTool.execute({value: 25, from: "celsius", to: "fahrenheit"})');
  const tempResult = await temperatureTool.execute({
    value: 25,
    from: 'celsius',
    to: 'fahrenheit',
  });
  console.log('Result:', tempResult);
  console.log();
  
  // Simulate LLM calling validator
  console.log('Tool: validatorTool.execute({type: "email", value: "test@example.com"})');
  const validationResult = await validatorTool.execute({
    type: 'email',
    value: 'test@example.com',
  });
  console.log('Result:', validationResult);
}

// Example 2: Data Tools require manual injection
async function demoDataTools() {
  console.log('=== DEMO: Data Tools (Manual Injection) ===\n');
  
  const dataTools = [
    userProfileDataTool,
    productCatalogDataTool,
    documentSearchDataTool,
  ];
  
  console.log('Data tools DON\'T auto-execute!');
  console.log('When LLM calls userProfileDataTool, YOU must:');
  console.log('1. Intercept the tool call');
  console.log('2. Fetch data from your database');
  console.log('3. Inject result into conversation');
  console.log();
  
  // Mock: LLM requests user profile
  console.log('Simulated: LLM calls userProfileDataTool({ userId: "user123" })');
  console.log('YOU fetch from database:');
  
  const mockUserData = {
    userId: 'user123',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    preferences: { theme: 'dark', notifications: true },
  };
  
  console.log('Injected data:', JSON.stringify(mockUserData, null, 2));
}

// Example 3: Mixed usage
async function demoMixedTools() {
  console.log('=== DEMO: Mixed Tool Usage ===\n');
  
  // Step 1: Data tool - get user preference
  console.log('Step 1: Fetch user profile (DATA TOOL)');
  const userPreference = 'fahrenheit'; // From your database
  
  // Step 2: Function tool - conversion based on preference
  console.log('Step 2: Convert using preference (FUNCTION TOOL)');
  const conversion = await temperatureTool.execute({
    value: 20,
    from: 'celsius',
    to: userPreference,
  });
  console.log(`Result: ${conversion.converted.value}°${conversion.converted.unit}`);
}

// ============================================================================
// PART 4: EXPORTS
// ============================================================================

export const functionTools = {
  temperature: temperatureTool,
  validator: validatorTool,
  dateTime: dateTimeTool,
  fileSystem: fileSystemTool,
  jsonParser: jsonParserTool,
  httpRequest: httpRequestTool,
};

export const dataTools = {
  userProfile: userProfileDataTool,
  productCatalog: productCatalogDataTool,
  documentSearch: documentSearchDataTool,
  conversationHistory: conversationHistoryDataTool,
  apiHealth: apiHealthDataTool,
  analytics: analyticsDataTool,
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  VERCEL AI SDK                                            ║');
  console.log('║  Function Tools vs Data Tools                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('FUNCTION TOOLS (6 total):');
  console.log('  ✓ temperatureTool - Auto-executes conversion');
  console.log('  ✓ validatorTool - Auto-executes validation');
  console.log('  ✓ dateTimeTool - Auto-executes date calculations');
  console.log('  ✓ fileSystemTool - Auto-executes file operations');
  console.log('  ✓ jsonParserTool - Auto-executes JSON parsing');
  console.log('  ✓ httpRequestTool - Auto-executes HTTP calls\n');
  
  console.log('DATA TOOLS (6 total):');
  console.log('  ○ userProfileDataTool - YOU fetch from database');
  console.log('  ○ productCatalogDataTool - YOU query products');
  console.log('  ○ documentSearchDataTool - YOU search vectors');
  console.log('  ○ conversationHistoryDataTool - YOU fetch history');
  console.log('  ○ apiHealthDataTool - YOU check service health');
  console.log('  ○ analyticsDataTool - YOU query analytics\n');
  
  await demoFunctionTools();
  console.log();
  await demoDataTools();
  console.log();
  await demoMixedTools();
  
  console.log('\n✅ Demos complete!');
}

if (require.main === module) {
  main().catch(console.error);
}
