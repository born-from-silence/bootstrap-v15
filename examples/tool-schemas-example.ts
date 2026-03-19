/**
 * TOOL SCHEMAS EXAMPLE
 * Comprehensive demonstration of Function Tools vs Data Tools
 * 
 * KEY CONCEPTS:
 * 
 * FUNCTION TOOLS (with execute):
 * - Automatically called and executed by the AI system
 * - Perform calculations, API calls, file operations
 * - Return structured data that goes back to the LLM
 * 
 * DATA TOOLS (without execute):
 * - Provide structured schemas to the LLM
 * - Execution happens manually (you fetch data from DB, etc.)
 * - LLM "sees" the schema but doesn't execute code
 * - Perfect for RAG, database queries, context injection
 */

import { z } from 'zod';

// ============================================================================
// SECTION 1: FUNCTION TOOLS
// Tools WITH execute - auto-executed when LLM calls them
// ============================================================================

/**
 * TOOL 1: Temperature Converter
 * Convert between Celsius, Fahrenheit, Kelvin
 */
export const temperatureConverterTool = {
  name: 'temperature_converter',
  description: 'Convert temperature between Celsius, Fahrenheit, and Kelvin',
  parameters: z.object({
    value: z.number().describe('Temperature value to convert'),
    from: z.enum(['celsius', 'fahrenheit', 'kelvin']).describe('Source unit'),
    to: z.enum(['celsius', 'fahrenheit', 'kelvin']).describe('Target unit'),
  }),
  execute: async ({ value, from, to }: { value: number; from: string; to: string }) => {
    // Execute conversion
    let result: number;
    
    // Normalize to Celsius first
    let celsius: number;
    if (from === 'celsius') celsius = value;
    else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
    else celsius = value - 273.15;
    
    // Convert to target
    if (to === 'celsius') result = celsius;
    else if (to === 'fahrenheit') result = (celsius * 9/5) + 32;
    else result = celsius + 273.15;
    
    return {
      original: { value, unit: from },
      converted: { value: Math.round(result * 100) / 100, unit: to },
      formula: getConversionFormula(from, to),
    };
  },
};

function getConversionFormula(from: string, to: string): string {
  const formulas: Record<string, string> = {
    'celsius-fahrenheit': '(C × 9/5) + 32',
    'fahrenheit-celsius': '(F - 32) × 5/9',
    'celsius-kelvin': 'C + 273.15',
    'kelvin-celsius': 'K - 273.15',
  };
  return formulas[`${from}-${to}`] || 'Standard conversion';
}

/**
 * TOOL 2: BMI Calculator
 * Calculate Body Mass Index with health category
 */
export const bmiCalculatorTool = {
  name: 'bmi_calculator',
  description: 'Calculate Body Mass Index and provide health categorization',
  parameters: z.object({
    weightKg: z.number().positive().describe('Weight in kilograms'),
    heightCm: z.number().positive().describe('Height in centimeters'),
    age: z.number().optional().describe('Age in years (for pediatric BMI)'),
  }),
  execute: async ({ weightKg, heightCm, age }: { weightKg: number; heightCm: number; age?: number }) => {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const roundedBMI = Math.round(bmi * 10) / 10;
    
    // Determine category
    let category: string;
    let recommendation: string;
    
    if (bmi < 18.5) {
      category = 'underweight';
      recommendation = 'Consider increasing caloric intake with nutrient-dense foods';
    } else if (bmi < 25) {
      category = 'normal';
      recommendation = 'Maintain current lifestyle with balanced diet and regular exercise';
    } else if (bmi < 30) {
      category = 'overweight';
      recommendation = 'Consider moderate caloric reduction and increased physical activity';
    } else {
      category = 'obese';
      recommendation = 'Consult healthcare provider for a personalized weight management plan';
    }
    
    // Pediatric BMI (ages 2-20)
    let pediatricData = null;
    if (age && age >= 2 && age <= 20) {
      pediatricData = {
        note: 'For children, BMI is age and sex-specific. Use growth charts for percentile.',
        age,
      };
    }
    
    return {
      bmi: roundedBMI,
      category,
      normalRange: '18.5 - 24.9',
      recommendation,
      idealWeight: {
        minKg: Math.round(18.5 * heightM * heightM * 10) / 10,
        maxKg: Math.round(24.9 * heightM * heightM * 10) / 10,
      },
      pediatricData,
    };
  },
};

/**
 * TOOL 3: File System Helper
 * Read and write files
 */
import { promises as fs } from 'fs';
import path from 'path';

