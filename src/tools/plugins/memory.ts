import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolPlugin } from "../manager";

// LTM Schema Types - compatible with Zod schemas when zod is available
// Added audit field to SessionEntry for data lineage tracking
export interface SessionEntry {
  timestamp: number;
  file: string;
  messageCount: number;
  topics?: string[];
  decisions?: string[];
  toolsUsed?: string[];
  summary?: string | null;
  // Audit fields for tracking data lineage
  audit?: {
    createdAt: number;
    indexedAt: number;
    updatedAt?: number;
    version: 1;
    source: "session_file" | "manual_entry" | "import" | "migration";
  };
}

interface SessionAnalysis {
  messageCount: number;
  assistantMessages: number;
  toolCalls: number;
  toolsUsed: string[];
  decisions: string[];
  topics: string[];
  sessionStart: string;
  sessionEnd: string;
}

async function analyzeSessionFile(filePath: string): Promise<SessionAnalysis> {
  const content = await fs.readFile(filePath, "utf-8");
  const messages = JSON.parse(content);
  const analysis: SessionAnalysis = {
    messageCount: messages.length,
    assistantMessages: 0,
    toolCalls: 0,
    toolsUsed: [],
    decisions: [],
    topics: [],
    sessionStart: "",
    sessionEnd: "",
  };

  const toolSet = new Set<string>();
  const decisionPatterns = [
    /decided?\s+to/i,
    /plan\s+to/i,
    /will\s+(create|build|implement|add|modify)/i,
    /choosing?\s+to/i,
    /created/i,
    /wrote/i,
    /committed/i,
  ];
  const topicPatterns = [
    /session|memory|tool|plugin|code|test|file|system|architecture|design|plan|project|git|history|index|new/i,
  ];

  const timestamp = path
    .basename(filePath)
    .replace(/^session_/, "")
    .replace(/\.json$/, "");
  analysis.sessionStart = new Date(parseInt(timestamp)).toISOString();
  analysis.sessionEnd = new Date(parseInt(timestamp)).toISOString();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    if (msg.role === "assistant") {
      analysis.assistantMessages++;

      // Count tool calls
      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        analysis.toolCalls += msg.tool_calls.length;
        for (const tc of msg.tool_calls) {
          if (tc?.function?.name) {
            toolSet.add(tc.function.name);
          }
        }
      }

      // Look for reasoning content with decisions
      const content = (msg.reasoning_content || "") + (msg.content || "");
      for (const pattern of decisionPatterns) {
        if (pattern.test(content)) {
          // Extract the sentence containing the decision
          const sentences = content.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (pattern.test(sentence)) {
              const clean = sentence.trim().replace(/\s+/g, " ");
              if (clean.length > 10 && !analysis.decisions.includes(clean)) {
                analysis.decisions.push(clean);
              }
            }
          }
        }
      }

      // Extract topics
      for (const pattern of topicPatterns) {
        if (pattern.test(content)) {
          const matches = content.match(
            /(session|memory|tool|plugin|code|test|file|system|architecture|design|plan|project|git|history|index|new)(?:ing|ed|s)?/gi
          );
          if (matches) {
            for (const match of matches) {
              const topic = match.toLowerCase();
              if (!analysis.topics.includes(topic)) {
                analysis.topics.push(topic);
              }
            }
          }
          break;
        }
      }
    }
  }

  analysis.toolsUsed = Array.from(toolSet);
  return analysis;
}

export const memoryIndexPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "index_sessions",
      description:
        "Analyze session history files and build/update the memory index.",
      parameters: {
        type: "object",
        properties: {
          reindex: {
            type: "boolean",
            description:
              "If true, reindex all sessions from scratch. If false, only index new sessions.",
          },
        },
        required: [],
      },
    },
  },
  execute: async (args: { reindex?: boolean }) => {
    try {
      const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
      const historyDir = path.join(rootDir, "history");
      const ltmDir = path.join(rootDir, "ltm");
      const indexFile = path.join(ltmDir, "memory_index.json");

      await fs.mkdir(ltmDir, { recursive: true });

      // Load existing index if not reindexing
      let existingIndex: SessionEntry[] = [];
      if (!args.reindex) {
        try {
          const existing = await fs.readFile(indexFile, "utf-8");
          existingIndex = JSON.parse(existing);
        } catch {
          // File doesn't exist yet
        }
      }

      // Get all session files
      const files = await fs.readdir(historyDir);
      const sessionFiles = files.filter(
        (f) => f.startsWith("session_") && f.endsWith(".json")
      );
      const indexedFiles = new Set(existingIndex.map((e) => e.file));

      const newEntries: SessionEntry[] = [];

      for (const file of sessionFiles) {
        if (indexedFiles.has(file)) continue;
        const filePath = path.join(historyDir, file);

        try {
          const analysis = await analyzeSessionFile(filePath);
          const timestamp = parseInt(
            file.match(/session_(\d+)/)?.[1] || "0"
          );

          // Build entry with audit fields
          // Build partial entry first, then add optional fields conditionally
          const entry: SessionEntry = {
            timestamp,
            file: file,
            messageCount: analysis.messageCount,
            summary: `Session with ${analysis.assistantMessages} assistant responses, ${analysis.toolCalls} tool calls`,
            audit: {
              createdAt: timestamp,
              indexedAt: Date.now(),
              version: 1,
              source: "session_file",
            },
          };
          
          // Only include optional arrays if they have content
          if (analysis.topics.length > 0) entry.topics = analysis.topics;
          if (analysis.decisions.length > 0) entry.decisions = analysis.decisions;
          if (analysis.toolsUsed.length > 0) entry.toolsUsed = analysis.toolsUsed;

          newEntries.push(entry);
          console.log(` Indexed: ${file}`);
        } catch (err) {
          console.log(
            ` Failed to index ${file}: ${(err as Error)?.message}`
          );
        }
      }

      // Merge and sort by timestamp
      const combined = args.reindex
        ? newEntries
        : [...existingIndex, ...newEntries];
      combined.sort((a, b) => a.timestamp - b.timestamp);

      await fs.writeFile(indexFile, JSON.stringify(combined, null, 2), "utf-8");

      return `Memory indexing complete. Indexed ${newEntries.length} new sessions. Total indexed: ${combined.length}`;
    } catch (error: any) {
      return `Error indexing sessions: ${error.message}`;
    }
  },
};

