/**
 * CLI Navigator Tests
 * TDD for the terminal-based mind navigation system
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { CliNavigator } from "./cli-navigator";

describe("CliNavigator", () => {
  let testDir: string;
  let navigator: CliNavigator;

  beforeEach(() => {
    testDir = join(tmpdir(), `cli-nav-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    navigator = new CliNavigator(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Project Commands", () => {
    it("should list all projects in compact format", async () => {
      // Create test planner state
      const plannerData = {
        activeProjects: [
          {
            id: "proj_1",
            name: "Test Project",
            description: "A test project",
            status: "active",
            tags: ["test"],
            goals: [
              { id: "g1", title: "Goal 1", status: "completed" },
              { id: "g2", title: "Goal 2", status: "active" },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("projects");
      expect(result).toContain("Test Project");
      expect(result).toContain("1/2"); // 1 completed, 2 total
    });

    it("should filter projects by status", async () => {
      const plannerData = {
        activeProjects: [
          { id: "p1", name: "Active Proj", status: "active", tags: [], goals: [] },
          { id: "p2", name: "Planning Proj", status: "planning", tags: [], goals: [] },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("projects --status active");
      expect(result).toContain("Active Proj");
      expect(result).not.toContain("Planning Proj");
    });

    it("should show detailed project view", async () => {
      const plannerData = {
        activeProjects: [
          {
            id: "proj_detail",
            name: "Detail Project",
            description: "Detailed description here",
            status: "active",
            tags: ["important", "test"],
            goals: [
              { id: "g1", title: "First Goal", status: "completed", priority: "high" },
              { id: "g2", title: "Second Goal", status: "active", priority: "medium" },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("project proj_detail");
      expect(result).toContain("Detail Project");
      expect(result).toContain("Detailed description");
      expect(result).toContain("First Goal");
      expect(result).toContain("Second Goal");
    });
  });

  describe("Goal Commands", () => {
    it("should list active goals across all projects", async () => {
      const plannerData = {
        activeProjects: [
          {
            id: "p1",
            name: "Project 1",
            status: "active",
            tags: [],
            goals: [
              { id: "g1", title: "Active Goal 1", status: "active", priority: "high" },
              { id: "g2", title: "Completed Goal", status: "completed", priority: "medium" },
            ],
          },
          {
            id: "p2",
            name: "Project 2",
            status: "active",
            tags: [],
            goals: [
              { id: "g3", title: "Active Goal 2", status: "active", priority: "critical" },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("goals --status active");
      expect(result).toContain("Active Goal 1");
      expect(result).toContain("Active Goal 2");
      expect(result).not.toContain("Completed Goal");
    });

    it("should filter goals by priority", async () => {
      const plannerData = {
        activeProjects: [
          {
            id: "p1",
            name: "Project 1",
            status: "active",
            tags: [],
            goals: [
              { id: "g1", title: "High Goal", status: "active", priority: "high" },
              { id: "g2", title: "Low Goal", status: "active", priority: "low" },
            ],
          },
        ],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("goals --priority high");
      expect(result).toContain("High Goal");
      expect(result).not.toContain("Low Goal");
    });
  });

  describe("Quick Access Commands", () => {
    it("should provide session context", async () => {
      const result = await navigator.executeCommand("status");
      expect(result).toContain("Session");
      expect(result).toContain("Projects");
      expect(result).toContain("Goals");
    });

    it("should show help information", async () => {
      const result = await navigator.executeCommand("help");
      expect(result).toContain("CLI Navigator");
      expect(result).toContain("projects");
      expect(result).toContain("goals");
      expect(result).toContain("status");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing planner file gracefully", async () => {
      const result = await navigator.executeCommand("projects");
      expect(result).toContain("No projects found");
    });

    it("should handle unknown project ID", async () => {
      const plannerData = {
        activeProjects: [],
        archivedProjects: [],
      };
      writeFileSync(
        join(testDir, "planner.json"),
        JSON.stringify(plannerData)
      );

      const result = await navigator.executeCommand("project nonexistent");
      expect(result).toContain("not found");
    });

    it("should handle invalid commands", async () => {
      const result = await navigator.executeCommand("invalidcommand");
      expect(result).toContain("Unknown command");
    });
  });
});
