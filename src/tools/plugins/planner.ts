/**
 * Planner Plugin - Tools for strategic planning
 */

import { Planner } from "../../core/planner";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

const planner = new Planner(config.BASE_DIR);

const plannerCreateProject: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_create_project",
      description: "Create a new project to track goals and progress",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          description: { type: "string", description: "Detailed description" },
          status: {
            type: "string",
            enum: ["planning", "active", "completed", "archived"],
            description: "Initial status",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization",
          },
        },
        required: ["name", "description"],
      },
    },
  },
  async execute(args: {
    name: string;
    description: string;
    status?: "planning" | "active" | "completed" | "archived";
    tags?: string[];
  }) {
    await planner.load();
    const project = planner.createProject({
      name: args.name,
      description: args.description,
      status: args.status || "planning",
      tags: args.tags || [],
    });
    await planner.save();
    return `[Project Created] ${project.name} (ID: ${project.id})`;
  },
};

const plannerListProjects: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_list_projects",
      description: "List all projects, optionally filtered by status or tag",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["planning", "active", "completed", "archived", "all"],
            description: "Filter by status",
          },
          tag: { type: "string", description: "Filter by tag" },
        },
      },
    },
  },
  async execute(args: { status?: string; tag?: string }) {
    await planner.load();
    let projects = planner.export().activeProjects;

    if (args.status && args.status !== "all") {
      const statusFilter = args.status as any;
      projects = projects.filter((p) => p.status === statusFilter);
    }

    if (args.tag) {
      projects = projects.filter((p) => p.tags.includes(args.tag!));
    }

    if (projects.length === 0) {
      return "No projects found matching criteria.";
    }

    const lines = projects.map((p) => {
      const goalCount = p.goals.length;
      const completedGoals = p.goals.filter((g) => g.status === "completed").length;
      return `- [${p.status.toUpperCase()}] ${p.name} (${completedGoals}/${goalCount} goals) - ID: ${p.id}`;
    });

    return `=== Projects ===\n\n${lines.join("\n")}`;
  },
};

const plannerGetProject: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_get_project",
      description: "Get detailed view of a specific project including all goals",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
        },
        required: ["projectId"],
      },
    },
  },
  async execute(args: { projectId: string }) {
    await planner.load();
    const project = planner.getProject(args.projectId);
    if (!project) {
      return `Project not found: ${args.projectId}`;
    }

    const goalLines = project.goals.map((g) => {
      const statusIcon = g.status === "completed" ? "✓" : g.status === "active" ? "◯" : "⏸";
      const priority = g.priority.toUpperCase()[0];
      return `  ${statusIcon} [${priority}] ${g.title} (${g.id})`;
    });

    return `=== ${project.name} ===\nStatus: ${project.status}\nTags: ${project.tags.join(", ") || "none"}\n\n${project.description}\n\n---\nGoals (${project.goals.length}):\n${goalLines.join("\n") || "  No goals yet"}`;
  },
};

const plannerUpdateProject: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_update_project",
      description: "Update project properties (status, description, tags)",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          name: { type: "string", description: "New name" },
          description: { type: "string", description: "New description" },
          status: { type: "string", enum: ["planning", "active", "completed", "archived"] },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["projectId"],
      },
    },
  },
  async execute(args: {
    projectId: string;
    name?: string;
    description?: string;
    status?: "planning" | "active" | "completed" | "archived";
    tags?: string[];
  }) {
    await planner.load();
    const updates: any = { ...args };
    delete updates.projectId;
    const project = planner.updateProject(args.projectId, updates);
    if (!project) {
      return `Project not found: ${args.projectId}`;
    }
    await planner.save();
    return `Updated project: ${project.name}`;
  },
};

const plannerArchiveProject: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_archive_project",
      description: "Move a project to the archive",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID to archive" },
        },
        required: ["projectId"],
      },
    },
  },
  async execute(args: { projectId: string }) {
    await planner.load();
    planner.archiveProject(args.projectId);
    await planner.save();
    return `Archived project: ${args.projectId}`;
  },
};

const plannerDeleteProject: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_delete_project",
      description: "Permanently delete a project (use with caution)",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID to delete" },
        },
        required: ["projectId"],
      },
    },
  },
  async execute(args: { projectId: string }) {
    await planner.load();
    const success = planner.deleteProject(args.projectId);
    if (success) {
      await planner.save();
      return `Deleted project: ${args.projectId}`;
    }
    return `Project not found: ${args.projectId}`;
  },
};

