/**
 * LLM Tests
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { OpenAILLM, AnthropicLLM } from '../llm.js';
import type { BrowserState, AgentStep } from '../types.js';

describe('OpenAILLM', () => {
  // Skip tests if no API key (optional environment check)
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.log('OPENAI_API_KEY not set, skipping OpenAI tests');
    }
  });

  it('should be defined', () => {
    const llm = new OpenAILLM({ apiKey: 'test' });
    expect(llm).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should generate decision with real API', async () => {
    const llm = new OpenAILLM({ 
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
    });

    const state: BrowserState = {
      url: 'https://example.com',
      title: 'Example Domain',
      elements: [
        {
          id: 'el-1',
          tagName: 'h1',
          text: 'Example Domain',
          isVisible: true,
          isClickable: false,
          isInput: false,
          attributes: {},
          xpath: '//h1',
          selector: 'h1',
        },
      ],
      timestamp: Date.now(),
      previousActions: [],
    };

    const decision = await llm.generateDecision(state, 'Click on the heading', []);

    expect(decision).toBeDefined();
    expect(decision.thought).toBeDefined();
    expect(decision.action).toBeDefined();
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
  });
});

describe('AnthropicLLM', () => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    if (!hasApiKey) {
      console.log('ANTHROPIC_API_KEY not set, skipping Anthropic tests');
    }
  });

  it('should be defined', () => {
    const llm = new AnthropicLLM({ apiKey: 'test' });
    expect(llm).toBeDefined();
  });
});
