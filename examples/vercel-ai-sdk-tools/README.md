# Vercel AI SDK - Tool Schemas Example

## Overview

This example demonstrates **two types of tools** in the Vercel AI SDK:

1. **Function Tools** (with `execute`) - Automatically executed
2. **Data Tools** (without `execute`) - Manual data injection

## Quick Start

```bash
# Install dependencies
npm install

# Run the demo
npm run demo
```

## Tool Types Explained

### 1. Function Tools (Auto-Execute)

Tools **WITH** an `execute` function:

```typescript
import { tool } from 'ai';

const temperatureTool = tool({
  description: 'Convert temperatures',
  parameters: z.object({
    value: z.number(),
    from: z.enum(['celsius', 'fahrenheit']),
    to: z.enum(['celsius', 'fahrenheit']),
  }),
  execute: async ({ value, from, to }) => {
    // This runs automatically when LLM calls the tool
    const celsius = from === 'fahrenheit' ? (value - 32) * 5/9 : value;
    const result = to === 'fahrenheit' ? (celsius * 9/5) + 32 : celsius;
    return { result };
  },
});
```

**Characteristics:**
- ✅ Auto-executed when LLM calls them
- ✅ Returns structured data to LLM
- ✅ No `void` return allowed
- ✅ Perfect for calculations, API calls, file operations

### 2. Data Tools (Manual Injection)

Tools **WITHOUT** an `execute` function:

```typescript
const userProfileDataTool = tool({
  description: 'Get user profile for personalization',
  parameters: z.object({
    userId: z.string(),
  }),
  // NO execute! 
  // YOU fetch data from database and inject it
});
```

**Characteristics:**
- ❌ No auto-execution
- ❌ You manually fetch data
- ✅ You control data injection
- ✅ Perfect for RAG, user profiles, database queries

## How Data Tools Work

```typescript
// 1. LLM calls data tool
const response = await generateText({
  model,
  messages,
  tools: { userProfile: userProfileDataTool },
  onStepFinish: async ({ toolCalls }) => {
    // 2. YOU intercept the call
    for (const call of toolCalls) {
      if (call.toolName === 'userProfile') {
        // 3. YOU fetch from database
        const user = await db.users.findById(call.args.userId);
        
        // 4. YOU inject into conversation
        // (implementation depends on your architecture)
      }
    }
  },
});
```

## Tools Included

### Function Tools (6)

| Tool | Description |
|------|-------------|
| `temperatureTool` | Convert between C/F/K |
| `validatorTool` | Validate email, URL, UUID, etc. |
| `dateTimeTool` | Time calculations and formatting |
| `fileSystemTool` | Read/write files |
| `jsonParserTool` | Parse and validate JSON |
| `httpRequestTool` | Make HTTP requests |

### Data Tools (6)

| Tool | Description |
|------|-------------|
| `userProfileDataTool` | User data - YOU fetch from DB |
| `productCatalogDataTool` | Products - YOU query DB |
| `documentSearchDataTool` | RAG - YOU search vectors |
| `conversationHistoryDataTool` | History - YOU fetch from DB |
| `apiHealthDataTool` | Service status - YOU check health |
| `analyticsDataTool` | Metrics - YOU query analytics |

## When to Use Each

### Use Function Tools When:
- You need calculations (BMI, temperature)
- You call external APIs
- You read/write files
- You validate inputs
- The logic is deterministic

### Use Data Tools When:
- You fetch user profiles
- You query your database
- You do RAG/semantic search
- You load previous context
- You check service health
- The data comes from your system

## Key Difference

| Aspect | Function Tools | Data Tools |
|--------|----------------|------------|
| `execute` | ✅ Has | ❌ No |
| Auto-execution | ✅ Yes | ❌ No |
| Who fetches data | SDK | You |
| Return value | Your choice | N/A |
| Typical use | Calculations | Database queries |

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- `tool-schemas-example.ts` - Complete implementation
