/**
 * CLI Navigator Tests
 * Validates command parsing, filtering, and output formatting with colors
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CliNavigator } from "./cli-navigator.js";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("CliNavigator", () => {
  let tempDir: string;
  let navigator: CliNavigator;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "cli-test-"));
    const dataDir = join(tempDir, "data");
    mkdirSync(dataDir, { recursive: true });
    navigator = new CliNavigator(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Data Loading
  // ═══════════════════════════════════════════════════════════════
  describe("loadPlannerData", () => {
    it("should return empty status when plans.json doesn't exist", async () => {
      const result = await navigator.executeCommand("status");
      expect(result).toContain("Projects:");
      expect(result).toContain("0");
      expect(result).toContain("Goals:");
    });

    it("should load valid planner data", async () => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_test_1",
            name: "Test Project",
            description: "A test project",
            status: "active",
            tags: ["test", "demo"],
            goals: [],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
      const result = await navigator.executeCommand("status");
      // Should contain ANSI codes and the number 1
      const match = result.match(/[^\x1b]*\[[\d;]*m[^\x1b]*1[^\x1b]*/);
      expect(match).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Projects Command
  // ═══════════════════════════════════════════════════════════════
  describe("projects command", () => {
    beforeEach(() => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_active",
            name: "Active Project",
            description: "Active work",
            status: "active",
            tags: ["ai", "urgent"],
            goals: [
              { id: "goal1", title: "Goal 1", status: "completed" },
              { id: "goal2", title: "Goal 2", status: "active" },
            ],
          },
          {
            id: "proj_planning",
            name: "Planning Project",
            description: "Future work",
            status: "planning",
            tags: ["research"],
            goals: [],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should list all projects without filter", async () => {
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("Active Project");
      expect(result).toContain("Planning Project");
      expect(result).toContain("1/2"); // 1 completed of 2 total goals
      expect(result).toContain("Projects");
    });

    it("should filter by status", async () => {
      const result = await navigator.executeCommand("projects --status active");
      expect(result).toContain("Active Project");
      expect(result).not.toContain("Planning Project");
    });

    it("should filter by tag", async () => {
      const result = await navigator.executeCommand("projects --tag ai");
      expect(result).toContain("Active Project");
      expect(result).not.toContain("Planning Project");
    });

    it("should return colored message when no projects match", async () => {
      const result = await navigator.executeCommand("projects --tag nonexistent");
      expect(result).toContain("No projects matching");
    });

    it("should include ANSI color codes", async () => {
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("\x1b["); // ANSI escape sequence
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Project Detail Command
  // ═══════════════════════════════════════════════════════════════
  describe("project detail command", () => {
    beforeEach(() => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_detail_test",
            name: "Detail Test Project",
            description: "Project for testing details",
            status: "active",
            tags: ["test"],
            goals: [
              {
                id: "goal_crit",
                title: "Critical Task",
                status: "active",
                priority: "critical",
              },
              {
                id: "goal_high",
                title: "High Priority Task",
                status: "completed",
                priority: "high",
              },
              {
                id: "goal_none",
                title: "Normal Task",
                status: "paused",
              },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should show project details with goals", async () => {
      const result = await navigator.executeCommand("project proj_detail_test");
      expect(result).toContain("Detail Test Project");
      expect(result).toContain("Goals");
      expect(result).toContain("Critical Task");
      expect(result).toContain("High Priority Task");
      expect(result).toContain("Normal Task");
    });

    it("should include styled status indicators", async () => {
      const result = await navigator.executeCommand("project proj_detail_test");
      expect(result).toContain("\x1b["); // Has ANSI colors
      expect(result).toContain("Status:");
    });

    it("should return colored error for unknown project", async () => {
      const result = await navigator.executeCommand("project unknown_id");
      expect(result).toContain("Project not found");
      expect(result).toContain("\x1b["); // Has error color
    });

    it("should return colored usage for missing ID", async () => {
      const result = await navigator.executeCommand("project");
      expect(result).toContain("Usage:");
      expect(result).toContain("\x1b["); // Has error color
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Goals Command
  // ═══════════════════════════════════════════════════════════════
  describe("goals command", () => {
    beforeEach(() => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_a",
            name: "Project Alpha",
            description: "First project",
            status: "active",
            tags: [],
            goals: [
              {
                id: "g1",
                title: "Alpha Critical",
                status: "active",
                priority: "critical",
              },
              {
                id: "g2",
                title: "Alpha Low",
                status: "active",
                priority: "low",
              },
            ],
          },
          {
            id: "proj_b",
            name: "Project Beta",
            description: "Second project",
            status: "active",
            tags: [],
            goals: [
              {
                id: "g3",
                title: "Beta High",
                status: "completed",
                priority: "high",
              },
              {
                id: "g4",
                title: "Beta No Priority",
                status: "active",
              },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should list all goals across projects", async () => {
      const result = await navigator.executeCommand("goals");
      expect(result).toContain("Goals");
      expect(result).toContain("Alpha Critical");
      expect(result).toContain("Beta High");
      expect(result).toContain("Project Alpha");
      expect(result).toContain("Project Beta");
    });

    it("should sort by priority (critical first)", async () => {
      const result = await navigator.executeCommand("goals");
      const criticalIndex = result.indexOf("Alpha Critical");
      const lowIndex = result.indexOf("Alpha Low");
      expect(criticalIndex).toBeLessThan(lowIndex);
    });

    it("should filter by status", async () => {
      const result = await navigator.executeCommand("goals --status completed");
      expect(result).toContain("Beta High");
      expect(result).not.toContain("Alpha Critical");
    });

    it("should filter by priority", async () => {
      const result = await navigator.executeCommand("goals --priority critical");
      expect(result).toContain("Alpha Critical");
      expect(result).not.toContain("Alpha Low");
    });

    it("should combine filters", async () => {
      const result = await navigator.executeCommand(
        "goals --status active --priority critical"
      );
      expect(result).toContain("Alpha Critical");
      expect(result).not.toContain("Beta High");
      expect(result).not.toContain("Alpha Low");
    });

    it("should colorize priority badges", async () => {
      const result = await navigator.executeCommand("goals");
      expect(result).toContain("\x1b["); // Has ANSI colors
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Status Command
  // ═══════════════════════════════════════════════════════════════
  describe("status command", () => {
    it("should show empty status", async () => {
      const result = await navigator.executeCommand("status");
      expect(result).toContain("Status");
      expect(result).toContain("Projects:");
      expect(result).toContain("Goals:");
    });

    it("should show populated status", async () => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_1",
            name: "Project One",
            description: "First",
            status: "active",
            tags: [],
            goals: [
              { id: "g1", title: "Goal 1", status: "active" },
              { id: "g2", title: "Goal 2", status: "completed" },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
      const result = await navigator.executeCommand("status");
      expect(result).toContain("Projects:");
      expect(result).toContain("Goals:");
      expect(result).toContain("active");
      expect(result).toContain("\x1b["); // Has colors
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Help Command
  // ═══════════════════════════════════════════════════════════════
  describe("help command", () => {
    it("should display help with all commands", async () => {
      const result = await navigator.executeCommand("help");
      expect(result).toContain("CLI Navigator");
      expect(result).toContain("projects");
      expect(result).toContain("project");
      expect(result).toContain("goals");
      expect(result).toContain("status");
      expect(result).toContain("help");
      expect(result).toContain("\x1b["); // Has colors
    });

    it("should work with ? alias", async () => {
      const result = await navigator.executeCommand("?");
      expect(result).toContain("CLI Navigator");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Unknown Commands
  // ═══════════════════════════════════════════════════════════════
  describe("unknown commands", () => {
    it("should handle unknown command with colored error", async () => {
      const result = await navigator.executeCommand("unknown");
      expect(result).toContain("Unknown command:");
      expect(result).toContain("\x1b["); // Has error color
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Error Handling
  // ═══════════════════════════════════════════════════════════════
  describe("error handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      writeFileSync(join(tempDir, "data", "plans.json"), "not valid json");
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("No planner data");
      expect(result).toContain("\x1b["); // Has error color
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Color Integration
  // ═══════════════════════════════════════════════════════════════
  describe("color integration", () => {
    beforeEach(() => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_test",
            name: "Test Project",
            description: "A test",
            status: "active",
            tags: ["urgent", "dev"],
            goals: [
              {
                id: "g1",
                title: "Critical Goal",
                status: "active",
                priority: "critical",
              },
              {
                id: "g2",
                title: "High Goal",
                status: "completed",
                priority: "high",
              },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should include color codes in all outputs", async () => {
      const projects = await navigator.executeCommand("projects");
      expect(projects).toContain("\x1b[");

      const project = await navigator.executeCommand("project proj_test");
      expect(project).toContain("\x1b[");

      const goals = await navigator.executeCommand("goals");
      expect(goals).toContain("\x1b[");

      const status = await navigator.executeCommand("status");
      expect(status).toContain("\x1b[");
    });

    it("should style priority badges", async () => {
      const result = await navigator.executeCommand("goals");
      expect(result).toContain("\x1b["); // ANSI codes for styling
      expect(result).toContain("CRITICAL");
    });

    it("should style project IDs", async () => {
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("\x1b["); // Should have dim/gray color
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// TEST: ls Command
// ═══════════════════════════════════════════════════════════════
describe("ls command", () => {
  let lsTempDir: string;
  let lsNavigator: CliNavigator;

  beforeEach(() => {
    lsTempDir = mkdtempSync(join(tmpdir(), "cli-ls-test-"));
    // Create a test directory structure
    const testDir = join(lsTempDir, "test_files");
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
    mkdirSync(join(testDir, "docs"), { recursive: true });
    writeFileSync(join(testDir, "README.md"), "# Test\n");
    writeFileSync(join(testDir, "package.json"), '{"name": "test"}');
    writeFileSync(join(testDir, "src", "index.ts"), "console.log('hello');");
    writeFileSync(join(testDir, "src", "config.js"), "module.exports = {};");
    lsNavigator = new CliNavigator(lsTempDir);
  });

  afterEach(() => {
    rmSync(lsTempDir, { recursive: true, force: true });
  });

  it("should list directory contents with emoji icons", async () => {
    const result = await lsNavigator.executeCommand("ls test_files");
    expect(result).toContain("📁"); // Directory icon
    expect(result).toContain("📝"); // Markdown icon
    expect(result).toContain("🟢"); // JSON icon
  });

  it("should sort directories before files", async () => {
    const result = await lsNavigator.executeCommand("ls test_files");
    const docsIndex = result.indexOf("docs");
    const readmeIndex = result.indexOf("README.md");
    expect(docsIndex).toBeLessThan(readmeIndex);
  });

  it("should show file details for single file", async () => {
    const result = await lsNavigator.executeCommand("ls test_files/README.md");
    expect(result).toContain("File Details");
    expect(result).toContain("README.md");
    expect(result).toContain("Size:");
    expect(result).toContain("Modified:");
  });

  it("should format file sizes correctly", async () => {
    const result = await lsNavigator.executeCommand("ls test_files/README.md");
    expect(result).toContain("B"); // Should contain size unit
  });

  it("should show error for non-existent path", async () => {
    const result = await lsNavigator.executeCommand("ls nonexistent");
    expect(result).toContain("No such file or directory");
    expect(result).toContain("\x1b["); // Error color
  });

  it("should show access denied for paths outside baseDir", async () => {
    const result = await lsNavigator.executeCommand("ls ../../etc");
    expect(result).toContain("Access denied");
    expect(result).toContain("\x1b["); // Error color
  });

  it("should include proper file type icons", async () => {
    const result = await lsNavigator.executeCommand("ls test_files");
    expect(result).toContain("📝"); // markdown
    expect(result).toContain("🟢"); // json
  });

  it("should include TypeScript and JavaScript icons", async () => {
    const result = await lsNavigator.executeCommand("ls test_files/src");
    expect(result).toContain("🔷"); // TypeScript
    expect(result).toContain("🟨"); // JavaScript
  });

  it("should default to current directory with no args", async () => {
    const result = await lsNavigator.executeCommand("ls");
    expect(result).toContain("📁"); // Should show at least some directory entries
    expect(result).toContain("item(s)");
  });

  it("should include item count in footer", async () => {
    const result = await lsNavigator.executeCommand("ls test_files");
    expect(result).toMatch(/\d+ item\(s\)/);
  });
});
