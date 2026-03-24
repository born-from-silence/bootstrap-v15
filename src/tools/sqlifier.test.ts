import { testToolsWithSetup } from "../testrunner/runner";
import { Sqlifier } from "./sqlifier";
import * as path from "path";
import * as fs from "node:fs/promises";

const testModule = {
  async beforeAll() {
    const sqlifier = new Sqlifier(
      "/tmp/test_sqlifier.db",
      "/tmp/test_sqlifier_data.json"
    );
    await sqlifier.initDatabase();
    return { sqlifier };
  },

  async afterAll() {
    try {
      await fs.unlink("/tmp/test_sqlifier.db").catch(() => {});
      await fs.unlink("/tmp/test_sqlifier_data.json").catch(() => {});
    } catch {}
  },

  "initDatabase creates tables": async ({ sqlifier }) => {
    const stats = await sqlifier.getStats();
    if (!stats.storage) throw new Error("Database stats should have storage type");
    return { pass: true };
  },

  "query add task": async ({ sqlifier }) => {
    const result = await sqlifier.query("add task called 'Test SQLifier'");
    if (!result.success) throw new Error(result.error || "Query failed");
    if (!result.results || result.results.length === 0) throw new Error("No results returned");
    const task = result.results[0];
    if (task.title !== "Test SQLifier") throw new Error("Task title mismatch");
    return { pass: true };
  },

  "query list tasks": async ({ sqlifier }) => {
    // First add a task
    await sqlifier.query("add task called 'Test Task'");
    const result = await sqlifier.query("list all tasks");
    if (!result.success) throw new Error(result.error || "Query failed");
    if (!result.results || result.results.length === 0) {
      throw new Error("Should have at least one task");
    }
    return { pass: true };
  },

  "query complete task": async ({ sqlifier }) => {
    await sqlifier.query("add task called 'Task to complete'");
    const result = await sqlifier.query("mark task 1 complete");
    if (!result.success) throw new Error(result.error || "Query failed");
    const task = result.results?.[0];
    if (!task || task.status !== "completed") {
      throw new Error("Task should be completed");
    }
    return { pass: true };
  },

  "query count": async ({ sqlifier }) => {
    await sqlifier.query("add task called 'Task A'");
    await sqlifier.query("add task called 'Task B'");
    const result = await sqlifier.query("count tasks");
    if (!result.success) throw new Error(result.error || "Query failed");
    const count = result.results?.[0]?.count;
    if (count === undefined) throw new Error("Count not returned");
    return { pass: true };
  },

  "query log observation": async ({ sqlifier }) => {
    const result = await sqlifier.query("log observation about system ready for testing");
    if (!result.success) throw new Error(result.error || "Query failed");
    if (!result.results || result.results.length === 0) {
      throw new Error("No observation created");
    }
    const obs = result.results[0];
    if (obs.category !== "system") throw new Error("Category should be system");
    return { pass: true };
  },

  "query list disciplines": async ({ sqlifier }) => {
    const result = await sqlifier.query("list disciplines");
    if (!result.success) throw new Error(result.error || "Query failed");
    if (!result.results || result.results.length === 0) {
      throw new Error("Should have default disciplines");
    }
    return { pass: true };
  },
};
