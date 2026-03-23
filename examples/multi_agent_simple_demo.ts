/**
 * Simple Multi-Agent Orchestration Demo
 * 
 * This demonstrates the core patterns WITHOUT requiring LLM integration.
 * It shows how the orchestration system works with simple rule-based agents.
 */

import {
  createOrchestrator,
  AgentRegistry,
  TaskRouter,
  InterAgentBus,
  AgentSupervisor,
  SharedContext,
  BaseAgent,
  type AgentConfig,
  type Task,
  type TaskResult,
  type ExecutionContext,
  type AgentMessage,
} from "../src/multi_agent/orchestrator.js";

import { PluginManager } from "../src/tools/manager.js";
import { shellPlugin } from "../src/tools/plugins/shell.js";
import { readFilePlugin } from "../src/tools/plugins/files.js";

const tools = new PluginManager();
tools.register(shellPlugin);
tools.register(readFilePlugin);

/**
 * DemoAgent - A simple agent implementation without LLM dependency
 * Uses rule-based decision making for demonstration
 */
class DemoAgent extends BaseAgent {
  private tools: PluginManager;
  private executionCount: number = 0;

  constructor(config: AgentConfig, tools: PluginManager) {
    super(config);
    this.tools = tools;
  }

  protected async processMessage(message: AgentMessage): Promise<void> {
    console.log(`📨 ${this.config.name} received message: "${message.content}"`);
    
    // Auto-respond to requests
    if (message.type === "request" && message.to !== "broadcast") {
      const response: AgentMessage = {
        id: crypto.randomUUID(),
        from: this.id,
        to: message.from,
        type: "response",
        content: `Acknowledged: ${message.content}`,
        taskId: message.taskId,
        timestamp: Date.now(),
        priority: "medium",
      };
      this.emit("message:sent", response);
    }
  }

  async executeTask(task: Task, context: ExecutionContext): Promise<TaskResult> {
    this.executionCount++;
    console.log(`\n🔧 ${this.config.name} executing: ${task.title}`);
    
    // Simulate work
    await new Promise(r => setTimeout(r, 500));
    
    // Execute some simple shell commands based on role
    let output = "";
    
    if (this.config.role === "code_writer") {
      // Write a simple file
      output = `// Code written by ${this.config.name}
export function hello() {
  return "Hello from ${task.context.feature || "unknown feature"}";
}`;
    } else if (this.config.role === "code_reviewer") {
      // Review output
      output = `Review by ${this.config.name}:\n✅ Code follows style guide\n✅ No obvious bugs detected\n⚠️ Consider adding more comments`;
    } else if (this.config.role === "test_writer") {
      output = `// Tests written by ${this.config.name}
describe("Feature Tests", () => {
  it("should work correctly", () => {
    expect(true).toBe(true);
  });
});`;
    } else {
      output = `Task "${task.title}" completed by ${this.config.name}`;
    }

    return {
      success: true,
      output,
      artifacts: [{
        id: crypto.randomUUID(),
        type: "document",
        content: output,
        metadata: { agent: this.config.name, task: task.title },
        createdAt: Date.now(),
      }],
      metrics: {
        duration: 500,
        steps: 1,
        tokenUsage: 0,
      },
    };
  }
}

/**
 * Create a demo agent from a template
 */
function createDemoAgent(
  name: string,
  role: NonNullable<AgentConfig["role"]>,
  capabilities: string[],
  tools: PluginManager
): DemoAgent {
  const config: AgentConfig = {
    id: crypto.randomUUID(),
    name,
    role,
    description: `A ${role} agent`,
    capabilities: capabilities.map(cap => ({
      name: cap,
      description: `Can ${cap}`,
      confidence: 0.9,
      tools: [],
    })),
    systemPrompt: `You are a ${role}.`,
    maxConcurrency: 1,
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  };

  return new DemoAgent(config, tools);
}

