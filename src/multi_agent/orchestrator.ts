/**
 * Multi-Agent Orchestration System
 * 
 * Design Pattern: Supervisor-Based Multi-Agent Orchestration
 * Inspired by: CrewAI, LangGraph, and AutoGen patterns
 * 
 * Architecture:
 * - AgentRegistry: Factory for creating and managing agent instances
 * - TaskRouter: Intelligent task distribution based on agent capabilities
 * - AgentSupervisor: Coordinates agent execution and manages workflow
 * - SharedContext: Thread-safe state management across agents
 * - InterAgentBus: Message passing system for agent communication
 */

import { EventEmitter } from "events";
import { randomUUID } from "crypto";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AgentRole = 
  | "planner"      // Breaks down complex tasks into subtasks
  | "researcher"   // Gathers information from various sources
  | "code_writer"  // Writes and modifies code
  | "code_reviewer" // Reviews code for quality and issues
  | "test_writer"  // Creates tests and validates functionality
  | "debugger"     // Diagnoses and fixes issues
  | "documenter"   // Creates documentation and comments
  | "coordinator"  // Manages other agents and workflow
  | "specialist";  // Domain-specific expert

export type AgentStatus = 
  | "idle" 
  | "busy" 
  | "paused" 
  | "error" 
  | "completed";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus = 
  | "pending"
  | "assigned"
  | "in_progress"
  | "blocked"
  | "completed"
  | "failed";

export interface AgentCapability {
  name: string;
  description: string;
  confidence: number; // 0-1, how well the agent can handle this
  tools: string[];    // Tools this agent can use
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  maxConcurrency: number;
  timeout: number; // milliseconds
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface Task {
  id: string;
  parentId?: string;      // For subtasks
  title: string;
  description: string;
  priority: TaskPriority;
  requiredCapabilities: string[];
  status: TaskStatus;
  assignedTo?: string;    // Agent ID
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  dependencies: string[];   // Task IDs that must complete first
  artifacts: TaskArtifact[];
  result?: TaskResult;
  context: Record<string, unknown>;
}

export interface TaskArtifact {
  id: string;
  type: "code" | "document" | "data" | "observation" | "error";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}

export interface TaskResult {
  success: boolean;
  output: string;
  artifacts: TaskArtifact[];
  metrics: {
    duration: number;
    steps: number;
    tokenUsage: number;
  };
}

export interface AgentMessage {
  id: string;
  from: string;           // Agent ID
  to: string | "broadcast"; // Agent ID or broadcast
  type: "request" | "response" | "update" | "error" | "delegation";
  content: string;
  taskId?: string;
  timestamp: number;
  priority: TaskPriority;
}

export interface ExecutionContext {
  sessionId: string;
  startTime: number;
  sharedMemory: Map<string, unknown>;
  executionLog: ExecutionEvent[];
}

export interface ExecutionEvent {
  timestamp: number;
  agentId: string;
  event: string;
  details: Record<string, unknown>;
}

// ============================================================================
// AGENT BASE CLASS
// ============================================================================

export abstract class BaseAgent extends EventEmitter {
  public readonly id: string;
  public readonly config: AgentConfig;
  protected status: AgentStatus = "idle";
  protected currentTask?: Task;
  protected taskHistory: Task[] = [];
  protected messageQueue: AgentMessage[] = [];

