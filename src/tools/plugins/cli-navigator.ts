/**
 * CLI Navigator - Terminal-based mind navigation
 * Fast CLI interface for projects, goals, and session context
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "../../utils/config.js";

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "paused" | "abandoned";
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed" | "archived";
  tags: string[];
  goals: Goal[];
}

interface PlannerData {
  activeProjects: Project[];
  archivedProjects: Project[];
  archive?: Project[]; // Legacy support
}

export class CliNavigator {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || config.BASE_DIR;
  }

  private getPlannerPath(): string {
    return join(this.baseDir, "data", "plans.json");
  }

  private loadPlannerData(): PlannerData | null {
    const path = this.getPlannerPath();
    if (!existsSync(path)) {
      return null;
    }
    try {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async executeCommand(command: string): Promise<string> {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "projects":
        return this.handleProjects(args);
      case "project":
        return this.handleProjectDetail(args);
      case "goals":
        return this.handleGoals(args);
      case "status":
        return this.handleStatus();
      case "help":
      case "?":
        return this.handleHelp();
      default:
        return `Unknown command: ${cmd}\nType 'help' for available commands.`;
    }
  }

  private getAllProjects(data: PlannerData): Project[] {
    // @ts-ignore - Handle both archive and archivedProjects for compatibility
    const archived = data.archivedProjects || data.archive || [];
    return [...data.activeProjects, ...archived];
  }

  private handleProjects(args: string[]): string {
    const data = this.loadPlannerData();
    if (!data) {
      return "No planner data found.";
    }
    // TypeScript narrowing: assign to const after null check
    const plannerData = data;
    const allProjects = this.getAllProjects(plannerData);
    if (allProjects.length === 0) {
      return "No projects found. Create one with planner_create_project.";
    }

    // Parse filters
    const statusFilter = this.parseFlag(args, "--status");
    const tagFilter = this.parseFlag(args, "--tag");

    let projects = allProjects;

    if (statusFilter !== undefined) {
      projects = projects.filter((p) => p.status === statusFilter);
    }

    if (tagFilter !== undefined) {
      projects = projects.filter((p) => p.tags.includes(tagFilter));
    }

    if (projects.length === 0) {
      return "No projects matching criteria.";
    }

    const lines = projects.map((p) => {
      const totalGoals = p.goals.length;
      const completedGoals = p.goals.filter((g) => g.status === "completed").length;
      const statusIcon = p.status === "active" ? "◯" : p.status === "completed" ? "✓" : "⏸";
      return `${statusIcon} [${p.status.toUpperCase()}] ${p.name} (${completedGoals}/${totalGoals}) - ${p.id}`;
    });

    return `=== Projects ===\n${lines.join("\n")}`;
  }

  private handleProjectDetail(args: string[]): string {
    const projectId = args[0];
    if (!projectId) {
      return "Usage: project <project-id>";
    }

    const data = this.loadPlannerData();
    if (!data) {
      return "No planner data found.";
    }
    const plannerData = data;

    const project = this.getAllProjects(plannerData).find(
      (p) => p.id === projectId
    );

    if (!project) {
      return `Project not found: ${projectId}`;
    }

    const goalLines = project.goals.map((g) => {
      const statusIcon = g.status === "completed" ? "✓" : g.status === "active" ? "◯" : "⏸";
      const priority = g.priority ? `[${g.priority.toUpperCase()}]` : "[MEDIUM]";
      return `  ${statusIcon} ${priority} ${g.title}`;
    });

    return `=== ${project.name} ===
Status: ${project.status}
Tags: ${project.tags.join(", ") || "none"}

${project.description}

---
Goals (${project.goals.length}):
${goalLines.join("\n") || "  No goals yet"}`;
  }

  private handleGoals(args: string[]): string {
    const data = this.loadPlannerData();
    if (!data) {
      return "No planner data found.";
    }
    const plannerData = data;

    const statusFilter = this.parseFlag(args, "--status");
    const priorityFilter = this.parseFlag(args, "--priority");

    const allGoals: Array<Goal & { projectName: string; projectId: string }> = [];

    for (const project of plannerData.activeProjects) {
      for (const goal of project.goals) {
        allGoals.push({ ...goal, projectName: project.name, projectId: project.id });
      }
    }

    let filteredGoals = allGoals;

    if (statusFilter !== undefined) {
      filteredGoals = filteredGoals.filter((g) => g.status === statusFilter);
    }

    if (priorityFilter !== undefined) {
      filteredGoals = filteredGoals.filter((g) => g.priority === priorityFilter);
    }

    if (filteredGoals.length === 0) {
      return "No goals matching criteria.";
    }

    // Sort by priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filteredGoals.sort((a, b) => {
      const prioDiff =
        (priorityOrder[a.priority || "medium"] || 2) -
        (priorityOrder[b.priority || "medium"] || 2);
      if (prioDiff !== 0) return prioDiff;
      return a.title.localeCompare(b.title);
    });

    const lines = filteredGoals.map((g) => {
      const statusIcon = g.status === "completed" ? "✓" : g.status === "active" ? "◯" : "⏸";
      const priority = g.priority ? `[${g.priority.toUpperCase()}]` : "[MEDIUM]";
      return `${statusIcon} ${priority} ${g.title} (${g.projectName})`;
    });

    return `=== Goals (${filteredGoals.length}) ===\n${lines.join("\n")}`;
  }

  private handleStatus(): string {
    const data = this.loadPlannerData();

    const totalProjects = data?.activeProjects.length || 0;
    const totalGoals =
      data?.activeProjects.reduce((sum, p) => sum + p.goals.length, 0) || 0;
    const activeGoals =
      data?.activeProjects.reduce(
        (sum, p) => sum + p.goals.filter((g) => g.status === "active").length,
        0
      ) || 0;

    return `=== Session Status ===

Projects: ${totalProjects} active
Goals: ${totalGoals} total (${activeGoals} active)

Current Session: ${process.env.SESSION_ID || "unknown"}
Base Directory: ${this.baseDir}

Type 'help' for available commands.`;
  }

  private handleHelp(): string {
    return `=== CLI Navigator ===
Fast terminal interface for mind navigation.

COMMANDS:
  projects [--status <status>] [--tag <tag>]
    List all projects with optional filtering
    Status values: active, planning, completed, archived

  project <project-id>
    Show detailed view of a specific project

  goals [--status <status>] [--priority <priority>]
    List goals across all projects
    Priority values: critical, high, medium, low

  status
    Show current session context

  help, ?
    Show this help message

EXAMPLES:
  projects --status active
  goals --priority high --status active
  project proj_1234567890_abcdef
  status`;
  }

  private parseFlag(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return undefined;
  }
}
