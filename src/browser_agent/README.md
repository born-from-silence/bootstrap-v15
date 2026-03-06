# Browser Use Agent

An AI-powered browser automation system that enables autonomous web navigation and interaction.

## Features

- **Autonomous Decision Making**: Uses LLMs to intelligently navigate and interact with websites
- **Visual State Understanding**: Captures screenshots and element mappings for AI analysis
- **Action Abstractions**: Click, type, scroll, extract, and more through clean API
- **Multi-Provider Support**: Works with OpenAI, Anthropic, or custom LLM implementations
- **Debugging & Observability**: Full step-by-step history and state tracking

## Quick Start

```typescript
import { BrowserUseAgent, SimpleLLM } from './agent.js';
import { OpenAILLM } from './llm.js';

// Using OpenAI (production)
const llm = new OpenAILLM({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
});

// Or use simple rule-based LLM for testing
// const llm = new SimpleLLM();

const agent = new BrowserUseAgent(llm, {
  headless: false,  // Show browser window
  debug: true,      // Log actions
});

await agent.initialize();

const task = await agent.executeTask(
  'Search for "climate change" on DuckDuckGo and summarize the top result',
  'https://duckduckgo.com',
  10  // max steps
);

console.log('Success:', task.success);
console.log('Result:', task.result);
console.log('Steps:', task.history.length);

await agent.close();
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Browser Use Agent             │
│  ┌───────────────────────────────────┐  │
│  │           Agent LLM                │  │
│  │  (Reasoning + Decision Making)     │  │
│  └─────────────────┬─────────────────┘  │
│                    │                     │
│  ┌─────────────────┴─────────────────┐   │
│  │         Browser Controller         │   │
│  │  ┌──────────┐   ┌──────────────┐ │   │
│  │  │Playwright│──▶│   Browser    │ │   │
│  │  │  Engine  │   │  Instance    │ │   │
│  │  └──────────┘   └──────────────┘ │   │
│  └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│             Actions                     │
│  navigate │ click │ type │ scroll       │
│  screenshot │ extract │ wait │ terminate │
└─────────────────────────────────────────┘
```

## Configuration

```typescript
interface AgentConfig {
  headless: boolean;           // Run without visible window
  viewport: {                  // Browser window size
    width: number; 
    height: number; 
  };
  userAgent?: string;          // Custom user agent
  timeout: number;             // Action timeout (ms)
  maxRetries: number;          // Retry failed actions
  screenshotOnStep: boolean;   // Capture screenshot each step
  debug: boolean;              // Verbose logging
}
```

## Available Actions


| Action | Description | Example |
|--------|-------------|---------|
| `navigate` | Load a URL | `{ type: 'navigate', url: 'https://example.com' }` |
| `click` | Click an element | `{ type: 'click', elementId: 'el-5', selector: '#btn' }` |
| `type` | Enter text | `{ type: 'type', elementId: 'el-3', text: 'Hello', selector: '#input' }` |
| `clear` | Clear input field | `{ type: 'clear', elementId: 'el-3', selector: '#input' }` |
| `scroll` | Scroll page | `{ type: 'scroll', direction: 'down', amount: 300 }` |
| `screenshot` | Capture screenshot | `{ type: 'screenshot', fullPage: true }` |
| `wait` | Pause execution | `{ type: 'wait', duration: 1000 }` |
| `press_key` | Simulate keypress | `{ type: 'press_key', key: 'Enter' }` |
| `extract` | Get element data | `{ type: 'extract', selector: '.title', attribute: 'href' }` |
| `hover` | Hover over element | `{ type: 'hover', elementId: 'el-7', selector: '.menu' }` |
| `submit` | Submit a form | `{ type: 'submit', elementId: 'el-4', selector: 'form' }` |
| `terminate` | End task | `{ type: 'terminate', reason: 'Done', success: true }` |

## Examples


### Basic Navigation
```typescript
const agent = new BrowserUseAgent(llm, { headless: true });
await agent.initialize();

const task = await agent.executeTask(
  'Navigate to example.com',
  'https://example.com',
  5
);

await agent.close();
```

### Form Filling
```typescript
const task = await agent.executeTask(
  `Fill the contact form with:
   - Name: John Doe
   - Email: john@example.com
   - Message: Hello world
   Then submit the form.`,
  'https://example.com/contact',
  10
);
```

### Data Extraction
```typescript
const task = await agent.executeTask(
  `Extract all product names and prices from the page,
   then scroll down to load more products and repeat.`,
  'https://shop.example.com',
  20
);

// Access extracted data from history
const extracts = task.history
  .filter(h => h.action.type === 'extract')
  .map(h => h.result.data);
```

## Custom LLM Integration

Implement the `AgentLLM` interface to use your own LLM:

```typescript
interface AgentLLM {
  generateDecision(
    state: BrowserState,
    task: string,
    history: AgentStep[]
  ): Promise<AgentDecision>;
}

class MyCustomLLM implements AgentLLM {
  async generateDecision(state, task, history): Promise<AgentDecision> {
    // Your implementation here
    return {
      thought: 'Reasoning about what to do...',
      action: { type: 'click', elementId: 'el-1', selector: '#btn' },
      confidence: 0.9,
    };
  }
}
```

## Prompt Engineering

The LLM receives structured information about:

1. **Task description**: The goal to accomplish
2. **Current state**: URL, page title, visible elements
3. **Element list**: Interactive elements with IDs, text, attributes
4. **Action history**: Recent actions and their results
5. **System prompt**: Available actions and response format

Optimize prompts by:
- Being specific about desired outcomes
- Providing clear context about the current page
- Setting reasonable boundaries on action counts
- Including screenshots when visual understanding is needed

## Safety & Security

- **Sandboxed Execution**: Browser runs in isolated Playwright context
- **User Confirmation**: Consider implementing confirmation for destructive actions
- **Rate Limiting**: Built-in delays and configurable timeouts
- **Element Validation**: Verifies elements exist before interacting
- **Screenshot Evidence**: Captures visual proof of all actions

## Running Examples

```bash
# Simple rule-based demo
npm install
DEMO_TYPE=simple npx tsx examples/demo.ts

# OpenAI-powered demo
OPENAI_API_KEY=sk-... DEMO_TYPE=openai npx tsx examples/demo.ts

# Autonomous mode
OPENAI_API_KEY=sk-... DEMO_TYPE=autonomous npx tsx examples/demo.ts

# Data extraction
OPENAI_API_KEY=sk-... npx tsx examples/extract_data.ts extract
```

## Requirements

- Node.js 18+
- Playwright (install: `npx playwright install`)
- API key for LLM provider (OpenAI/Anthropic)

## License

MIT
