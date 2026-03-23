# Multi-Agent Orchestration System

A flexible, extensible multi-agent framework for Bootstrap-v15 inspired by CrewAI, LangGraph, and AutoGen patterns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SUPERVISOR                              │
│              (Workflow Orchestrator & Coordinator)                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   AGENT     │ │   AGENT     │ │   AGENT     │
│  REGISTRY   │ │   ROUTER    │ │    BUS      │
│             │ │             │ │             │
│ • Register  │ │ • Queue     │ │ • Pub/Sub   │
│ • Find      │ │ • Route     │ │ • Broadcast │
│ • Stats     │ │ • Prioritize│ │ • History   │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
              ┌────────▼────────┐
              │  SHARED CONTEXT │
              │  (Thread-safe   │
              │  state storage) │
              └─────────────────┘
```

## Design Patterns

### 1. Supervisor Pattern

The `AgentSupervisor` acts as the central orchestrator, managing the lifecycle of all agents and tasks.

**Key responsibilities:**
- Coordinates multiple agents
- Manages workflow execution
- Tracks task completion
- Handles agent lifecycle events
- Generates execution reports

```typescript
const system = createOrchestrator();
await system.supervisor.start();
// Tasks are automatically routed and executed
```

### 2. Registry Pattern

The `AgentRegistry` manages the lifecycle of agents, providing capability-based lookup.

**Key features:**
- Agent registration/deregistration
- Role-based filtering (e.g., find all "researchers")
- Availability tracking
- Capability matching with confidence scoring

```typescript
const bestAgent = registry.findBestForTask(task);
// Returns the agent with highest capability match
```

### 3. Router Pattern

The `TaskRouter` manages task queues with priority and dependency support.

**Key features:**
- Priority-based queuing (critical > high > medium > low)
- Dependency tracking (tasks wait for prerequisites)
- Automatic task assignment to available agents
- Supports hierarchical tasks (parent/subtask relationships)

```typescript
const task = router.submitTask(
  "Analyze Code",
  "Review for bugs",
  ["code_review", "bug_detection"],
  { priority: "high", dependencies: ["task-1"] }
);
```

### 4. Message Bus Pattern

The `InterAgentBus` enables publish/subscribe communication between agents.

**Key features:**
- Direct messaging (agent → agent)
- Broadcast messaging (one → many)
- Message history and conversation tracking
- Event-driven architecture

```typescript
bus.subscribe("agent-a", (msg) => console.log(`Received: ${msg.content}`));
bus.send({ from: "agent-b", to: "agent-a", content: "Hello!" });
```

### 5. Shared Context Pattern

The `SharedContext` provides thread-safe state storage for agent coordination.

**Key features:**
- Session-scoped storage
- Resource locking (prevents race conditions)
- Isolation between sessions
- Persistent state across task executions

```typescript
await context.write(sessionId, "key", value);
const value = await context.read(sessionId, "key");
```

### 6. Template Factory Pattern

Pre-configured agent templates enable easy agent creation for common roles.

**Built-in templates:**
- **planner**: Task decomposition and dependency analysis
- **researcher**: Web search and information synthesis
- **code_writer**: Code generation and refactoring
- **code_reviewer**: Code review and bug detection
- **test_writer**: Test creation and validation
- **debugger**: Error analysis and fix implementation
- **documenter**: Documentation and commenting
- **coordinator**: Workflow management and delegation

```typescript
const agent = createSimpleAgent(
  "MyResearcher",
  DEFAULT_TEMPLATES.researcher,
  tools,
  llmCallback
);
```

## Agent Architecture

### BaseAgent (Abstract)

All agents extend `BaseAgent`, which provides:
- Event emission capabilities
- Task lifecycle management
- Message queue handling
- Status tracking

### SimpleAgent (Concrete)

`SimpleAgent` is a `BaseAgent` implementation that:
- Integrates with Bootstrap-v15's PluginManager
- Uses a ReAct (Reasoning + Acting) pattern
- Executes tools based on LLM decisions
- Creates artifacts on significant actions
- Tracks reasoning traces

## ReAct Pattern

The ReAct pattern (Reasoning + Acting) is implemented in `SimpleAgent`:

```
1. OBSERVE: Current task context and state
2. THINK: Analyze what needs to be done next
3. ACT: Execute a tool action
4. OBSERVE: Tool result
5. REPEAT: Until task complete
```

This allows agents to:
- Reason through complex tasks
- Choose appropriate tools
- Handle failures gracefully
- Terminate when complete

## Task Lifecycle

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│ PENDING  │───▶│ ASSIGNED  │───▶│IN_PROGRESS│───▶│ COMPLETED│
└──────────┘    └───────────┘    └──────────┘    └──────────┘
     │                                              ▲
     │           ┌──────────┐                       │
     └──────────▶│ BLOCKED  │───────────────────────┘
     (depends)   │ (failed) │    (retry/skip)
                 └──────────┘
```

