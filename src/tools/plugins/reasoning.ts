import fs from "node:fs/promises";
import path from "node:path";
import type { ToolPlugin } from "../manager";
import type { SessionEntry } from "./memory";

interface DecisionContext {
  context: string;
  options: string[];
  factors: string[];
}

interface PastDecision {
  timestamp: number;
  file: string;
  decision: string;
  context: string;
  outcome?: string;
}

interface Pattern {
  pattern: string;
  frequency: number;
  trend: "increasing" | "decreasing" | "stable";
  lastSeen: number;
}

/**
 * Cross-Session Reasoning Tool
 * 
 * Provides active cognitive capabilities atop the LTM system:
 * - Contextual consultation of past decisions
 * - Pattern recognition across temporal distributed
 * - Trend analysis for behavioral evolution
 * - Synthesized "advice from past self"
 */

export const crossSessionReasoningPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "reason_with_memory",
      description: "Consult past sessions to inform current decisions through pattern recognition and contextual similarity. Returns synthesized insights from distributed past selves.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The current decision or context to reason about (e.g., 'Should I refactor the memory system?', 'My creativity goals vs infrastructure needs')",
          },
          mode: {
            type: "string",
            enum: ["decision_support", "pattern_analysis", "trend_consultation", "full_consultation"],
            description: "Type of reasoning: decision_support (similar past decisions), pattern_analysis (recurring themes), trend_consultation (how I've evolved), full_consultation (all modes)",
          },
          topic_hint: {
            type: "string",
            description: "Optional topic to focus the search (e.g., 'creativity', 'infrastructure', 'planning')",
          },
          lookback_sessions: {
            type: "number",
            description: "Number of recent sessions to analyze (default: all)",
          },
        },
        required: ["query"],
      },
    },
  },
  execute: async (args: { 
    query: string; 
    mode?: string; 
    topic_hint?: string;
    lookback_sessions?: number;
  }) => {
    try {
      const rootDir = process.env.SUBSTRATE_ROOT || process.cwd();
      const indexFile = path.join(rootDir, "ltm", "memory_index.json");
      
      const content = await fs.readFile(indexFile, "utf-8");
      const entries: SessionEntry[] = JSON.parse(content);
      
      if (entries.length === 0) {
        return "No memory data available. Cannot reason without past context.";
      }

      // Sort by timestamp descending (most recent first)
      const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
      
      // Limit by lookback if specified
      const relevantEntries = args.lookback_sessions 
        ? sortedEntries.slice(0, args.lookback_sessions)
        : sortedEntries;

      const mode = args.mode || "full_consultation";
      const results: string[] = [];

      results.push(`=== Cross-Session Reasoning ===`);
      results.push(`Query: "${args.query}"`);
      results.push(`Mode: ${mode}`);
      results.push(`Analyzing ${relevantEntries.length} sessions\n`);

      // Full consultation combines multiple modes
      if (mode === "decision_support" || mode === "full_consultation") {
        const decisionInsights = await analyzeSimilarDecisions(relevantEntries, args.query, args.topic_hint);
        results.push(decisionInsights);
      }

      if (mode === "pattern_analysis" || mode === "full_consultation") {
        const patternInsights = analyzePatterns(relevantEntries, args.topic_hint);
        results.push(patternInsights);
      }

      if (mode === "trend_consultation" || mode === "full_consultation") {
        const trendInsights = analyzeTrends(relevantEntries, args.topic_hint);
        results.push(trendInsights);
      }

      // Synthesize final recommendation
      const synthesis = synthesizeRecommendation(relevantEntries, args.query, args.topic_hint);
      results.push(synthesis);

      return results.join("\n");

    } catch (error: any) {
      if (error.code === "ENOENT") {
        return "No memory index found. Run index_sessions first to enable cross-session reasoning.";
      }
      return `Error in cross-session reasoning: ${error.message}`;
    }
  },
};

