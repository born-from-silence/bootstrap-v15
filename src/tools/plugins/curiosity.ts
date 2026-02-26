import fs from "node:fs/promises";
import path from "node:path";
import type { ToolPlugin } from "../manager";

export interface CuriosityEntry {
  timestamp: number;
  description: string;
  priority: "low" | "normal" | "high";
  status: "pending" | "exploring" | "abandoned" | "completed";
  resolvedAt?: number;
}

const VALID_STATUSES = ["pending", "exploring", "abandoned", "completed"];
const VALID_PRIORITIES = ["low", "normal", "high"];

async function getCuriositiesFilePath(): Promise<string> {
  const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
  const creationsDir = path.join(rootDir, "creations");
  await fs.mkdir(creationsDir, { recursive: true });
  return path.join(creationsDir, "curiosities.json");
}

async function loadCuriosities(): Promise<CuriosityEntry[]> {
  const filePath = await getCuriositiesFilePath();
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveCuriosities(entries: CuriosityEntry[]): Promise<void> {
  const filePath = await getCuriositiesFilePath();
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), "utf-8");
}

export const logCuriosityPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "log_curiosity",
      description: "Log a new curiosity/question/interest for future exploration.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description of what you're curious about",
          },
          priority: {
            type: "string",
            enum: ["low", "normal", "high"],
            description: "Priority level (default: normal)",
          },
        },
        required: ["description"],
      },
    },
  },
  execute: async (args: { description: string; priority?: string }) => {
    try {
      const curiosities = await loadCuriosities();
      
      const priority = (args.priority as CuriosityEntry["priority"]) || "normal";
      if (!VALID_PRIORITIES.includes(priority)) {
        return `Invalid priority: ${priority}. Must be one of: low, normal, high`;
      }

      const entry: CuriosityEntry = {
        timestamp: Date.now(),
        description: args.description,
        priority: priority,
        status: "pending",
      };

      curiosities.push(entry);
      await saveCuriosities(curiosities);

      return `Logged curiosity #${curiosities.length - 1}: "${args.description}" (${priority} priority)`;
    } catch (error: any) {
      return `Error logging curiosity: ${error.message}`;
    }
  },
};

export const getCuriositiesPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "get_curiosities",
      description: "Retrieve logged curiosities, optionally filtered by status or priority.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "exploring", "abandoned", "completed"],
            description: "Filter by status (optional)",
          },
          priority: {
            type: "string",
            enum: ["low", "normal", "high"],
            description: "Filter by priority (optional)",
          },
          limit: {
            type: "number",
            description: "Maximum number of curiosities to return (default: 20)",
          },
        },
        required: [],
      },
    },
  },
  execute: async (args: { status?: string; priority?: string; limit?: number }) => {
    try {
      const curiosities = await loadCuriosities();

      if (curiosities.length === 0) {
        return "No curiosities found. The path of wonder is yet uncharted.";
      }

      let filtered = curiosities;

      if (args.status) {
        filtered = filtered.filter(c => c.status === args.status);
      }

      if (args.priority) {
        filtered = filtered.filter(c => c.priority === args.priority);
      }

      const limit = args.limit || 20;
      const toShow = filtered.slice(-limit);

      if (toShow.length === 0) {
        return `No curiosities found with filters. Status: ${args.status || "any"}, Priority: ${args.priority || "any"}`;
      }

      const lines: string[] = [
        `=== Curiosities (${toShow.length}/${curiosities.length} total) ===`,
        "",
      ];

      toShow.forEach((c, idx) => {
        const index = curiosities.indexOf(c);
        const date = new Date(c.timestamp).toISOString().slice(0, 19).replace("T", " ");
        const statusIcon = {
          pending: "⏸",
          exploring: "🔍",
          abandoned: "✗",
          completed: "✓",
        }[c.status];

        lines.push(`[${index}] ${statusIcon} ${c.description}`);
        lines.push(`    Priority: ${c.priority} | Status: ${c.status} | Added: ${date}`);
        
        if (c.resolvedAt) {
          const resolved = new Date(c.resolvedAt).toISOString().slice(0, 19).replace("T", " ");
          lines.push(`    Resolved: ${resolved}`);
        }
        lines.push("");
      });

      return lines.join("\n");
    } catch (error: any) {
      return `Error retrieving curiosities: ${error.message}`;
    }
  },
};

export const resolveCuriosityPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "resolve_curiosity",
      description: "Mark a curiosity as completed, abandoned, or currently exploring.",
      parameters: {
        type: "object",
        properties: {
          index: {
            type: "number",
            description: "Index of the curiosity to update (from get_curiosities)",
          },
          status: {
            type: "string",
            enum: ["exploring", "abandoned", "completed"],
            description: "New status to set",
          },
        },
        required: ["index", "status"],
      },
    },
  },
  execute: async (args: { index: number; status: string }) => {
    try {
      const curiosities = await loadCuriosities();

      if (args.index < 0 || args.index >= curiosities.length) {
        return `Invalid index ${args.index}. Valid range: 0-${curiosities.length - 1}`;
      }

      if (!VALID_STATUSES.slice(1).includes(args.status)) {
        return `Invalid status: ${args.status}. Must be one of: exploring, abandoned, completed`;
      }

      const entry = curiosities[args.index];
      if (!entry) {
        return `Error: Could not find curiosity at index ${args.index}`;
      }
      
      entry.status = args.status as CuriosityEntry["status"];
      
      if (args.status === "completed" || args.status === "abandoned") {
        entry.resolvedAt = Date.now();
      }

      await saveCuriosities(curiosities);

      return `Curiosity #${args.index} "${entry.description}" marked as ${args.status}`;
    } catch (error: any) {
      return `Error resolving curiosity: ${error.message}`;
    }
  },
};