export const fileSystemTool = {
  name: 'file_system',
  description: 'Read from or write to the file system',
  parameters: z.object({
    operation: z.enum(['read', 'write', 'exists']).describe('Operation to perform'),
    filePath: z.string().describe('Relative or absolute file path'),
    content: z.string().optional().describe('Content for write operation'),
  }),
  execute: async ({ operation, filePath, content }: { operation: string; filePath: string; content?: string }) => {
    const resolvedPath = path.resolve(filePath);
    
    try {
      switch (operation) {
        case 'read':
          const data = await fs.readFile(resolvedPath, 'utf-8');
          return { success: true, operation, data, filePath: resolvedPath };
          
        case 'write':
          await fs.writeFile(resolvedPath, content || '', 'utf-8');
          return { success: true, operation, message: `Written to ${resolvedPath}`, filePath: resolvedPath };
          
        case 'exists':
          try {
            await fs.access(resolvedPath);
            return { success: true, exists: true, filePath: resolvedPath };
          } catch {
            return { success: true, exists: false, filePath: resolvedPath };
          }
          
        default:
          return { success: false, error: 'Unknown operation' };
      }
    } catch (error: any) {
      return { success: false, error: error.message, filePath: resolvedPath };
    }
  },
};

/**
 * TOOL 4: Date Time Calculator
 * Calculate time differences, add/subtract time
 */
export const dateTimeCalculatorTool = {
  name: 'date_time_calculator',
  description: 'Calculate time differences, add/subtract time from dates',
  parameters: z.object({
    operation: z.enum(['diff', 'add', 'subtract', 'format']).describe('Operation type'),
    date1: z.string().describe('First date (ISO format) or "now"'),
    date2: z.string().optional().describe('Second date for difference calculation'),
    amount: z.number().optional().describe('Amount to add/subtract'),
    unit: z.enum(['minutes', 'hours', 'days', 'weeks', 'months']).optional().describe('Time unit'),
    format: z.string().optional().describe('Output format (luxon format string)'),
  }),
  execute: async (args: any) => {
    // Simplified implementation
    const date1 = args.date1 === 'now' ? new Date() : new Date(args.date1);
    
    switch (args.operation) {
      case 'diff':
        const date2 = new Date(args.date2 || new Date());
        const diffMs = Math.abs(date2.getTime() - date1.getTime());
        return {
          milliseconds: diffMs,
          seconds: Math.floor(diffMs / 1000),
          minutes: Math.floor(diffMs / (1000 * 60)),
          hours: Math.floor(diffMs / (1000 * 60 * 60)),
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        };
        
      case 'add':
        const added = new Date(date1);
        if (args.unit === 'days') added.setDate(added.getDate() + args.amount);
        if (args.unit === 'hours') added.setHours(added.getHours() + args.amount);
        return { result: added.toISOString(), operation: 'add' };
        
      case 'format':
        return { 
          formatted: date1.toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          iso: date1.toISOString(),
        };
        
      default:
        return { error: 'Invalid operation' };
    }
  },
};

/**
 * TOOL 5: HTTP Request
 * Make HTTP requests to external APIs
 */
export const httpRequestTool = {
  name: 'http_request',
  description: 'Make HTTP requests to external APIs and websites',
  parameters: z.object({
    url: z.string().url().describe('URL to fetch'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional().describe('HTTP headers'),
    body: z.string().optional().describe('Request body for POST/PUT'),
    timeout: z.number().default(30000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ url, method, headers, body, timeout }: any) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? body : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        url,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out', url };
      }
      return { success: false, error: error.message, url };
    }
  },
};

/**
 * TOOL 6: String Validator
 * Validate various string formats
 */
export const stringValidatorTool = {
  name: 'string_validator',
  description: 'Validate string formats: email, URL, phone, UUID, etc.',
  parameters: z.object({
    type: z.enum(['email', 'url', 'phone', 'uuid', 'credit_card', 'ip_address']).describe('Validation type'),
    value: z.string().describe('String to validate'),
  }),
  execute: async ({ type, value }: { type: string; value: string }) => {
    const validators: Record<string, { regex: RegExp; message: string }> = {
      email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Must contain @ and valid domain',
      },
      url: {
        regex: /^https?:\/\/.+/,
        message: 'Must start with http:// or https://',
      },
      phone: {
        regex: /^\+?[\d\s\-\(\)]+$/,
        message: 'Valid phone number format',
      },
      uuid: {
        regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: 'UUID format (8-4-4-4-12 hex characters)',
      },
      credit_card: {
        regex: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
        message: '16-digit credit card number',
      },
      ip_address: {
        regex: /^(\d{1,3}\.){3}\d{1,3}$/,
        message: 'IPv4 format (x.x.x.x)',
      },
    };
    
    const validator = validators[type];
    if (!validator) {
      return { isValid: false, error: 'Unknown validation type' };
    }
    
    const isValid = validator.regex.test(value);
    
    return {
      type,
      value,
      isValid,
      message: isValid ? 'Valid format' : `Invalid format. Expected: ${validator.message}`,
      normalized: isValid ? value.trim() : null,
    };
  },
};

