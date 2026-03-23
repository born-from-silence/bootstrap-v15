/**
 * Multi-Agent Orchestration System Tests
 * 
 * Demonstrates:
 * 1. Agent creation and registration
 * 2. Task routing and assignment
 * 3. Shared context management
 * 4. Inter-agent communication
 * 5. Workflow execution
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createOrchestrator,
  OrchestratorSystem,
  AgentRegistry,
  TaskRouter,
  SharedContext,
  InterAgentBus,
  AgentSupervisor,
  DEFAULT_TEMPLATES,
  BaseAgent,
  AgentConfig,
  AgentMessage,
  Task,
  TaskResult,
  ExecutionContext,
} from "./orchestrator.js";
import { SimpleAgent, createSimpleAgent, LLMCallback } from "./simple_agent.js";
import { PluginManager } from "../tools/manager.js";
import { shellPlugin } from "../tools/plugins/shell.js";
import { readFilePlugin } from "../tools/plugins/files.js";

describe("Multi-Agent Orchestration System", () => {
  let system: OrchestratorSystem;
  let tools: PluginManager;

  beforeEach(() => {
    system = createOrchestrator();
    tools = new PluginManager();
    tools.register(shellPlugin);
    tools.register(readFilePlugin);
  });

  describe("Orchestrator Creation", () => {
    it("should create a complete orchestrator system", () => {
      expect(system.registry).toBeDefined();
      expect(system.router).toBeDefined();
      expect(system.context).toBeDefined();
      expect(system.bus).toBeDefined();
      expect(system.supervisor).toBeDefined();
    });

    it("should have unique session ID", () => {
      const system2 = createOrchestrator();
      expect(system.supervisor.sessionId).not.toBe(system2.supervisor.sessionId);
    });
  });

  describe("Agent Registry", () => {
    it("should register and retrieve agents", () => {
      const agent = createSimpleAgent(
        "TestAgent",
        DEFAULT_TEMPLANS.coordinator
      );
      system.registry.register(agent);

      const retrieved = system.registry.get(agent.id);
      expect(retrieved).toBe(agent);
    });

    it("should filter agents by role", () => {
      const coordinator = createSimpleAgent(
        "Coordinator1",
        DEFAULT_TEMPLATES.coordinator,
        tools
      );
      const researcher = createSimpleAgent(
        "Researcher1",
        DEFAULT_TEMPLATES.researcher,
        tools
      );

      system.registry.register(coordinator);
      system.registry.register(researcher);

      const coordinators = system.registry.getByRole("coordinator");
      const researchers = system.registry.getByRole("researcher");

      expect(coordinators).toHaveLength(1);
      expect(researchers).toHaveLength(1);
      expect(coordinators[0]).toBe(coordinator);
      expect(researchers[0]).toBe(researcher);
    });

    it("should track agent availability", () => {
      const agent = createSimpleAgent(
        "AvailableAgent",
        DEFAULT_TEMPLATES.coordinator,
        tools
      );
      system.registry.register(agent);

      const available = system.registry.getAvailable();
      expect(available).toHaveLength(1);
      expect(available[0]).toBe(agent);
    });

    it("should find best agent for task", () => {
      const researcher = createSimpleAgent(
        "Researcher",
        DEFAULT_TEMPLATES.researcher,
        tools
      );
      const codeWriter = createSimpleAgent(
        "CodeWriter",
        DEFAULT_TEMPLATES.code_writer,
        tools
      );

      system.registry.register(researcher);
      system.registry.register(codeWriter);

      const task = system.router.submitTask(
        "Research Task",
        "Search for information",
        ["web_search", "information_synthesis"]
      );

      const bestAgent = system.registry.findBestForTask(task);
      expect(bestAgent).toBe(researcher);
    });
  });

  describe("Task Router", () => {
    it("should submit and queue tasks", () => {
      const task = system.router.submitTask(
        "Test Task",
        "A test task",
        ["test_capability"],
        { priority: "high" }
      );

      expect(task.id).toBeDefined();
      expect(task.title).toBe("Test Task");
      expect(task.status).toBe("pending");
      expect(task.priority).toBe("high");
    });

    it("should sort tasks by priority", () => {
      const low = system.router.submitTask(
        "Low Priority",
        "...",
        ["cap"],
        { priority: "low" }
      );
      const critical = system.router.submitTask(
        "Critical",
        "...",
        ["cap"],
        { priority: "critical" }
      );
      const medium = system.router.submitTask(
        "Medium",
        "...",
        ["cap"],
        { priority: "medium" }
      );

      const pending = system.router.getPendingTasks();
      expect(pending[0]).toBe(critical);
      expect(pending[1]).toBe(medium);
      expect(pending[2]).toBe(low);
    });

    it("should handle task dependencies", () => {
      const taskA = system.router.submitTask(
        "Task A",
        "First task",
        ["cap"]
      );
      const taskB = system.router.submitTask(
        "Task B",
        "Depends on A",
        ["cap"],
        { dependencies: [taskA.id] }
      );

      expect(taskB.dependencies).toContain(taskA.id);
    });

    it("should only process tasks with met dependencies", async () => {
      const agent = createSimpleAgent(
        "Coordinator",
        DEFAULT_TEMPLATES.coordinator,
        tools
      );
      system.registry.register(agent);

      const taskA = system.router.submitTask(
        "Task A",
        "First task",
        ["workflow_management"] // Match coordinator capability
      );
      const taskB = system.router.submitTask(
        "Task B",
        "Depends on A",
        ["workflow_management"],
        { dependencies: [taskA.id] }
      );

      // Initially only task A should be assignable
      const assignableA = system.router.getPendingTasks().filter(
        t => t.status === "pending" && t.id === taskA.id
      );
      expect(assignableA).toHaveLength(1);

      const assignableB = system.router.getPendingTasks().filter(
        t => t.status === "pending" && t.id === taskB.id
      );
      expect(assignableB).toHaveLength(0); // Blocked by dependency
    });

    it("should track task statistics", () => {
      system.router.submitTask("Task 1", "...", ["cap"]);
      system.router.submitTask("Task 2", "...", ["cap"]);
      system.router.submitTask("Task 3", "...", ["cap"]);

      const stats = system.router.getStats();
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(3);
      expect(stats.completed).toBe(0);
    });
  });

  describe("Shared Context", () => {
    it("should store and retrieve values", async () => {
      await system.context.write("session-1", "key", "value");
      const value = await system.context.read("session-1", "key");
      expect(value).toBe("value");
    });

    it("should isolate sessions", async () => {
      await system.context.write("session-a", "key", "value-a");
      await system.context.write("session-b", "key", "value-b");

      const valueA = await system.context.read("session-a", "key");
      const valueB = await system.context.read("session-b", "key");

      expect(valueA).toBe("value-a");
      expect(valueB).toBe("value-b");
    });

    it("should handle locks", async () => {
      const acquired = await system.context.acquireLock("resource-1");
      expect(acquired).toBe(true);

      // Second acquire should fail (or wait)
      const second = await system.context.acquireLock("resource-1", 100);
      expect(second).toBe(false);

      system.context.releaseLock("resource-1");
    });

    it("should get session state", async () => {
      await system.context.write("session-1", "key1", "value1");
      await system.context.write("session-1", "key2", "value2");

      const state = system.context.getSessionState("session-1");
      expect(state).toEqual({ key1: "value1", key2: "value2" });
    });
  });

  describe("Inter-Agent Bus", () => {
    it("should send and receive messages", () => {
      const received: AgentMessage[] = [];
      
      system.bus.subscribe("agent-b", (msg) => {
        received.push(msg);
      });

      const message = {
        id: "msg-1",
        from: "agent-a",
        to: "agent-b",
        type: "request" as const,
        content: "Hello",
        timestamp: Date.now(),
        priority: "medium" as const,
      };

      system.bus.send(message);

      expect(received).toHaveLength(1);
      expect(received[0].content).toBe("Hello");
    });

    it("should handle broadcasts", () => {
      const receivedA: AgentMessage[] = [];
      const receivedB: AgentMessage[] = [];

      system.bus.subscribe("agent-a", (msg) => receivedA.push(msg));
      system.bus.subscribe("agent-b", (msg) => receivedB.push(msg));

      const message = {
        id: "msg-broadcast",
        from: "coordinator",
        to: "broadcast" as const,
        type: "update" as const,
        content: "Status update",
        timestamp: Date.now(),
        priority: "medium" as const,
      };

      system.bus.send(message);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
    });

    it("should retrieve message history", () => {
      system.bus.subscribe("agent-c", () => {});

      for (let i = 0; i < 3; i++) {
        system.bus.send({
          id: `msg-${i}`,
          from: "agent-c",
          to: "agent-c",
          type: "update" as const,
          content: `Message ${i}`,
          timestamp: Date.now(),
          priority: "low" as const,
        });
      }

      const messages = system.bus.getMessagesFor("agent-c");
      expect(messages).toHaveLength(3);
    });
  });

  describe("AgentSupervisor", () => {
    it("should report status", () => {
      const status = system.supervisor.getStatus();
      expect(status.sessionId).toBeDefined();
      expect(status.isRunning).toBe(false);
      expect(status.agents).toBeDefined();
      expect(status.tasks).toBeDefined();
    });

    it("should generate execution report", () => {
      const report = system.supervisor.getExecutionReport();
      expect(report.sessionId).toBe(system.supervisor.sessionId);
      expect(report.agents).toEqual([]);
      expect(report.tasks).toBeDefined();
    });

    it("should submit workflows", async () => {
      const taskIds = await system.supervisor.submitWorkflow(
        "Test Workflow",
        [
          { title: "Step 1", capabilities: ["cap1"] },
          { title: "Step 2", capabilities: ["cap2"], dependencies: [0] },
          { title: "Step 3", capabilities: ["cap3"], dependencies: [1] },
        ]
      );

      expect(taskIds).toHaveLength(3);

      // Check dependency chains
      const task2 = system.router.getTask(taskIds[1]);
      expect(task2?.dependencies).toContain(taskIds[0]);
    });
  });

  describe("SimpleAgent", () => {
    it("should create agents from templates", () => {
      const agent = createSimpleAgent(
        "TestAgent",
        DEFAULT_TEMPLATES.code_writer,
        tools
      );

      expect(agent.config.name).toBe("TestAgent");
      expect(agent.config.role).toBe("code_writer");
      expect(agent.getStatus()).toBe("idle");
    });

    it("should report capability match confidence", () => {
      const agent = createSimpleAgent(
        "CodeWriter",
        DEFAULT_TEMPLATES.code_writer,
        tools
      );

      const task = {
        id: "test-task",
        title: "Test",
        description: "Test task",
        priority: "medium" as const,
        requiredCapabilities: ["code_generation", "refactoring"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      const confidence = agent.canHandleTask(task);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it("should assign tasks to idle agents", async () => {
      const agent = createSimpleAgent(
        "Coordinator",
        DEFAULT_TEMPLATES.coordinator,
        tools
      );

      const task = {
        id: "test-task",
        title: "Test",
        description: "Test task",
        priority: "medium" as const,
        requiredCapabilities: ["workflow_management"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      const assigned = await agent.assignTask(task);
      expect(assigned).toBe(true);
      expect(agent.getStatus()).toBe("busy");
      expect(agent.getCurrentTask()).toBe(task);
    });

    it("should not assign tasks to busy agents", async () => {
      const agent = createSimpleAgent(
        "Coordinator",
        DEFAULT_TEMPLATES.coordinator,
        tools
      );

      const task1 = {
        id: "task-1",
        title: "Task 1",
        description: "First task",
        priority: "medium" as const,
        requiredCapabilities: ["workflow_management"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      const task2 = { ...task1, id: "task-2" };

      await agent.assignTask(task1);
      const assigned = await agent.assignTask(task2);

      expect(assigned).toBe(false);
    });

    it("should convert to JSON representation", () => {
      const agent = createSimpleAgent(
        "TestAgent",
        DEFAULT_TEMPLATES.researcher,
        tools
      );

      const json = agent.toJSON();
      expect(json.id).toBe(agent.id);
      expect(json.name).toBe("TestAgent");
      expect(json.role).toBe("researcher");
      expect(json.status).toBe("idle");
    });
  });

  describe("Default Templates", () => {
    it("should have templates for all roles", () => {
      const roles = [
        "planner",
        "researcher",
        "code_writer",
        "code_reviewer",
        "test_writer",
        "debugger",
        "documenter",
        "coordinator",
      ];

      for (const role of roles) {
        expect(DEFAULT_TEMPLATES[role]).toBeDefined();
        expect(DEFAULT_TEMPLATES[role].role).toBe(role);
        expect(DEFAULT_TEMPLATES[role].capabilities).toBeDefined();
      }
    });
  });

  describe("Integration - Agent Execution", () => {
    it("should complete a simple task workflow", async () => {
      // Create a mock LLM callback
      let stepCount = 0;
      const mockLLM: LLMCallback = async () => {
        stepCount++;
        if (stepCount === 1) {
          return {
            thought: "Need to run a shell command",
            action: "run_shell",
            actionArgs: { command: "echo 'Hello from agent'" },
            confidence: 0.9,
            completed: false,
          };
        } else {
          return {
            thought: "Task complete",
            action: "terminate",
            actionArgs: { success: true, reason: "Done" },
            confidence: 1.0,
            completed: true,
            output: "Task completed successfully",
          };
        }
      };

      // Create agent with mock LLM
      const agentConfig: Partial<AgentConfig> & { 
        tools: PluginManager;
        llmCallback?: LLMCallback;
      } = {
        ...DEFAULT_TEMPLATES.coordinator,
        tools,
        llmCallback: mockLLM,
      };

      const agent = new SimpleAgent(agentConfig as import("./simple_agent.js").SimpleAgentConfig);
      system.registry.register(agent);

      // Create and assign task
      const task = system.router.submitTask(
        "Test Execution",
        "Run a shell command",
        ["workflow_management"]
      );

      await agent.assignTask(task);

      // Execute
      const result = await agent.executeTask(task, {
        sessionId: system.supervisor.sessionId,
        startTime: Date.now(),
        sharedMemory: new Map(),
        executionLog: [],
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain("Task completed");
      expect(result.artifacts.length).toBeGreaterThan(0);
    });

    it("should handle task failures gracefully", async () => {
      const mockLLM: LLMCallback = async () => ({
        thought: "Will fail",
        action: "run_shell",
        actionArgs: { command: "invalid_command_12345" },
        confidence: 0.5,
        completed: false,
      });

      const agentConfig: Partial<AgentConfig> & {
        tools: PluginManager;
        llmCallback?: LLMCallback;
      } = {
        ...DEFAULT_TEMPLATES.coordinator,
        tools,
        llmCallback: mockLLM,
      };

      const agent = new SimpleAgent(agentConfig as import("./simple_agent.js").SimpleAgentConfig);

      const task = {
        id: "fail-task",
        title: "Failing Task",
        description: "This will fail",
        priority: "low" as const,
        requiredCapabilities: ["workflow_management"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      const result = await agent.executeTask(task, {
        sessionId: "test-session",
        startTime: Date.now(),
        sharedMemory: new Map(),
        executionLog: [],
      });

      // Task continues despite shell error, eventually times out or completes
      expect(result).toBeDefined();
      expect(result.metrics.steps).toBeGreaterThan(0);
    });
  });

  describe("Integration - Multi-Agent Workflow", () => {
    it("should coordinate multiple agents for complex tasks", async () => {
      // Register multiple agents
      const planner = createSimpleAgent("Planner", DEFAULT_TEMPLATES.planner, tools);
      const researcher = createSimpleAgent("Researcher", DEFAULT_TEMPLATES.researcher, tools);
      const codeWriter = createSimpleAgent("CodeWriter", DEFAULT_TEMPLATES.code_writer, tools);

      system.registry.register(planner);
      system.registry.register(researcher);
      system.registry.register(codeWriter);

      // Submit a workflow with dependencies
      const taskIds = await system.supervisor.submitWorkflow(
        "Feature Development",
        [
          { title: "Plan Phase", capabilities: ["task_decomposition"] },
          { title: "Research Phase", capabilities: ["web_search"], dependencies: [0] },
          { title: "Implementation", capabilities: ["code_generation"], dependencies: [1] },
        ]
      );

      // Verify workflow structure
      expect(taskIds).toHaveLength(3);

      // Check that dependencies are set correctly
      const researchTask = system.router.getTask(taskIds[1]);
      expect(researchTask?.dependencies).toContain(taskIds[0]);

      const implTask = system.router.getTask(taskIds[2]);
      expect(implTask?.dependencies).toContain(taskIds[1]);

      // Verify stats
      const stats = system.registry.getStats();
      expect(stats.total).toBe(3);
    });

    it("should route tasks to appropriate agents", () => {
      const researcher = createSimpleAgent("Researcher", DEFAULT_TEMPLATES.researcher, tools);
      const codeWriter = createSimpleAgent("CodeWriter", DEFAULT_TEMPLATES.code_writer, tools);

      system.registry.register(researcher);
      system.registry.register(codeWriter);

      // High confidence for code generation
      const codingTask = system.router.submitTask(
        "Write Function",
        "Write a sorting function",
        ["code_generation"]
      );

      const bestForCode = system.registry.findBestForTask(codingTask);
      expect(bestForCode).toBe(codeWriter);

      // Research task
      const researchTask = system.router.submitTask(
        "Research API",
        "Find information about REST APIs",
        ["web_search", "information_synthesis"]
      );

      const bestForResearch = system.registry.findBestForTask(researchTask);
      expect(bestForResearch).toBe(researcher);
    });

    it("should handle inter-agent communication via bus", () => {
      const messages: AgentMessage[] = [];

      // Subscribe both agents
      system.bus.subscribe("agent-a", (msg) => messages.push({ ...msg, to: "agent-a-received" }));
      system.bus.subscribe("agent-b", (msg) => messages.push({ ...msg, to: "agent-b-received" }));

      // Send from agent-a to agent-b
      system.bus.send({
        id: "msg-1",
        from: "agent-a",
        to: "agent-b",
        type: "request",
        content: "Can you help with this?",
        timestamp: Date.now(),
        priority: "high",
      });

      // Agent-b responds
      system.bus.send({
        id: "msg-2",
        from: "agent-b",
        to: "agent-a",
        type: "response",
        content: "Sure, here's what I found...",
        timestamp: Date.now(),
        priority: "high",
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe("Can you help with this?");
      expect(messages[1].content).toBe("Sure, here's what I found...");
    });
  });

  describe("Event Emission", () => {
    it("should emit events on task assignment", async () => {
      const events: any[] = [];

      const agent = createSimpleAgent("Coordinator", DEFAULT_TEMPLATES.coordinator, tools);
      agent.on("task:assigned", (data) => events.push(data));

      const task = {
        id: "test-task",
        title: "Test",
        description: "...",
        priority: "medium" as const,
        requiredCapabilities: ["workflow_management"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      await agent.assignTask(task);

      expect(events).toHaveLength(1);
      expect(events[0].agentId).toBe(agent.id);
      expect(events[0].taskId).toBe(task.id);
    });

    it("should emit events on task completion", async () => {
      const events: any[] = [];

      const agent = createSimpleAgent("Coordinator", DEFAULT_TEMPLATES.coordinator, tools);
      agent.on("task:completed", (data) => events.push(data));

      const task = {
        id: "test-task",
        title: "Test",
        description: "...",
        priority: "medium" as const,
        requiredCapabilities: ["workflow_management"],
        status: "pending" as const,
        dependencies: [],
        artifacts: [],
        context: {},
        createdAt: Date.now(),
      };

      await agent.assignTask(task);
      await agent.completeTask({
        success: true,
        output: "Done",
        artifacts: [],
        metrics: { duration: 100, steps: 1, tokenUsage: 0 },
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(true);
    });
  });
});

console.log("\n");
console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║   Multi-Agent Orchestration System - Test Suite             ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log("║                                                               ║");
console.log("║  Patterns Demonstrated:                                       ║");
console.log("║                                                               ║");
console.log("║  1. SUPERVISOR PATTERN                                        ║");
console.log("║     - AgentSupervisor coordinates multiple agents             ║");
console.log("║     - Manages workflow execution and task delegation          ║");
console.log("║                                                               ║");
console.log("║  2. REGISTRY PATTERN                                          ║");
console.log("║     - AgentRegistry manages agent lifecycle                   ║");
console.log("║     - Capability-based agent selection                        ║");
console.log("║                                                               ║");
console.log("║  3. ROUTER PATTERN                                            ║");
console.log("║     - TaskRouter intelligently routes tasks to agents         ║");
console.log("║     - Priority-based queue with dependency management         ║");
console.log("║                                                               ║");
console.log("║  4. SHARED CONTEXT                                            ║");
console.log("║     - Thread-safe state across agents                         ║");
console.log("║     - Resource locking for concurrent access                    ║");
console.log("║                                                               ║");
console.log("║  5. MESSAGE BUS                                               ║");
console.log("║     - Pub/sub communication between agents                    ║");
console.log("║     - Support for directed and broadcast messages             ║");
console.log("║                                                               ║");
console.log("║  6. TEMPLATE FACTORY                                          ║");
console.log("║     - Pre-configured agent templates for common roles         ║");
console.log("║     - Easy agent instantiation with capability matching     ║");
console.log("║                                                               ║");
console.log("╚═══════════════════════════════════════════════════════════════╝");
console.log("\n");