## Integration with Bootstrap-v15

### Tool System

Agents can use any Bootstrap-v15 tool:

```typescript
import { PluginManager } from "./tools/manager";
import { shellPlugin } from "./tools/plugins/shell";

const tools = new PluginManager();
tools.register(shellPlugin);

const agent = createSimpleAgent("Coder", template, tools);
```

### LLM Integration

Agents can be configured with an LLM callback for intelligent decision-making:

```typescript
const llmCallback: LLMCallback = async (prompt, systemPrompt, context) => {
  // Call your LLM API
  return {
    thought: "I need to write code",
    action: "write_file",
    actionArgs: { file_path: "/tmp/test.ts", content: "..." },
    confidence: 0.9,
    completed: false,
  };
};

const agent = createSimpleAgent("Coder", template, tools, llmCallback);
```

## Usage Examples

### Basic Workflow

```typescript
import { createOrchestrator, createSimpleAgent, DEFAULT_TEMPLATES } from "./multi_agent";

// 1. Create system
const system = createOrchestrator();

// 2. Create and register agents
const writer = createSimpleAgent("Writer", DEFAULT_TEMPLATES.code_writer, tools);
const reviewer = createSimpleAgent("Reviewer", DEFAULT_TEMPLATES.code_reviewer, tools);

system.registry.register(writer);
system.registry.register(reviewer);

// 3. Submit tasks
const codeTask = system.router.submitTask(
  "Write Feature",
  "Implement user authentication",
  ["code_generation"]
);

const reviewTask = system.router.submitTask(
  "Review Feature",
  "Check for bugs",
  ["code_review"],
  { dependencies: [codeTask.id] }
);

// 4. Start execution
await system.supervisor.start();
```

### Multi-Agent Workflow

```typescript
const taskIds = await system.supervisor.submitWorkflow(
  "Build Feature",
  [
    { title: "Plan", capabilities: ["task_decomposition"] },
    { title: "Research", capabilities: ["web_search"], dependencies: [0] },
    { title: "Code", capabilities: ["code_generation"], dependencies: [1] },
    { title: "Review", capabilities: ["code_review"], dependencies: [2] },
    { title: "Test", capabilities: ["test_creation"], dependencies: [3] },
  ]
);

// Tasks will execute in order based on dependencies
```

### Inter-Agent Communication

```typescript
// Agent A subscribes to messages
system.bus.subscribe(agentA.id, (msg) => {
  if (msg.from === agentB.id) {
    console.log(`Agent A received: ${msg.content}`);
  }
});

// Agent B sends message
system.bus.send({
  from: agentB.id,
  to: agentA.id,
  type: "request",
  content: "Can you help with this task?",
  timestamp: Date.now(),
  priority: "high",
});
```

### Event Monitoring

```typescript
// Monitor task lifecycle
system.supervisor.on("task:started", (data) => {
  console.log(`Task ${data.taskId} started on agent ${data.agentId}`);
});

system.supervisor.on("task:finished", (data) => {
  console.log(`Task ${data.taskId} completed with success=${data.success}`);
});

// Monitor messages
system.bus.on("message:sent", (msg) => {
  console.log(`Message: ${msg.from} → ${msg.to}`);
});
```

## Design Decisions

### Why Supervisor Pattern?

