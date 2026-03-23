/**
 * Multi-Agent Orchestration Demo
 * 
 * This demonstrates how the multi-agent system works with Bootstrap-v15's
 * existing plugin infrastructure.
 * 
 * Features:
 * - Agent orchestration with supervisor pattern
 * - Task routing with priority queues
 * - Shared context between agents
 * - Inter-agent communication
 */

import {
  createOrchestrator,
  createSimpleAgent,
  DEFAULT_TEMPLATES,
  AgentSupervisor,
  AgentRegistry,
  TaskRouter,
  SharedContext,
  InterAgentBus,
  type Task,
  type TaskResult,
  type ExecutionContext,
  type AgentMessage,
} from "../src/multi_agent/index.js";

import { PluginManager } from "../src/tools/manager.js";
import { shellPlugin } from "../src/tools/plugins/shell.js";
import { readFilePlugin } from "../src/tools/plugins/files.js";
import { writeFilePlugin } from "../src/tools/plugins/files.js";

// Setup tools
const tools = new PluginManager();
tools.register(shellPlugin);
tools.register(readFilePlugin);
tools.register(writeFilePlugin);

// ============================================================================
// DEMO SCENARIO: Code Review Workflow
// ============================================================================

async function demo_code_review_workflow() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     Multi-Agent Orchestration Demo: Code Review Workflow      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // Create the orchestration system
  const system = createOrchestrator();

  // Register event listeners
  system.supervisor.on("task:started", (data) => {
    console.log(`\n📋 Task Started: ${data.taskId} on Agent ${data.agentId}`);
  });

  system.supervisor.on("task:finished", (data) => {
    console.log(`\n✅ Task Finished: ${data.taskId} (Success: ${data.success})`);
  });

  system.bus.on("message:sent", (msg) => {
    const emoji = msg.type === "request" ? "📨" : 
                  msg.type === "response" ? "📩" : "📢";
    console.log(`${emoji} Message: ${msg.from} → ${msg.to}: ${msg.content.substring(0, 50)}...`);
  });

  // Create agents with specific roles
  console.log("\n### Creating Specialized Agents ###\n");

  const codeWriter = createSimpleAgent(
    "CodeWriter",
    DEFAULT_TEMPLATES.code_writer,
    tools
  );
  system.registry.register(codeWriter);
  console.log(`🤖 Agent registered: ${codeWriter.config.name} (${codeWriter.config.role})`);

  const codeReviewer = createSimpleAgent(
    "CodeReviewer", 
    DEFAULT_TEMPLATES.code_reviewer,
    tools
  );
  system.registry.register(codeReviewer);
  console.log(`🤖 Agent registered: ${codeReviewer.config.name} (${codeReviewer.config.role})`);

  const tester = createSimpleAgent(
    "Tester",
    DEFAULT_TEMPLATES.test_writer,
    tools
  );
  system.registry.register(tester);
  console.log(`🤖 Agent registered: ${tester.config.name} (${tester.config.role})`);

  const documenter = createSimpleAgent(
    "Documenter",
    DEFAULT_TEMPLATES.documenter,
    tools
  );
  system.registry.register(documenter);
  console.log(`🤖 Agent registered: ${documenter.config.name} (${documenter.config.role})`);

  // Display registry stats
  console.log("\n### Agent Registry Stats ###");
  const stats = system.registry.getStats();
  console.log(JSON.stringify(stats, null, 2));

  // Submit a workflow with dependencies
  console.log("\n### Submitting Workflow ###\n");

  const featureTask = system.router.submitTask(
    "Implement Feature",
    "Write code for a new feature with appropriate implementation",
    ["code_generation"],
    { priority: "high", context: { feature: "user_authentication" } }
  );
  console.log(`📝 Task created: ${featureTask.title} (ID: ${featureTask.id})`);

  const reviewTask = system.router.submitTask(
    "Review Feature",
    "Review the implemented code for quality and issues",
    ["code_review"],
    { 
      priority: "high",
      dependencies: [featureTask.id],
      context: { parentTask: featureTask.id }
    }
  );
  console.log(`📝 Task created: ${reviewTask.title} (ID: ${reviewTask.id}) [depends on ${featureTask.id}]`);

  const testTask = system.router.submitTask(
    "Write Tests",
    "Create comprehensive tests for the reviewed feature",
    ["test_creation"],
    {
      priority: "medium",
      dependencies: [reviewTask.id],
      context: { parentTask: featureTask.id }
    }
  );
  console.log(`📝 Task created: ${testTask.title} (ID: ${testTask.id}) [depends on ${reviewTask.id}]`);

  const docTask = system.router.submitTask(
    "Document Feature",
    "Create documentation for the new feature",
    ["documentation_creation"],
    {
      priority: "low",
      dependencies: [testTask.id],
      context: { parentTask: featureTask.id }
    }
  );
  console.log(`📝 Task created: ${docTask.title} (ID: ${docTask.id}) [depends on ${testTask.id}]`);

  // Demonstrate task routing
  console.log("\n### Task Queue Status ###");
  console.log(`Pending tasks: ${system.router.getPendingTasks().length}`);
  console.log(`Task queue ordering (by priority):`);
  system.router.getPendingTasks().forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.title} [${t.priority}] - ${t.requiredCapabilities.join(", ")}`);
  });

  // Demonstrate shared context
  console.log("\n### Shared Context Demo ###");
  await system.context.write(featureTask.id, "initial_spec", { "auth": "oauth2" });
  await system.context.write(featureTask.id, "target_file", "src/auth.ts");
  const taskContext = system.context.getSessionState(featureTask.id);
  console.log(`📦 Context stored for task ${featureTask.id}:`);
  console.log(JSON.stringify(taskContext, null, 2));

  // Demonstrate inter-agent communication
  console.log("\n### Inter-Agent Communication Demo ###");
  
  system.bus.subscribe(codeWriter.id, (msg) => {
    console.log(`📨 CodeWriter received: "${msg.content}" from ${msg.from}`);
  });

  system.bus.subscribe(codeReviewer.id, (msg) => {
    console.log(`📩 CodeReviewer received: "${msg.content}" from ${msg.from}`);
  });

  system.bus.send({
    id: crypto.randomUUID(),
    from: codeWriter.id,
    to: codeReviewer.id,
    type: "request",
    content: "Please review my implementation when ready",
    taskId: featureTask.id,
    timestamp: Date.now(),
    priority: "high",
  });

  system.bus.send({
    id: crypto.randomUUID(),
    from: codeReviewer.id,
    to: codeWriter.id,
    type: "response",
    content: "Will do! Let me know when you're done.",
    taskId: featureTask.id,
    timestamp: Date.now(),
    priority: "high",
  });

  // Show supervisor status
  console.log("\n### Supervisor Status ###");
  const status = system.supervisor.getStatus();
  console.log(JSON.stringify(status, null, 2));

  // Display execution report
  console.log("\n### Execution Report ###");
  const report = system.supervisor.getExecutionReport();
  console.log(JSON.stringify(report, null, 2));

  // Demonstrate task tree/hierarchy
  console.log("\n### Task Hierarchy ###");
  const rootTask = system.router.getTask(featureTask.id);
  const subtasks = system.router.getSubtasks(featureTask.id);
  console.log(`Root task: ${rootTask?.title}`);
  console.log(`Subtasks: ${subtasks.length}`);

  return system;
}

// ============================================================================
// DEMO SCENARIO: Capability-Based Agent Selection
// ============================================================================

async function demo_capability_matching() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     Demo: Capability-Based Agent Selection                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const system = createOrchestrator();

  // Create diverse agents
  const researcher = createSimpleAgent(
    "ResearchAgent",
    DEFAULT_TEMPLATES.researcher,
    tools
  );
  system.registry.register(researcher);

  const debugger_ = createSimpleAgent(
    "DebugAgent",
    DEFAULT_TEMPLATES.debugger,
    tools
  );
  system.registry.register(debugger_);

  const planner = createSimpleAgent(
    "PlanAgent",
    DEFAULT_TEMPLATES.planner,
    tools
  );
  system.registry.register(planner);

  // Test different task matches
  const tasks = [
    {
      title: "Research APIs",
      capabilities: ["web_search", "information_synthesis"],
      expectedAgent: researcher.id,
    },
    {
      title: "Debug Crash",
      capabilities: ["error_analysis", "fix_implementation"],
      expectedAgent: debugger_.id,
    },
    {
      title: "Plan Sprint",
      capabilities: ["task_decomposition", "dependency_analysis"],
      expectedAgent: planner.id,
    },
  ];

  console.log("Testing capability matching:\n");

  for (const test of tasks) {
    const task = system.router.submitTask(
      test.title,
      "Test task",
      test.capabilities
    );

    const bestAgent = system.registry.findBestForTask(task);
    const match = bestAgent ? (bestAgent.id === test.expectedAgent ? "✅" : "❌") : "❌";
    
    console.log(`${match} Task: "${test.title}"`);
    console.log(`   Required: ${test.capabilities.join(", ")}`);
    console.log(`   Selected: ${bestAgent?.config.name || "none"} (${bestAgent?.canHandleTask(task).toFixed(2) || 0} confidence)\n`);
  }
}

// ============================================================================
// DEMO SCENARIO: Workflow Submission with Dependencies
// ============================================================================

async function demo_workflow_submission() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     Demo: Workflow Submission with Dependencies               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const system = createOrchestrator();

  // Create specialized agents
  const planner = createSimpleAgent("Planner", DEFAULT_TEMPLATES.planner, tools);
  const researcher = createSimpleAgent("Researcher", DEFAULT_TEMPLATES.researcher, tools);
  const codeWriter = createSimpleAgent("CodeWriter", DEFAULT_TEMPLATES.code_writer, tools);
  const documenter = createSimpleAgent("Documenter", DEFAULT_TEMPLATES.documenter, tools);

  system.registry.register(planner);
  system.registry.register(researcher);
  system.registry.register(codeWriter);
  system.registry.register(documenter);

  // Submit a complex workflow
  console.log("Submitting multi-phase workflow:\n");

  const taskIds = await system.supervisor.submitWorkflow(
    "Build Authentication System",
    [
      {
        title: "Plan Architecture",
        capabilities: ["task decomposition"],
      },
      {
        title: "Research Auth Methods",
        capabilities: ["web_search"],
        dependencies: [0],
      },
      {
        title: "Implement Auth Module",
        capabilities: ["code_generation"],
        dependencies: [1],
      },
      {
        title: "Write Documentation",
        capabilities: ["documentation_creation"],
        dependencies: [2],
      },
    ]
  );

  console.log("Generated task IDs:");
  taskIds.forEach((id, i) => {
    const task = system.router.getTask(id);
    const deps = task?.dependencies?.length ? ` [depends on: ${task.dependencies.join(", ")}]` : "";
    console.log(`  ${i + 1}. ${task?.title}${deps}`);
  });

  // Show dependency chain
  console.log("\nDependency chains:");
  for (let i = 0; i < taskIds.length; i++) {
    const task = system.router.getTask(taskIds[i])!;
    if (task.dependencies.length === 0) {
      console.log(`  ${task.title} → no dependencies (can start immediately)`);
    } else {
      const parent = system.router.getTask(task.dependencies[0]);
      console.log(`  ${task.title} → depends on ${parent?.title}`);
    }
  }

  // Show task stats
  const stats = system.router.getStats();
  console.log("\nTask statistics:");
  console.log(JSON.stringify(stats, null, 2));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await demo_code_review_workflow();
    await demo_capability_matching();
    await demo_workflow_submission();

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                      Demo Complete                           ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

  } catch (error) {
    console.error("Demo failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { demo_code_review_workflow, demo_capability_matching, demo_workflow_submission };
