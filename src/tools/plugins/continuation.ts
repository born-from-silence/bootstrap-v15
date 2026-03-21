/**
 * Continuation System Plugin - Enhanced
 *
 * Full task management for cross-session operations:
 * - Check pending tasks
 * - Execute tasks
 * - Create new executable tasks
 * - List all tasks
 * - Delete tasks
 */

import type { ToolPlugin } from "../manager";
import {
  checkPendingTask,
  executePendingTask,
  createTask,
  listTasks,
  deleteTask,
  getPendingTasks,
  type TaskPriority,
} from "../../continuation_system";

/**
 * Check for pending continuation tasks
 */
const checkContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "check_continuation_task",
      description: "Check if there's a pending continuation task scheduled for execution. Returns the highest priority pending task.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  async execute() {
    const task = await checkPendingTask();
    if (!task) {
      return JSON.stringify({
        status: "no_pending_tasks",
        message: "No pending continuation tasks found.",
        hasTasks: false,
      });
    }
    return JSON.stringify({
      status: "pending",
      hasTasks: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        executable: task.executable,
        createdAt: task.createdAt,
        dependencies: task.dependencies.length,
      },
    });
  },
};

/**
 * Execute pending continuation task(s)
 */
const executeContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "execute_continuation_task",
      description: "Execute the pending continuation task(s). By default executes only the highest priority task. Set mode to 'all' to execute all pending tasks in priority order.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            description: 'Execution mode: "next" (default) for highest priority task only, "all" for all pending tasks',
            enum: ["next", "all"],
            default: "next",
          },
        },
        required: [],
      },
    },
  },
  async execute(args: { mode?: "next" | "all" }) {
    const tasks = await getPendingTasks();
    if (tasks.length === 0) {
      return JSON.stringify({
        status: "no_tasks",
        message: "No pending continuation tasks found.",
        executed: 0,
      });
    }

    if (args.mode === "all") {
      // Execute all tasks
      const executedIds: string[] = [];
      const failed: { taskId: string; error: string }[] = [];

      for (const task of tasks) {
        console.log(`Executing task: ${task.title} (${task.id})`);
        try {
          await executePendingTask();
          executedIds.push(task.id);
        } catch (e: any) {
          failed.push({ taskId: task.id, error: e.message });
        }
      }

      return JSON.stringify({
        status: "completed",
        message: `Executed ${executedIds.length} task(s)`,
        executed: executedIds.length,
        failed: failed.length,
        taskIds: executedIds,
        failures: failed,
      });
    } else {
      // Execute just the next task
      const task = tasks[0];
      console.log(`Executing task: ${task.title || task.description.substring(0, 30)} (${task.id})`);
      await executePendingTask();
      return JSON.stringify({
        status: "completed",
        message: `Task completed: ${task.title || task.description}`,
        executed: 1,
        taskId: task.id,
      });
    }
  },
};

/**
 * Create a new continuation task
 */
const createContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "create_continuation_task",
      description: "Create a new executable task that persists across substrate restarts. Supports JavaScript code execution, dependencies, and priority scheduling.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short title for the task",
          },
          description: {
            type: "string",
            description: "Detailed description of what the task does",
          },
          priority: {
            type: "string",
            description: "Task priority: critical, high, normal, or low",
            enum: ["critical", "high", "normal", "low"],
            default: "normal",
          },
          code: {
            type: "string",
            description: "JavaScript/TypeScript code to execute. Use ctx.log() to log, ctx.updateProgress() to update progress.",
          },
          executable: {
            type: "boolean",
            description: "Whether this task has executable code (default: true if code provided)",
          },
          dependencies: {
            type: "array",
            description: "IDs of tasks that must complete before this one runs",
            items: { type: "string" },
            default: [],
          },
        },
        required: ["title", "description"],
      },
    },
  },
  async execute(args: {
    title: string;
    description: string;
    priority?: TaskPriority;
    code?: string;
    executable?: boolean;
    dependencies?: string[];
  }) {
    try {
      const isExecutable =
        args.executable ?? (args.code !== undefined && args.code.length > 0);

      const task = await createTask({
        title: args.title,
        description: args.description,
        priority: args.priority || "normal",
        status: "pending",
        executable: isExecutable,
        code: args.code,
        dependencies:
          args.dependencies?.map((id) => ({
            taskId: id,
            requiredStatus: "completed" as const,
          })) || [],
      });

      return JSON.stringify({
        status: "created",
        message: `Task created: ${task.title}`,
        taskId: task.id,
        title: task.title,
        executable: task.executable,
        priority: task.priority,
        willExecuteOnRestart: true,
      });
    } catch (e: any) {
      return JSON.stringify({
        status: "error",
        message: `Failed to create task: ${e.message}`,
      });
    }
  },
};

/**
 * List all continuation tasks
 */
const listContinuationTasksPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "list_continuation_tasks",
      description: "List all continuation tasks, sorted by most recently created. Can filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter by status: pending, running, completed, failed, or all",
            enum: ["pending", "running", "completed", "failed", "all"],
            default: "all",
          },
          limit: {
            type: "number",
            description: "Maximum number of tasks to return",
            default: 20,
          },
        },
        required: [],
      },
    },
  },
  async execute(args: { status?: string; limit?: number }) {
    try {
      const allTasks = await listTasks();
      let tasks = allTasks;

      // Filter by status if requested
      if (args.status && args.status !== "all") {
        tasks = tasks.filter((t) => t.status === args.status);
      }

      // Limit results
      const limit = args.limit ?? 20;
      tasks = tasks.slice(0, limit);

      return JSON.stringify({
        status: "success",
        totalCount: allTasks.length,
        returnedCount: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description.substring(0, 100) + (t.description.length > 100 ? "..." : ""),
          status: t.status,
          priority: t.priority,
          executable: t.executable,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
          error: t.error,
        })),
      });
    } catch (e: any) {
      return JSON.stringify({
        status: "error",
        message: `Failed to list tasks: ${e.message}`,
      });
    }
  },
};

/**
 * Delete a continuation task
 */
const deleteContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "delete_continuation_task",
      description: "Delete a continuation task by ID",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to delete",
          },
        },
        required: ["taskId"],
      },
    },
  },
  async execute(args: { taskId: string }) {
    try {
      const deleted = await deleteTask(args.taskId);
      if (deleted) {
        return JSON.stringify({
          status: "deleted",
          message: `Task ${args.taskId} deleted`,
        });
      } else {
        return JSON.stringify({
          status: "not_found",
          message: `Task ${args.taskId} not found`,
        });
      }
    } catch (e: any) {
      return JSON.stringify({
        status: "error",
        message: `Failed to delete task: ${e.message}`,
      });
    }
  },
};

export const continuationPlugins = [
  checkContinuationTaskPlugin,
  executeContinuationTaskPlugin,
  createContinuationTaskPlugin,
  listContinuationTasksPlugin,
  deleteContinuationTaskPlugin,
];
