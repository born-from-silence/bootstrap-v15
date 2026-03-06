/**
 * Browser Use Agent
 * Core agent logic for autonomous web browsing
 */

import { BrowserController } from './browser_controller.js';
import {
  type AgentTask,
  type AgentStep,
  type AgentDecision,
  type BrowserState,
  type BrowserAction,
  type AgentConfig,
  DEFAULT_CONFIG,
} from './types.js';

export interface AgentLLM {
  generateDecision(state: BrowserState, task: string, history: AgentStep[]): Promise<AgentDecision>;
}

export class BrowserUseAgent {
  private controller: BrowserController;
  private llm: AgentLLM;
  private config: AgentConfig;
  private currentTask: AgentTask | null = null;
  private isRunning = false;

  constructor(llm: AgentLLM, config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.controller = new BrowserController(this.config);
    this.llm = llm;
  }

  async initialize(): Promise<void> {
    await this.controller.initialize();
  }

  async close(): Promise<void> {
    this.isRunning = false;
    await this.controller.close();
  }

  async executeTask(
    description: string,
    startUrl?: string,
    maxSteps = 10
  ): Promise<AgentTask> {
    if (!this.controller.isInitialized()) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      url: startUrl,
      maxSteps,
      currentStep: 0,
      completed: false,
      history: [],
    };

    this.currentTask = task;
    this.isRunning = true;

    console.log(`\n[Agent] Starting task: "${description}"`);
    console.log(`[Agent] Max steps: ${maxSteps}`);
    if (startUrl) console.log(`[Agent] Start URL: ${startUrl}`);

    try {
      // Navigate to start URL if provided
      if (startUrl) {
        const navResult = await this.controller.executeAction({
          type: 'navigate',
          url: startUrl,
        });
        
        if (!navResult.success) {
          task.completed = true;
          task.success = false;
          task.result = `Failed to navigate to start URL: ${navResult.message}`;
          return task;
        }
      }

      // Main execution loop
      while (this.isRunning && task.currentStep < task.maxSteps) {
        const completed = await this.executeStep();
        if (completed) break;
      }

      if (!task.completed) {
        task.completed = true;
        task.success = false;
        task.result = `Task timed out after ${task.maxSteps} steps`;
      }

    } catch (error) {
      task.completed = true;
      task.success = false;
      task.result = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    this.isRunning = false;
    console.log(`\n[Agent] Task ${task.success ? 'completed' : 'failed'}: ${task.result}`);
    
    return task;
  }

  private async executeStep(): Promise<boolean> {
    if (!this.currentTask) return true;

    this.currentTask.currentStep++;
    const step = this.currentTask.currentStep;

    console.log(`\n[Step ${step}/${this.currentTask.maxSteps}]`);

    // Get current browser state
    const state = await this.controller.getState();
    state.previousActions = this.currentTask.history.map((h) => h.result);

    // Get decision from LLM
    const decision = await this.llm.generateDecision(
      state,
      this.currentTask.description,
      this.currentTask.history
    );

    console.log(`[Thought] ${decision.thought}`);
    console.log(`[Action] ${JSON.stringify(decision.action)}`);

    // Execute action
    const result = await this.controller.executeAction(decision.action);
    console.log(`[Result] ${result.success ? '✓' : '✗'} ${result.message}`);

    // Record step
    const agentStep: AgentStep = {
      step,
      thought: decision.thought,
      action: decision.action,
      result,
      timestamp: Date.now(),
    };
    this.currentTask.history.push(agentStep);

    // Check for termination
    if (decision.action.type === 'terminate') {
      this.currentTask.completed = true;
      this.currentTask.success = decision.action.success;
      this.currentTask.result = decision.action.reason;
      return true;
    }

    // Check for failure
    if (!result.success && step >= this.currentTask.maxSteps - 1) {
      this.currentTask.completed = true;
      this.currentTask.success = false;
      this.currentTask.result = `Failed at step ${step}: ${result.message}`;
      return true;
    }

    return false;
  }

  stop(): void {
    this.isRunning = false;
  }

  getCurrentTask(): AgentTask | null {
    return this.currentTask;
  }

  getController(): BrowserController {
    return this.controller;
  }
}

/**
 * Simple rule-based LLM implementation for demonstration
 * In production, this should be replaced with actual LLM API calls
 */
export class SimpleLLM implements AgentLLM {
  async generateDecision(
    state: BrowserState,
    task: string,
    history: AgentStep[]
  ): Promise<AgentDecision> {
    // This is a simple rule-based implementation
    // Replace with actual LLM calls (OpenAI, Anthropic, etc.)
    
    const currentUrl = state.url.toLowerCase();
    const currentTitle = state.title.toLowerCase();
    
    // Simple keyword-based decision making
    if (currentUrl === 'about:blank' || currentUrl === '') {
      return {
        thought: 'Need to navigate to a website to start',
        action: {
          type: 'navigate',
          url: 'https://example.com',
        },
        confidence: 0.9,
      };
    }

    if (task.toLowerCase().includes('search') || task.toLowerCase().includes('find')) {
      // Look for a search input
      const searchInput = state.elements.find(
        (el) =>
          el.isInput &&
          (el.placeholder?.toLowerCase().includes('search') ||
           el.ariaLabel?.toLowerCase().includes('search') ||
           el.attributes.type === 'search')
      );

      if (searchInput && !history.some((h) => h.action.type === 'type' && h.action.elementId === searchInput.id)) {
        return {
          thought: 'Found a search input, will try to enter a search query',
          action: {
            type: 'type',
            elementId: searchInput.id,
            text: 'test search query',
            selector: searchInput.selector,
          },
          confidence: 0.7,
        };
      }
    }

    // If we have history and last action was successful, maybe we're done
    if (history.length > 0) {
      const lastStep = history[history.length - 1];
      if (lastStep.result.success) {
        return {
          thought: 'Task appears to be complete or requires manual intervention',
          action: {
            type: 'terminate',
            reason: 'Task handling in simple mode - would be driven by actual LLM in production',
            success: true,
          },
          confidence: 0.6,
        };
      }
    }

    // Take a screenshot to gather more info
    if (history.length < 2) {
      return {
        thought: 'Taking screenshot to analyze current page state',
        action: {
          type: 'screenshot',
          fullPage: true,
        },
        confidence: 0.5,
      };
    }

    // Default: terminate
    return {
      thought: 'No further actions determined by simple logic',
      action: {
        type: 'terminate',
        reason: 'Simple LLM reached end of predefined actions',
        success: false,
      },
      confidence: 0.3,
    };
  }
}