  constructor(config: AgentConfig) {
    super();
    this.id = config.id;
    this.config = config;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getCurrentTask(): Task | undefined {
    return this.currentTask;
  }

  getTaskHistory(): Task[] {
    return [...this.taskHistory];
  }

  canHandleTask(task: Task): number {
    // Returns confidence score (0-1) based on capability match
    const matched = this.config.capabilities.filter(cap =>
      task.requiredCapabilities.includes(cap.name)
    );
    if (matched.length === 0) return 0;
    
    const avgConfidence = matched.reduce((sum, c) => sum + c.confidence, 0) / matched.length;
    const coverage = matched.length / task.requiredCapabilities.length;
    
    return avgConfidence * coverage;
  }

  async assignTask(task: Task): Promise<boolean> {
    if (this.status !== "idle") {
      return false;
    }

    this.status = "busy";
    this.currentTask = task;
    this.emit("task:assigned", { agentId: this.id, taskId: task.id });
    
    return true;
  }

  async completeTask(result: TaskResult): Promise<void> {
    if (!this.currentTask) return;

    const task = this.currentTask;
    task.status = result.success ? "completed" : "failed";
    task.result = result;
    task.completedAt = Date.now();
    task.artifacts.push(...result.artifacts);

    this.taskHistory.push(task);
    this.emit("task:completed", { agentId: this.id, taskId: task.id, result });

    this.currentTask = undefined;
    this.status = "idle";
  }

  receiveMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.emit("message:received", message);
    this.processMessage(message);
  }

  protected abstract processMessage(message: AgentMessage): Promise<void>;
  abstract executeTask(task: Task, context: ExecutionContext): Promise<TaskResult>;

  pause(): void {
    if (this.status === "busy") {
      this.status = "paused";
      this.emit("status:changed", { agentId: this.id, status: "paused" });
    }
  }

  resume(): void {
    if (this.status === "paused") {
      this.status = "busy";
      this.emit("status:changed", { agentId: this.id, status: "busy" });
    }
  }

  toJSON(): object {
    return {
      id: this.id,
      name: this.config.name,
      role: this.config.role,
      status: this.status,
      currentTask: this.currentTask?.id,
      taskCount: this.taskHistory.length,
      capabilities: this.config.capabilities.map(c => c.name),
    };
  }
}

// ============================================================================
// SHARED CONTEXT MANAGER
// ============================================================================

export class SharedContext {
  private context: Map<string, Map<string, unknown>> = new Map();
  private locks: Map<string, boolean> = new Map();

  async read(sessionId: string, key: string): Promise<unknown | undefined> {
    const session = this.context.get(sessionId);
    return session?.get(key);
  }

  async write(sessionId: string, key: string, value: unknown): Promise<void> {
    if (!this.context.has(sessionId)) {
      this.context.set(sessionId, new Map());
    }
    this.context.get(sessionId)!.set(key, value);
  }

