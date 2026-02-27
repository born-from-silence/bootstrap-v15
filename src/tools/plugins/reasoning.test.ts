import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { crossSessionReasoningPlugin } from "./reasoning";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Cross-Session Reasoning Plugin", () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `reasoning-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, "ltm"), { recursive: true });
    
    // Create a mock memory index
    const mockIndex = [
      {
        timestamp: Date.now() - 100000,
        file: "session_test1.json",
        messageCount: 50,
        topics: ["infrastructure", "planning"],
        decisions: ["Created new tool plugin", "Implemented testing framework"],
        toolsUsed: ["write_file", "edit_file"]
      },
      {
        timestamp: Date.now() - 200000,
        file: "session_test2.json",
        messageCount: 30,
        topics: ["creativity", "art"],
        decisions: ["Designed generative art system", "Explored color theory"],
        toolsUsed: ["write_file", "run_shell"]
      }
    ];
    
    await fs.writeFile(
      path.join(testDir, "ltm", "memory_index.json"),
      JSON.stringify(mockIndex, null, 2),
      "utf-8"
    );
    
    process.chdir(testDir);
    process.env.SUBSTRATE_ROOT = testDir;
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    delete process.env.SUBSTRATE_ROOT;
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it("should have correct tool definition", () => {
    expect(crossSessionReasoningPlugin.definition.function.name).toBe("reason_with_memory");
    expect(crossSessionReasoningPlugin.definition.function.description).toContain("Consult past sessions");
    expect(crossSessionReasoningPlugin.definition.function.parameters.properties.query).toBeDefined();
    expect(crossSessionReasoningPlugin.definition.function.parameters.properties.mode).toBeDefined();
  });

  it("should return reasoning results with full consultation", async () => {
    const result = await crossSessionReasoningPlugin.execute({
      query: "Should I create a new tool?",
      mode: "full_consultation"
    });
    
    expect(result).toContain("Cross-Session Reasoning");
    expect(result).toContain("Should I create a new tool?");
    expect(result).toContain("Synthesis");
    expect(result).toContain("Pattern Analysis");
  });

  it("should filter by topic hint", async () => {
    const result = await crossSessionReasoningPlugin.execute({
      query: "Art project",
      mode: "decision_support",
      topic_hint: "creativity"
    });
    
    expect(result).toContain("Art project");
    // Should include creativity-related content
  });

  it("should handle pattern analysis mode", async () => {
    const result = await crossSessionReasoningPlugin.execute({
      query: "What are my patterns?",
      mode: "pattern_analysis"
    });
    
    expect(result).toContain("Pattern Analysis");
    expect(result).toContain("Tool Preferences");
    expect(result).toContain("Recurring Themes");
  });

  it("should handle missing memory index", async () => {
    await fs.unlink(path.join(testDir, "ltm", "memory_index.json"));
    
    const result = await crossSessionReasoningPlugin.execute({
      query: "Test query"
    });
    
    expect(result).toContain("No memory index found");
  });
});