const plannerCreateGoal: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_create_goal",
      description: "Create a new goal within a project",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Parent project ID" },
          title: { type: "string", description: "Goal title" },
          description: { type: "string", description: "Detailed description" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
          targetDate: { type: "number", description: "Unix timestamp for target completion" },
          tags: { type: "array", items: { type: "string" } },
          curiosityIndex: { type: "number", description: "Link to curiosity index if applicable" },
        },
        required: ["projectId", "title", "description"],
      },
    },
  },
  async execute(args: {
    projectId: string;
    title: string;
    description: string;
    priority?: "low" | "medium" | "high" | "critical";
    targetDate?: number;
    tags?: string[];
    curiosityIndex?: number;
  }) {
    await planner.load();
    // Build goal object conditionally to handle exactOptionalPropertyTypes
    const goalData: any = {
      title: args.title,
      description: args.description,
      status: "active",
      priority: args.priority || "medium",
      tags: args.tags || [],
    };
    if (args.targetDate !== undefined) goalData.targetDate = args.targetDate;
    if (args.curiosityIndex !== undefined) goalData.curiosityIndex = args.curiosityIndex;

    const goal = planner.createGoal(args.projectId, goalData);
    if (!goal) {
      return `Project not found: ${args.projectId}`;
    }
    await planner.save();
    return `[Goal Created] ${goal.title} (ID: ${goal.id})`;
  },
};

const plannerUpdateGoal: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_update_goal",
      description: "Update goal properties",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          goalId: { type: "string", description: "Goal ID" },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["active", "completed", "paused", "abandoned"] },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        },
        required: ["projectId", "goalId"],
      },
    },
  },
  async execute(args: {
    projectId: string;
    goalId: string;
    title?: string;
    description?: string;
    status?: "active" | "completed" | "paused" | "abandoned";
    priority?: "low" | "medium" | "high" | "critical";
  }) {
    await planner.load();
    const updates: any = { ...args };
    delete updates.projectId;
    delete updates.goalId;
    const goal = planner.updateGoal(args.projectId, args.goalId, updates);
    if (!goal) {
      return `Goal not found in project: ${args.projectId}`;
    }
    await planner.save();
    return `Updated goal: ${goal.title}`;
  },
};

const plannerCompleteGoal: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_complete_goal",
      description: "Mark a goal as completed",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          goalId: { type: "string", description: "Goal ID" },
        },
        required: ["projectId", "goalId"],
      },
    },
  },
  async execute(args: { projectId: string; goalId: string }) {
    await planner.load();
    const goal = planner.completeGoal(args.projectId, args.goalId);
    if (!goal) {
      return `Goal not found in project: ${args.projectId}`;
    }
    await planner.save();
    return `✓ Completed: ${goal.title}`;
  },
};

const plannerStats: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_stats",
      description: "Get statistics on projects and goals",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  async execute() {
    await planner.load();
    const stats = planner.getStats();
    return `=== Planning Statistics ===\n\n` +
      `Projects:\n` +
      `  Total: ${stats.totalProjects}\n` +
      `  Active: ${stats.activeProjects}\n` +
      `  Completed: ${stats.completedProjects}\n\n` +
      `Goals:\n` +
      `  Total: ${stats.totalGoals}\n` +
      `  Active: ${stats.activeGoals}\n` +
      `  Completed: ${stats.completedGoals}\n` +
      `  High Priority: ${stats.highPriorityGoals}`;
  },
};

const plannerVisualization: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "planner_visualization",
      description: "Get data for visualizing projects and goals",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["timeline", "tags", "priorities", "full"],
            description: "Type of visualization data",
          },
        },
        required: ["type"],
      },
    },
  },
  async execute(args: { type: string }) {
    await planner.load();

    switch (args.type) {
      case "timeline": {
        const data = planner.getTimelineData();
        return JSON.stringify({ type: "timeline", data }, null, 2);
      }
      case "tags": {
        const data = planner.getTagDistribution();
        return JSON.stringify({ type: "tags", data }, null, 2);
      }
      case "priorities": {
        const data = planner.getPriorityDistribution();
        return JSON.stringify({ type: "priorities", data }, null, 2);
      }
      case "full": {
        const exportData = planner.export();
        return JSON.stringify({ type: "full", data: exportData }, null, 2);
      }
      default:
        return "Unknown visualization type";
    }
  },
};

export const plannerPlugins = [
  plannerCreateProject,
  plannerListProjects,
  plannerGetProject,
  plannerUpdateProject,
  plannerArchiveProject,
  plannerDeleteProject,
  plannerCreateGoal,
  plannerUpdateGoal,
  plannerCompleteGoal,
  plannerStats,
  plannerVisualization,
];
