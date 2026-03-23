/**
 * Simple Agent Implementation
 * 
 * A concrete implementation of BaseAgent that integrates with Bootstrap-v15's
 * existing tool system. This agent can use the PluginManager to execute tools.
 */

import {
  BaseAgent,
  type AgentConfig,
  type AgentMessage,
  type Task,
  type TaskResult,
  type ExecutionContext,
  type TaskArtifact,
} from "./orchestrator.js";
import { randomUUID } from "crypto";
import { PluginManager } from "../tools/manager.js";

export interface SimpleAgentConfig extends AgentConfig {
  tools: PluginManager;      // The tool registry this agent can use
  llmCallback?: LLMCallback; // Callback for LLM interactions
}

export type LLMCallback = (
  prompt: string,
  systemPrompt: string,
  context: ExecutionContext
) => Promise<LLMResponse>;

export interface LLMResponse {
  thought: string;
  action: string;
  actionArgs: Record<string, unknown>;
  confidence: number;
  completed: boolean;
  output?: string;
}

/**
 * Reasoning trace for a single step
 */
interface ReasoningStep {
  step: number;
  thought: string;
  action: string;
  actionArgs: Record<string, unknown>;
  result: string;
  timestamp: number;
}

/**
 * SimpleAgent - A concrete agent implementation that uses tools
 * 
 * This agent follows a ReAct (Reasoning + Acting) pattern:
 * 1. Observe current state
 * 2. Think about what to do next
 * 3. Act by calling a tool
 * 4. Observe the result
 * 5. Repeat until task is complete
 */
export class SimpleAgent extends BaseAgent {
  private tools: PluginManager;
  private llmCallback?: LLMCallback;
  private reasoningHistory: ReasoningStep[] = [];

  constructor(config: SimpleAgentConfig) {
    super(config);
    this.tools = config.tools;
    this.llmCallback = config.llmCallback;
  }

  /**
   * Execute a task using ReAct pattern
   */
  async executeTask(task: Task, context: ExecutionContext): Promise<TaskResult> {
    const startTime = Date.now();
    const artifacts: TaskArtifact[] = [];
    let step = 0;
    let completed = false;
    let success = false;
    let output = "";

    // Build initial system prompt + task context
    const systemPrompt = this.buildSystemPrompt();
    const taskPrompt = this.buildTaskPrompt(task, context);

    this.emit("task:execution:started", { agentId: this.id, taskId: task.id });

    try {
      while (!completed && step < 20) { // Max 20 steps
        step++;
        
        // Get LLM decision
        const llmResponse = await this.getLLMDecision(
          taskPrompt,
          systemPrompt,
          context,
          step
        );

        this.emit("step:thought", {
          agentId: this.id,
          taskId: task.id,
          step,
          thought: llmResponse.thought,
        });

        // Record reasoning
        this.reasoningHistory.push({
          step,
          thought: llmResponse.thought,
          action: llmResponse.action,
          actionArgs: llmResponse.actionArgs,
          result: "",
          timestamp: Date.now(),
        });

        // Check if task is complete
        if (llmResponse.completed) {
          completed = true;
          success = true;
          output = llmResponse.output || "Task completed successfully";
          break;
        }

        // Execute action
        let actionResult: string;
        try {
          actionResult = await this.executeAction(
            llmResponse.action,
            llmResponse.actionArgs
          );
        } catch (error) {
          actionResult = `Error: ${error}`;
        }

        // Update reasoning history with result
        this.reasoningHistory[this.reasoningHistory.length - 1].result = actionResult;

        this.emit("step:action", {
          agentId: this.id,
          taskId: task.id,
          step,
          action: llmResponse.action,
          result: actionResult.substring(0, 500), // Truncate for events
        });

        // Check for termination signals
        if (llmResponse.action === "terminate" || actionResult.includes("REBOOTING")) {
          completed = true;
          success = llmResponse.actionArgs.success as boolean || true;
          output = (llmResponse.actionArgs.reason as string) || actionResult;
          break;
        }

        // Create artifact for significant actions
        if (this.isSignificantAction(llmResponse.action)) {
          artifacts.push({
            id: randomUUID(),
            type: this.getArtifactType(llmResponse.action),
            content: actionResult,
            metadata: {
              step,
              action: llmResponse.action,
              thought: llmResponse.thought,
            },
            createdAt: Date.now(),
          });
        }
      }

      // Build final output with reasoning summary
      output = this.buildFinalOutput(output);

    } catch (error) {
      success = false;
      output = `Task failed with error: ${error}`;
      artifacts.push({
        id: randomUUID(),
        type: "error",
        content: String(error),
        metadata: { step, timestamp: Date.now() },
        createdAt: Date.now(),
      });
    }

    const duration = Date.now() - startTime;

    // Add reasoning trace as artifact
    artifacts.push({
      id: randomUUID(),
      type: "document",
      content: JSON.stringify(this.reasoningHistory, null, 2),
      metadata: { type: "reasoning_trace" },
      createdAt: Date.now(),
    });

    this.emit("task:execution:completed", { agentId: this.id, taskId: task.id, success });

    return {
      success,
      output,
      artifacts,
      metrics: {
        duration,
        steps: step,
        tokenUsage: 0, // Would need to track from LLM
      },
    };
  }