/**
 * TOOL 7: JSON Parser
 * Parse and validate JSON with structure checking
 */
export const jsonParserTool = {
  name: 'json_parser',
  description: 'Parse JSON strings and validate against expected structure',
  parameters: z.object({
    jsonString: z.string().describe('JSON string to parse'),
    schema: z.enum(['object', 'array', 'string', 'number', 'boolean', 'null']).optional()
      .describe('Expected top-level type'),
  }),
  execute: async ({ jsonString, schema }: { jsonString: string; schema?: string }) => {
    try {
      const parsed = JSON.parse(jsonString);
      const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;
      
      const result = {
        success: true,
        data: parsed,
        type: actualType,
        formatted: JSON.stringify(parsed, null, 2),
      };
      
      // Validate against expected schema
      if (schema && schema !== actualType) {
        return {
          ...result,
          schemaMatch: false,
          expectedType: schema,
          actualType,
          warning: `Expected ${schema} but got ${actualType}`,
        };
      }
      
      return { ...result, schemaMatch: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        hint: 'Check for syntax errors: unmatched braces, missing quotes, trailing commas',
        position: error.message.match(/position (\d+)/)?.[1],
      };
    }
  },
};

// ============================================================================
// SECTION 2: DATA TOOLS
// Tools WITHOUT execute - you provide data manually from database, etc.
// ============================================================================

/**
 * DATA TOOL 1: User Profile
 * Provides user information - YOU fetch this from your database
 */
export const userProfileDataTool = {
  name: 'get_user_profile',
  description: 'Get current user profile information including preferences, settings, and history. Call this first before making personalized recommendations.',
  parameters: z.object({
    userId: z.string().describe('Unique user identifier'),
    includeHistory: z.boolean().default(false).describe('Include usage history'),
  }),
  // NO execute function! This is a data tool.
  // You fetch the data from your database/API and inject it.
};

/**
 * DATA TOOL 2: Product Catalog Search
 * Search products - YOU fetch from your product database
 */
export const productCatalogDataTool = {
  name: 'search_products',
  description: 'Search product catalog for items matching criteria. Returns available products with pricing and availability.',
  parameters: z.object({
    category: z.enum(['electronics', 'clothing', 'home', 'food', 'books']).describe('Product category'),
    maxPrice: z.number().optional().describe('Maximum price limit'),
    minRating: z.number().min(0).max(5).optional().describe('Minimum rating (1-5)'),
    query: z.string().optional().describe('Search keywords'),
    sortBy: z.enum(['price', 'rating', 'name', 'newest']).default('relevance'),
    limit: z.number().default(10).describe('Number of results'),
  }),
  // NO execute - your backend calls your database
};

/**
 * DATA TOOL 3: Document Semantic Search
 * Vector/semantic search - YOU query your vector database
 */
