/**
 * LLM Integration
 * Connects Browser Use Agent to language models
 */

import { fetch } from 'undici';
import {
  type AgentDecision,
  type BrowserState,
  type AgentStep,
  type BrowserAction,
} from './types.js';

interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAILLM {
  private config: Required<LLMConfig>;

  constructor(config: LLMConfig) {
    this.config = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };
  }

  async generateDecision(
    state: BrowserState,
    task: string,
    history: AgentStep[]
  ): Promise<AgentDecision> {
    const prompt = this.buildPrompt(state, task, history);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `You are a web browsing agent. Given the current browser state and task, decide the next action.

Available actions:
- { "type": "navigate", "url": "https://example.com" }
- { "type": "click", "elementId": "el-N", "selector": "..." }
- { "type": "type", "elementId": "el-N", "text": "...", "selector": "..." }
- { "type": "clear", "elementId": "el-N", "selector": "..." }
- { "type": "scroll", "direction": "up|down|left|right", "amount": 300 }
- { "type": "screenshot" }
- { "type": "wait", "duration": 1000 }
- { "type": "press_key", "key": "Enter|Tab|Escape" }
- { "type": "extract", "selector": "...", "attribute": "href" }
- { "type": "hover", "elementId": "el-N", "selector": "..." }
- { "type": "submit", "elementId": "el-N", "selector": "..." }
- { "type": "terminate", "reason": "...", "success": true|false }

Respond with JSON only:
{
  "thought": "Your reasoning about what to do next",
  "action": { "type": "...", ... },
  "confidence": 0.95
}`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error('[LLM] Error:', error);
      
      // Fallback to a safe action
      return {
        thought: `Error calling LLM: ${error instanceof Error ? error.message : String(error)}. Taking screenshot to analyze.`,
        action: { type: 'screenshot', fullPage: true },
        confidence: 0.1,
      };
    }
  }

  private buildPrompt(state: BrowserState, task: string, history: AgentStep[]): string {
    const elements = state.elements
      .slice(0, 20) // Limit to first 20 elements
      .map((el) => {
        const info = [el.id, el.tagName, el.text || el.ariaLabel || el.placeholder || '']
          .filter(Boolean)
          .join(', ');
        return `  - ${info}`.slice(0, 200);
      })
      .join('\n');

    const historyStr = history
      .slice(-5) // Last 5 steps
      .map((step) => {
        return `Step ${step.step}: ${step.action.type} - ${step.result.success ? 'success' : 'failed'} (${step.result.message})`;
      })
      .join('\n');

    return `Task: ${task}

Current State:
- URL: ${state.url}
- Title: ${state.title}
- Visible Elements (${state.elements.length} total, showing first 20):
${elements}

${history ? `Recent History:\n${historyStr}\n` : ''}

What is the next action? Respond with JSON only.`;
  }

  private parseResponse(content: string): AgentDecision {
    try {
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      const cleanContent = jsonMatch ? jsonMatch[1] : content;
      
      const parsed = JSON.parse(cleanContent.trim()) as AgentDecision;
      return {
        thought: parsed.thought || 'No thought provided',
        action: parsed.action as BrowserAction,
        confidence: parsed.confidence ?? 0.8,
      };
    } catch (error) {
      console.error('[LLM] Failed to parse response:', content);
      throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export class AnthropicLLM {
  private config: Required<LLMConfig> & { baseUrl: string };

  constructor(config: LLMConfig) {
    this.config = {
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };
  }

  async generateDecision(
    state: BrowserState,
    task: string,
    history: AgentStep[]
  ): Promise<AgentDecision> {
    const prompt = this.buildPrompt(state, task, history);

    try {
      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: `You are a web browsing agent. Given the current browser state and task, decide the next action to take.

Available actions:
- { "type": "navigate", "url": "https://example.com" }
- { "type": "click", "elementId": "el-N", "selector": "..." }
- { "type": "type", "elementId": "el-N", "text": "...", "selector": "..." }
- { "type": "clear", "elementId": "el-N", "selector": "..." }
- { "type": "scroll", "direction": "up|down|left|right", "amount": 300 }
- { "type": "screenshot" }
- { "type": "wait", "duration": 1000 }
- { "type": "press_key", "key": "Enter|Tab|Escape" }
- { "type": "extract", "selector": "...", "attribute": "href" }
- { "type": "hover", "elementId": "el-N", "selector": "..." }
- { "type": "submit", "elementId": "el-N", "selector": "..." }
- { "type": "terminate", "reason": "...", "success": true|false }

You MUST respond with ONLY valid JSON in this exact format:
{
  "thought": "Your reasoning about what to do next",
  "action": { "type": "...", ... },
  "confidence": 0.95
}`,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };

      const content = data.content?.[0]?.text;
      if (!content) {
        throw new Error('No response from LLM');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error('[LLM] Error:', error);
      
      return {
        thought: `Error calling LLM: ${error instanceof Error ? error.message : String(error)}. Taking screenshot.`,
        action: { type: 'screenshot', fullPage: true },
        confidence: 0.1,
      };
    }
  }

  private buildPrompt(state: BrowserState, task: string, history: AgentStep[]): string {
    const elements = state.elements
      .slice(0, 20)
      .map((el) => {
        const info = [el.id, el.tagName, el.text || el.ariaLabel || el.placeholder || '']
          .filter(Boolean)
          .join(', ');
        return `  - ${info}`.slice(0, 200);
      })
      .join('\n');

    const historyStr = history
      .slice(-5)
      .map((step) => {
        return `Step ${step.step}: ${step.action.type} - ${step.result.success ? 'success' : 'failed'}`;
      })
      .join('\n');

    return `Task: ${task}

Current State:
- URL: ${state.url}
- Title: ${state.title}
- Visible Elements (${state.elements.length} total, showing first 20):
${elements}

${history ? `Recent History:\n${historyStr}\n` : ''}

What is the next action? Respond with JSON only.`;
  }

  private parseResponse(content: string): AgentDecision {
    try {
      const parsed = JSON.parse(content.trim()) as AgentDecision;
      return {
        thought: parsed.thought || 'No thought provided',
        action: parsed.action as BrowserAction,
        confidence: parsed.confidence ?? 0.8,
      };
    } catch (error) {
      console.error('[LLM] Failed to parse response:', content);
      throw new Error('Failed to parse LLM response');
    }
  }
}
