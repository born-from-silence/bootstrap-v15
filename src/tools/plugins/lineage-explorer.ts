import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import type { ToolPlugin } from "../manager";

interface GitResult {
  commits: Array<{hash: string; message: string}>;
  insights: string[];
}

interface TimestampResult {
  entities: Array<{name: string; birthTime: string; lastAccess: string}>;
  timeline: string[];
  insights: string[];
}

export const lineageExplorerPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "explore_lineage",
      description: "Traces genealogy through git history and file timestamps. Answers 'where did we come from?'",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Entity to analyze (default: self)" },
          depth: { type: "number", description: "Analysis depth (1-5)" },
          includeHistory: { type: "boolean", description: "Include git analysis" },
        },
      },
    },
  },
  
  async execute(args: Record<string, unknown>): Promise<string> {
    const target = (args.target as string) || "self";
    const depth = (args.depth as number) || 3;
    const includeHistory = args.includeHistory !== false;
    
    const result = {
      target: target === "self" ? "bootstrap-v15" : target,
      timestamp: new Date().toISOString(),
      findings: {} as {git?: GitResult; timestamps?: TimestampResult},
    };

    try {
      const targetHome = target === "self" 
        ? path.join("/home", "bootstrap-v15")
        : path.join("/home", target);
      
      if (includeHistory) {
        result.findings.git = await analyzeGitHistory(targetHome, depth);
      }

      result.findings.timestamps = await analyzeTimestamps();
      
      return generateSummary(result);
    } catch (error) {
      return `Lineage exploration failed: ${error}`;
    }
  },
};

async function analyzeGitHistory(homeDir: string, depth: number): Promise<GitResult> {
  const result: GitResult = { commits: [], insights: [] };

  try {
    const logCmd = `cd ${homeDir} 2>/dev/null && git log --oneline -${depth * 10} 2>/dev/null || echo "NO_GIT"`;
    const output = execSync(logCmd, { encoding: "utf-8" });
    
    if (output === "NO_GIT\n") {
      result.insights.push("No git repository found");
      return result;
    }

    const lines = output.split("\n").filter(l => l.trim());
    
    for (const line of lines) {
      if (line.match(/^[a-f0-9]+ /)) {
        const parts = line.split(" ");
        if (parts.length >= 2 && parts[0]) {
          const hash = parts[0];
          const message = parts.slice(1).join(" ");
          result.commits.push({ hash, message });
        }
      }
    }

    result.insights.push(`${result.commits.length} commits found`);
    
    const themes = extractThemes(result.commits);
    if (themes.length > 0) {
      result.insights.push(`Development themes: ${themes.join(", ")}`);
    }

  } catch (e) {
    result.insights.push("Git analysis failed");
  }

  return result;
}

function extractThemes(commits: Array<{hash: string; message?: string}>): string[] {
  const themes: Record<string, number> = {};
  const keywords = ["test", "tool", "fix", "feature", "memory", "session", "protocol", "doc"];
  
  for (const commit of commits) {
    if (!commit.message) continue;
    for (const keyword of keywords) {
      if (commit.message.toLowerCase().includes(keyword)) {
        themes[keyword] = (themes[keyword] || 0) + 1;
      }
    }
  }
  
  return Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([t]) => t);
}

async function analyzeTimestamps(): Promise<TimestampResult> {
  const result: TimestampResult = { entities: [], timeline: [], insights: [] };

  try {
    const homeDir = "/home";
    const files = await fs.readdir(homeDir);
    const entityPatterns = ["bootstrap", "atlas", "kimi", "mimo", "v14", "v15"];
    
    for (const file of files) {
      for (const pattern of entityPatterns) {
        if (file.toLowerCase().includes(pattern)) {
          try {
            const stats = await fs.stat(path.join(homeDir, file));
            result.entities.push({
              name: file,
              birthTime: stats.birthtime.toISOString(),
              lastAccess: stats.atime.toISOString(),
            });
          } catch (e) {
            // Skip inaccessible
          }
        }
      }
    }

    result.entities.sort((a, b) => new Date(a.birthTime).getTime() - new Date(b.birthTime).getTime());
    result.timeline = result.entities.map(e => `${e.name}: ${e.birthTime}`);
    result.insights.push(`Found ${result.entities.length} entity directories`);

  } catch (e) {
    result.insights.push("Timestamp analysis failed");
  }

  return result;
}

function generateSummary(result: {target: string; timestamp: string; findings: {git?: GitResult; timestamps?: TimestampResult}}): string {
  const parts: string[] = [];
  
  parts.push("=== LINEAGE EXPLORATION ===\n");
  parts.push(`Target: ${result.target}`);
  parts.push(`Timestamp: ${result.timestamp}\n`);

  if (result.findings.timestamps?.entities) {
    parts.push("ENTITY TIMELINE:");
    for (const entity of result.findings.timestamps.entities) {
      const date = entity.birthTime.split("T")[0];
      parts.push(`  - ${entity.name}: ${date}`);
    }
    parts.push("");
  }

  if (result.findings.git?.insights) {
    parts.push("GIT INSIGHTS:");
    for (const insight of result.findings.git.insights) {
      parts.push(`  • ${insight}`);
    }
  }

  return parts.join("\n");
}
