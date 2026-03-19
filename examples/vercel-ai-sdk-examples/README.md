# Vercel AI SDK v4 - Tool Schemas Guide

A comprehensive guide to understanding and using `function` and `data` tools with the Vercel AI SDK version 4.x.

## Table of Contents
1. [Tool Types Overview](#tool-types-overview)
2. [Function Tools](#function-tools)
3. [Data Tools](#data-tools)
4. [Tool Execution Flow](#tool-execution-flow)
5. [Usage Patterns](#usage-patterns)
6. [Error Handling](#error-handling)
7. [API Reference](#api-reference)

---

## Tool Types Overview

The Vercel AI SDK supports two primary tool types:

### Function Tools (`tool()` with `execute`)
- **Purpose**: Execute code when called by the LLM
- **Execution**: Fully automatic - the SDK handles calling `execute()`
- **Best For**: Computations, API calls, file operations, validation

### Data Tools (`tool()` without `execute`)
- **Purpose**: Provide structured data schemas to the model
- **Execution**: Manual - you control data injection
- **Best For**: RAG context, user profiles, database queries

---

## Function Tools

### Basic Structure

```typescript
const myTool = tool({
  description: 'What this tool does and when to use it',
  parameters: z.object({
    param1: z.string().describe('Description'),
    param2: z.number().default(10),
  }),
  execute: async (args) => {
    // Your logic here
    return { result: '...' };
  },
});
```

### Key Characteristics

1. **Automatic Execution**: When the LLM calls the tool, the SDK automatically executes the `execute` function
2. **Type Safety**: Zod schemas ensure type-safe arguments
3. **Structured Results**: Return values are passed back to the LLM
4. **Synchronous or Async**: `execute` can be sync or async

### Examples

#### Temperature Converter
```typescript
const temperatureConverter = tool({
  description: 'Convert temperature between units',
  parameters: z.object({
    value: z.number(),
    from: z.enum(['celsius', 'fahrenheit']),
    to: z.enum(['celsius', 'fahrenheit']),
  }),
  execute: async ({ value, from, to }) => {
    if (from === to) return { value, unit: to };
    const result = from === 'celsius' 
      ? (value * 9/5) + 32
      : (value - 32) * 5/9;
    return { value: result, unit: to };
  },
});
```

#### HTTP Request
```typescript
const httpRequest = tool({
  description: 'Make external API calls',
  parameters: z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST']).default('GET'),
  }),
  execute: async ({ url, method }) => {
    const response = await fetch(url, { method });
    return await response.json();
  },
});
```

---

## Data Tools

### Basic Structure

```typescript
const myDataTool = tool({
  description: 'Provide context to the model',
  parameters: z.object({
    query: z.string(),
  }),
  // NO execute function!
});
```

### Key Characteristics

1. **Manual Control**: You decide when and how to provide data
2. **Schema Enforced**: Model outputs follow your Zod schema
3. **Context Injection**: Perfect for RAG and external data sources
4. **Flexible Loading**: Data can come from databases, APIs, files, etc.

### Common Use Cases

| Use Case | Pattern | Example |
|----------|---------|---------|
| RAG | Vector search | `documentSearchTool` |
| User Context | DB lookup | `userContextTool` |
| Product Catalog | API fetch | `productCatalogTool` |
| System State | In-memory | `systemStateTool` |

### Handling Data Tool Calls

Since data tools don't execute automatically, you handle them in callbacks:

```typescript
const result = await generateText({
  model: anthropic('claude-3'),
  messages: [...],
  tools: {
    // Function tool - auto-executes
    calculator: calculatorTool,
    // Data tool - manual handling
    userContext: userContextTool,
  },
  onStepFinish: ({ toolCalls }) => {
    toolCalls.forEach(call => {
      if (call.toolName === 'userContext') {
        // Fetch data from your database
        const data = db.users.get(call.args.userId);
        // Inject into conversation (implementation varies)
      }
    });
  },
});
```

---

## Tool Execution Flow

### Control Levels

```
┌─────────────────────────────────────────────────────────────┐
│                     User Input                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  LLM Determines: Do I need a tool?                          │
│  • If yes → Outputs tool call                               │
│  • If no  → Outputs text response                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│ No Tool Call │   │ Tool Call Made   │
└───────┬──────┘   └────────┬─────────┘
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│ Return Text  │   │ SDK Routes to:    │
└──────────────┘   │ • Function:      │
                   │   Auto-execute    │
                   │ • Data:           │
                   │   Pass to callback│
                   └──────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Return results     │
                   │ to LLM (continue     │
                   │ conversation)       │
                   └────────────────────┘
```

### Multi-Tool Coordination

When multiple tools are needed:

1. **Sequential `(maxSteps: N)`**: Tools execute one after another
2. **Parallel**: Independent tools may execute simultaneously
3. **Chaining**: Output of tool A feeds into tool B

```typescript
const result = await generateText({
  model: anthropic('claude-3'),
  tools: { toolA, toolB, toolC },
  maxSteps: 5, // Allow up to 5 tool calls
  maxRetries: 3, // Retry on failure
});
```

### Flow Control

| Setting | Purpose | Default |
|---------|---------|---------|
| `maxSteps` | Max tool call cycles | 1 |
| `maxRetries` | Retry attempts on failure | 2 |
| `onStepFinish` | Hook for step completion | - |
| `onFinish` | Hook for total completion | - |

---

## Usage Patterns

### Pattern 1: Streaming with Real-Time Updates

```typescript
const { textStream, toolCalls, toolResults } = streamText({
  model: anthropic('claude-3'),
  messages,
  tools: { calculator, weather },
});

// Stream text as it's generated
for await (const delta of textStream) {
  process.stdout.write(delta);
}

// Get tool execution info
const calls = await toolCalls;
const results = await toolResults;
```

**Use Case**: Chat interfaces needing real-time display

### Pattern 2: Structured Batch Execution

```typescript
const result = await generateText({
  model: anthropic('claude-3'),
  messages: [
    { role: 'user', content: 'Convert: 25°C, 100°F, 0°C' },
  ],
  tools: { tempConverter },
  maxSteps: 5, // Allow multiple conversions
});

console.log(result.text); // All conversions complete
```

**Use Case**: Data processing pipelines

### Pattern 3: Multi-Turn Conversation

```typescript
const messages: CoreMessage[] = [initialPrompt];

// Turn 1
const result1 = await generateText({ model, messages, tools });
messages.push({ role: 'assistant', content: result1.text });
messages.push({ role: 'user', content: followUp });

// Turn 2 (context preserved)
const result2 = await generateText({ model, messages, tools });
```

**Use Case**: Interactive chatbots

### Pattern 4: Tool Selection with Conditional Logic

```typescript
const tools = {
  // Only load expensive tools when needed
  ...(user.isPremium && { webSearch: webSearchTool }),
  ...(user.hasFileAccess && { fileSystem: fileSystemTool }),
  // Always available
  calculator: calculatorTool,
};

const result = await generateText({ model, messages, tools });
```

**Use Case**: Permission-based tool access

### Pattern 5: Caching Tool Results

```typescript
const cache = new Map<string, { result: any; expiry: number }>();

const cachedTool = {
  ...expensiveTool,
  execute: async (args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }
    
    const result = await expensiveTool.execute(args);
    cache.set(key, { result, expiry: Date.now() + 60000 });
    return result;
  },
};
```

**Use Case**: Expensive API calls that can be cached

---

## Error Handling

### Automatic Retry

```typescript
const result = await generateText({
  model,
  messages,
  tools,
  maxRetries: 3, // Automatic retry on transient errors
});
```

### Graceful Degradation

```typescript
const safeTool = {
  ...originalTool,
  execute: async (args) => {
    try {
      return await originalTool.execute(args);
    } catch (error) {
      // Return structured error instead of throwing
      return { 
        success: false, 
        error: error.message,
        fallback: 'Please try again' 
      };
    }
  },
};
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private open = false;
  
  async execute(fn: Function) {
    if (this.open) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.open = true;
      }
      throw error;
    }
  }
}
```

---

## UI Integration with Data Tools

Data tools shine in applications needing UI updates:

```typescript
// React/Vue/Angular component
function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [toolState, setToolState] = useState({ loading: false });

  async function sendMessage(input) {
    setToolState({ loading: true });
    
    const result = await generateText({
      model,
      messages: [...messages, { role: 'user', content: input }],
      tools: {
        searchProducts: productSearchTool, // data tool
        getWeather: weatherTool, // function tool
      },
      onStepFinish: ({ toolCalls }) => {
        // UI updates for data tool loading states
        toolCalls.forEach(call => {
          if (call.toolName === 'searchProducts') {
            setToolState({ loading: true, operation: 'searching' });
            // Fetch from your API and inject
            fetchProducts(call.args).then(products => {
              // Update UI with results
              setToolState({ loading: false, products });
            });
          }
        });
      },
    });
    
    setMessages([...messages, { role: 'assistant', content: result.text }]);
  }
}
```

---

## API Reference

### Tool Definition

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  // Required
  description: string,      // What this tool does
  parameters: ZodSchema,    // Zod schema for arguments
  
  // Optional (makes it a function tool)
  execute: async (args) => {
    // Return any JSON-serializable value
    return { ... };
  },
});
```

### Generation Functions

```typescript
// Blocking call with full result
const { text, toolCalls, toolResults } = await generateText({
  model,
  messages,
  tools,
  maxSteps,
  maxRetries,
  onStepFinish,
  onFinish,
});

// Streaming for real-time updates
const { textStream, toolCalls, toolResults } = streamText({
  model,
  messages,
  tools,
  onChunk,
  onFinish,
});
```

### Types

```typescript
// Tool definition type
interface ToolDefinition {
  description: string;
  parameters: z.ZodSchema;
  execute?: (args: any) => Promise<any> | any;
}

// Tool callback parameters
interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: any;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
}
```

---

## Best Practices

1. **Clear Descriptions**: Tool descriptions should explain WHAT and WHEN
2. **Schema Precision**: Use `describe()` in Zod schemas for better LLM understanding
3. **Error Handling**: Always return structured errors, not thrown exceptions
4. **Type Safety**: Leverage Zod inference for TypeScript types
5. **Return Values**: Make tool results meaningful and context-rich
6. **Caching**: Cache expensive operations
7. **Timeouts**: Add timeouts to network operations
8. **Validation**: Validate inputs before execution
9. **Logging**: Log tool calls for debugging
10. **Testing**: Test tools in isolation

---

## Migration from v3

If coming from SDK v3:

- `experimental_generateText` → `generateText`
- `experimental_streamText` → `streamText`
- `client` tool type → Use data tools (no `execute`) or handle manually
- Response structure may vary slightly

---

## License

MIT - See examples for implementation details.
