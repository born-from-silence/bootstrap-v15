/**
 * Agent Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserUseAgent, SimpleLLM } from '../agent.js';
import type { AgentDecision, BrowserState, AgentStep } from '../types.js';

describe('BrowserUseAgent', () => {
  let agent: BrowserUseAgent;

  beforeAll(() => {
    const llm = new SimpleLLM();
    agent = new BrowserUseAgent(llm, { headless: true });
  });

  afterAll(async () => {
    await agent.close();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await agent.initialize();
      expect(agent.getController().isInitialized()).toBe(true);
    });

    it('should close successfully', async () => {
      await agent.close();
      expect(agent.getController().isInitialized()).toBe(false);
    });
  });

  describe('Task Execution', () => {
    beforeAll(async () => {
      if (!agent.getController().isInitialized()) {
        await agent.initialize();
      }
    });

    it('should execute a simple task', async () => {
      const task = await agent.executeTask(
        'Test task',
        'https://example.com',
        3
      );

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.description).toBe('Test task');
    });

    it('should record task history', async () => {
      const task = await agent.executeTask(
        'Test task with history',
        'https://example.com',
        3
      );

      expect(task.history).toBeDefined();
      expect(task.history.length).toBeGreaterThanOrEqual(1);
      expect(task.currentStep).toBeGreaterThanOrEqual(1);
    });

    it('should complete task', async () => {
      const task = await agent.executeTask(
        'Navigate and screenshot',
        'https://example.com',
        3
      );

      expect(task.completed).toBe(true);
      expect(task.success).toBeDefined();
    });
  });
});

describe('SimpleLLM', () => {
  const llm = new SimpleLLM();

  it('should generate a decision', async () => {
    const state: BrowserState = {
      url: 'about:blank',
      title: '',
      elements: [],
      timestamp: Date.now(),
      previousActions: [],
    };

    const decision = await llm.generateDecision(state, 'Test task', []);

    expect(decision).toBeDefined();
    expect(decision.thought).toBeDefined();
    expect(decision.action).toBeDefined();
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });

  it('should suggest navigation on blank page', async () => {
    const state: BrowserState = {
      url: 'about:blank',
      title: '',
      elements: [],
      timestamp: Date.now(),
      previousActions: [],
    };

    const decision = await llm.generateDecision(state, 'Test task', []);

    expect(decision.action.type).toBe('navigate');
    expect(decision.action).toHaveProperty('url');
  });
});
