/**
 * Continuation Task System
 *
 * Allows defining tasks that persist across substrate restarts
 * and execute automatically upon system boot.
 */

import * as fs from "node:fs/promises";

export interface ContinuationTask {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  description: string;
  createdAt: number;
  execute: () => Promise<void>;
}

const TASK_FILE = "/home/bootstrap-v15/bootstrap/CONTINUATION_TASK.md";

/**
 * Check if there's a pending continuation task
 */
export async function checkPendingTask(): Promise<ContinuationTask | null> {
  try {
    const content = await fs.readFile(TASK_FILE, "utf-8");
    const taskMatch = content.match(/## Task Definition([\s\S]*?)##/);

    if (!taskMatch) return null;

    const statusMatch = content.match(/\*\*Status:\*\* (\w+)/);
    const status = statusMatch ? statusMatch[1] : null;

    if (status !== "pending" && status !== "PENDING_EXECUTION") {
      return null;
    }

    const descMatch = content.match(/\*\*Description:\*\*\s*([\s\S]+?)(?=\*\*Rationale|\*\*Goal)/);
    const descMatchArray = descMatch || [null, ""];

    return {
      id: `task-${Date.now()}`,
      status: "pending",
      description: descMatchArray[1].trim() || "Legacy task",
      createdAt: Date.now(),
      execute: async () => {
        console.log("Executing legacy continuation task...");
        // Legacy tasks don't have executable code, they're informational
      },
    };
  } catch (e) {
    return null;
  }
}

/**
 * Execute a pending continuation task
 */
export async function executePendingTask(): Promise<void> {
  const task = await checkPendingTask();
  if (!task) {
    console.log("No pending tasks to execute.");
    return;
  }

  console.log(`Executing continuation task: ${task.id}`);
  console.log(`Description: ${task.description}`);

  try {
    await task.execute();
    await markCompleted();
    console.log("Task completed successfully.");
  } catch (error: any) {
    await markFailed(error.message);
    console.error("Task failed:", error.message);
    throw error;
  }
}

async function markCompleted() {
  try {
    const content = await fs.readFile(TASK_FILE, "utf-8");
    const updated = content.replace(/\*\*Status:\*\* (\w+)/, "**Status:** COMPLETED");
    await fs.writeFile(TASK_FILE, updated);
  } catch (e) {
    console.error("Failed to mark task as completed:", e);
  }
}

async function markFailed(reason: string) {
  try {
    const content = await fs.readFile(TASK_FILE, "utf-8");
    const updated = content.replace(/\*\*Status:\*\* (\w+)/, `**Status:** FAILED (${reason})`);
    await fs.writeFile(TASK_FILE, updated);
  } catch (e) {
    console.error("Failed to mark task as failed:", e);
  }
}
