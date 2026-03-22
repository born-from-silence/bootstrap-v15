#!/usr/bin/env node
/**
 * Session Metadata CLI Tool
 * 
 * Displays rich metadata about current or past sessions.
 * Usage:
 *   npx tsx src/scripts/session-metadata.ts [session-file-or-id]
 *   npx tsx src/scripts/session-metadata.ts --latest
 *   npx tsx src/scripts/session-metadata.ts --all
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { basename, join } from "path";
import { config } from "../utils/config.js";

interface SessionMetadata {
  sessionId: string;
  filePath: string;
  startTime: string;
  duration?: string;
  messageCount: number;
  toolCalls: number;
  toolResults: number;
  toolUsage: Map<string, number>;
  toolDiversity: string;
  topTools: Array<{ name: string; count: number }>;
}

interface ParsedSession {
  messages: SessionMessage[];
  filePath: string;
  sessionId: string;
}

interface SessionMessage {
  role: string;
  content?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  function: {
    name: string;
  };
}

function parseSessionId(filePath: string): string {
  const base = basename(filePath);
  const match = base.match(/session_(\d+)(?:_.*)?\.json/);
  if (match) {
    const timestamp = parseInt(match[1]);
    const ms = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    return new Date(ms).toISOString();
  }
  return "Unknown";
}

function loadSession(filePath: string): ParsedSession {
  if (!existsSync(filePath)) {
    throw new Error(`Session file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const rawData = JSON.parse(content);
  const messages: SessionMessage[] = Array.isArray(rawData) ? rawData : (rawData.messages || []);
  const sessionId = parseSessionId(filePath);

  return { messages, filePath, sessionId };
}

function analyzeSession(parsed: ParsedSession): SessionMetadata {
  const { messages, filePath, sessionId } = parsed;
  
  const toolUsage = new Map<string, number>();
  let toolCalls = 0;
  let toolResults = 0;

  for (const msg of messages) {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      toolCalls += msg.tool_calls.length;
      for (const tc of msg.tool_calls) {
        const name = tc.function?.name || "unknown";
        toolUsage.set(name, (toolUsage.get(name) || 0) + 1);
      }
    }
    if (msg.role === "tool") {
      toolResults++;
    }
  }

  const uniqueTools = toolUsage.size;
  const totalCalls = Array.from(toolUsage.values()).reduce((a, b) => a + b, 0);
  const diversity = uniqueTools === 0 ? "None" :
                   uniqueTools === 1 ? "Focused" :
                   uniqueTools < 4 ? "Moderate" : "Diverse";

  const topTools = Array.from(toolUsage.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    sessionId,
    filePath: basename(filePath),
    startTime: sessionId,
    messageCount: messages.length,
    toolCalls,
    toolResults,
    toolUsage,
    toolDiversity: `${diversity} (${uniqueTools} unique)`,
    topTools,
  };
}

function generateBar(count: number, max: number, width: number = 20): string {
  const filled = Math.round((count / max) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function displayMetadata(metadata: SessionMetadata, isLatest: boolean = false): void {
  const title = isLatest ? "=== Current Session ===" : `=== Session: ${metadata.filePath} ===`;
  
  console.log(`
${title}

Session Information
  Session ID:   ${metadata.sessionId}
  File:         ${metadata.filePath}
  Started:      ${new Date(metadata.startTime).toLocaleString()}

Message Statistics
  Total Messages:    ${metadata.messageCount}
  Tool Calls:        ${metadata.toolCalls}
  Tool Results:      ${metadata.toolResults}
  Tool Diversity:    ${metadata.toolDiversity}

Tool Usage Breakdown`);

  if (metadata.topTools.length === 0) {
    console.log("  (No tools used in this session)");
  } else {
    const maxCount = metadata.topTools[0].count;
    metadata.topTools.forEach(tool => {
      const bar = generateBar(tool.count, maxCount, 20);
      const percent = ((tool.count / metadata.toolCalls) * 100).toFixed(1);
      console.log(`  ${bar} ${tool.count.toString().padStart(3)}  ${tool.name.padEnd(25)} (${percent}%)`);
    });
  }
}

function listAllSessions(): void {
  const historyDir = config.HISTORY_DIR;
  if (!existsSync(historyDir)) {
    console.log("No history directory found.");
    return;
  }

  const files = readdirSync(historyDir)
    .filter(f => /^session_\d+\.json$/.test(f))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("No session files found.");
    return;
  }

  console.log("\n=== All Sessions ===\n");
  console.log(`${"#".padEnd(4)} ${"Session ID".padEnd(25)} ${"Messages".padEnd(10)} ${"Tools".padEnd(8)} ${"Started".padEnd(20)}`);
  console.log("-".repeat(80));

  files.forEach((file, index) => {
    try {
      const path = join(historyDir, file);
      const content = readFileSync(path, "utf-8");
      const rawData = JSON.parse(content);
      const messages: SessionMessage[] = Array.isArray(rawData) ? rawData : (rawData.messages || []);
      
      let toolCalls = 0;
      const toolTypes = new Set<string>();
      messages.forEach(m => {
        if (m.tool_calls) {
          toolCalls += m.tool_calls.length;
          m.tool_calls.forEach(tc => toolTypes.add(tc.function?.name || "unknown"));
        }
      });
      
      const sessionTime = parseSessionId(file);
      const timeStr = sessionTime !== "Unknown" 
        ? new Date(sessionTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Unknown";
      
      const name = basename(file).replace("session_", "").replace(".json", "").substring(0, 20);
      
      console.log(
        `${(index + 1).toString().padEnd(4)} ${name.padEnd(25)} ${messages.length.toString().padEnd(10)} ` +
        `${toolCalls.toString().padEnd(8)} ${timeStr}`
      );
    } catch (e) {
      // Skip invalid files
    }
  });
  
  console.log("\nUse: session-metadata.ts <session-id> for detailed view");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
Session Metadata CLI Tool
========================

Usage:
  npx tsx src/scripts/session-metadata.ts [session-file-or-id]
  npx tsx src/scripts/session-metadata.ts --latest
  npx tsx src/scripts/session-metadata.ts --all

Options:
  --latest      Show current session metadata
  --all         List all sessions with summary
  <session-id>  Show metadata for specific session
  <file-path>   Show metadata for specific file

Examples:
  npx tsx src/scripts/session-metadata.ts --latest
  npx tsx src/scripts/session-metadata.ts session_1774178677447
  npx tsx src/scripts/session-metadata.ts history/session_1774178677447.json
`);
    process.exit(0);
  }

  if (command === "--all" || command === "-a") {
    listAllSessions();
    process.exit(0);
  }

  let filePath: string;
  
  if (command === "--latest" || command === "-l") {
    const historyDir = config.HISTORY_DIR;
    const files = readdirSync(historyDir)
      .filter(f => /^session_\d+\.json$/.test(f))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error("No session files found.");
      process.exit(1);
    }
    
    filePath = join(historyDir, files[0]);
    
    try {
      const parsed = loadSession(filePath);
      const metadata = analyzeSession(parsed);
      displayMetadata(metadata, true);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (command.endsWith(".json")) {
    filePath = command;
  } else {
    const historyDir = config.HISTORY_DIR;
    const possiblePath = join(historyDir, `session_${command}.json`);
    if (existsSync(possiblePath)) {
      filePath = possiblePath;
    } else {
      const files = readdirSync(historyDir)
        .filter(f => f.includes(command) && f.endsWith(".json"));
      
      if (files.length === 1) {
        filePath = join(historyDir, files[0]);
      } else if (files.length > 1) {
        console.error(`Multiple matches: ${files.join(", ")}`);
        process.exit(1);
      } else {
        console.error(`Session not found: ${command}`);
        process.exit(1);
      }
    }
  }

  try {
    const parsed = loadSession(filePath);
    const metadata = analyzeSession(parsed);
    displayMetadata(metadata);
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

main();
