# Getting Started with Vercel AI SDK Examples

## 📚 What's Included

This repository contains comprehensive examples of the Vercel AI SDK v4, demonstrating:

1. **Tool Schemas** - Function tools vs Data tools
2. **Custom Tools** - Real-world tool implementations
3. **Childcare Advisor App** - Production-ready application

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (or OpenAI API key)

### Setup

```bash
# Clone/navigate to the examples
cd vercel-ai-sdk-examples

# Install dependencies
npm install

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here
# OR for OpenAI
export OPENAI_API_KEY=your_key_here

# Verify installation
npm run typecheck
```

## 📖 Examples

### 1. Tool Schemas Example (`tool-schemas-example.ts`)

**What it covers:**
- Function tools (with `execute`)
- Data tools (without `execute`)
- Zod schema patterns
- Streaming vs blocking generation

**Run it:**
```bash
npm run demo:tools
```

**Key Concepts:**
```typescript
// Function tool - auto-executes
const calculator = tool({
  description: 'Add two numbers',
  parameters: z.object({ x: z.number(), y: z.number() }),
  execute: async ({ x, y }) => ({ result: x + y }),
});

// Data tool - manual injection
const userContext = tool({
  description: 'Get user info',
  parameters: z.object({ userId: z.string() }),
  // NO execute - provide data manually
});
```

### 2. Custom Tools Example (`custom-tools-example.ts`)

**What it covers:**
- Temperature conversion
- HTTP requests
- String validation
- File operations (mock)

**Run it:**
```bash
npm run demo:custom
```

### 3. Childcare Advisor App (`childcare-advisor-app/app.ts`)

**What it covers:**
- Production-ready tool suite
- Multi-turn conversations
- Data tool integration patterns
- Error handling

**Run it:**
```bash
npm run demo:childcare
```

## 📋 Tool Types Explained

### Function Tools

Execute code automatically when LLM calls them:

```typescript
const sleepQuality = tool({
  description: 'Calculate sleep quality',
  parameters: z.object({
    sleepHours: z.number(),
    ageMonths: z.number(),
  }),
  execute: async ({ sleepHours, ageMonths }) => {
    // Calculate quality score...
    return { score, quality };
  },
});
```

**Use for:**
- Calculations
- API calls
- File operations
- Validations

### Data Tools

Provide schema context without execution:

```typescript
const userProfile = tool({
  description: 'Get user profile data',
  parameters: z.object({ userId: z.string() }),
  // NO execute function
});
```

**Use for:**
- Database lookups
- Vector search results
- System state
- Configuration data

## 🔧 Workflow Example

### Basic Tool Usage

```typescript
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { tool } from 'ai';

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Define tool
const tempConverter = tool({
  description: 'Convert Celsius to Fahrenheit',
  parameters: z.object({
    celsius: z.number(),
  }),
  execute: async ({ celsius }) => ({
    fahrenheit: (celsius * 9/5) + 32,
    formula: 'F = (C × 9/5) + 32',
  }),
});

// Use tool
const result = await generateText({
  model: anthropic('claude-3-5-sonnet'),
  messages: [
    { role: 'user', content: 'What is 25°C in Fahrenheit?' }
  ],
  tools: { tempConverter },
});

console.log(result.text); // "25°C is 77°F..."
```

### Streaming Response

```typescript
const { textStream } = streamText({
  model: anthropic('claude-3-5-sonnet'),
  messages,
  tools: { tempConverter },
});

for await (const delta of textStream) {
  process.stdout.write(delta); // Real-time output
}
```

### Data Tool with Manual Injection

```typescript
// 1. Define data tool (no execute)
const userData = tool({
  description: 'Get user information',
  parameters: z.object({ userId: z.string() }),
});

// 2. Use in generation
const result = await generateText({
  model,
  messages,
  tools: { userData },
  onStepFinish: async ({ toolCalls }) => {
    // 3. Handle data tool calls manually
    for (const call of toolCalls) {
      if (call.toolName === 'userData') {
        // Fetch from database
        const data = await db.users.get(call.args.userId);
        // Inject into conversation
        // (Implementation varies by production setup)
      }
    }
  },
});
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Specific File

```bash
npm test -- childcare-tools.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

## 🎯 Common Patterns

### Error Handling

```typescript
const safeTool = {
  ...originalTool,
  execute: async (args) => {
    try {
      return await originalTool.execute(args);
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        fallback: 'Please try again' 
      };
    }
  },
};
```

### Tool Caching

```typescript
const cache = new Map();
const cachedTool = {
  ...originalTool,
  execute: async (args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    
    const result = await originalTool.execute(args);
    cache.set(key, result);
    return result;
  },
};
```

### Conditional Tool Loading

```typescript
const tools = {
  calculator: calculatorTool,
  ...(isPremium && { webSearch: webSearchTool }),
  ...(hasLocation && { weather: weatherTool }),
};
```

## 📊 Tool Categories

### Utilities
- Calculators
- Converters
- Validators
- Formatters

### Network Operations
- HTTP requests
- API calls
- Web searches

### Domain-Specific
- Healthcare (temperature, dosing)
- Childcare (sleep, feeding)
- Finance (currency, stocks)

### Data Processing
- JSON parsing
- CSV conversion
- Text analysis

## 🚨 Troubleshooting

### "API key not set"

```bash
export ANTHROPIC_API_KEY=your_key_here
```

### "Module not found"

Ensure you're in the correct directory and have run `npm install`.

### "TypeScript error"

```bash
npm run typecheck
```

### "Tool not executing"

- Verify tool has `execute` function
- Check Zod schema matches expected arguments
- Ensure tool is included in `tools` configuration

## 📚 Learning Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Zod Documentation](https://zod.dev)
- [Anthropic API Docs](https://docs.anthropic.com)
- Examples in this repository

## 🔗 Related Files

- [README.md](./README.md) - Tool types overview
- [SDK-COMPARISON.md](./SDK-COMPARISON.md) - SDK vs custom implementation
- [childcare-advisor-app/](./childcare-advisor-app/) - Production app example

## 💡 Tips

1. **Always use Zod** for type safety
2. **Describe parameters** - helps LLM use tools correctly
3. **Return structured data** - easier for LLM to understand
4. **Handle errors gracefully** - return error objects, don't throw
5. **Limit tool count** - 5-10 tools is manageable
6. **Test tools independently** - before integrating with LLM

## 🎓 Next Steps

1. ✅ Run the examples
2. ✅ Modify a tool
3. ✅ Create your own tool
4. ✅ Build a multi-tool workflow
5. ✅ Deploy your application

## 📝 License

MIT - See parent directory

Built with ❤️ by Bootstrap-v15
