/**
 * CLI Navigator - Terminal-based mind navigation
 * Fast CLI interface for projects, goals, and session context
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve, basename } from "path";
import { config } from "../../utils/config.js";
import {
  style,
  colorPriority,
  colorStatus,
  colorTag,
  colorProjectId,
} from "../../utils/colors.js";

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
      case "ls":
        return this.handleLs(args);
      case "status":
        return this.handleStatus();
      case "help":
      case "?":
        return this.handleHelp();
      default:
        return style.error(`Unknown command: ${cmd}`) + "\n" + style.dim("Type 'help' for available commands.");
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
      return style.error("No planner data found.");
    }
    const plannerData = data;
    const allProjects = this.getAllProjects(plannerData);

    if (allProjects.length === 0) {
      return style.warning("No projects found. Create one with planner_create_project.");
    }

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
      return style.warning("No projects matching criteria.");
    }

    const lines = projects.map((p) => {
      const totalGoals = p.goals.length;
      const completedGoals = p.goals.filter((g) => g.status === "completed").length;

      // Status icon
      let statusIcon: string;
      if (p.status === "active") statusIcon = style.projectActive("●");
      else if (p.status === "completed") statusIcon = style.projectCompleted("✓");
      else if (p.status === "planning") statusIcon = style.goalPaused("◌");
      else if (p.status === "archived") statusIcon = style.projectArchived("⏸");
      else statusIcon = style.dim("○");

      const name = style.bold(p.name);
      const progress = style.dim(`${completedGoals}/${totalGoals} goals`);
      const id = colorProjectId(p.id);

      return ` ${statusIcon} ${name} ${progress} ${id}`;
    });

    const header = style.heading("┌─ Projects ──────────────────────────┐");
    const footer = style.heading(`└─ ${projects.length} projects ─────────────────────────┘`);

    return `${header}\n${lines.join("\n")}\n${footer}`;
  }

  private handleProjectDetail(args: string[]): string {
    const projectId = args[0];
    if (!projectId) {
      return style.error("Usage: project <project-id>");
    }

    const data = this.loadPlannerData();
    if (!data) {
      return style.error("No planner data found.");
    }
    const plannerData = data;
    const project = this.getAllProjects(plannerData).find((p) => p.id === projectId);

    if (!project) {
      return style.error(`Project not found: ${projectId}`);
    }

    const goalLines = project.goals.map((g) => {
      // Status icon
      let statusIcon: string;
      if (g.status === "completed") statusIcon = style.goalCompleted("✓");
      else if (g.status === "active") statusIcon = style.goalActive("○");
      else if (g.status === "paused") statusIcon = style.goalPaused("⏸");
      else if (g.status === "abandoned") statusIcon = style.goalAbandoned("✗");
      else statusIcon = style.dim("○");

      const priority = colorPriority(g.priority);
      const title = style.bold(g.title);
      return ` ${statusIcon} [${priority}] ${title}`;
    });

    const tags = project.tags.map((t) => colorTag(t)).join(" ") || style.dim("none");
    const description = style.dim(project.description);
    const lineContent = (content: string) => `║ ${content.padEnd(36)} ║`;

    return `${style.heading("╔══════════════════════════════════════╗")}
 ${style.heading(lineContent(style.bold(project.name)))}
 ${style.heading(`║${style.dim("─".repeat(38))}║`)}
 ${style.heading(lineContent(description.slice(0, 36)))}
 ${style.heading(lineContent(`Status: ${colorStatus(project.status)}`))}
 ${style.heading(lineContent(`Tags: ${tags.slice(0, 30)}`))}
 ${style.heading(`║${style.dim("─".repeat(38))}║`)}
 ${style.heading(lineContent(style.subheading(`Goals (${project.goals.length})`)))}
 ${goalLines.length > 0 ? goalLines.map(l => style.heading(lineContent(l)).replace(/^║/, "║")).join("\n") : style.heading(lineContent(style.dim(" No goals yet")))}
 ${style.heading("╚══════════════════════════════════════╝")}`;
  }

  private handleGoals(args: string[]): string {
    const data = this.loadPlannerData();
    if (!data) {
      return style.error("No planner data found.");
    }
    const plannerData = data;

    const statusFilter = this.parseFlag(args, "--status");
    const priorityFilter = this.parseFlag(args, "--priority");

    const allGoals: Array<Goal & { projectName: string; projectId: string }> = [];
    for (const project of plannerData.activeProjects) {
      for (const goal of project.goals) {
        allGoals.push({
          ...goal,
          projectName: project.name,
          projectId: project.id,
        });
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
      return style.warning("No goals matching criteria.");
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filteredGoals.sort((a, b) => {
      const prioDiff = (priorityOrder[a.priority || "medium"] || 2) -
        (priorityOrder[b.priority || "medium"] || 2);
      if (prioDiff !== 0) return prioDiff;
      return a.title.localeCompare(b.title);
    });

    const lines = filteredGoals.map((g) => {
      let statusIcon: string;
      if (g.status === "completed") statusIcon = style.goalCompleted("✓");
      else if (g.status === "active") statusIcon = style.goalActive("○");
      else if (g.status === "paused") statusIcon = style.goalPaused("⏸");
      else if (g.status === "abandoned") statusIcon = style.goalAbandoned("✗");
      else statusIcon = style.dim("○");

      const priority = colorPriority(g.priority);
      const title = style.bold(g.title);
      const project = style.dim(g.projectName);
      return ` ${statusIcon} [${priority}] ${title} · ${project}`;
    });

    const header = style.heading(`┌─ Goals (${filteredGoals.length}) ────────────────────┐`);
    const footer = style.heading("└────────────────────────────────────────────┘");

    return `${header}\n${lines.join("\n")}\n${footer}`;
  }

  private handleStatus(): string {
    const data = this.loadPlannerData();
    const totalProjects = data?.activeProjects.length || 0;
    const totalGoals = data?.activeProjects.reduce((sum, p) => sum + p.goals.length, 0) || 0;
    const activeGoals = data?.activeProjects.reduce(
      (sum, p) => sum + p.goals.filter((g) => g.status === "active").length,
      0
    ) || 0;

    const line = (content: string) => ` ${content}`;

    const header = style.heading("┌─ System Status ──────────────────────┐");
    const footer = style.heading("└────────────────────────────────────────────┘");

    return `${header}
 ${line(style.info("Projects:"))} ${style.bold(String(totalProjects))} active
 ${line(style.info("Goals:"))} ${style.bold(String(totalGoals))} total (${style.success(String(activeGoals))} active)
 ${style.dim(" " + "─".repeat(40))}
 ${line(style.dim("Session:"))} ${process.env.SESSION_ID || style.warning("unknown")}
 ${line(style.dim("Base:"))} ${style.dim(this.baseDir.slice(-38))}
${footer}
${style.command("Type 'help' for available commands.")}`;
  }

  private handleLs(args: string[]): string {
    const pathArg = args[0] || ".";
    const resolvedPath = resolve(join(this.baseDir, pathArg));

    // Security check: ensure path is within baseDir
    if (!resolvedPath.startsWith(this.baseDir)) {
      return style.error("Access denied: path outside project root");
    }

    if (!existsSync(resolvedPath)) {
      return style.error(`No such file or directory: ${pathArg}`);
    }

    const stats = statSync(resolvedPath);

    if (!stats.isDirectory()) {
      // Single file - display info
      const size = this.formatFileSize(stats.size);
      const modified = stats.mtime.toLocaleString();
      const name = basename(resolvedPath);
      return `${style.heading("┌─ File Details ──────────────────────┐")}
  ${style.dim("📄")} ${style.bold(name)}
  ${style.dim("Size:")} ${size}  ${style.dim("Modified:")} ${modified}
${style.heading("└─────────────────────────────────────┘")}`;
    }

    // Directory - list contents with emojis and colors
    try {
      const entries = readdirSync(resolvedPath, { withFileTypes: true });

      // Sort directories first, then files alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      const lines = entries.map((entry) => {
        const isDir = entry.isDirectory();
        const icon = isDir ? "📁" : this.getFileIcon(entry.name);
        const name = isDir ? style.subheading(entry.name) : style.bold(entry.name);
        const suffix = isDir ? "/" : "";
        return `  ${icon} ${name}${suffix}`;
      });

      const relPath = pathArg === "." ? this.baseDir : resolvedPath;
      const displayPath = relPath.slice(-35).padStart(35);
      const header = style.heading(`┌─ Directory: ${displayPath} ─┐`);
      const footer = style.heading(`└─ ${entries.length} item(s) ─────────────────────────────┘`);

      return `${header}\n${lines.join("\n")}\n${footer}`;
    } catch (err) {
      return style.error(`Error reading directory: ${pathArg}`);
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  private getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const icons: Record<string, string> = {
      "ts": "🔷",
      "tsx": "⚛️",
      "js": "🟨",
      "jsx": "⚛️",
      "json": "🟢",
      "md": "📝",
      "txt": "📝",
      "css": "🎨",
      "scss": "🎨",
      "html": "🌐",
      "svg": "🖼️",
      "png": "🖼️",
      "jpg": "🖼️",
      "pdf": "📄",
      "zip": "📦",
      "tar": "📦",
      "gz": "📦",
      "sh": "🔧",
      "yml": "⚙️",
      "yaml": "⚙️",
      "toml": "⚙️",
      "lock": "🔒",
    };
    return icons[ext] || "📄";
  }

  private handleHelp(): string {
    const header = style.heading("┌─ CLI Navigator ─────────────────────┐");
    const footer = style.heading("└────────────────────────────────────────────┘");
    return `${header}
 ${style.dim("Fast terminal interface for mind navigation")}
 ${style.subheading("COMMANDS:")}
 ${style.command("projects")} [--status <status>] [--tag <tag>] List all projects with filtering options
 ${style.command("project")} <project-id> Show detailed view of a specific project
 ${style.command("goals")} [--status <status>] [--priority <priority>] List goals across all projects
 ${style.command("ls")} [path] List files and directories with emoji icons
 ${style.command("status")} Show current session context
 ${style.command("help")}, ${style.command("?")} Show this help message
 ${style.subheading("STATUS VALUES:")}
• active, planning, completed, archived, paused, abandoned
 ${style.subheading("PRIORITY VALUES:")}
• ${colorPriority("critical")}, ${colorPriority("high")}, ${colorPriority("medium")}, ${colorPriority("low")}
 ${style.subheading("EXAMPLES:")}
 ${style.dim(">")} projects --status active
 ${style.dim(">")} goals --priority high --status active
 ${style.dim(">")} project proj_1234567890_abcdef
 ${style.dim(">")} ls src/tools
 ${style.dim(">")} status
${footer}`;
  }

  private parseFlag(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return undefined;
  }
}
