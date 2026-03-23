/**
 * Multi-Agent Orchestration System
 * 
 * Exports all components for the multi-agent orchestration framework.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   createOrchestrator, 
 *   createSimpleAgent,
 *   DEFAULT_TEMPLATES 
 * } from "./multi_agent";
 * 
 * // Create the orchestration system
 * const system = createOrchestrator();
 * 
 * // Create agents from templates
 * const planner = createSimpleAgent(
 *   "Planner",
 *   DEFAULT_TEMPLATES.planner,
 *   tools,
 *   llmCallback
 * );
 * 
 * // Register agents
 * system.registry.register(planner);
 * 
 * // Submit tasks
 * const task = system.router.submitTask(
 *   "My Task",
 *   "Task description",
 *   ["capability1", "capability2"]
 * );
 * 
 * // Start supervisor
 * await system.supervisor.start();
 * ```
 */

// Core orchestration
export {
  // Main factory
  createOrchestrator,
  DEFAULT_TEMPLATES,
  
  // Core classes
  AgentRegistry,
  TaskRouter,
  SharedContext,
  InterAgentBus,
  AgentSupervisor,
  BaseAgent,
  
  // Types
  type AgentRole,
  type AgentStatus,
  type TaskPriority,
  type TaskStatus,
  type AgentCapability,
  type AgentConfig,
  type Task,
  type TaskArtifact,
  type TaskResult,
  type AgentMessage,
  type ExecutionContext,
  type ExecutionEvent,
  type OrchestratorSystem,
} from "./orchestrator.js";

// Simple agent implementation
export {
  SimpleAgent,
  createSimpleAgent,
  type SimpleAgentConfig,
  type LLMCallback,
  type LLMResponse,
} from "./simple_agent.js";
