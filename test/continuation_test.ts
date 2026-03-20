/**
 * Test suite for Continuation Task System
 */

import { checkPendingTask, executePendingTask } from "../src/continuation_system";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

// Test helpers
const TEST_TASK_FILE = path.join(os.homedir(), "tmp", `continuation-test-${Date.now()}.md`);
const ORIGINAL_TASK_FILE = "/home/bootstrap-v15/bootstrap/CONTINUATION_TASK.md";

async function setup() {
  try {
    await fs.mkdir(path.join(os.homedir(), "tmp"), { recursive: true });
    // Save original if exists
    try {
      const original = await fs.readFile(ORIGINAL_TASK_FILE, "utf-8");
      await fs.writeFile(ORIGINAL_TASK_FILE + ".backup", original);
    } catch (e) {
      // No original yet
    }
  } catch (e) {
    console.error("Setup error:", e);
  }
}

async function teardown() {
  try {
    // Remove test task file
    await fs.unlink(TEST_TASK_FILE).catch(() => {});
    // Restore original
    try {
      const backup = await fs.readFile(ORIGINAL_TASK_FILE + ".backup", "utf-8");
      await fs.writeFile(ORIGINAL_TASK_FILE, backup);
      await fs.unlink(ORIGINAL_TASK_FILE + ".backup");
    } catch (e) {
      // No backup
    }
  } catch (e) {
    console.error("Teardown error:", e);
  }
}

async function testNoPendingTask() {
  console.log("\n1. Testing no pending task...");
  // Write a completed task file
  await fs.writeFile(ORIGINAL_TASK_FILE, `# Continuation Task

**Status:** COMPLETED  
**Created:** Test

## Task Definition
Task is done.
`);

  const task = await checkPendingTask();
  if (task !== null) {
    throw new Error("Expected null for completed task");
  }
  console.log("  ✓ Correctly returned null for completed task");
}

async function testPendingTask() {
  console.log("\n2. Testing pending task detection...");
  await fs.writeFile(ORIGINAL_TASK_FILE, `# Continuation Task

**Status:** PENDING_EXECUTION  
**Created:** Session test

## Task Definition

**Goal:** Test continuation system

**Description:**
Upon restart, I will test the continuation system.

**Rationale:**
Testing is important.

## Execution Status
- [ ] Pending
`);

  const task = await checkPendingTask();
  if (task === null) {
    throw new Error("Expected task but got null");
  }
  if (task.status !== "pending") {
    throw new Error(`Expected status 'pending' but got '${task.status}'`);
  }
  if (!task.description.includes("test the continuation system")) {
    throw new Error("Description mismatch");
  }
  console.log("  ✓ Successfully detected pending task");
}

async function cleanup() {
  await fs.unlink(ORIGINAL_TASK_FILE).catch(() => {});
  await fs.unlink(ORIGINAL_TASK_FILE + ".backup").catch(() => {});
}

// Run tests
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CONTINUATION SYSTEM TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    await setup();

    await testNoPendingTask();
    await testPendingTask();

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ALL TESTS PASSED ✓");
    console.log("═══════════════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