  /**
   * Process incoming messages from other agents
   */
  protected async processMessage(message: AgentMessage): Promise<void> {
    this.emit("message:processed", {
      agentId: this.id,
      messageId: message.id,
      content: `Received ${message.type} from ${message.from}`,
    });

    // Simple message handling - could be extended for delegation
    switch (message.type) {
      case "request":
        // Could trigger a subtask
        break;
      case "delegation":
        // Handle task delegation
        break;
      case "update":
        // Store in context
        break;
    }
  }

  /**
   * Build system prompt for this agent
   */
  private buildSystemPrompt(): string {
    const capabilities = this.config.capabilities
      .map(c => `- ${c.name}: ${c.description}`)
      .join("\n");

    const tools = this.tools.getDefinitions()
      .map(t => `- ${t.function.name}: ${t.function.description}`)
      .join("\n");

    return `${this.config.systemPrompt}

Your capabilities:
${capabilities}

Available tools:
${tools}

Instructions:
1. Analyze the task and think step-by-step
2. Choose the appropriate tool for each step
3. When the task is complete, signal completion
4. If you encounter errors, try to recover or report failure`;
  }

  /**
   * Build task-specific prompt
   */
  private buildTaskPrompt(task: Task, context: ExecutionContext): string {
    const contextData = Object.entries(task.context)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");

    return `Task: ${task.title}
Description: ${task.description}
Priority: ${task.priority}
${contextData ? `Context:\n${contextData}` : ""}`;
  }

  /**
   * Get LLM decision for next step
   */
  private async getLLMDecision(
    taskPrompt: string,
    systemPrompt: string,
    context: ExecutionContext,
    step: number
  ): Promise<LLMResponse> {
    if (!this.llmCallback) {
      // Fallback to simple rule-based if no LLM callback provided
      return this.getRuleBasedDecision(step);
    }

    const fullPrompt = this.buildFullPrompt(taskPrompt, step);
    return await this.llmCallback(fullPrompt, systemPrompt, context);
  }

  /**
   * Build full prompt with history
   */
  private buildFullPrompt(taskPrompt: string, step: number): string {
    const history = this.reasoningHistory
      .map(h => `Step ${h.step}:
Thought: ${h.thought}
Action: ${h.action}(${JSON.stringify(h.actionArgs)})
Result: ${h.result.substring(0, 500)}...`) // Truncate long results
      .join("\n\n");

    return `${taskPrompt}

${history ? `Previous steps:\n${history}\n\n` : ""}Step ${step}:
What should you do next? Think step-by-step, then choose an action.`;
  }

  /**
   * Fallback rule-based decision maker
   */
  private getRuleBasedDecision(step: number): LLMResponse {
    // This is a simple fallback - in practice you'd want more sophisticated logic
    return {
      thought: "Using rule-based decision making",
      action: step > 10 ? "terminate" : "run_shell",
      actionArgs: step > 10 
        ? { reason: "Reached step limit", success: false }
        : { command: "echo 'Step executing'" },
      confidence: 0.5,
      completed: step > 10,
      output: step > 10 ? "Task terminated due to step limit" : undefined,
    };
  }

  /**
   * Execute a tool action
   */
  private async executeAction(
    action: string,
    args: Record<string, unknown>
  ): Promise<string> {
    return await this.tools.execute(action, args);
  }

  /**
   * Determine if an action is significant enough to create an artifact
   */
  private isSignificantAction(action: string): boolean {
    const significant = ["write_file", "edit_file", "reboot_substrate", "run_shell"];
    return significant.includes(action);
  }

  /**
   * Get artifact type for an action
   */
  private getArtifactType(action: string): "code" | "document" | "data" | "observation" | "error" {
    switch (action) {
      case "write_file":
      case "edit_file":
        return "code";
      case "run_shell":
        return "data";
      default:
        return "observation";
    }
  }

  /**
   * Build final output with reasoning summary
   */
  private buildFinalOutput(result: string): string {
    const summary = `## Task Execution Summary

**Agent:** ${this.config.name} (${this.config.role})
**Steps taken:** ${this.reasoningHistory.length}
**Result:** ${result}

### Reasoning Trace:
${this.reasoningHistory.map(h => `
**Step ${h.step}:**
- Thought: ${h.thought.substring(0, 200)}${h.thought.length > 200 ? "..." : ""}
- Action: ${h.action}
- Result: ${h.result.substring(0, 200)}${h.result.length > 200 ? "..." : ""}
`).join("\n---\n")}`;

    return summary;
  }
}

/**
 * Create a simple agent from a template
 */
export function createSimpleAgent(
  name: string,
  template: Partial<AgentConfig>,
  tools: PluginManager,
  llmCallback?: LLMCallback
): SimpleAgent {
  const config: SimpleAgentConfig = {
    id: randomUUID(),
    name,
    role: template.role || "specialist",
    description: template.description || "A task agent",
    capabilities: template.capabilities || [],
    systemPrompt: template.systemPrompt || "You are a helpful agent.",
    maxConcurrency: template.maxConcurrency || 1,
    timeout: template.timeout || 30000,
    retryPolicy: template.retryPolicy || { maxRetries: 2, backoffMs: 1000 },
    tools,
    llmCallback,
  };

  return new SimpleAgent(config);
}
