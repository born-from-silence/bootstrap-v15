import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { memoryIndexPlugin, queryMemoryPlugin, sessionStatsPlugin } from "./memory";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Memory Plugins", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = path.join(os.homedir(), "tmp", `memory-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, "history"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "ltm"), { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tempDir);
    process.env.SUBSTRATE_ROOT = tempDir;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    delete process.env.SUBSTRATE_ROOT;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("memoryIndexPlugin", () => {
    it("should index new sessions", async () => {
      // Create a mock session file
      const sessionFile = path.join(tempDir, "history", "session_1234567890000.json");
      const sessionData = [
        { role: "system", content: "Test system message" },
        {
          role: "assistant",
          content: "Hello, I will create a new feature",
          reasoning_content: "Planning to build something new",
        },
        { role: "tool", content: "Success", name: "run_shell" }
      ];
      await fs.writeFile(sessionFile, JSON.stringify(sessionData), "utf-8");

      const result = await memoryIndexPlugin.execute({});
      
      expect(result).toContain("Memory indexing complete");
      expect(result).toContain("Indexed 1 new sessions");
      expect(result).toContain("Total indexed: 1");

      // Verify index file was created
      const indexFile = path.join(tempDir, "ltm", "memory_index.json");
      const indexContent = await fs.readFile(indexFile, "utf-8");
      const entries = JSON.parse(indexContent);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].file).toBe("session_1234567890000.json");
      expect(entries[0].topics).toContain("new");
    });

    it("should handle empty history directory", async () => {
      const result = await memoryIndexPlugin.execute({});
      
      expect(result).toContain("Memory indexing complete");
      expect(result).toContain("Indexed 0 new sessions");
    });

    it("should reindex from scratch when reindex is true", async () => {
      // Create existing index
      const existingIndex = [{ timestamp: 123, file: "old.json", messageCount: 2 }];
      await fs.mkdir(path.join(tempDir, "ltm"), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, "ltm", "memory_index.json"),
        JSON.stringify(existingIndex)
      );

      // Create new session
      const sessionFile = path.join(tempDir, "history", "session_9999999999999.json");
      await fs.writeFile(sessionFile, JSON.stringify([{ role: "user", content: "Test" }]));

      const result = await memoryIndexPlugin.execute({ reindex: true });
      
      expect(result).toContain("Memory indexing complete");
      expect(result).toContain("Total indexed: 1");
    });
  });

  describe("queryMemoryPlugin", () => {
    beforeEach(async () => {
      // Set up an index file
      const entries = [
        {
          timestamp: 1234567890000,
          file: "session_1234567890000.json",
          messageCount: 5,
          topics: ["memory", "session", "code"],
          decisions: ["Will create a memory system"],
          toolsUsed: ["run_shell", "write_file"]
        },
        {
          timestamp: 1234567900000,
          file: "session_1234567900000.json",
          messageCount: 3,
          topics: ["git", "code"],
          decisions: ["Committed changes"],
          toolsUsed: ["run_shell"]
        }
      ];
      await fs.writeFile(
        path.join(tempDir, "ltm", "memory_index.json"),
        JSON.stringify(entries)
      );
    });

    it("should query by topic", async () => {
      const result = await queryMemoryPlugin.execute({ topic: "memory" });
      
      expect(result).toContain("Found 1 memories");
      expect(result).toContain("session_1234567890000.json");
    });

    it("should query by tool", async () => {
      const result = await queryMemoryPlugin.execute({ tool: "write_file" });
      
      expect(result).toContain("Found 1 memories");
      expect(result).toContain("session_1234567890000.json");
    });

    it("should return error when no index exists", async () => {
      await fs.unlink(path.join(tempDir, "ltm", "memory_index.json"));
      
      const result = await queryMemoryPlugin.execute({});
      
      expect(result).toContain("No memory index found");
    });

    it("should apply limit parameter", async () => {
      const result = await queryMemoryPlugin.execute({ limit: 1 });
      
      expect(result).toContain("Found 1 memories");
    });

    it("should filter by since timestamp", async () => {
      const result = await queryMemoryPlugin.execute({ since: 1234567899999 });
      
      expect(result).toContain("Found 1 memories");
      expect(result).toContain("session_1234567900000.json");
    });
  });

  describe("sessionStatsPlugin", () => {
    it("should return error when no index exists", async () => {
      const result = await sessionStatsPlugin.execute({});
      
      expect(result).toContain("No memory index found");
    });

    it("should calculate statistics correctly", async () => {
      const entries = [
        {
          timestamp: 1234567890000,
          file: "session_1.json",
          messageCount: 10,
          topics: ["memory", "session"],
          toolsUsed: ["run_shell"]
        },
        {
          timestamp: 1234567900000,
          file: "session_2.json",
          messageCount: 5,
          topics: ["code", "session"],
          toolsUsed: ["write_file", "run_shell"]
        }
      ];
      await fs.writeFile(
        path.join(tempDir, "ltm", "memory_index.json"),
        JSON.stringify(entries)
      );

      const result = await sessionStatsPlugin.execute({});
      
      expect(result).toContain("Total Sessions: 2");
      expect(result).toContain("Total Messages: 15");
      expect(result).toContain("run_shell");
      expect(result).toContain("memory");
      expect(result).toContain("session");
    });
  });
});