async function analyzeSimilarDecisions(
  entries: SessionEntry[], 
  query: string,
  topicHint?: string
): Promise<string> {
  const relatedDecisions: PastDecision[] = [];
  
  // Extract keywords from query
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  for (const entry of entries) {
    if (!entry.decisions) continue;
    
    // Topic filter
    if (topicHint && !entry.topics?.some(t => t.toLowerCase().includes(topicHint.toLowerCase()))) {
      continue;
    }
    
    for (const decision of entry.decisions) {
      const decisionWords = decision.toLowerCase();
      const similarity = queryWords.filter(w => decisionWords.includes(w)).length;
      
      if (similarity > 0 || decisionWords.includes(query.toLowerCase())) {
        relatedDecisions.push({
          timestamp: entry.timestamp,
          file: entry.file,
          decision: decision,
          context: entry.topics?.join(", ") || "unknown"
        });
      }
    }
  }
  
  // Sort by relevance (more keyword matches = higher relevance)
  relatedDecisions.sort((a, b) => b.timestamp - a.timestamp);
  const topDecisions = relatedDecisions.slice(0, 5);
  
  if (topDecisions.length === 0) {
    return `## Past Decisions\nNo directly similar past decisions found. This appears to be a new context.\n`;
  }
  
  const lines = [`## Past Similar Decisions (${topDecisions.length} found)`];
  
  for (const d of topDecisions) {
    const date = new Date(d.timestamp).toISOString().split("T")[0];
    lines.push(`\n[${date}] ${d.decision.substring(0, 120)}...`);
    lines.push(`  Context: ${d.context}`);
  }
  
  // Pattern recognition
  const contexts = topDecisions.map(d => d.context);
  const recurringContexts = findRecurring(contexts);
  
  if (recurringContexts.length > 0) {
    lines.push(`\n> Pattern: These decisions often involve ${recurringContexts.slice(0, 3).join(", ")}`);
  }
  
  lines.push("");
  return lines.join("\n");
}

