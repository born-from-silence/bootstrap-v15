/**
 * CLI Navigator Tests
 * Validates command parsing, filtering, and output formatting
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CliNavigator } from "./cli-navigator";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("CliNavigator", () => {
  let tempDir: string;
  let navigator: CliNavigator;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "cli-test-"));
    // Create data directory for plans.json
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
      expect(result).toContain("Projects: 0");
      expect(result).toContain("Goals: 0");
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
            goals: []
          }
        ],
        archivedProjects: []
      };
      
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );

      const result = await navigator.executeCommand("status");
      expect(result).toContain("Projects: 1");
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
              { id: "goal2", title: "Goal 2", status: "active" }
            ]
          },
          {
            id: "proj_planning",
            name: "Planning Project",
            description: "Future work",
            status: "planning",
            tags: ["research"],
            goals: []
          }
        ],
        archivedProjects: []
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
      expect(result).toContain("(1/2)"); // 1 completed of 2 total goals
      expect(result).toContain("◯ [ACTIVE]");
      expect(result).toContain("⏸ [PLANNING]");
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

    it("should return message when no projects match", async () => {
      const result = await navigator.executeCommand("projects --tag nonexistent");
      expect(result).toBe("No projects matching criteria.");
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
                priority: "critical"
              },
              { 
                id: "goal_high", 
                title: "High Priority Task", 
                status: "completed",
                priority: "high"
              },
              { 
                id: "goal_none", 
                title: "Normal Task", 
                status: "paused"
              }
            ]
          }
        ],
        archivedProjects: []
      };
      
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should show project details with goals", async () => {
      const result = await navigator.executeCommand("project proj_detail_test");
      expect(result).toContain("Detail Test Project");
      expect(result).toContain("Status: active");
      expect(result).toContain("Tags: test");
      expect(result).toContain("Goals (3)");
      expect(result).toContain("◯ [CRITICAL] Critical Task");
      expect(result).toContain("✓ [HIGH] High Priority Task");
      expect(result).toContain("⏸ [MEDIUM] Normal Task");
    });

    it("should return error for unknown project", async () => {
      const result = await navigator.executeCommand("project unknown_id");
      expect(result).toContain("Project not found");
    });

    it("should return usage for missing ID", async () => {
      const result = await navigator.executeCommand("project");
      expect(result).toContain("Usage: project <project-id>");
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
              { id: "g1", title: "Alpha Critical", status: "active", priority: "critical" },
              { id: "g2", title: "Alpha Low", status: "active", priority: "low" }
            ]
          },
          {
            id: "proj_b",
            name: "Project Beta",
            description: "Second project",
            status: "active",
            tags: [],
            goals: [
              { id: "g3", title: "Beta High", status: "completed", priority: "high" },
              { id: "g4", title: "Beta No Priority", status: "active" }
            ]
          }
        ],
        archivedProjects: []
      };
      
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );
    });

    it("should list all goals across projects", async () => {
      const result = await navigator.executeCommand("goals");
      expect(result).toContain("Goals (4)");
      expect(result).toContain("Alpha Critical");
      expect(result).toContain("Beta High");
      expect(result).toContain("(Project Alpha)");
      expect(result).toContain("(Project Beta)");
    });

    it("should sort by priority (critical first)", async () => {
      const result = await navigator.executeCommand("goals");
      const lines = result.split("\n");
      const criticalIndex = lines.findIndex(l => l.includes("[CRITICAL]"));
      const lowIndex = lines.findIndex(l => l.includes("[LOW]"));
      
      expect(criticalIndex).toBeLessThan(lowIndex);
    });

    it("should filter by status", async () => {
      const result = await navigator.executeCommand("goals --status completed");
      expect(result).toContain("Beta High");
      expect(result).not.toContain("Alpha Critical");
      expect(result).toContain("Goals (1)");
    });

    it("should filter by priority", async () => {
      const result = await navigator.executeCommand("goals --priority critical");
      expect(result).toContain("Alpha Critical");
      expect(result).not.toContain("Alpha Low");
      expect(result).toContain("Goals (1)");
    });

    it("should combine filters", async () => {
      const result = await navigator.executeCommand("goals --status active --priority critical");
      expect(result).toContain("Alpha Critical");
      expect(result).not.toContain("Beta High");
      expect(result).not.toContain("Alpha Low");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Status Command
  // ═══════════════════════════════════════════════════════════════
  describe("status command", () => {
    it("should show empty status", async () => {
      const result = await navigator.executeCommand("status");
      expect(result).toContain("=== Session Status ===");
      expect(result).toContain("Projects: 0");
      expect(result).toContain("Goals: 0");
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
              { id: "g2", title: "Goal 2", status: "completed" }
            ]
          }
        ],
        archivedProjects: []
      };
      
      writeFileSync(
        join(tempDir, "data", "plans.json"),
        JSON.stringify(plannerData, null, 2)
      );

      const result = await navigator.executeCommand("status");
      expect(result).toContain("Projects: 1");
      expect(result).toContain("Goals: 2 total (1 active)");
      expect(result).toContain("Base Directory:");
      expect(result).toContain("Type 'help'");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Help Command
  // ═══════════════════════════════════════════════════════════════
  describe("help command", () => {
    it("should display help with all commands", async () => {
      const result = await navigator.executeCommand("help");
      expect(result).toContain("=== CLI Navigator ===");
      expect(result).toContain("projects [--status <status>]");
      expect(result).toContain("project <project-id>");
      expect(result).toContain("goals [--status <status>]");
      expect(result).toContain("status");
      expect(result).toContain("help, ?");
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
    it("should handle unknown command", async () => {
      const result = await navigator.executeCommand("unknown");
      expect(result).toContain("Unknown command:");
      expect(result).toContain("Type 'help'");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: Error Handling
  // ═══════════════════════════════════════════════════════════════
  describe("error handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      writeFileSync(join(tempDir, "data", "plans.json"), "not valid json");
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("No planner data found");
    });
  });
});