  async acquireLock(resourceId: string, timeout: number = 5000): Promise<boolean> {
    const start = Date.now();
    while (this.locks.get(resourceId)) {
      if (Date.now() - start > timeout) {
        return false;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    this.locks.set(resourceId, true);
    return true;
  }

  releaseLock(resourceId: string): void {
    this.locks.delete(resourceId);
  }

  getSessionState(sessionId: string): Record<string, unknown> {
    const session = this.context.get(sessionId);
    if (!session) return {};
    return Object.fromEntries(session);
  }

  clearSession(sessionId: string): void {
    this.context.delete(sessionId);
  }
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private templates: Map<string, Partial<AgentConfig>> = new Map();

  register(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  get(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getByRole(role: AgentRole): BaseAgent[] {
    return this.getAll().filter(a => a.config.role === role);
  }

  getAvailable(): BaseAgent[] {
    return this.getAll().filter(a => a.getStatus() === "idle");
  }

  findBestForTask(task: Task): BaseAgent | undefined {
    const available = this.getAvailable();
    if (available.length === 0) return undefined;

    // Score each agent by capability match
    const scored = available.map(agent => ({
      agent,
      score: agent.canHandleTask(task),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return best match if they have any capability
    return scored[0]?.score > 0 ? scored[0].agent : undefined;
  }

  defineTemplate(name: string, template: Partial<AgentConfig>): void {
    this.templates.set(name, template);
  }

  getTemplate(name: string): Partial<AgentConfig> | undefined {
    return this.templates.get(name);
  }

  getStats(): object {
    const all = this.getAll();
    return {
      total: all.length,
      idle: all.filter(a => a.getStatus() === "idle").length,
      busy: all.filter(a => a.getStatus() === "busy").length,
      paused: all.filter(a => a.getStatus() === "paused").length,
      byRole: Object.fromEntries(
        Object.values(["planner", "researcher", "code_writer", "code_reviewer", "test_writer", "debugger", "documenter", "coordinator", "specialist"] as AgentRole[]).map(role => [
          role,
          this.getByRole(role).length,
        ])
      ),
    };
  }
}

// ============================================================================
// INTER-AGENT BUS
// ============================================================================

export class InterAgentBus extends EventEmitter {
  private messages: AgentMessage[] = [];
  private subscribers: Map<string, ((msg: AgentMessage) => void)[]> = new Map();

  send(message: AgentMessage): void {
    this.messages.push(message);
    this.emit("message:sent", message);

    // Deliver to specific agent
    if (message.to !== "broadcast") {
      const handlers = this.subscribers.get(message.to);
      handlers?.forEach(h => h(message));
    } else {
      // Broadcast to all
      this.subscribers.forEach(handlers => {
        handlers.forEach(h => h(message));
      });
    }
  }

  subscribe(agentId: string, handler: (msg: AgentMessage) => void): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId)!.push(handler);
  }

  unsubscribe(agentId: string, handler: (msg: AgentMessage) => void): void {
    const handlers = this.subscribers.get(agentId);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  }

  getMessagesFor(agentId: string, since?: number): AgentMessage[] {
    return this.messages.filter(
      m => (m.to === agentId || m.to === "broadcast" || m.from === agentId) &&
           (!since || m.timestamp > since)
    );
  }

  getConversation(agentId1: string, agentId2: string): AgentMessage[] {
    return this.messages.filter(
      m => (m.from === agentId1 && m.to === agentId2) ||
           (m.from === agentId2 && m.to === agentId1)
    );
  }
}

// ============================================================================
// TASK ROUTER
// ============================================================================

export class TaskRouter extends EventEmitter {
  private taskQueue: Task[] = [];
  private taskMap: Map<string, Task> = new Map();
  private registry: AgentRegistry;
  private bus: InterAgentBus;

  constructor(registry: AgentRegistry, bus: InterAgentBus) {
    super();
    this.registry = registry;
    this.bus = bus;
  }

  submitTask(
    title: string,
    description: string,
    requiredCapabilities: string[],
    options: {
      priority?: TaskPriority;
      dependencies?: string[];
      context?: Record<string, unknown>;
      parentId?: string;
    } = {}
  ): Task {
    const task: Task = {
      id: randomUUID(),
      parentId: options.parentId,
      title,
      description,
      priority: options.priority || "medium",
      requiredCapabilities,
      status: "pending",
      dependencies: options.dependencies || [],
      artifacts: [],
      context: options.context || {},
      createdAt: Date.now(),
    };

    this.taskQueue.push(task);
    this.taskMap.set(task.id, task);

    // Sort by priority
    this.sortQueue();

    this.emit("task:submitted", task);
    return task;
  }

  private sortQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    this.taskQueue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by creation time (older first)
      return a.createdAt - b.createdAt;
    });
  }

  async processQueue(): Promise<Task[]> {
    const assigned: Task[] = [];

    // Filter tasks with resolved dependencies
    const readyTasks = this.taskQueue.filter(
      t => t.status === "pending" && this.areDependenciesMet(t)
    );

    for (const task of readyTasks) {
      const agent = this.registry.findBestForTask(task);
      if (agent) {
        const success = await agent.assignTask(task);
        if (success) {
          task.status = "assigned";
          task.assignedTo = agent.id;
          assigned.push(task);
          this.emit("task:assigned", { task, agent });

          // Remove from queue
          const idx = this.taskQueue.indexOf(task);
          if (idx > -1) this.taskQueue.splice(idx, 1);
        }
      }
    }

    return assigned;
  }

  private areDependenciesMet(task: Task): boolean {
    return task.dependencies.every(depId => {
      const dep = this.taskMap.get(depId);
      return dep?.status === "completed";
    });
  }

  getTask(id: string): Task | undefined {
    return this.taskMap.get(id);
  }

  getPendingTasks(): Task[] {
    return [...this.taskQueue];
  }

  getFailedTasks(): Task[] {
    return Array.from(this.taskMap.values()).filter(t => t.status === "failed");
  }

  getTaskTree(rootId: string): Task | undefined {
    const root = this.taskMap.get(rootId);
    if (!root) return undefined;
    return root;
  }

  getSubtasks(parentId: string): Task[] {
    return Array.from(this.taskMap.values()).filter(t => t.parentId === parentId);
  }

  getStats(): object {
    const all = Array.from(this.taskMap.values());
    return {
      total: all.length,
      pending: this.taskQueue.length,
      assigned: all.filter(t => t.status === "assigned").length,
      in_progress: all.filter(t => t.status === "in_progress").length,
      completed: all.filter(t => t.status === "completed").length,
      failed: all.filter(t => t.status === "failed").length,
      blocked: all.filter(t => t.status === "blocked").length,
    };
  }
}

// ============================================================================
// AGENT SUPERVISOR (ORCHESTRATOR)
// ============================================================================

export class AgentSupervisor extends EventEmitter {
  public readonly id: string;
  public readonly sessionId: string;
  private registry: AgentRegistry;
  private router: TaskRouter;
  private context: SharedContext;
  private bus: InterAgentBus;
  private executionContext: ExecutionContext;
  private isRunning: boolean = false;
  private checkInterval?: NodeJS.Timeout;

  constructor(
    registry: AgentRegistry,
    router: TaskRouter,
    context: SharedContext,
    bus: InterAgentBus
  ) {
    super();
    this.id = randomUUID();
    this.sessionId = randomUUID();
    this.registry = registry;
    this.router = router;
    this.context = context;
    this.bus = bus;
    this.executionContext = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      sharedMemory: new Map(),
      executionLog: [],
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for agent events
    this.registry.getAll().forEach(agent => {
      agent.on("task:completed", (data) => {
        this.handleTaskCompletion(data.agentId, data.taskId, data.result);
      });

      agent.on("status:changed", (data) => {
        this.logEvent(data.agentId, "status_change", data);
      });
    });

    // Listen for bus messages
    this.bus.on("message:sent", (msg) => {
      this.logEvent(msg.from, "message_sent", { to: msg.to, type: msg.type });
    });
  }

  private logEvent(agentId: string, event: string, details: Record<string, unknown>): void {
    this.executionContext.executionLog.push({
      timestamp: Date.now(),
      agentId,
      event,
      details,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit("supervisor:started", { sessionId: this.sessionId });

    // Start processing loop
    this.checkInterval = setInterval(() => {
      this.processCycle();
    }, 1000);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Pause all agents
    this.registry.getAll().forEach(agent => agent.pause());

    this.emit("supervisor:stopped", { sessionId: this.sessionId });
  }

  private async processCycle(): Promise<void> {
    // Process task queue
    const assigned = await this.router.processQueue();
    
    // Start execution for newly assigned tasks
    for (const task of assigned) {
      const agent = this.registry.get(task.assignedTo!);
      if (agent) {
        this.executeTaskOnAgent(agent, task);
      }
    }
  }

  private async executeTaskOnAgent(agent: BaseAgent, task: Task): Promise<void> {
    task.status = "in_progress";
    task.startedAt = Date.now();
    
    this.emit("task:started", { taskId: task.id, agentId: agent.id });

    try {
      const result = await agent.executeTask(task, this.executionContext);
      await agent.completeTask(result);
    } catch (error) {
      await agent.completeTask({
        success: false,
        output: `Execution error: ${error}`,
        artifacts: [{
          id: randomUUID(),
          type: "error",
          content: String(error),
          metadata: { agentId: agent.id, taskId: task.id },
          createdAt: Date.now(),
        }],
        metrics: { duration: 0, steps: 0, tokenUsage: 0 },
      });
    }
  }

  private async handleTaskCompletion(
    agentId: string,
    taskId: string,
    result: TaskResult
  ): Promise<void> {
    const task = this.router.getTask(taskId);
    if (!task) return;

    // Store results in shared context
    await this.context.write(this.sessionId, `task:${taskId}:result`, result);

    // If task failed and has retries left, requeue
    if (!result.success && task.result) {
      // Could implement retry logic here
    }

    this.emit("task:finished", { taskId, agentId, success: result.success });
  }

  async submitWorkflow(
    description: string,
    steps: { title: string; capabilities: string[]; dependencies?: number[] }[]
  ): Promise<string[]> {
    const taskIds: string[] = [];
    const tasks: Task[] = [];

    // Create all tasks
    for (const step of steps) {
      const task = this.router.submitTask(
        step.title,
        `${description} - ${step.title}`,
        step.capabilities,
        { priority: "medium" }
      );
      taskIds.push(task.id);
      tasks.push(task);
    }

    // Set up dependencies
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].dependencies) {
        tasks[i].dependencies = steps[i].dependencies!.map(idx => taskIds[idx]);
      }
    }

    return taskIds;
  }

  getStatus(): object {
    return {
      sessionId: this.sessionId,
      isRunning: this.isRunning,
      uptime: Date.now() - this.executionContext.startTime,
      agents: this.registry.getStats(),
      tasks: this.router.getStats(),
      logSize: this.executionContext.executionLog.length,
    };
  }

  getExecutionReport(): object {
    const tasks = Array.from(this.router.getPendingTasks());
    const allTasks = tasks.map(t => this.router.getTask(t.id)).filter(Boolean);
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.executionContext.startTime,
      agents: this.registry.getAll().map(a => a.toJSON()),
      tasks: {
        total: allTasks.length,
        completed: allTasks.filter(t => t?.status === "completed").length,
        failed: allTasks.filter(t => t?.status === "failed").length,
        pending: allTasks.filter(t => t?.status === "pending").length,
        details: allTasks,
      },
      events: this.executionContext.executionLog,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export interface OrchestratorSystem {
  registry: AgentRegistry;
  router: TaskRouter;
  context: SharedContext;
  bus: InterAgentBus;
  supervisor: AgentSupervisor;
}

export function createOrchestrator(): OrchestratorSystem {
  const registry = new AgentRegistry();
  const context = new SharedContext();
  const bus = new InterAgentBus();
  const router = new TaskRouter(registry, bus);
  const supervisor = new AgentSupervisor(registry, router, context, bus);

  return { registry, router, context, bus, supervisor };
}

// Default agent templates
export const DEFAULT_TEMPLATES: Record<string, Partial<AgentConfig>> = {
  planner: {
    role: "planner",
    description: "Breaks down complex tasks into manageable subtasks",
    capabilities: [
      { name: "task_decomposition", description: "Splits large tasks into smaller ones", confidence: 0.9, tools: [] },
      { name: "dependency_analysis", description: "Identifies task dependencies", confidence: 0.85, tools: [] },
    ],
    systemPrompt: "You are a task planning specialist. Your job is to analyze complex requirements and break them down into discrete, actionable subtasks.",
    maxConcurrency: 1,
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
  researcher: {
    role: "researcher",
    description: "Gathers information and research on topics",
    capabilities: [
      { name: "web_search", description: "Conducts web searches", confidence: 0.9, tools: ["web_search"] },
      { name: "data_analysis", description: "Analyzes gathered data", confidence: 0.8, tools: [] },
      { name: "information_synthesis", description: "Synthesizes information from multiple sources", confidence: 0.85, tools: [] },
    ],
    systemPrompt: "You are a research specialist. Your job is to gather comprehensive information on topics using available tools and synthesize findings.",
    maxConcurrency: 3,
    timeout: 60000,
    retryPolicy: { maxRetries: 3, backoffMs: 2000 },
  },
  code_writer: {
    role: "code_writer",
    description: "Writes and implements code solutions",
    capabilities: [
      { name: "code_generation", description: "Writes code in various languages", confidence: 0.9, tools: ["write_file", "edit_file"] },
      { name: "refactoring", description: "Refactors existing code", confidence: 0.85, tools: ["edit_file"] },
      { name: "api_integration", description: "Integrates with APIs", confidence: 0.8, tools: [] },
    ],
    systemPrompt: "You are a code writing specialist. Your job is to write clean, well-documented, functional code that meets requirements.",
    maxConcurrency: 1,
    timeout: 45000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
  code_reviewer: {
    role: "code_reviewer",
    description: "Reviews code for quality and issues",
    capabilities: [
      { name: "code_review", description: "Reviews code for quality", confidence: 0.9, tools: ["read_file"] },
      { name: "bug_detection", description: "Identifies potential bugs", confidence: 0.85, tools: [] },
      { name: "security_audit", description: "Checks for security issues", confidence: 0.75, tools: [] },
    ],
    systemPrompt: "You are a code review specialist. Your job is to thoroughly review code for bugs, security issues, performance problems, and style violations.",
    maxConcurrency: 2,
    timeout: 30000,
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
  },
  test_writer: {
    role: "test_writer",
    description: "Creates tests and validates functionality",
    capabilities: [
      { name: "test_creation", description: "Creates unit and integration tests", confidence: 0.9, tools: ["write_file", "run_shell"] },
      { name: "coverage_analysis", description: "Analyzes test coverage", confidence: 0.75, tools: [] },
      { name: "validation", description: "Validates implementations", confidence: 0.85, tools: [] },
    ],
    systemPrompt: "You are a testing specialist. Your job is to create comprehensive tests that validate functionality and catch edge cases.",
    maxConcurrency: 1,
    timeout: 45000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
  debugger: {
    role: "debugger",
    description: "Diagnoses and fixes issues",
    capabilities: [
      { name: "error_analysis", description: "Analyzes error messages", confidence: 0.9, tools: ["read_file", "run_shell"] },
      { name: "root_cause_identification", description: "Finds root causes", confidence: 0.85, tools: [] },
      { name: "fix_implementation", description: "Implements fixes", confidence: 0.85, tools: ["edit_file"] },
    ],
    systemPrompt: "You are a debugging specialist. Your job is to diagnose issues from error messages and implement effective fixes.",
    maxConcurrency: 1,
    timeout: 60000,
    retryPolicy: { maxRetries: 3, backoffMs: 1500 },
  },
  documenter: {
    role: "documenter",
    description: "Creates documentation and comments",
    capabilities: [
      { name: "documentation_creation", description: "Creates technical documentation", confidence: 0.9, tools: ["write_file"] },
      { name: "code_commenting", description: "Adds code comments", confidence: 0.85, tools: ["edit_file", "read_file"] },
      { name: "api_documentation", description: "Documents APIs", confidence: 0.8, tools: [] },
    ],
    systemPrompt: "You are a documentation specialist. Your job is to create clear, comprehensive documentation and helpful code comments.",
    maxConcurrency: 2,
    timeout: 30000,
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
  },
  coordinator: {
    role: "coordinator",
    description: "Manages other agents and orchestrates workflows",
    capabilities: [
      { name: "workflow_management", description: "Manages multi-agent workflows", confidence: 0.9, tools: [] },
      { name: "task_delegation", description: "Delegates tasks to appropriate agents", confidence: 0.9, tools: [] },
      { name: "progress_tracking", description: "Tracks overall progress", confidence: 0.85, tools: [] },
    ],
    systemPrompt: "You are a coordination specialist. Your job is to manage workflows, delegate tasks to appropriate agents, and ensure smooth execution.",
    maxConcurrency: 5,
    timeout: 60000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
};