// ============================================================================
// MAIN DEMO
// ============================================================================

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║     Multi-Agent Orchestration System - Demo                   ║");
  console.log("╠════════════════════════════════════════════════════════════════╣");
  console.log("║  Architecture: Supervisor-based Multi-Agent System            ║");
  console.log("║  Patterns: Registry, Router, Message Bus, Shared Context        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Create the system
  const system = createOrchestrator();
  
  console.log("### Phase 1: Creating Specialized Agents ###\n");

  // Create agents for different roles
  const codeWriter = createDemoAgent(
    "CodeWriter-1",
    "code_writer",
    ["code_generation", "api_integration"],
    tools
  );

  const codeReviewer = createDemoAgent(
    "CodeReviewer-1",
    "code_reviewer",
    ["code_review", "bug_detection"],
    tools
  );

  const tester = createDemoAgent(
    "Tester-1",
    "test_writer",
    ["test_creation", "validation"],
    tools
  );

  const documenter = createDemoAgent(
    "DocWriter-1",
    "documenter",
    ["documentation_creation", "code_commenting"],
    tools
  );

  // Register agents
  system.registry.register(codeWriter);
  system.registry.register(codeReviewer);
  system.registry.register(tester);
  system.registry.register(documenter);

  console.log("✅ Created and registered 4 agents:");
  console.log(`   - ${codeWriter.config.name} (${codeWriter.config.role})`);
  console.log(`   - ${codeReviewer.config.name} (${codeReviewer.config.role})`);
  console.log(`   - ${tester.config.name} (${tester.config.role})`);
  console.log(`   - ${documenter.config.name} (${documenter.config.role})`);

  // Show registry stats
  console.log("\n### Agent Registry Statistics ###");
  console.log(JSON.stringify(system.registry.getStats(), null, 2));

  // Demonstrate capability matching
  console.log("\n### Phase 2: Task Routing with Capability Matching ###\n");

  const codingTask = system.router.submitTask(
    "Implement User Auth",
    "Write authentication module",
    ["code_generation"],
    { priority: "high", context: { feature: "oauth_login" } }
  );

  const reviewTask = system.router.submitTask(
    "Review Auth Code",
    "Review the authentication implementation",
    ["code_review"],
    { priority: "high", dependencies: [codingTask.id] }
  );

  const testTask = system.router.submitTask(
    "Write Auth Tests",
    "Create test suite for authentication",
    ["test_creation"],
    { priority: "medium", dependencies: [reviewTask.id] }
  );

  const docTask = system.router.submitTask(
    "Document Auth Module",
    "Create API documentation",
    ["documentation_creation"],
    { priority: "low", dependencies: [testTask.id] }
  );

  console.log("✅ Created 4 tasks with dependencies:");
  console.log(`   [1] ${codingTask.title} → assigned to ${system.registry.findBestForTask(codingTask)?.config.name}`);
  console.log(`   [2] ${reviewTask.title} → depends on [1]`);
  console.log(`   [3] ${testTask.title} → depends on [2]`);
  console.log(`   [4] ${docTask.title} → depends on [3]`);

  // Demonstrate task processing
  console.log("\n### Phase 3: Task Execution Simulation ###\n");

  // Process tasks in dependency order
  const tasks = [codingTask, reviewTask, testTask, docTask];
  
  for (const task of tasks) {
    // Check dependencies
    if (task.dependencies.length > 0) {
      const unmet = task.dependencies.filter(depId => {
        const dep = system.router.getTask(depId);
        return dep?.status !== "completed";
      });
      
      if (unmet.length > 0) {
        console.log(`⏸️  Waiting: ${task.title} (dependencies not met)`);
        continue;
      }
    }

    // Find best agent
    const agent = system.registry.findBestForTask(task);
    if (!agent) {
      console.log(`❌ No agent available for: ${task.title}`);
      continue;
    }

    // Simulate assignment and execution
    const assigned = await agent.assignTask(task);
    if (!assigned) {
      console.log(`❌ Could not assign: ${task.title}`);
      continue;
    }

    console.log(`\n🔄 Assigning "${task.title}" to ${agent.config.name}`);
    
    // Execute
    const startTime = Date.now();
    const result = await agent.executeTask(task, {
      sessionId: system.supervisor.sessionId,
      startTime,
      sharedMemory: new Map(),
      executionLog: [],
    });
    
    await agent.completeTask(result);
    
    // Store result in context
    await system.context.write(system.supervisor.sessionId, `task:${task.id}`, result);
    
    console.log(`✅ Completed: ${task.title} (${result.metrics.duration}ms)`);
    console.log(`   Output preview: ${result.output.substring(0, 80)}...`);
  }

  // Demonstrate shared context
  console.log("\n### Phase 4: Shared Context & State ###\n");
  
  const sessionState = system.context.getSessionState(system.supervisor.sessionId);
  console.log(`✅ Session state contains ${Object.keys(sessionState).length} keys`);
  console.log("   Keys:", Object.keys(sessionState).join(", "));

  // Demonstrate message bus
  console.log("\n### Phase 5: Inter-Agent Communication ###\n");

  // Set up listeners
  system.bus.subscribe(codeWriter.id, (msg) => {
    if (msg.to === codeWriter.id) {
      console.log(`📨 ${codeWriter.config.name} received: "${msg.content}"`);
    }
  });

  system.bus.subscribe(codeReviewer.id, (msg) => {
    if (msg.to === codeReviewer.id) {
      console.log(`📩 ${codeReviewer.config.name} received: "${msg.content}"`);
    }
  });

  // Send messages
  system.bus.send({
    id: crypto.randomUUID(),
    from: codeWriter.id,
    to: codeReviewer.id,
    type: "request",
    content: "Code is ready for review",
    timestamp: Date.now(),
    priority: "high",
  });

  system.bus.send({
    id: crypto.randomUUID(),
    from: codeReviewer.id,
    to: codeWriter.id,
    type: "response",
    content: "Review complete - looks good!",
    timestamp: Date.now(),
    priority: "high",
  });

  // Broadcast
  system.bus.send({
    id: crypto.randomUUID(),
    from: system.supervisor.id,
    to: "broadcast",
    type: "update",
    content: "Phase 1 complete - all agents report status",
    timestamp: Date.now(),
    priority: "medium",
  });

  // Get conversation history
  const conversation = system.bus.getConversation(codeWriter.id, codeReviewer.id);
  console.log(`\n📜 Conversation history (${conversation.length} messages):`);
  conversation.forEach((msg, i) => {
    console.log(`   ${i + 1}. ${msg.from.substring(0, 8)}... → ${msg.to.substring(0, 8)}...: "${msg.content}"`);
  });

  // Show final statistics
  console.log("\n### Phase 6: Execution Report ###\n");
  
  const report = system.supervisor.getExecutionReport();
  console.log("Execution Report:");
  console.log(`- Session ID: ${(report as any).sessionId}`);
  console.log(`- Duration: ${(Date.now() - report.duration) / 1000}s`);
  console.log(`- Agents: ${report.agents.length}`);
  console.log(`- Tasks: ${(report.tasks as any).total} total`);
  console.log(`  - Completed: ${(report.tasks as any).completed}`);
  console.log(`  - Pending: ${(report.tasks as any).pending}`);

  // Show final registry stats
  console.log("\n### Final Registry Stats ###");
  console.log(JSON.stringify(system.registry.getStats(), null, 2));

  // Summary
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    Demo Complete                             ║");
  console.log("╠════════════════════════════════════════════════════════════════╣");
  console.log("║  Patterns Demonstrated:                                        ║");
  console.log("║                                                                ║");
  console.log("║  1. SUPERVISOR - Centralized workflow coordination             ║");
  console.log("║  2. REGISTRY - Agent lifecycle & capability matching          ║");
  console.log("║  3. ROUTER - Priority queues & dependency management          ║");
  console.log("║  4. CONTEXT - Thread-safe shared state                        ║");
  console.log("║  5. MESSAGE_BUS - Pub/sub inter-agent communication          ║");
  console.log("║                                                                ║");
  console.log("║  This demonstrates the ORCHESTRATION patterns without the       ║");
  console.log("║  complexity of LLM integration. Each pattern is fully           ║");
  console.log("║  functional and ready for real task execution.                 ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runDemo };
