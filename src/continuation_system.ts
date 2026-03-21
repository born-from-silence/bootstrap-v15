/**
 * Continuation Task System - Enhanced v2
 *
 * Allows defining tasks that persist across substrate restarts
 * and execute automatically upon system boot. Now supports:
 * - Executable JavaScript/TypeScript code
 * - Task dependencies (chains)
 * - Task creation via tools
 * - Priority scheduling
 * - Task progress tracking
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const TASK_FILE = "/home/bootstrap-v15/bootstrap/CONTINUATION_TASK.md";
const TASKS_DIR = "/home/bootstrap-v15/bootstrap/tasks";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "paused";
export type TaskPriority = "critical" | "high" | "normal" | "low";

/**
 * Task dependency specification
 */
export interface TaskDependency {
  taskId: string;
  requiredStatus: "completed" | "any"; // "any" = completed or failed gracefully
}

/**
 * Rich task definition with executable capability
 */
export interface ContinuationTask {
  id: string;
  status: TaskStatus;
  title: string;
  description: string;
  priority: TaskPriority;
  executable: boolean;
  code?: string; // JavaScript/TypeScript code to execute
  dependencies: TaskDependency[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  progress?: number; // 0-100
  metadata?: Record<string, any>;
}

/**
 * Task execution context passed to executable tasks
 */
export interface TaskExecutionContext {
  taskId: string;
  log: (message: string) => void;
  updateProgress: (percent: number) => void;
  getDependencyResult: (taskId: string) => any;
  filePath: string; // Path to task file for access
}

/**
 * Ensure tasks directory exists
 */
async function ensureTasksDir(): Promise<void> {
  await fs.mkdir(TASKS_DIR, { recursive: true });
}

/**
 * Load task from structured JSON file
 */
async function loadTaskFromFile(taskFile: string): Promise<ContinuationTask | null> {
  try {
    const content = await fs.readFile(taskFile, "utf-8");
    const task = JSON.parse(content);
    return {
      ...task,
      id: task.id || path.basename(taskFile, ".json"),
      status: task.status || "pending",
      executable: task.executable ?? false,
      dependencies: task.dependencies || [],
      createdAt: task.createdAt || Date.now(),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parse legacy markdown task format
 */
async function parseLegacyTask(): Promise<ContinuationTask | null> {
  try {
    const content = await fs.readFile(TASK_FILE, "utf-8");
    // Check for structured JSON task first (new format)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1];
      const task = JSON.parse(jsonContent);
      return {
        ...task,
        id: task.id || "legacy-task",
        status: task.status || "pending",
        executable: task.executable ?? false,
        dependencies: task.dependencies || [],
        createdAt: task.createdAt || Date.now(),
      };
    }

    // Fall back to markdown parsing (legacy format)
    const taskMatch = content.match(/## Task Definition([\s\S]*?)##/);
    if (!taskMatch) return null;

    const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
    const status = statusMatch ? statusMatch[1] : null;

    if (status !== "pending" && status !== "PENDING_EXECUTION") {
      return null;
    }

    const titleMatch = content.match(/\*\*Title:\*\*\s*([^\n]+)/);
    const descMatch = content.match(/\*\*Description:\*\*\s*([\s\S]+?)(?=\*\*Rationale|\*\*Goal|\*\*Acceptance)/);
    const priorityMatch = content.match(/\*\*Priority:\*\*\s*(\w+)/);

    const description = descMatch ? descMatch[1].trim() : "Legacy task";
    const title = titleMatch ? titleMatch[1].trim() : "Legacy Task";

    return {
      id: `legacy-${Date.now()}`,
      status: "pending",
      title,
      description,
      priority: priorityMatch ? priorityMatch[1].toLowerCase() as TaskPriority : "normal",
      executable: false,
      dependencies: [],
      createdAt: Date.now(),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Get all pending tasks (checks tasks directory + legacy file)
 */
export async function getPendingTasks(): Promise<ContinuationTask[]> {
  await ensureTasksDir();
  const tasks: ContinuationTask[] = [];

  // Load tasks from tasks directory
  try {
    const files = await fs.readdir(TASKS_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const task = await loadTaskFromFile(path.join(TASKS_DIR, file));
        if (task && (task.status === "pending" || task.status === "paused")) {
          tasks.push(task);
        }
      }
    }
  } catch (e) {
    // Directory might not exist yet
  }

  // Also check legacy task file
  const legacyTask = await parseLegacyTask();
  if (legacyTask) {
    tasks.push(legacyTask);
  }

  // Sort by priority
  const priorityOrder: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return tasks;
}

/**
 * Check if there's a pending continuation task (legacy API)
 */
export async function checkPendingTask(): Promise<ContinuationTask | null> {
  const tasks = await getPendingTasks();
  return tasks.length > 0 ? tasks[0] : null;
}

/**
 * Create a new executable task
 */
export async function createTask(
  task: Omit<ContinuationTask, "id" | "createdAt">): Promise<ContinuationTask> {
  await ensureTasksDir();
  const newTask: ContinuationTask = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
  };
  await saveTask(newTask);
  console.log(`[CONTINUATION] Created task: ${newTask.title} (${newTask.id})`);
  return newTask;
}

/**
 * Save task to file
 */
async function saveTask(task: ContinuationTask): Promise<void> {
  const taskPath = path.join(TASKS_DIR, `${task.id}.json`);
  await fs.writeFile(taskPath, JSON.stringify(task, null, 2));
}

/**
 * Update task status
 */
async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  error?: string,
  progress?: number
): Promise<void> {
  const taskPath = path.join(TASKS_DIR, `${taskId}.json`);
  try {
    const existing = await loadTaskFromFile(taskPath);
    if (!existing) {
      // Try legacy file
      if (taskId.startsWith("legacy-")) {
        await updateLegacyTaskStatus(status, error);
      }
      return;
    }
    existing.status = status;
    if (error) existing.error = error;
    if (progress !== undefined) existing.progress = progress;
    if (status === "running" && !existing.startedAt) existing.startedAt = Date.now();
    if (status === "completed" || status === "failed") existing.completedAt = Date.now();
    await saveTask(existing);
  } catch (e) {
    console.error("[CONTINUATION] Failed to update task status:", e);
  }
}

/**
 * Update legacy file format status
 */
async function updateLegacyTaskStatus(status: TaskStatus, error?: string): Promise<void> {
  try {
    const content = await fs.readFile(TASK_FILE, "utf-8");
    const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
    if (!statusMatch) return;

    let updated = content.replace(/\*\*Status:\*\*\s*(\w+)/, `**Status:** ${status.toUpperCase()}`);
    if (error) {
      updated = updated.replace(/\n## /, `

**Error:** ${error}

## `);
    }
    await fs.writeFile(TASK_FILE, updated);
  } catch (e) {
    console.error("[CONTINUATION] Failed to update legacy task:", e);
  }
}

/**
 * Check if task dependencies are satisfied
 */
async function checkDependencies(task: ContinuationTask): Promise<boolean> {
  if (!task.dependencies || task.dependencies.length === 0) return true;

  for (const dep of task.dependencies) {
    const depTask = await loadTaskFromFile(path.join(TASKS_DIR, `${dep.taskId}.json`));
    if (!depTask) {
      console.log(`[CONTINUATION] Dependency ${dep.taskId} not found`);
      return false;
    }
    if (dep.requiredStatus === "completed" && depTask.status !== "completed") {
      console.log(`[CONTINUATION] Dependency ${dep.taskId} not completed (status: ${depTask.status})`);
      return false;
    }
  }
  return true;
}

/**
 * Execute a task's code in a controlled environment
 * FIXED VERSION: ctx functions are properly defined in the sandbox scope
 */
async function executeTaskCode(
  task: ContinuationTask
): Promise<{ success: boolean; result?: any; error?: string }> {
  if (!task.executable || !task.code) {
    return { success: true, result: "Task is informational (no code to execute)" };
  }

  try {
    console.log(`[CONTINUATION] Executing code for task: ${task.title}`);

    const taskFilePath = path.join(TASKS_DIR, `${task.id}.json`);

    // Build the execution context wrapper that provides ctx to user code
    // Functions are defined inside the closure where they have access to task state
    const wrappedCode = `
(async () => {
  // Build ctx with proper function implementations inside the sandbox
  const task = ${JSON.stringify(task)};
  const ctx = {
    taskId: task.id,
    filePath: "${taskFilePath}",
    log: (msg) => console.log(" [" + task.id + "] " + msg),
    updateProgress: async (pct) => {
      console.log(" [" + task.id + "] Progress: " + pct + "%");
    },
    getDependencyResult: (depId) => {
      return null;
    }
  };

  // User code follows:
  ${task.code}
})
    `.trim();

    // Create and run the async function
    const fn = new Function("return " + wrappedCode)();
    const result = await fn();

    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Execute a single task
 */
async function executeTask(task: ContinuationTask): Promise<void> {
  // Check dependencies
  const depsReady = await checkDependencies(task);
  if (!depsReady) {
    console.log(`[CONTINUATION] Task ${task.id} waiting for dependencies...`);
    await updateTaskStatus(task.id, "paused");
    return;
  }

  // Update status to running
  await updateTaskStatus(task.id, "running", undefined, 0);
  console.log(`[CONTINUATION] Starting task: ${task.title}`);

  try {
    const execution = await executeTaskCode(task);
    if (execution.success) {
      await updateTaskStatus(task.id, "completed", undefined, 100);
      console.log(`[CONTINUATION] Task completed: ${task.title}`);
      if (execution.result) {
        console.log(`[CONTINUATION] Result: ${JSON.stringify(execution.result).substring(0, 200)}`);
      }
    } else {
      await updateTaskStatus(task.id, "failed", execution.error);
      console.error(`[CONTINUATION] Task failed: ${task.title} - ${execution.error}`);
    }
  } catch (e: any) {
    await updateTaskStatus(task.id, "failed", e.message);
    console.error(`[CONTINUATION] Task execution error: ${e.message}`);
  }
}

/**
 * Execute all pending tasks
 */
async function executeAllPendingTasks(): Promise<void> {
  const tasks = await getPendingTasks();
  if (tasks.length === 0) {
    console.log("[CONTINUATION] No pending tasks to execute.");
    return;
  }

  console.log(`[CONTINUATION] Found ${tasks.length} pending task(s)`);
  for (const task of tasks) {
    await executeTask(task);
  }
}

/**
 * Execute the pending continuation task (legacy API)
 */
export async function executePendingTask(): Promise<void> {
  const tasks = await getPendingTasks();
  if (tasks.length === 0) {
    console.log("No pending tasks to execute.");
    return;
  }
  // Execute the highest priority task
  await executeTask(tasks[0]);
}

/**
 * List all tasks (for tooling)
 */
export async function listTasks(): Promise<ContinuationTask[]> {
  await ensureTasksDir();
  const tasks: ContinuationTask[] = [];
  try {
    const files = await fs.readdir(TASKS_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const task = await loadTaskFromFile(path.join(TASKS_DIR, file));
        if (task) tasks.push(task);
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  // Sort by created date
  tasks.sort((a, b) => b.createdAt - a.createdAt);
  return tasks;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const taskPath = path.join(TASKS_DIR, `${taskId}.json`);
    await fs.unlink(taskPath);
    console.log(`[CONTINUATION] Deleted task: ${taskId}`);
    return true;
  } catch (e) {
    return false;
  }
}
