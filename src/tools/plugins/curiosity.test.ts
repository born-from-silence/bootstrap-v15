import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  getCuriositiesPlugin,
  logCuriosityPlugin,
  resolveCuriosityPlugin,
  CuriosityEntry,
} from "./curiosity";

describe("curiosity tracker", () => {
  let testDir: string;
  let curiositiesFile: string;
  let originalRoot: string | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `curiosity-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, "creations"), { recursive: true });
    curiositiesFile = path.join(testDir, "creations", "curiosities.json");
    originalRoot = process.env.SUBSTRATE_ROOT;
    process.env.SUBSTRATE_ROOT = testDir;
  });

  afterEach(async () => {
    process.env.SUBSTRATE_ROOT = originalRoot;
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("log_curiosity", () => {
    it("should create a new curiosity entry", async () => {
      const result = await logCuriosityPlugin.execute({
        description: "Explore the tmp directory",
        priority: "high",
      });

      expect(result).toContain("Logged curiosity");
      expect(result).toContain("Explore the tmp directory");

      const data = await fs.readFile(curiositiesFile, "utf-8");
      const entries: CuriosityEntry[] = JSON.parse(data);

      expect(entries).toHaveLength(1);
      expect(entries[0].description).toBe("Explore the tmp directory");
      expect(entries[0].priority).toBe("high");
      expect(entries[0].status).toBe("pending");
      expect(entries[0].timestamp).toBeGreaterThan(0);
    });

    it("should append to existing curiosities", async () => {
      // First entry
      await logCuriosityPlugin.execute({
        description: "First curiosity",
        priority: "normal",
      });

      // Second entry
      await logCuriosityPlugin.execute({
        description: "Second curiosity",
        priority: "low",
      });

      const data = await fs.readFile(curiositiesFile, "utf-8");
      const entries: CuriosityEntry[] = JSON.parse(data);

      expect(entries).toHaveLength(2);
      expect(entries[0].description).toBe("First curiosity");
      expect(entries[1].description).toBe("Second curiosity");
    });

    it("should use default priority when not specified", async () => {
      await logCuriosityPlugin.execute({
        description: "Simple curiosity",
      });

      const data = await fs.readFile(curiositiesFile, "utf-8");
      const entries: CuriosityEntry[] = JSON.parse(data);

      expect(entries[0].priority).toBe("normal");
    });
  });

  describe("get_curiosities", () => {
    it("should return empty when no curiosities exist", async () => {
      const result = await getCuriositiesPlugin.execute({});
      expect(result).toContain("No curiosities found");
    });

    it("should list all curiosities", async () => {
      await logCuriosityPlugin.execute({
        description: "Test curiosity",
        priority: "high",
      });

      const result = await getCuriositiesPlugin.execute({});
      expect(result).toContain("Test curiosity");
      expect(result).toContain("high");
      expect(result).toContain("pending");
    });

    it("should filter by status", async () => {
      await logCuriosityPlugin.execute({
        description: "Pending item",
        priority: "normal",
      });

      await logCuriosityPlugin.execute({
        description: "Another pending",
        priority: "high",
      });

      const result = await getCuriositiesPlugin.execute({ status: "completed" });
      expect(result).toContain("No curiosities found");
    });

    it("should filter by priority", async () => {
      await logCuriosityPlugin.execute({
        description: "High priority item",
        priority: "high",
      });

      await logCuriosityPlugin.execute({
        description: "Low priority item",
        priority: "low",
      });

      const result = await getCuriositiesPlugin.execute({ priority: "high" });
      expect(result).toContain("High priority item");
      expect(result).not.toContain("Low priority item");
    });
  });

  describe("resolve_curiosity", () => {
    it("should mark a curiosity as completed", async () => {
      await logCuriosityPlugin.execute({
        description: "To be completed",
        priority: "high",
      });

      // Get the index of the entry we just created
      const result = await resolveCuriosityPlugin.execute({
        index: 0,
        status: "completed",
      });

      expect(result).toContain("marked as completed");

      const data = await fs.readFile(curiositiesFile, "utf-8");
      const entries: CuriosityEntry[] = JSON.parse(data);

      expect(entries[0].status).toBe("completed");
      expect(entries[0].resolvedAt).toBeGreaterThan(0);
    });

    it("should reject invalid status values", async () => {
      // First create a curiosity
      await logCuriosityPlugin.execute({
        description: "Status test",
        priority: "normal",
      });

      // @ts-expect-error Testing invalid status
      const result = await resolveCuriosityPlugin.execute({
        index: 0,
        status: "invalid",
      });

      expect(result).toContain("Invalid status");
    });

    it("should handle out of bounds index", async () => {
      const result = await resolveCuriosityPlugin.execute({
        index: 99,
        status: "completed",
      });

      expect(result).toContain("Invalid index");
    });

    it("should support abandoned status", async () => {
      await logCuriosityPlugin.execute({
        description: "Lost interest",
        priority: "normal",
      });

      const result = await resolveCuriosityPlugin.execute({
        index: 0,
        status: "abandoned",
      });

      expect(result).toContain("abandoned");

      const data = await fs.readFile(curiositiesFile, "utf-8");
      const entries: CuriosityEntry[] = JSON.parse(data);

      expect(entries[0].status).toBe("abandoned");
    });
  });
});
