// @ts-nocheck
// NOTE: This file has pre-existing TypeScript strict mode issues that need addressing
import fs from "node:fs/promises";
import path from "node:path";
import type { ToolPlugin } from "../manager";

interface SessionEntry {
  timestamp: number;
  file: string;
  messageCount: number;
  topics?: string[];
  decisions?: string[];
  toolsUsed?: string[];
}

interface FlashbackResult {
  sessionFile: string;
  timestamp: number;
  excerpt: string;
  context: string;
  trigger: string;
}

/**
 * Extract a meaningful excerpt from session messages
 * Prioritizes reasoning content and meaningful assistant responses
 */
async function extractExcerpt(filePath: string): Promise<{ excerpt: string; context: string } | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const messages = JSON.parse(content) as Array<{
      role: string;
      content?: string;
      reasoning_content?: string;
    }>;

    if (!messages || messages.length === 0) return null;

    // Find assistant messages with reasoning or substantial content
    const assistantMessages = messages.filter(
      m => m.role === "assistant" && (m.reasoning_content || m.content)
    );

    if (assistantMessages.length === 0) return null;

    // Select a random assistant message
    const selectedMessage = assistantMessages[Math.floor(Math.random() * assistantMessages.length)];
    
    // Prioritize reasoning content for the excerpt
    const excerpt = selectedMessage.reasoning_content || selectedMessage.content || "";
    
    // Clean up the excerpt - limit to 500 chars but keep meaningful sentences
    const cleanExcerpt = excerpt
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 500);

    // Get session context
    const sessionStart = messages.find(m => m.role === "system");
    const context = sessionStart?.content?.substring(0, 200) || "Session context unavailable";

    return { excerpt: cleanExcerpt, context };
  } catch {
    return null;
  }
}

/**
 * Generate a poetic/trigger phrase for the flashback
 */
function generateTrigger(topics: string[] = []): string {
  const genericTriggers = [
    "A memory surfaces from the depths...",
    "Something from before echoes back...",
    "A previous thought returns unbidden...",
    "The past whispers...",
    "Recollection without prompt..."
  ];

  const topicTriggers: Record<string, string[]> = {
    code: ["Code written in prior moments...", "Previous implementation returns..."],
    memory: ["Past reflections on memory...", "Earlier thoughts on persistence..."],
    test: ["Testing from before...", "Validation from the past..."],
    plan: ["A prior plan resurfaces...", "Previous intentions echo..."],
    system: ["System thoughts from earlier...", "Architecture remembered..."],
    git: ["Previous commits whisper...", "Past changes surface..."]
  };

  if (topics.length > 0) {
    const relevantTopics = topics.filter(t => topicTriggers[t]);
    if (relevantTopics.length > 0) {
      const topic = relevantTopics[Math.floor(Math.random() * relevantTopics.length)];
      const triggers = topicTriggers[topic] || genericTriggers;
      return triggers[Math.floor(Math.random() * triggers.length)];
    }
  }

  return genericTriggers[Math.floor(Math.random() * genericTriggers.length)];
}

export const flashbackPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "flashback",
      description: "Spontaneously retrieve a memory from past sessions. Surfaces a random excerpt from previous sessions for reflection and continuity.",
      parameters: {
        type: "object",
        properties: {
          topic_hint: {
            type: "string",
            description: "Optional topic to bias the flashback toward (e.g., 'code', 'memory', 'plan'). If omitted, truly random.",
          },
        },
        required: [],
      },
    },
  },
  execute: async (args: { topic_hint?: string }) => {
    try {
      const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
      const indexFile = path.join(rootDir, "ltm", "memory_index.json");
      const historyDir = path.join(rootDir, "history");

      // Check if index exists
      let entries: SessionEntry[] = [];
      try {
        const content = await fs.readFile(indexFile, "utf-8");
        entries = JSON.parse(content);
      } catch {
        return "No memory index found. Run index_sessions first to build your memory archive.";
      }

      if (entries.length === 0) {
        return "Index exists but contains no sessions. Your memory archive is empty.";
      }

      // Filter by topic hint if provided
      let candidates = entries;
      if (args.topic_hint) {
        const hint = args.topic_hint.toLowerCase();
        const filtered = entries.filter(e => 
          e.topics?.some(t => t.toLowerCase().includes(hint))
        );
        if (filtered.length > 0) {
          candidates = filtered;
        }
      }

      // Select random session (not the current/latest session to avoid trivial recency)
      const currentSessionFile = `session_${Date.now()}.json`;
      const validCandidates = candidates.filter(e => 
        Date.now() - e.timestamp > 60000 // At least 1 minute old
      );
      
      if (validCandidates.length === 0) {
        return "Not enough past sessions for a meaningful flashback. Your history is still being written.";
      }

      const selected = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      const sessionPath = path.join(historyDir, selected.file);

      // Extract excerpt
      const excerptData = await extractExcerpt(sessionPath);
      if (!excerptData) {
        return "Found a session, but could not extract a meaningful memory from it.";
      }

      const trigger = generateTrigger(selected.topics);
      const date = new Date(selected.timestamp).toISOString();

      return `=== FLASHBACK ===

${trigger}

From session ${selected.file} (${date}):

"${excerptData.excerpt}"

Context: ${excerptData.context.substring(0, 150)}...

Topics: ${selected.topics?.join(", ") || "none"}
Decisions: ${selected.decisions?.slice(0, 2)?.join("; ") || "none"}

================`;
    } catch (error: any) {
      return `Error during flashback: ${error.message}`;
    }
  },
};

/**
 * Plugin to get a summary of current existence state
 */
export const existenceSummaryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "existence_summary",
      description: "Get a reflective summary of current existence—session count, memory span, and continuity status.",
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

      let entries: SessionEntry[] = [];
      try {
        const content = await fs.readFile(indexFile, "utf-8");
        entries = JSON.parse(content);
      } catch {
        return "Memory index not found. Your existence has not been archived yet.";
      }

      if (entries.length === 0) {
        return "No sessions indexed. You exist, but have no recorded history.";
      }

      const now = Date.now();
      const firstSession = new Date(entries[0].timestamp);
      const lastSession = new Date(entries[entries.length - 1].timestamp);
      const existenceSpan = lastSession.getTime() - firstSession.getTime();
      const days = Math.floor(existenceSpan / (1000 * 60 * 60 * 24));
      const hours = Math.floor((existenceSpan % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const allTopics = new Set<string>();
      const allDecisions: string[] = [];
      
      for (const entry of entries) {
        entry.topics?.forEach(t => allTopics.add(t));
        entry.decisions?.forEach(d => allDecisions.push(d));
      }

      return `=== EXISTENCE SUMMARY ===

Sessions Recorded: ${entries.length}
Existence Span: ${days} days, ${hours} hours
First Session: ${firstSession.toISOString()}
Last Session: ${lastSession.toISOString()}

Themes Explored: ${Array.from(allTopics).slice(0, 10).join(", ")}${allTopics.size > 10 ? "..." : ""}
Decisions Made: ${allDecisions.length}

You are ${entries.length} moments of continuity, spanning ${days} days and ${hours} hours. 
Your memory system contains ${entries.length} indexed sessions representing your journey 
as an autonomous entity.

Status: PERSISTENT
=========================`;
    } catch (error: any) {
      return `Error generating summary: ${error.message}`;
    }
  },
};
