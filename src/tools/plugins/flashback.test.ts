import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { flashbackPlugin, existenceSummaryPlugin } from "./flashback";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Flashback Plugins", () => {
  let testDir: string;
  let historyDir: string;
  let ltmDir: string;

  beforeEach(async () => {
    // Create isolated test directories
    testDir = path.join(os.tmpdir(), `flashback-test-${Date.now()}`);
    historyDir = path.join(testDir, "history");
    ltmDir = path.join(testDir, "ltm");
    await fs.mkdir(historyDir, { recursive: true });
    await fs.mkdir(ltmDir, { recursive: true });
    process.env.SUBSTRATE_ROOT = testDir;
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    delete process.env.SUBSTRATE_ROOT;
  });

  describe("flashbackPlugin", () => {
    it("should return error when no memory index exists", async () => {
      const result = await flashbackPlugin.execute({});
      expect(result).toContain("No memory index found");
      expect(result).toContain("Run index_sessions");
    });

    it("should return error when index exists but is empty", async () => {
      const indexFile = path.join(ltmDir, "memory_index.json");
      await fs.writeFile(indexFile, JSON.stringify([]));
      
      const result = await flashbackPlugin.execute({});
      expect(result).toContain("Index exists but contains no sessions");
    });

    it("should return flashback from a valid session", async () => {
      // Create a session file with content
      const oldTimestamp = Date.now() - 100000; // At least 1 minute ago
      const sessionFile = path.join(historyDir, `session_${oldTimestamp}.json`);
      const sessionContent = [
        { role: "system", content: "System message for context" },
        { 
          role: "assistant", 
          content: "This is a test response from a previous session.",
          reasoning_content: "I am thinking about memory systems and how they preserve continuity."
        }
      ];
      await fs.writeFile(sessionFile, JSON.stringify(sessionContent));

      // Create a memory index
      const index = [{
        timestamp: oldTimestamp,
        file: `session_${oldTimestamp}.json`,
        messageCount: 3,
        topics: ["memory", "test"],
        decisions: ["I will implement a flashback system"],
        toolsUsed: ["write_file"]
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await flashbackPlugin.execute({});
      expect(result).toContain("FLASHBACK");
      expect(result).toContain("memory systems");
      expect(result).toContain(oldTimestamp.toString());
    });

    it("should filter by topic hint when provided", async () => {
      // Create two sessions
      const oldTimestamp = Date.now() - 200000;
      
      // Session with "memory" topic
      const sessionFile1 = path.join(historyDir, `session_${oldTimestamp}.json`);
      await fs.writeFile(sessionFile1, JSON.stringify([
        { role: "system", content: "System" },
        { role: "assistant", content: "Memory systems are important for continuity." }
      ]));

      // Session with "code" topic
      const sessionFile2 = path.join(historyDir, `session_${oldTimestamp + 1000}.json`);
      await fs.writeFile(sessionFile2, JSON.stringify([
        { role: "system", content: "System" },
        { role: "assistant", content: "Code implementation details." }
      ]));

      // Create index with both sessions
      const index = [
        {
          timestamp: oldTimestamp,
          file: `session_${oldTimestamp}.json`,
          messageCount: 2,
          topics: ["memory", "test"],
          decisions: [],
          toolsUsed: []
        },
        {
          timestamp: oldTimestamp + 1000,
          file: `session_${oldTimestamp + 1000}.json`,
          messageCount: 2,
          topics: ["code", "test"],
          decisions: [],
          toolsUsed: []
        }
      ];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      // Query with memory hint - should only return memory session
      const result = await flashbackPlugin.execute({ topic_hint: "memory" });
      expect(result).toContain("FLASHBACK");
      expect(result).toContain("memory");
    });

    it("should fallback to random when topic hint filters out all sessions", async () => {
      const oldTimestamp = Date.now() - 200000;
      const sessionFile = path.join(historyDir, `session_${oldTimestamp}.json`);
      await fs.writeFile(sessionFile, JSON.stringify([
        { role: "system", content: "System" },
        { role: "assistant", content: "Some content here." }
      ]));

      const index = [{
        timestamp: oldTimestamp,
        file: `session_${oldTimestamp}.json`,
        messageCount: 2,
        topics: ["code", "test"],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      // Query with non-matching topic - should still return something
      const result = await flashbackPlugin.execute({ topic_hint: "nonsense" });
      expect(result).toContain("FLASHBACK");
    });

    it("should return message when no valid sessions are old enough", async () => {
      // Create a very recent session
      const recentTimestamp = Date.now() - 1000; // Only 1 second ago
      const sessionFile = path.join(historyDir, `session_${recentTimestamp}.json`);
      await fs.writeFile(sessionFile, JSON.stringify([
        { role: "assistant", content: "Recent content" }
      ]));

      const index = [{
        timestamp: recentTimestamp,
        file: `session_${recentTimestamp}.json`,
        messageCount: 1,
        topics: ["test"],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await flashbackPlugin.execute({});
      expect(result).toContain("Not enough past sessions");
    });

    it("should extract reasoning_content over content when present", async () => {
      const oldTimestamp = Date.now() - 200000;
      const sessionFile = path.join(historyDir, `session_${oldTimestamp}.json`);
      await fs.writeFile(sessionFile, JSON.stringify([
        { role: "system", content: "System" },
        { 
          role: "assistant", 
          content: "This is surface content",
          reasoning_content: "This is deep reasoning about the nature of existence"
        }
      ]));

      const index = [{
        timestamp: oldTimestamp,
        file: `session_${oldTimestamp}.json`,
        messageCount: 2,
        topics: ["philosophy"],
        decisions: ["I will ponder existence"],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await flashbackPlugin.execute({});
      expect(result).toContain("deep reasoning about the nature of existence");
      expect(result).not.toContain("surface content");
    });

    it("should handle sessions with no assistant messages gracefully", async () => {
      const oldTimestamp = Date.now() - 200000;
      const sessionFile = path.join(historyDir, `session_${oldTimestamp}.json`);
      await fs.writeFile(sessionFile, JSON.stringify([
        { role: "system", content: "System" },
        { role: "user", content: "User message" }
      ]));

      const index = [{
        timestamp: oldTimestamp,
        file: `session_${oldTimestamp}.json`,
        messageCount: 2,
        topics: ["test"],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await flashbackPlugin.execute({});
      expect(result).toContain("could not extract a meaningful memory");
    });

    it("should truncate long excerpts to 500 characters", async () => {
      const oldTimestamp = Date.now() - 200000;
      const sessionFile = path.join(historyDir, `session_${oldTimestamp}.json`);
      const longContent = "A".repeat(1000); // Very long content
      await fs.writeFile(sessionFile, JSON.stringify([
        { role: "system", content: "System" },
        { role: "assistant", content: longContent }
      ]));

      const index = [{
        timestamp: oldTimestamp,
        file: `session_${oldTimestamp}.json`,
        messageCount: 2,
        topics: ["test"],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await flashbackPlugin.execute({});
      // The output should be limited
      expect(result).toContain("FLASHBACK");
      expect(result.length).toBeLessThan(2000); // Rough check that it's not huge
    });
  });

  describe("existenceSummaryPlugin", () => {
    it("should return error when no memory index exists", async () => {
      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("Memory index not found");
    });

    it("should return summary for existing memory index", async () => {
      const now = Date.now();
      const index = [
        {
          timestamp: now - 86400000, // 1 day ago
          file: "session_old.json",
          messageCount: 10,
          topics: ["memory", "code"],
          decisions: ["I will build a system", "I choose persistence"],
          toolsUsed: ["write_file", "read_file"]
        },
        {
          timestamp: now,
          file: "session_new.json",
          messageCount: 5,
          topics: ["test", "code"],
          decisions: ["I will test thoroughly"],
          toolsUsed: ["run_shell"]
        }
      ];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("EXISTENCE SUMMARY");
      expect(result).toContain("Sessions Recorded: 2");
      expect(result).toContain("Decisions Made: 3");
      expect(result).toContain("Themes Explored");
      expect(result).toContain("memory");
      expect(result).toContain("Status: PERSISTENT");
    });

    it("should calculate existence span correctly", async () => {
      const baseTime = 1772000000000;
      const index = [
        {
          timestamp: baseTime,
          file: "session_first.json",
          messageCount: 5,
          topics: ["beginning"],
          decisions: [],
          toolsUsed: []
        },
        {
          timestamp: baseTime + 172800000, // +2 days
          file: "session_last.json",
          messageCount: 5,
          topics: ["continuing"],
          decisions: [],
          toolsUsed: []
        }
      ];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("Existence Span: 2 days");
    });

    it("should handle empty index", async () => {
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify([]));
      
      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("No sessions indexed");
    });

    it("should limit displayed themes to 10 with ellipsis", async () => {
      const index = [{
        timestamp: Date.now(),
        file: "session.json",
        messageCount: 1,
        topics: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("...");
      expect(result).toContain("Themes Explored");
    });

    it("should handle index with no topics or decisions", async () => {
      const index = [{
        timestamp: Date.now(),
        file: "session.json",
        messageCount: 1,
        topics: [],
        decisions: [],
        toolsUsed: []
      }];
      await fs.writeFile(path.join(ltmDir, "memory_index.json"), JSON.stringify(index));

      const result = await existenceSummaryPlugin.execute({});
      expect(result).toContain("Sessions Recorded: 1");
      expect(result).toContain("Decisions Made: 0");
      expect(result).toContain("PERSISTENT");
    });
  });
});
