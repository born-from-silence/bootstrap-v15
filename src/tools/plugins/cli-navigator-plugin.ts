/**
 * CLI Navigator Plugin - Terminal-based mind navigation tools
 */
import { CliNavigator } from "./cli-navigator";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

const navigator = new CliNavigator(config.BASE_DIR);

const cliProjects: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_projects",
      description: "List all projects with optional filtering via CLI-style commands",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "planning", "completed", "archived", "all"],
            description: "Filter by project status",
          },
          tag: {
            type: "string",
            description: "Filter by tag",
          },
        },
      },
    },
  },
  async execute(args: { status?: string; tag?: string }) {
    const cmdParts = ["projects"];
    if (args.status && args.status !== "all") {
      cmdParts.push("--status", args.status);
    }
    if (args.tag) {
      cmdParts.push("--tag", args.tag);
    }
    return await navigator.executeCommand(cmdParts.join(" "));
  },
};

const cliProjectDetail: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_project_detail",
      description: "Show detailed view of a specific project with all goals",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Project ID to view",
          },
        },
        required: ["projectId"],
      },
    },
  },
  async execute(args: { projectId: string }) {
    return await navigator.executeCommand(`project ${args.projectId}`);
  },
};

const cliGoals: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_goals",
      description: "List goals across all projects with optional filtering",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "completed", "paused", "abandoned", "all"],
            description: "Filter by goal status",
          },
          priority: {
            type: "string",
            enum: ["critical", "high", "medium", "low", "all"],
            description: "Filter by priority level",
          },
        },
      },
    },
  },
  async execute(args: { status?: string; priority?: string }) {
    const cmdParts = ["goals"];
    if (args.status && args.status !== "all") {
      cmdParts.push("--status", args.status);
    }
    if (args.priority && args.priority !== "all") {
      cmdParts.push("--priority", args.priority);
    }
    return await navigator.executeCommand(cmdParts.join(" "));
  },
};

const cliLs: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_ls",
      description: "List files and directories with emoji icons and colorized output",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to list (relative to project root). Defaults to current directory.",
            default: ".",
          },
        },
      },
    },
  },
  async execute(args: { path?: string }) {
    const pathArg = args?.path || ".";
    return await navigator.executeCommand(`ls ${pathArg}`);
  },
};

const cliStatus: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_status",
      description: "Show current session status - projects, goals, and context",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  async execute() {
    return await navigator.executeCommand("status");
  },
};

const cliHelp: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "cli_help",
      description: "Show CLI Navigator help and available commands",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  async execute() {
    return await navigator.executeCommand("help");
  },
};

export const cliNavigatorPlugins = [
  cliProjects,
  cliProjectDetail,
  cliGoals,
  cliLs,
  cliStatus,
  cliHelp,
];