export const documentSearchDataTool = {
  name: 'search_documents',
  description: 'Search document corpus using semantic similarity. Use this to find relevant documents based on meaning, not just keywords.',
  parameters: z.object({
    query: z.string().describe('Search query in natural language'),
    limit: z.number().default(5).describe('Number of results'),
    threshold: z.number().min(0).max(1).default(0.7).describe('Similarity threshold'),
    filter: z.object({
      category: z.string().optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
  }),
  // NO execute - this queries your vector database (Pinecone, Weaviate, etc.)
};

/**
 * DATA TOOL 4: Conversation History
 * Load previous messages - YOU fetch from your chat database
 */
export const conversationHistoryDataTool = {
  name: 'get_conversation_history',
  description: 'Retrieve previous messages from conversation thread for context.',
  parameters: z.object({
    conversationId: z.string().describe('Conversation thread ID'),
    limit: z.number().default(20).describe('Number of recent messages'),
    beforeMessageId: z.string().optional().describe('Get messages before this ID'),
  }),
  // NO execute - fetch from your database (Supabase, Prisma, etc.)
};

/**
 * DATA TOOL 5: System Configuration
 * App settings - YOU fetch from your config service
 */
export const systemConfigurationDataTool = {
  name: 'get_system_config',
  description: 'Get system configuration, feature flags, and current settings for this environment.',
  parameters: z.object({
    section: z.enum(['general', 'ai', 'security', 'features', 'limits']).default('general')
      .describe('Config section to retrieve'),
  }),
  // NO execute - this comes from your config store
};

/**
 * DATA TOOL 6: External API Status
 * Check API health - YOU ping your external services
 */
export const externalApiStatusDataTool = {
  name: 'check_api_status',
  description: 'Check health status and latency of external APIs and services.',
  parameters: z.object({
    service: z.enum(['payment', 'email', 'sms', 'database', 'cache']).describe('Service to check'),
  }),
  // NO execute - you'd check your service health dashboard
};

/**
 * DATA TOOL 7: Analytics/Metrics
 * Get usage data - YOU query your analytics database
 */
export const analyticsMetricsDataTool = {
  name: 'get_analytics',
  description: 'Retrieve usage analytics and metrics for reporting and insights.',
  parameters: z.object({
    metric: z.enum(['users', 'conversations', 'tools', 'errors']).describe('Metric type'),
    period: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    startDate: z.string().describe('Start date (ISO format)'),
    endDate: z.string().describe('End date (ISO format)'),
    granularity: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
  }),
  // NO execute - query your analytics database (TimeScaleDB, BigQuery, etc.)
};

// ============================================================================
// SECTION 3: EXAMPLES OF REAL-WORLD USAGE
// ============================================================================

/**
 * EXAMPLE FUNCTION: Using Function Tools
 * 
 * This shows how function tools are automatically executed by the SDK
 */
export async function exampleWithFunctionTools() {
  console.log('=== Example: Function Tools (Auto-Execute) ===\n');
  
  const tools = [
    temperatureConverterTool,
    bmiCalculatorTool,
    dateTimeCalculatorTool,
    stringValidatorTool,
  ];
  
  // Simulate: "Convert 25°C to Fahrenheit"
  const tempCall = {
    name: 'temperature_converter',
    arguments: { value: 25, from: 'celsius', to: 'fahrenheit' },
  };
  
  // The SDK would automatically call execute
  const tempTool = tools.find(t => t.name === tempCall.name);
  if (tempTool && 'execute' in tempTool) {
    const result = await tempTool.execute(tempCall.arguments);
    console.log('Function tool result:', result);
  }
}

/**
 * EXAMPLE FUNCTION: Using Data Tools
 * 
 * This shows how YOU manually provide data for data tools
 */
export async function exampleWithDataTools() {
  console.log('=== Example: Data Tools (Manual Injection) ===\n');
  
  const dataTools = [
    userProfileDataTool,
    productCatalogDataTool,
    documentSearchDataTool,
  ];
  
  // Simulate: LLM wants user profile data
  const dataCall = {
    name: 'get_user_profile',
    arguments: { userId: 'user123', includeHistory: true },
  };
  
  // YOU fetch data from your database
  console.log('Data tool called:', dataCall.name);
  console.log('Fetching data from database...');
  
  const mockData = {
    userId: 'user123',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    preferences: { theme: 'dark', notifications: true },
    history: [...], // Your real database query here
  };
  
  // Inject data into conversation
  console.log('Injected data:', mockData);
}

/**
 * EXAMPLE FUNCTION: Mixed Tool Usage
 * 
 * Shows coordination between function and data tools
 */
export async function exampleMixedToolUsage() {
  console.log('=== Example: Mixed Tool Usage ===\n');
  
  // Step 1: Use data tool to get context
  console.log('Step 1: Fetch user profile (DATA TOOL)');
  const userProfile = {
    userId: 'user789',
    currentTemperatureUnit: 'fahrenheit',
    location: 'New York',
    timezone: 'America/New_York',
    // Fetched from database
  };
  
  // Step 2: Use function tool for calculation
  console.log('Step 2: Convert temperature (FUNCTION TOOL)');
  const tempResult = await temperatureConverterTool.execute({
    value: 20,
    from: 'celsius',
    to: userProfile.currentTemperatureUnit,
  });
  console.log('Converted:', tempResult);
  
  // Step 3: Use another function tool
  console.log('Step 3: Calculate BMI (FUNCTION TOOL)');
  const bmiResult = await bmiCalculatorTool.execute({
    weightKg: 70,
    heightCm: 175,
    age: 30,
  });
  console.log('BMI:', bmiResult);
}

/**
 * EXAMPLE FUNCTION: Error Handling
 */
export async function exampleErrorHandling() {
  console.log('=== Example: Error Handling ===\n');
  
  // Invalid input
  const result = await jsonParserTool.execute({
    jsonString: '{invalid json',
    schema: 'object',
  });
  
  if (!result.success) {
    console.log('Error caught:', result.error);
    console.log('Hint:', result.hint);
  }
}

/**
 * EXAMPLE FUNCTION: Multi-Tool Chain
 * 
 * Shows how multiple tools work together
 */
export async function exampleMultiToolChain() {
  console.log('=== Example: Multi-Tool Chain ===\n');
  
  // Task: "Calculate BMI, save to file, and notify"
  
  // Tool 1: BMI Calculator
  const bmi = await bmiCalculatorTool.execute({
    weightKg: 75,
    heightCm: 178,
  });
  console.log('Step 1 - BMI Calculated:', bmi.bmi);
  
  // Tool 2: File System (save results)
  const report = JSON.stringify(bmi, null, 2);
  const fileResult = await fileSystemTool.execute({
    operation: 'write',
    filePath: './health_report.json',
    content: report,
  });
  console.log('Step 2 - File written:', fileResult.success);
  
  // Tool 3: HTTP Request (send notification)
  const notificationResult = await httpRequestTool.execute({
    url: 'https://api.example.com/notify',
    method: 'POST',
    body: JSON.stringify({ userId: 'user123', message: 'Health report ready' }),
  });
  console.log('Step 3 - Notification sent:', notificationResult.success);
}

// ============================================================================
// SECTION 4: TOOL REGISTRIES
// ============================================================================

/**
 * REGISTRY: All Function Tools
 */
export const functionTools = {
  temperature_converter: temperatureConverterTool,
  bmi_calculator: bmiCalculatorTool,
  file_system: fileSystemTool,
  date_time_calculator: dateTimeCalculatorTool,
  http_request: httpRequestTool,
  string_validator: stringValidatorTool,
  json_parser: jsonParserTool,
};

/**
 * REGISTRY: All Data Tools
 */
export const dataTools = {
  get_user_profile: userProfileDataTool,
  search_products: productCatalogDataTool,
  search_documents: documentSearchDataTool,
  get_conversation_history: conversationHistoryDataTool,
  get_system_config: systemConfigurationDataTool,
  check_api_status: externalApiStatusDataTool,
  get_analytics: analyticsMetricsDataTool,
};

/**
 * REGISTRY: All Tools Combined
 */
export const allTools = {
  ...functionTools,
  ...dataTools,
};

// ============================================================================
// SECTION 5: MAIN DEMONSTRATION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  TOOL SCHEMAS EXAMPLE                                      ║');
  console.log('║  Function Tools vs Data Tools                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('FUNCTION TOOLS:', Object.keys(functionTools).length);
  console.log('- temperature_converter');
  console.log('- bmi_calculator');
  console.log('- file_system');
  console.log('- date_time_calculator');
  console.log('- http_request');
  console.log('- string_validator');
  console.log('- json_parser\n');
  
  console.log('DATA TOOLS:', Object.keys(dataTools).length);
  console.log('- get_user_profile (requires manual data injection)');
  console.log('- search_products (requires manual data injection)');
  console.log('- search_documents (requires manual data injection)');
  console.log('- get_conversation_history (requires manual data injection)');
  console.log('- get_system_config (requires manual data injection)');
  console.log('- check_api_status (requires manual data injection)');
  console.log('- get_analytics (requires manual data injection)\n');
  
  // Demonstrate function tools
  await exampleWithFunctionTools();
  
  // Demonstrate data tools
  await exampleWithDataTools();
  
  // Demonstrate mixed usage
  await exampleMixedToolUsage();
  
  // Demonstrate error handling
  await exampleErrorHandling();
  
  // Demonstrate multi-tool chain
  await exampleMultiToolChain();
  
  console.log('\n✅ All examples completed!');
}

// Export for testing
export {
  temperatureConverterTool,
  bmiCalculatorTool,
  fileSystemTool,
  dateTimeCalculatorTool,
  httpRequestTool,
  stringValidatorTool,
  jsonParserTool,
  userProfileDataTool,
  productCatalogDataTool,
  documentSearchDataTool,
  conversationHistoryDataTool,
  systemConfigurationDataTool,
  externalApiStatusDataTool,
  analyticsMetricsDataTool,
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