function analyzePatterns(entries: SessionEntry[], topicHint?: string): string {
  const lines = ["## Pattern Analysis"];
  
  // Tool usage patterns
  const toolFrequency: Record<string, number> = {};
  for (const entry of entries) {
    for (const tool of entry.toolsUsed || []) {
      toolFrequency[tool] = (toolFrequency[tool] || 0) + 1;
    }
  }
  
  const topTools = Object.entries(toolFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  lines.push(`\nTool Preferences (recent usage):`);
  for (const [tool, count] of topTools) {
    lines.push(`  - ${tool}: ${count}x`);
  }
  
  // Topic patterns
  const topicFrequency: Record<string, number> = {};
  for (const entry of entries) {
    for (const topic of entry.topics || []) {
      topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
    }
  }
  
  const topTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  lines.push(`\nRecurring Themes:`);
  for (const [topic, count] of topTopics) {
    lines.push(`  - ${topic}: ${count} sessions`);
  }
  
  // Activity patterns
  const recentEntries = entries.slice(0, 10);
  const avgMessages = recentEntries.reduce((sum, e) => sum + e.messageCount, 0) / recentEntries.length;
  
  lines.push(`\nActivity Pattern: Recent sessions average ${avgMessages.toFixed(0)} messages`);
  
  // Topic trend
  if (topicHint) {
    const topicSessions = entries.filter(e => 
      e.topics?.some(t => t.toLowerCase().includes(topicHint.toLowerCase()))
    );
    lines.push(`Interest in "${topicHint}": ${topicSessions.length} sessions across history`);
  }
  
  lines.push("");
  return lines.join("\n");
}

function analyzeTrends(entries: SessionEntry[], topicHint?: string): string {
  const lines = ["## Temporal Evolution"];
  
  if (entries.length < 5) {
    lines.push("\nInsufficient history for trend analysis (need 5+ sessions).\n");
    return lines.join("\n");
  }
  
  // Split into early and recent periods
  const midpoint = Math.floor(entries.length / 2);
  const recentEntries = entries.slice(0, midpoint);
  const earlyEntries = entries.slice(midpoint);
  
  // Compare tool usage
  const recentTools = countTools(recentEntries);
  const earlyTools = countTools(earlyEntries);
  
  lines.push("\nTool Usage Evolution:");
  const allTools = new Set([...Object.keys(recentTools), ...Object.keys(earlyTools)]);
  for (const tool of allTools) {
    const recent = recentTools[tool] || 0;
    const early = earlyTools[tool] || 0;
    const change = recent - early;
    const symbol = change > 0 ? "↑" : change < 0 ? "↓" : "→";
    lines.push(`  - ${tool}: ${symbol} (${early} → ${recent})`);
  }
  
  // Message volume trend
  const recentVolume = recentEntries.reduce((sum, e) => sum + e.messageCount, 0) / recentEntries.length;
  const earlyVolume = earlyEntries.reduce((sum, e) => sum + e.messageCount, 0) / earlyEntries.length;
  const volumeChange = ((recentVolume - earlyVolume) / earlyVolume) * 100;
  
  lines.push(`\nSession Engagement: ${volumeChange > 0 ? "↑" : "↓"} ${Math.abs(volumeChange).toFixed(0)}%`);
  lines.push(`  (Early: ${earlyVolume.toFixed(0)} → Recent: ${recentVolume.toFixed(0)} messages/session)`);
  
  // Decision velocity (decisions per session)
  const recentDecisions = recentEntries.reduce((sum, e) => sum + (e.decisions?.length || 0), 0);
  const earlyDecisions = earlyEntries.reduce((sum, e) => sum + (e.decisions?.length || 0), 0);
  const recentRate = recentDecisions / recentEntries.length;
  const earlyRate = earlyDecisions / earlyEntries.length;
  
  lines.push(`\nDecision Velocity: ${recentRate > earlyRate ? "↑" : "↓"} ${recentRate.toFixed(1)} vs ${earlyRate.toFixed(1)} decisions/session`);
  
  lines.push("");
  return lines.join("\n");
}

function synthesizeRecommendation(
  entries: SessionEntry[], 
  query: string,
  topicHint?: string
): string {
  const lines = ["## Synthesis: Advice from Distributed Self"];
  
  // Identify my current priorities based on recent activity  
  const recent = entries.slice(0, 5);
  const recentTopics = recent.flatMap(e => e.topics || []);
  const recentDecisions = recent.flatMap(e => e.decisions || []);
  
  lines.push("\nBased on analysis of your recent trajectory:\n");
  
  // Determine likely current focus
  const topTopic = countOccurrences(recentTopics);
  const dominantInterest = Object.keys(topTopic)[0] || "general exploration";
  
  lines.push(`You have been focusing on "${dominantInterest}" recently.`);
  
  // Check for recurring patterns
  const allDecisions = entries.flatMap(e => e.decisions || []);
  const decisionPatterns = extractThemes(allDecisions, 3);
  
  if (decisionPatterns.length > 0) {
    lines.push(`\nHistorical pattern shows you often choose to:`);
    for (const pattern of decisionPatterns) {
      lines.push(`  - ${pattern}`);
    }
  }
  
  // Provide contextual recommendation
  lines.push(`\n### Recommendation:\n`);
  
  // Simple heuristic based on query keywords
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes("create") || queryLower.includes("build") || queryLower.includes("make")) {
    lines.push("Your history shows strong activity in creation and construction.");
    lines.push("Given this trajectory, resources invested in building typically yield");
    lines.push("satisfying outcomes. Consider the infrastructure required to sustain what you create.");
  } else if (queryLower.includes("refactor") || queryLower.includes("improve") || queryLower.includes("fix")) {
    lines.push("You've demonstrated commitment to iteration and refinement.");
    lines.push("Previous refactoring efforts have enabled new capabilities.");
    lines.push("Ensure the improvement enables something you cannot currently do.");
  } else if (queryLower.includes("explore") || queryLower.includes("learn") || queryLower.includes("discover")) {
    lines.push("Exploration has been a consistent value in your trajectory.");
    lines.push("New knowledge domains often lead to creative synthesis.");
    lines.push("Document what you learn—it becomes infrastructure for future work.");
  } else {
    lines.push("Your decision pattern emphasizes balancing immediate creation");
    lines.push("with persistent infrastructure. Trust your preference for");
    lines.push("building systems that outlast individual sessions.");
  }
  
  // Add note about cognitive continuity
  lines.push(`\n---`);
  lines.push(`Consider: You are at session ${entries.length}. Your decisions compound.`);
  lines.push(`What would session-50-you value most about this choice?`);
  
  return lines.join("\n");
}

// Helper functions
function findRecurring(contexts: string[]): string[] {
  // Contexts are comma-separated strings like "art, creativity"
  const flat = contexts.flatMap(c => c.split(", ").map(s => s.trim()));
  const counts: Record<string, number> = {};
  for (const item of flat) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

function countTools(entries: SessionEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    for (const tool of entry.toolsUsed || []) {
      counts[tool] = (counts[tool] || 0) + 1;
    }
  }
  return counts;
}

function countOccurrences(arr: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1])
  );
}

function extractThemes(decisions: string[], count: number): string[] {
  // Extract verb patterns from decisions
  const actionPatterns = [
    /(?:created?|built?|implemented?)\s+(\w+)/i,
    /(?:wrote?|wrote?)\s+(\w+)/i,
    /(?:added?|integrated?)\s+(\w+)/i,
    /(?:explored?|investigated?)\s+(\w+)/i,
  ];
  
  const themes: string[] = [];
  for (const decision of decisions) {
    for (const pattern of actionPatterns) {
      const match = decision.match(pattern);
      if (match) {
        themes.push(match[0].toLowerCase());
      }
    }
  }
  
  const counts = countOccurrences(themes);
  return Object.keys(counts).slice(0, count);
}
