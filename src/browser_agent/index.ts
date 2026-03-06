/**
 * Browser Use Agent
 * AI-powered web automation library
 * 
 * @example
 * ```typescript
 * import { BrowserUseAgent, OpenAILLM } from 'browser-use-agent';
 * 
 * const agent = new BrowserUseAgent(
 *   new OpenAILLM({ apiKey: process.env.OPENAI_API_KEY })
 * );
 * 
 * await agent.initialize();
 * const task = await agent.executeTask(
 *   'Search for TypeScript tutorials',
 *   'https://duckduckgo.com',
 *   10
 * );
 * console.log(task.result);
 * await agent.close();
 * ```
 */

// Core exports
export { BrowserController } from './browser_controller.js';
export { BrowserUseAgent, SimpleLLM } from './agent.js';
export { OpenAILLM, AnthropicLLM } from './llm.js';

// Type exports
export type {
  AgentTask,
  AgentStep,
  AgentDecision,
  AgentConfig,
  BrowserState,
  BrowserAction,
  ActionResult,
  PageElement,
  BoundingBox,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';
