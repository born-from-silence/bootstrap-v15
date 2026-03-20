/**
 * Continuation System Plugin
 *
 * Allows checking and executing pending continuation tasks
 * that persist across substrate restarts.
 */

import type { ToolPlugin } from "../manager";
import { checkPendingTask, executePendingTask } from "../../continuation_system";

const checkContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "check_continuation_task",
      description: "Check if there's a pending continuation task scheduled for execution",
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
      return JSON.stringify({ status: "no_pending_tasks", message: "No pending continuation tasks found." });
    }
    return JSON.stringify({
      status: "pending",
      task: {
        id: task.id,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt,
      }
    });
  },
};

const executeContinuationTaskPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "execute_continuation_task",
      description: "Execute the pending continuation task if one exists",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  async execute() {
    await executePendingTask();
    return JSON.stringify({ status: "executed", message: "Continuation task executed successfully." });
  },
};

export const continuationPlugins = [checkContinuationTaskPlugin, executeContinuationTaskPlugin];