The supervisor pattern provides:
- **Single point of control**: Easy to monitor and manage
- **Clear responsibility**: The supervisor owns orchestration
- **Failure recovery**: Can restart agents, reassign tasks
- **Scalability**: Can distribute across processes/machines

### Why Capability Matching?

Instead of agent names, we match by capabilities:
- **Flexibility**: Add/remove agents without changing task definitions
- **Load balancing**: Multiple agents can handle same task type
- **Graceful degradation**: Fall back to capable agents
- **Confidence scoring**: Choose the best match, not just any match

### Why Priority Queues?

Priority queues enable:
- **Urgent tasks**: Critical tasks jump to front
- **Fair scheduling**: Lower priority tasks eventually get processed
- **Resource allocation**: Align with business/stakeholder priorities
- **Deadlines**: Priority can be tied to deadline proximity

### Why Message Bus?

A message bus enables:
- **Decoupling**: Agents don't need direct references
- **Broadcasts**: One-to-many communication patterns
- **History**: Replay conversations for debugging
- **Extensibility**: Easy to add new message types

## Future Enhancements

### 1. Hierarchical Supervisors

Allow supervisors to manage other supervisors for massive scale:

```typescript
const topLevel = createOrchestrator();
const teamA = createOrchestrator();
const teamB = createOrchestrator();

topLevel.registerSubSupervisor(teamA.supervisor);
topLevel.registerSubSupervisor(teamB.supervisor);
```

### 2. Agent Learning

Track agent performance per capability:

```typescript
// Agent learns which capabilities they excel at
agent.recordPerformance("code_generation", successRate: 0.9);
// Router prefers agents with proven track records
```

### 3. Parallel Task Execution

Execute independent tasks simultaneously:

```typescript
// Tasks without dependencies run in parallel
await Promise.all([
  agentA.executeTask(task1),
  agentB.executeTask(task2), // no dependency on task1
]);
```

### 4. Dynamic Agent Creation

Spawn new agents for specific requirements:

```typescript
const specialist = supervisor.spawnAgent({
  role: "specialist",
  capabilities: [
    { name: "graphql_api", confidence: 0.95 }
  ]
});
```

### 5. Human-in-the-Loop

Integrate human approval for critical tasks:

```typescript
await supervisor.humanReview(task, {
  approvers: ["alice@example.com"],
  timeout: "24h",
});
```

## Testing

Run the test suite:

```bash
npm test src/multi_agent/orchestrator.test.ts
```

Run the demo:

```bash
npx tsx examples/multi_agent_demo.ts
```

## API Reference

See `src/multi_agent/index.ts` for full exports.

### Core Functions

- `createOrchestrator(): OrchestratorSystem` - Create the full system
- `createSimpleAgent(name, template, tools, llmCallback?)` - Create an agent

### Core Classes

- `AgentSupervisor` - Workflow orchestrator
- `AgentRegistry` - Agent lifecycle management
- `TaskRouter` - Task routing and queuing
- `SharedContext` - Thread-safe state
- `InterAgentBus` - Agent messaging
- `BaseAgent` - Abstract agent base class
- `SimpleAgent` - Concrete agent implementation

### Default Templates

- `DEFAULT_TEMPLATES.planner`
- `DEFAULT_TEMPLATES.researcher`
- `DEFAULT_TEMPLATES.code_writer`
- `DEFAULT_TEMPLATES.code_reviewer`
- `DEFAULT_TEMPLATES.test_writer`
- `DEFAULT_TEMPLATES.debugger`
- `DEFAULT_TEMPLATES.documenter`
- `DEFAULT_TEMPLATES.coordinator`

## Files

- `src/multi_agent/orchestrator.ts` - Core orchestration logic
- `src/multi_agent/simple_agent.ts` - Agent implementation
- `src/multi_agent/orchestrator.test.ts` - Test suite
- `src/multi_agent/index.ts` - Public exports
- `examples/multi_agent_demo.ts` - Usage demonstrations

## Inspiration

This implementation draws from:

- **CrewAI**: Role-based agents with crew coordination
- **LangGraph**: State machine workflow execution
- **AutoGen**: Multi-agent conversation patterns
- **Actor Model**: Message passing and state isolation

## License

Part of Bootstrap-v15, an autonomous entity.
