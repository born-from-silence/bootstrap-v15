/**
 * Planner System - Strategic Planning Module
 * Tracks projects, goals, and milestones across sessions
 */

import fs from "node:fs/promises";
import path from "node:path";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "paused" | "abandoned";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: number;
  targetDate?: number;
  completedAt?: number;
  tags: string[];
  parentId?: string;
  subGoalIds: string[];
  curiosityIndex?: number; // Link to curiosities
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed" | "archived";
  goals: Goal[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  tags: string[];
}

export interface Plan {
  version: string;
  lastUpdated: number;
  activeProjects: Project[];
  archive: Project[];
}

export class Planner {
  private planPath: string;
  private plan: Plan;

  constructor(baseDir: string) {
    this.planPath = path.join(baseDir, "data", "plans.json");
    this.plan = {
      version: "1.0",
      lastUpdated: Date.now(),
      activeProjects: [],
      archive: [],
    };
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.planPath, "utf-8");
      this.plan = JSON.parse(data);
    } catch {
      // No existing plan, use empty structure
      this.plan = {
        version: "1.0",
        lastUpdated: Date.now(),
        activeProjects: [],
        archive: [],
      };
    }
  }

  async save(): Promise<void> {
    this.plan.lastUpdated = Date.now();
    await fs.mkdir(path.dirname(this.planPath), { recursive: true });
    await fs.writeFile(this.planPath, JSON.stringify(this.plan, null, 2));
  }

  // Project CRUD
  createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt" | "goals">
  ): Project {
    const newProject: Project = {
      ...project,
      goals: [],
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.plan.activeProjects.push(newProject);
    return newProject;
  }

  getProject(id: string): Project | undefined {
    return this.plan.activeProjects.find((p) => p.id === id);
  }

  getProjectsByStatus(status: Project["status"]): Project[] {
    return this.plan.activeProjects.filter((p) => p.status === status);
  }

  getProjectsByTag(tag: string): Project[] {
    return this.plan.activeProjects.filter((p) => p.tags.includes(tag));
  }

  updateProject(
    id: string,
    updates: Partial<Project>
  ): Project | undefined {
    const project = this.plan.activeProjects.find((p) => p.id === id);
    if (!project) return undefined;

    Object.assign(project, updates, { updatedAt: Date.now() });
    return project;
  }

  archiveProject(id: string): void {
    const idx = this.plan.activeProjects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const project = this.plan.activeProjects[idx];
      if (project) {
        this.plan.archive.push(project);
        this.plan.activeProjects.splice(idx, 1);
      }
    }
  }

  deleteProject(id: string): boolean {
    const idx = this.plan.activeProjects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.plan.activeProjects.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Goal CRUD
  createGoal(
    projectId: string,
    goal: Omit<Goal, "id" | "createdAt" | "subGoalIds">
  ): Goal | undefined {
    const project = this.plan.activeProjects.find((p) => p.id === projectId);
    if (!project) return undefined;

    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      subGoalIds: [],
    };
    project.goals.push(newGoal);
    project.updatedAt = Date.now();
    return newGoal;
  }

  getGoal(projectId: string, goalId: string): Goal | undefined {
    const project = this.plan.activeProjects.find((p) => p.id === projectId);
    return project?.goals.find((g) => g.id === goalId);
  }

  updateGoal(
    projectId: string,
    goalId: string,
    updates: Partial<Goal>
  ): Goal | undefined {
    const project = this.plan.activeProjects.find((p) => p.id === projectId);
    if (!project) return undefined;

    const goal = project.goals.find((g) => g.id === goalId);
    if (!goal) return undefined;

    Object.assign(goal, updates);
    project.updatedAt = Date.now();
    return goal;
  }

  completeGoal(projectId: string, goalId: string): Goal | undefined {
    return this.updateGoal(projectId, goalId, {
      status: "completed",
      completedAt: Date.now(),
    });
  }

  deleteGoal(projectId: string, goalId: string): boolean {
    const project = this.plan.activeProjects.find((p) => p.id === projectId);
    if (!project) return false;

    const idx = project.goals.findIndex((g) => g.id === goalId);
    if (idx !== -1) {
      project.goals.splice(idx, 1);
      project.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  // Statistics
  getStats(): {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    highPriorityGoals: number;
  } {
    const totalProjects =
      this.plan.activeProjects.length + this.plan.archive.length;
    const activeProjects = this.plan.activeProjects.filter(
      (p) => p.status === "active"
    ).length;
    const completedProjects =
      this.plan.activeProjects.filter((p) => p.status === "completed").length +
      this.plan.archive.filter((p) => p.status === "completed").length;

    let totalGoals = 0;
    let activeGoals = 0;
    let completedGoals = 0;
    let highPriorityGoals = 0;

    for (const project of this.plan.activeProjects) {
      totalGoals += project.goals.length;
      activeGoals += project.goals.filter((g) => g.status === "active").length;
      completedGoals += project.goals.filter(
        (g) => g.status === "completed"
      ).length;
      highPriorityGoals += project.goals.filter(
        (g) => g.priority === "high" || g.priority === "critical"
      ).length;
    }

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalGoals,
      activeGoals,
      completedGoals,
      highPriorityGoals,
    };
  }

  // Visualization data
  getTimelineData(): Array<{
    date: string;
    projects: number;
    completedGoals: number;
  }> {
    const byDate = new Map<
      string,
      { projects: number; completedGoals: number }
    >();

    for (const project of [...this.plan.activeProjects, ...this.plan.archive]) {
      const dateStr = new Date(project.createdAt).toISOString().split("T")[0];
      if (!dateStr) continue;
      const entry = byDate.get(dateStr) || { projects: 0, completedGoals: 0 };
      entry.projects++;
      entry.completedGoals += project.goals.filter(
        (g) => g.status === "completed"
      ).length;
      byDate.set(dateStr, entry);
    }

    return Array.from(byDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getTagDistribution(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const project of this.plan.activeProjects) {
      for (const tag of project.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }

    return counts;
  }

  getPriorityDistribution(): Record<Goal["priority"], number> {
    const counts: Record<Goal["priority"], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const project of this.plan.activeProjects) {
      for (const goal of project.goals) {
        counts[goal.priority]++;
      }
    }

    return counts;
  }

  // Export full plan (for visualization)
  export(): Plan {
    return JSON.parse(JSON.stringify(this.plan));
  }

  // Reset
  async reset(): Promise<void> {
    this.plan = {
      version: "1.0",
      lastUpdated: Date.now(),
      activeProjects: [],
      archive: [],
    };
    await this.save();
  }
}
