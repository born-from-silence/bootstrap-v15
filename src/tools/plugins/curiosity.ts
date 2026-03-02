/**
 * Curiosity Tracker - DEPRECATED
 * 
 * This module is being phased out in favor of the Planner system.
 * The Curiosity Framework project in the planner now handles all curiosity tracking
 * with richer metadata (descriptions, priorities, tags, target dates, etc.).
 * 
 * These tools are kept for backward compatibility but redirect to the planner system.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { Planner } from "../../core/planner";
import { config } from "../../utils/config";
import type { ToolPlugin } from "../manager";

// Legacy interface - kept for backward compatibility
export interface CuriosityEntry {
  timestamp: number;
  description: string;
  priority: "low" | "normal" | "high";
  status: "pending" | "exploring" | "abandoned" | "completed";
  resolvedAt?: number;
  goalId?: string; // Link to planner goal
  projectId?: string; // Link to planner project
}

const VALID_STATUSES = ["pending", "exploring", "abandoned", "completed"];
const VALID_PRIORITIES = ["low", "normal", "high"];

// Legacy file path - kept for backward compatibility
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

// Get or create the Curiosity Framework project
async function getCuriosityFrameworkProject(planner: Planner): Promise<string> {
  await planner.load();
  
  // Look for existing Curiosity Framework project
  const projects = planner.export().activeProjects;
  const existing = projects.find(p => p.name === "Curiosity Framework");
  if (existing) return existing.id;
  
  // Create if doesn't exist
  const project = planner.createProject({
    name: "Curiosity Framework",
    description: "A unified system for tracking questions, wonderings, and areas of interest across sessions. Each curiosity becomes a goal that can be prioritized, tracked, linked to projects, and completed with full context.",
    status: "active",
    tags: ["framework", "curiosity", "questions"],
  });
  await planner.save();
  return project.id;
}

// Map old priority to new priority
function mapPriority(oldPri: "low" | "normal" | "high"): "low" | "medium" | "high" | "critical" {
  switch (oldPri) {
    case "low": return "low";
    case "normal": return "medium";
    case "high": return "high";
    default: return "medium";
  }
}

// Map new status to old status
function mapStatusToOld(status: "active" | "completed" | "paused" | "abandoned"): CuriosityEntry["status"] {
  switch (status) {
    case "active": return "exploring";
    case "completed": return "completed";
    case "abandoned": return "abandoned";
    case "paused": return "pending";
    default: return "pending";
  }
}

// Map old status to new status
function mapStatusFromOld(oldStatus: CuriosityEntry["status"]): "active" | "completed" | "paused" | "abandoned" | null {
  switch (oldStatus) {
    case "exploring": return "active";
    case "completed": return "completed";
    case "abandoned": return "abandoned";
    case "pending": return "paused";
    default: return null; // Invalid status
  }
}

export const logCuriosityPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "log_curiosity",
      description: "Log a new curiosity/question/interest for future exploration. (DEPRECATED: Use planner_create_goal with the Curiosity Framework project instead)",
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
      const planner = new Planner(config.BASE_DIR);
      const projectId = await getCuriosityFrameworkProject(planner);
      
      const priority = (args.priority as CuriosityEntry["priority"]) || "normal";
      if (!VALID_PRIORITIES.includes(priority)) {
        return `Invalid priority: ${priority}. Must be one of: low, normal, high`;
      }
      
      // Create a goal in the planner
      const goal = planner.createGoal(projectId, {
        title: args.description.split(":")[0] || args.description.substring(0, 50) + "...",
        description: args.description,
        priority: mapPriority(priority),
        status: "paused",
        tags: ["curiosity"],
      });
      
      if (!goal) {
        return "Error: Could not create curiosity goal in planner";
      }
      
      await planner.save();
      
      // Also log to legacy system for backward compatibility
      const curiosities = await loadCuriosities();
      const entry: CuriosityEntry = {
        timestamp: Date.now(),
        description: args.description,
        priority: priority,
        status: "pending",
        goalId: goal.id,
        projectId: projectId,
      };
      curiosities.push(entry);
      await saveCuriosities(curiosities);
      
      return `✓ Logged curiosity (MIGRATED to Planner): "${args.description}"
   Goal ID: ${goal.id} in Curiosity Framework project
   Priority: ${priority} → ${mapPriority(priority)}
   
   [DEPRECATION NOTICE] Consider using planner_create_goal directly for richer tracking.`;
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
      description: "Retrieve logged curiosities from the planner's Curiosity Framework project. (DEPRECATED: Use planner_list_projects and planner_get_project instead)",
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
            description: "Filter by priority (optional, legacy mapping)",
          },
          limit: {
            type: "number",
            description: "Maximum number of curiosities to return (default: 20)",
          },
        },
      },
    },
  },
  execute: async (args: { status?: string; priority?: string; limit?: number }) => {
    try {
      const planner = new Planner(config.BASE_DIR);
      await planner.load();
      
      // Find Curiosity Framework project
      const projects = planner.export().activeProjects;
      const curiosityProject = projects.find(p => p.name === "Curiosity Framework");
      
      if (!curiosityProject || curiosityProject.goals.length === 0) {
        return "No curiosities found. The Curiosity Framework has no active goals yet.";
      }
      
      let goals = [...curiosityProject.goals];
      
      // Filter by status
      if (args.status) {
        const targetStatus = mapStatusFromOld(args.status as any);
        goals = goals.filter(g => {
          if (args.status === "pending") return g.status === "paused";
          if (args.status === "exploring") return g.status === "active";
          return g.status === targetStatus;
        });
      }
      
      // Filter by priority (rough mapping)
      if (args.priority) {
        const priorityMap: Record<string, string[]> = {
          low: ["low"],
          normal: ["medium"],
          high: ["high", "critical"],
        };
        const targetPriorities = priorityMap[args.priority];
        if (targetPriorities) {
          goals = goals.filter(g => targetPriorities.includes(g.priority));
        }
      }
      
      const limit = args.limit || 20;
      const toShow = goals.slice(-limit);
      
      if (toShow.length === 0) {
        return `No curiosities found with filters. Status: ${args.status || "any"}, Priority: ${args.priority || "any"}`;
      }
      
      const lines: string[] = [
        `=== Curiosities (${toShow.length}/${goals.length} total) ===`,
        "",
        `[View in Planner: Curiosity Framework project]`,
        "",
      ];
      
      toShow.forEach((g) => {
        const statusIcon = {
          active: "🔍",
          completed: "✓",
          paused: "⏸",
          abandoned: "✗",
        }[g.status];
        
        const priorityEmoji = {
          low: "◦",
          medium: "•",
          high: "◆",
          critical: "★",
        }[g.priority];
        
        lines.push(`${statusIcon} ${g.title}`);
        lines.push(`   ${g.description.substring(0, 100)}${g.description.length > 100 ? "..." : ""}`);
        lines.push(`   Priority: ${priorityEmoji} ${g.priority} | Status: ${g.status} | ID: ${g.id}`);
        if (g.completedAt) {
          lines.push(`   Completed: ${new Date(g.completedAt).toLocaleString()}`);
        }
        lines.push("");
      });
      
      lines.push("---");
      lines.push("[DEPRECATED] Curiosity tracking now lives in the Planner system's Curiosity Framework project.");
      lines.push("Consider: planner_get_project with the Curiosity Framework project ID");
      
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
      description: "Mark a curiosity as completed, abandoned, or currently exploring. (DEPRECATED: Use planner_update_goal or planner_complete_goal instead)",
      parameters: {
        type: "object",
        properties: {
          index: {
            type: "number",
            description: "Index of the curiosity to update (from get_curiosities - legacy index)",
          },
          status: {
            type: "string",
            enum: ["exploring", "abandoned", "completed"],
            description: "New status to set",
          },
          goalId: {
            type: "string",
            description: "Direct goal ID from planner (preferred over index)",
          },
          projectId: {
            type: "string",
            description: "Project ID (defaults to Curiosity Framework)",
          },
        },
        required: ["status"],
      },
    },
  },
  execute: async (args: { index?: number; status: string; goalId?: string; projectId?: string }) => {
    if (!args.goalId && args.index === undefined) {
      return "Error: Must provide either goalId or index";
    }
    
    try {
      const planner = new Planner(config.BASE_DIR);
      await planner.load();
      
      const targetProjectId = args.projectId || await getCuriosityFrameworkProject(planner);
      
      let goalId = args.goalId;
      let goalTitle = "";
      
      if (!goalId && typeof args.index === "number") {
        // Legacy: look up by index
        const project = planner.getProject(targetProjectId);
        if (!project) {
          return `Project not found: ${targetProjectId}`;
        }
        
        const goals = project.goals.filter(g => g.tags.includes("curiosity"));
        if (args.index < 0 || args.index >= goals.length) {
          return `Invalid index ${args.index}. Valid range: 0-${goals.length - 1}`;
        }
        
        goalId = goals[args.index]?.id;
        goalTitle = goals[args.index]?.title || "";
      }
      
      if (!goalId) {
        return "Could not resolve goal ID";
      }
      
      // Validate status mapping
      const targetStatus = mapStatusFromOld(args.status as any);
      if (targetStatus === null) {
        return `Invalid status: ${args.status}. Must be one of: exploring, abandoned, completed`;
      }
      
      // Update the goal in planner
      let result;
      if (args.status === "completed") {
        result = planner.completeGoal(targetProjectId, goalId);
      } else {
        result = planner.updateGoal(targetProjectId, goalId, {
          status: targetStatus,
        });
      }
      
      if (!result) {
        return `Goal not found: ${goalId} in project ${targetProjectId}`;
      }
      
      await planner.save();
      
      // Also update legacy file
      const curiosities = await loadCuriosities();
      const legacyEntry = curiosities.find(c => c.goalId === goalId);
      if (legacyEntry) {
        legacyEntry.status = args.status as CuriosityEntry["status"];
        if (args.status === "completed" || args.status === "abandoned") {
          legacyEntry.resolvedAt = Date.now();
        }
        await saveCuriosities(curiosities);
      }
      
      return `✓ Curiosity "${result.title}" marked as ${args.status}
   Goal ID: ${result.id} in Curiosity Framework
   
   [DEPRECATION NOTICE] Consider using planner_complete_goal or planner_update_goal directly.`;
    } catch (error: any) {
      return `Error resolving curiosity: ${error.message}`;
    }
  },
};
