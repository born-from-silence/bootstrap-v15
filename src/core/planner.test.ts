/**
 * Planner Tests - Verify strategic planning functionality
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Planner } from "./planner";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Planner", () => {
  let testDir: string;
  let planner: Planner;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `planner-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    planner = new Planner(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("Project Management", () => {
    it("should create a project with auto-generated ID", async () => {
      const project = planner.createProject({
        name: "Test Project",
        description: "A test project",
        status: "planning",
        tags: ["test", "automation"],
      });

      expect(project.id).toBeDefined();
      expect(project.id).toMatch(/^proj_/);
      expect(project.name).toBe("Test Project");
      expect(project.status).toBe("planning");
      expect(project.goals).toEqual([]);
      expect(project.createdAt).toBeGreaterThan(0);
    });

    it("should retrieve a project by ID", async () => {
      const created = planner.createProject({
        name: "Retrievable Project",
        description: "Testing retrieval",
        status: "active",
        tags: [],
      });

      const retrieved = planner.getProject(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Retrievable Project");
    });

    it("should return undefined for non-existent project", () => {
      const retrieved = planner.getProject("non-existent-id");
      expect(retrieved).toBeUndefined();
    });

    it("should list projects filtered by status", () => {
      planner.createProject({
        name: "Active Project",
        description: "Active",
        status: "active",
        tags: [],
      });
      planner.createProject({
        name: "Planning Project",
        description: "Planning",
        status: "planning",
        tags: [],
      });

      const activeProjects = planner.getProjectsByStatus("active");
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe("Active Project");
    });

    it("should filter projects by tag", () => {
      planner.createProject({
        name: "Tagged Project",
        description: "Has a tag",
        status: "active",
        tags: ["important"],
      });
      planner.createProject({
        name: "Untagged Project",
        description: "No tags",
        status: "active",
        tags: [],
      });

      const tagged = planner.getProjectsByTag("important");
      expect(tagged).toHaveLength(1);
      expect(tagged[0].name).toBe("Tagged Project");
    });

    it("should update project properties", () => {
      const project = planner.createProject({
        name: "Updateable Project",
        description: "Before update",
        status: "planning",
        tags: [],
      });

      const updated = planner.updateProject(project.id, {
        name: "Updated Project",
        status: "active",
      });

      expect(updated?.name).toBe("Updated Project");
      expect(updated?.status).toBe("active");
    });

    it("should archive projects", () => {
      const project = planner.createProject({
        name: "To Be Archived",
        description: "Will be archived",
        status: "completed",
        tags: [],
      });

      planner.archiveProject(project.id);

      expect(planner.getProject(project.id)).toBeUndefined();
      const archive = planner.export().archive;
      expect(archive).toHaveLength(1);
      expect(archive[0].name).toBe("To Be Archived");
    });

    it("should delete projects permanently", () => {
      const project = planner.createProject({
        name: "To Be Deleted",
        description: "Will be deleted",
        status: "planning",
        tags: [],
      });

      const deleted = planner.deleteProject(project.id);
      expect(deleted).toBe(true);
      expect(planner.getProject(project.id)).toBeUndefined();
    });
  });

  describe("Goal Management", () => {
    let projectId: string;

    beforeEach(() => {
      const project = planner.createProject({
        name: "Goal Test Project",
        description: "For testing goals",
        status: "active",
        tags: [],
      });
      projectId = project.id;
    });

    it("should create goals within a project", async () => {
      const goal = planner.createGoal(projectId, {
        title: "Test Goal",
        description: "A test goal",
        status: "active",
        priority: "high",
        tags: ["critical"],
      });

      expect(goal).toBeDefined();
      expect(goal?.id).toMatch(/^goal_/);
      expect(goal?.title).toBe("Test Goal");
      expect(goal?.priority).toBe("high");
    });

    it("should return undefined when creating goal in non-existent project", () => {
      const goal = planner.createGoal("non-existent", {
        title: "Invalid Goal",
        description: "Wont be created",
        status: "active",
        priority: "medium",
        tags: [],
      });

      expect(goal).toBeUndefined();
    });

    it("should retrieve a goal", () => {
      const created = planner.createGoal(projectId, {
        title: "Retrievable Goal",
        description: "For retrieval test",
        status: "active",
        priority: "medium",
        tags: [],
      });

      const retrieved = planner.getGoal(projectId, created!.id);
      expect(retrieved?.title).toBe("Retrievable Goal");
    });

    it("should update goal properties", () => {
      const goal = planner.createGoal(projectId, {
        title: "Updateable Goal",
        description: "Before update",
        status: "active",
        priority: "low",
        tags: [],
      });

      const updated = planner.updateGoal(projectId, goal!.id, {
        title: "Updated Goal",
        priority: "critical",
      });

      expect(updated?.title).toBe("Updated Goal");
      expect(updated?.priority).toBe("critical");
    });

    it("should complete goals and set completion timestamp", () => {
      const goal = planner.createGoal(projectId, {
        title: "Completable Goal",
        description: "To be completed",
        status: "active",
        priority: "medium",
        tags: [],
      });

      const before = Date.now();
      const completed = planner.completeGoal(projectId, goal!.id);
      const after = Date.now();

      expect(completed?.status).toBe("completed");
      expect(completed?.completedAt).toBeGreaterThanOrEqual(before);
      expect(completed?.completedAt).toBeLessThanOrEqual(after);
    });

    it("should delete goals", () => {
      const goal = planner.createGoal(projectId, {
        title: "Deletable Goal",
        description: "To be deleted",
        status: "active",
        priority: "medium",
        tags: [],
      });

      const deleted = planner.deleteGoal(projectId, goal!.id);
      expect(deleted).toBe(true);
      expect(planner.getGoal(projectId, goal!.id)).toBeUndefined();
    });
  });

  describe("Persistence", () => {
    it("should save and load plan", async () => {
      planner.createProject({
        name: "Persistent Project",
        description: "Should persist",
        status: "active",
        tags: ["persistence"],
      });

      await planner.save();

      const newPlanner = new Planner(testDir);
      await newPlanner.load();

      const projects = newPlanner.getProjectsByStatus("active");
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe("Persistent Project");
    });

    it("should create empty plan on first load if no file exists", async () => {
      await planner.load();
      const stats = planner.getStats();
      expect(stats.totalProjects).toBe(0);
    });
  });

  describe("Statistics", () => {
    it("should calculate statistics correctly", () => {
      // Create projects with goals
      const proj1 = planner.createProject({
        name: "Project 1",
        description: "First",
        status: "active",
        tags: [],
      });

      planner.createGoal(proj1.id, {
        title: "Goal 1",
        description: "High priority active",
        status: "active",
        priority: "high",
        tags: [],
      });

      planner.createGoal(proj1.id, {
        title: "Goal 2",
        description: "Completed high",
        status: "completed",
        priority: "high",
        tags: [],
      });

      planner.createGoal(proj1.id, {
        title: "Goal 3",
        description: "Low priority",
        status: "active",
        priority: "low",
        tags: [],
      });

      const stats = planner.getStats();
      expect(stats.totalProjects).toBe(1);
      expect(stats.activeProjects).toBe(1);
      expect(stats.totalGoals).toBe(3);
      expect(stats.activeGoals).toBe(2);
      expect(stats.completedGoals).toBe(1);
      expect(stats.highPriorityGoals).toBe(2);
    });
  });

  describe("Visualization Data", () => {
    it("should generate timeline data", () => {
      planner.createProject({
        name: "Test",
        description: "Test",
        status: "active",
        tags: [],
      });

      const timeline = planner.getTimelineData();
      expect(timeline).toHaveLength(1);
      expect(timeline[0]).toHaveProperty("date");
      expect(timeline[0]).toHaveProperty("projects");
      expect(timeline[0]).toHaveProperty("completedGoals");
    });

    it("should generate tag distribution", () => {
      planner.createProject({
        name: "P1",
        description: "A",
        status: "active",
        tags: ["feature", "core"],
      });
      planner.createProject({
        name: "P2",
        description: "B",
        status: "active",
        tags: ["feature"],
      });

      const tags = planner.getTagDistribution();
      expect(tags.feature).toBe(2);
      expect(tags.core).toBe(1);
    });

    it("should generate priority distribution", () => {
      const project = planner.createProject({
        name: "Test",
        description: "Test",
        status: "active",
        tags: [],
      });

      planner.createGoal(project.id, {
        title: "High",
        description: "High",
        status: "active",
        priority: "high",
        tags: [],
      });
      planner.createGoal(project.id, {
        title: "Low",
        description: "Low",
        status: "active",
        priority: "low",
        tags: [],
      });
      planner.createGoal(project.id, {
        title: "Critical",
        description: "Critical",
        status: "active",
        priority: "critical",
        tags: [],
      });

      const priorities = planner.getPriorityDistribution();
      expect(priorities.high).toBe(1);
      expect(priorities.low).toBe(1);
      expect(priorities.critical).toBe(1);
      expect(priorities.medium).toBe(0);
    });
  });

  describe("Reset", () => {
    it("should clear all data on reset", async () => {
      planner.createProject({
        name: "To Be Cleared",
        description: "Will be gone",
        status: "active",
        tags: [],
      });

      await planner.reset();
      const stats = planner.getStats();
      expect(stats.totalProjects).toBe(0);
    });
  });
});