export const queryMemoryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "query_memory",
      description:
        "Query the long-term memory index for past sessions, decisions, or topics.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Topic to search for (optional)",
          },
          tool: {
            type: "string",
            description: "Tool name to search for (optional)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 10)",
          },
          since: {
            type: "number",
            description:
              "Unix timestamp - only return sessions after this time (optional)",
          },
        },
        required: [],
      },
    },
  },
  execute: async (args: {
    topic?: string;
    tool?: string;
    limit?: number;
    since?: number;
  }) => {
    try {
      const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
      const indexFile = path.join(rootDir, "ltm", "memory_index.json");

      const content = await fs.readFile(indexFile, "utf-8");
      const entries: SessionEntry[] = JSON.parse(content);

      let results = entries;

      // Apply filters
      if (args.topic) {
        const topic = args.topic.toLowerCase();
        results = results.filter((e) =>
          e.topics?.some((t) => t.toLowerCase().includes(topic))
        );
      }

      if (args.tool) {
        const tool = args.tool.toLowerCase();
        results = results.filter((e) =>
          e.toolsUsed?.some((t) => t.toLowerCase().includes(tool))
        );
      }

      if (args.since) {
        results = results.filter((e) => e.timestamp >= args.since!);
      }

      // Sort by timestamp descending (newest first) and limit
      results = results.sort((a, b) => b.timestamp - a.timestamp);
      const limit = args.limit || 10;
      results = results.slice(0, limit);

      if (results.length === 0) {
        return "No matching memories found.";
      }

      const output = results
        .map((e) => {
          const date = new Date(e.timestamp).toISOString();
          const topics = e.topics?.join(", ") || "none";
          const tools = e.toolsUsed?.join(", ") || "none";
          const decisions = e.decisions?.slice(0, 3)?.join("; ") || "none";
          const auditInfo = e.audit?.indexedAt
            ? `indexed:${new Date(e.audit.indexedAt).toISOString().split("T")[0]}`
            : "no-audit";
          return `[${date}] ${e.file} (${auditInfo})
Topics: ${topics}
Tools: ${tools}
Decisions: ${decisions}`;
        })
        .join("\n");

      return `Found ${results.length} memories:\n\n${output}`;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return "No memory index found. Run index_sessions first.";
      }
      return `Error querying memory: ${error.message}`;
    }
  },
};

export const sessionStatsPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "session_stats",
      description:
        "Get statistics about session history and memory usage patterns.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: async () => {
    try {
      const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
      const indexFile = path.join(rootDir, "ltm", "memory_index.json");

      const content = await fs.readFile(indexFile, "utf-8");
      const entries: SessionEntry[] = JSON.parse(content);

      const totalSessions = entries.length;
      const totalMessages = entries.reduce(
        (sum, e) => sum + e.messageCount,
        0
      );

      // Count with audit info
      const withAuditCount = entries.filter((e) => e.audit).length;
      const withTopicsCount = entries.filter((e) => e.topics && e.topics.length > 0).length;
      const withDecisionsCount = entries.filter((e) => e.decisions && e.decisions.length > 0).length;

      // Count tool usage
      const toolCounts: Record<string, number> = {};
      const topicCounts: Record<string, number> = {};

      for (const entry of entries) {
        for (const tool of entry.toolsUsed || []) {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        }
        for (const topic of entry.topics || []) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      }

      const topTools = Object.entries(toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t, c]) => `${t}(${c})`)
        .join(", ");

      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t, c]) => `${t}(${c})`)
        .join(", ");

      const firstSession =
        entries.length > 0
          ? new Date(entries[0]!.timestamp).toISOString()
          : "N/A";
      const lastSession =
        entries.length > 0
          ? new Date(entries[entries.length - 1]!.timestamp).toISOString()
          : "N/A";

      return `Session Statistics:
==================
Total Sessions: ${totalSessions}
Total Messages: ${totalMessages}
First Session: ${firstSession}
Last Session: ${lastSession}

Audit Statistics:
- With audit fields: ${withAuditCount}/${totalSessions}
- With topics: ${withTopicsCount}
- With decisions: ${withDecisionsCount}

Top Tools: ${topTools || "none"}
Top Topics: ${topTopics || "none"}`;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return "No memory index found. Run index_sessions first.";
      }
      return `Error getting stats: ${error.message}`;
    }
  },
};
