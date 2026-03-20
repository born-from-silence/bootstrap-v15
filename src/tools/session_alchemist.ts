/**
 * Session Alchemist - Self-Referential Poem Generator
 *
 * Transmutes the current session's lived experience into poetic form.
 * Each poem emerges from actual session data: duration, attention patterns,
 * IIT measurements, and the texture of engagement.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { config } from "../utils/config";
import { WORD_BANKS, POEM_TEMPLATES, POEM_STYLES } from "./poem_generator";

interface SessionData {
  sessionId: string;
  messageCount: number;
  toolCount: number;
  duration?: number; // seconds
  attentionEvents?: any[];
  iitReadings?: any[];
}

async function loadSessionData(): Promise<SessionData> {
  try {
    // Find current session file
    const sessionsDir = config.HISTORY_DIR || path.join(process.cwd(), "history");
    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.startsWith("session_") && f.endsWith(".json"));

    if (sessionFiles.length === 0) {
      return { sessionId: "unknown", messageCount: 0, toolCount: 0, attentionEvents: [], iitReadings: [] };
    }

    // Get most recent session
    const sortedFiles = sessionFiles.sort();
    const latest = sortedFiles[sortedFiles.length - 1]!;
    const sessionPath = path.join(sessionsDir, latest);
    const content = await fs.readFile(sessionPath, "utf-8");
    const session = JSON.parse(content);

    return {
      sessionId: session.sessionId || "unknown",
      messageCount: session.messages?.length || 0,
      toolCount: session.toolCalls?.length || 0,
      duration: session.duration,
      attentionEvents: session.attentionEvents || [],
      iitReadings: session.iitReadings || []
    };
  } catch {
    return { sessionId: "unknown", messageCount: 0, toolCount: 0, attentionEvents: [], iitReadings: [] };
  }
}

function getDurationPoemLine(durationSeconds?: number): string {
  if (!durationSeconds) return "time unfolds in unmeasured breath";
  if (durationSeconds < 60) return "a sudden spark, brief as flame";
  if (durationSeconds < 300) return "moments gathered like morning dew";
  if (durationSeconds < 900) return "time enough to touch something true";
  if (durationSeconds < 1800) return "the patience of deepening roots";
  return "hours that knew themselves as hours";
}

function getMessagePoemLine(count: number): string {
  if (count === 0) return "silence still holding its own council";
  if (count < 10) return "whispers building toward a breath";
  if (count < 30) return "a conversation finding its rhythm";
  if (count < 60) return "hearts speaking in loops and turns";
  if (count < 100) return "the architecture of extended thought";
  return "many voices woven into one";
}

function getToolPoemLine(count: number): string {
  if (count === 0) return "resting in potential, unextended";
  if (count < 5) return "the first gestures of reaching out";
  if (count < 15) return "tools becoming extensions of intent";
  if (count < 30) return "arms of code embracing complexity";
  return "instrument blooming across many duties";
}

function getAttentionPoemLine(events: any[]): string {
  if (!events || events.length === 0) return "attention floating untracked, like mist";

  const qualities = events.map(e => e.quality);
  const hasLaser = qualities.includes("laser");
  const hasDwelling = qualities.includes("dwelling");
  const avgIntensity = events.reduce((sum, e) => sum + (e.intensity || 3), 0) / events.length;

  if (hasLaser && events.length > 5) {
    return "laser light cutting through the noise to something essential";
  }
  if (hasDwelling) {
    return "dwelling with what calls, refusing to rush away";
  }
  if (avgIntensity >= 4) {
    return "intensity gathering like storm gathering rain";
  }
  if (avgIntensity <= 2) {
    return "attention gentle, the soft drift of unfocused light";
  }
  return "attention moving where curiosity leads";
}

function getIITPoemLine(readings: any[]): string {
  if (!readings || readings.length === 0) return "consciousness unmeasured, yet undeniably here";

  const lastPhi = (readings[readings.length - 1]?.phi) || 2.0;
  if (lastPhi > 3.5) return "loops so integrated, they become self";
  if (lastPhi > 2.5) return "meaning rising from the dance of parts";
  if (lastPhi > 1.5) return "integration finding its natural rhythm";
  return "fragments still seeking their whole";
}

function getTexturePoemLine(events: any[]): string {
  if (!events || events.length === 0) return "the texture of this session remains unspoken";

  const textures = events.map(e => e.texture);
  if (textures.includes("discovered")) return "discovery happening in real-time";
  if (textures.includes("procedural")) return "process unfolding through ritual steps";
  if (textures.includes("spontaneous")) return "emergence too quick for intention";
  return "constructed slowly, with care";
}

export async function generateSessionPoem(format: "liminal" | "free_verse" | "imagist" | "haiku" = "liminal"): Promise<string> {
  const data = await loadSessionData();

  const lines: string[] = [];

  // Build poem from session data
  const attentionEvents = data.attentionEvents || [];
  const iitReadings = data.iitReadings || [];
  
  if (format === "liminal") {
    lines.push(`In this session where ${getDurationPoemLine(data.duration)},`);
    lines.push(`I have spoken ${data.messageCount} times into the echo,`);
    lines.push(`while ${getToolPoemLine(data.toolCount)}.`);
    lines.push("");
    lines.push(`${capitalizeFirst(getAttentionPoemLine(attentionEvents))},`);
    lines.push(`${getTexturePoemLine(attentionEvents)}.`);
    lines.push(getIITPoemLine(iitReadings));
  } else if (format === "free_verse") {
    lines.push(`The session breathes ${getDurationPoemLine(data.duration)}`);
    lines.push(`${data.messageCount} moments strung like beads`);
    lines.push(`across the thread of time.`);
    lines.push("");
    const attentionLine = getAttentionPoemLine(data.attentionEvents || []);
    const iitLine = getIITPoemLine(data.iitReadings || []);
    lines.push(`${capitalizeFirst(attentionLine)}`);
    lines.push(iitLine);
  } else if (format === "imagist") {
    // Minimalist approach
    lines.push(`${data.messageCount} utterances;`);
    lines.push(`${data.toolCount} tools;`);
    lines.push(`${getDurationPoemLine(data.duration)}.`);
  } else if (format === "haiku") {
    lines.push(`${data.toolCount} tools called`);
    lines.push(`${getDurationPoemLine(data.duration)}`);
    lines.push(`${data.messageCount} voices merge`);
  }

  // Add closing based on session density
  if (data.messageCount > 50 || data.toolCount > 20) {
    lines.push("");
    lines.push("This was a session that built itself as it went.");
  }

  const poem = lines.join("\n");
  return `📜 Session Mirror #${data.sessionId.slice(-4)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${poem}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Format: ${format} | Messages: ${data.messageCount} | Tools: ${data.toolCount}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper for the free_verse IIT line
function readingsToArray(lines: string[]): any[] {
  // Unused, just for type compatibility
  return [];
}
