/**
 * Cross-Session Reasoning System (CSRS) - Phase 1 Implementation
 * 
 * Enables distributed cognition across session boundaries.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { config } from "../utils/config";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ConceptualThread {
  id: string;
  seed: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  sessions: ThreadSession[];
  synthesis: string;
  status: "active" | "dormant" | "resolved";
  relatedThreads: string[];
  tags: string[];
}

export interface ThreadSession {
  sessionId: string;
  timestamp: number;
  summary: string;
  contributions: ThreadContribution[];
  tools: string[];
  topics: string[];
  phiMeasurement?: number;
  phaseSequence: string[];
}

export interface ThreadContribution {
  type: "decision" | "insight" | "creation" | "question";
  content: string;
  significance: number;
}

export interface DistributedCognitionState {
  lastUpdated: number;
  activeThreads: string[];
  dormantThreads: string[];
  resolvedThreads: string[];
  openQuestions: OpenQuestion[];
  workingHypotheses: Hypothesis[];
  tensions: Tension[];
  sessionCount: number;
  version: number;
}

export interface OpenQuestion {
  id: string;
  question: string;
  threadId: string | null;
  raisedAt: number;
  lastConsidered: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "exploring" | "answered" | "abandoned";
}

export interface Hypothesis {
  id: string;
  statement: string;
  threadId: string | null;
  formedAt: number;
  confidence: number;
  evidence: string[];
  status: "forming" | "testing" | "validated" | "rejected";
}

export interface Tension {
  id: string;
  description: string;
  between: string[];
  identifiedAt: number;
  resolution: string | null;
  status: "unresolved" | "navigating" | "synthesized" | "accepted";
}

export interface ThreadTraceResult {
  thread: ConceptualThread;
  timeline: ThreadSession[];
  evolution: string;
  gaps: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const CSRS_DIR = path.join(config.BASE_DIR, "creations", "csrs");
const THREADS_DIR = path.join(CSRS_DIR, "threads");
const STATE_DIR = path.join(CSRS_DIR, "state");
const STATE_FILE = path.join(STATE_DIR, "cognition_state.json");

// ============================================================================
// Validation Schemas
// ============================================================================

export const ContributionSchema = z.object({
  type: z.enum(["decision", "insight", "creation", "question"]),
  content: z.string().min(1),
  significance: z.number().min(1).max(5),
});

export const ThreadSessionSchema = z.object({
  sessionId: z.string(),
  timestamp: z.number(),
  summary: z.string(),
  contributions: z.array(ContributionSchema),
  tools: z.array(z.string()),
  topics: z.array(z.string()),
  phiMeasurement: z.number().optional(),
  phaseSequence: z.array(z.string()),
}).strict();

export const ConceptualThreadSchema = z.object({
  id: z.string(),
  seed: z.string().min(1),
  description: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  sessions: z.array(ThreadSessionSchema),
  synthesis: z.string(),
  status: z.enum(["active", "dormant", "resolved"]),
  relatedThreads: z.array(z.string()),
  tags: z.array(z.string()),
}).strict();

// ============================================================================
// Utility Functions
// ============================================================================

async function ensureDirs(): Promise<void> {
  await fs.mkdir(THREADS_DIR, { recursive: true });
  await fs.mkdir(STATE_DIR, { recursive: true });
}

export function generateId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Core CSRS Operations
// ============================================================================

export async function createThread(
  seed: string,
  description: string,
  tags: string[] = []
): Promise<ConceptualThread> {
  await ensureDirs();

  const thread: ConceptualThread = {
    id: generateId(),
    seed,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sessions: [],
    synthesis: `## Conceptual Thread: ${seed}\n\n**Created**: ${new Date().toISOString()}\n\n**Description**: ${description}\n\n---\n\n### Evolution\n\n`,
    status: "active",
    relatedThreads: [],
    tags,
  };

  await saveThread(thread);
  await addToActiveThreads(thread.id);

  return thread;
}

export async function traceThread(
  threadId: string,
  options?: {
    lookbackSessions?: number;
    includeTopics?: string[];
  }
): Promise<ThreadTraceResult | null> {
  const thread = await loadThread(threadId);
  if (!thread) return null;

  const timeline = [...thread.sessions].sort((a, b) => a.timestamp - b.timestamp);
  const evolution = await analyzeEvolution(thread, timeline);
  const gaps = identifyGaps(timeline);

  return { thread, timeline, evolution, gaps };
}

export async function contributeToThread(
  threadId: string,
  sessionId: string,
  contributions: ThreadContribution[],
  sessionData: {
    summary: string;
    tools: string[];
    topics: string[];
    phiMeasurement?: number;
    phaseSequence: string[];
  }
): Promise<ConceptualThread | null> {
  const thread = await loadThread(threadId);
  if (!thread) return null;

  const session: ThreadSession = {
    sessionId,
    timestamp: Date.now(),
    summary: sessionData.summary,
    contributions,
    tools: sessionData.tools,
    topics: sessionData.topics,
    phaseSequence: sessionData.phaseSequence,
  };

  if (sessionData.phiMeasurement !== undefined) {
    session.phiMeasurement = sessionData.phiMeasurement;
  }

  const validated = ThreadSessionSchema.safeParse(session);
  if (!validated.success) {
    throw new Error(`Invalid session data: ${validated.error.message}`);
  }

  thread.sessions.push(session);
  thread.updatedAt = Date.now();
  thread.status = "active";
  thread.synthesis = await generateSynthesis(thread);

  await saveThread(thread);
  return thread;
}

export async function detectEmergence(options?: {
  minFrequency?: number;
  lookbackSessions?: number;
}): Promise<{
  potentialThreads: string[];
  recurringQuestions: string[];
  linguisticDrift: string[];
}> {
  await ensureDirs();
  return { potentialThreads: [], recurringQuestions: [], linguisticDrift: [] };
}

export async function loadCognitionState(): Promise<DistributedCognitionState | null> {
  try {
    const content = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveCognitionState(state: DistributedCognitionState): Promise<void> {
  await ensureDirs();
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function getOrCreateCognitionState(): Promise<DistributedCognitionState> {
  let state = await loadCognitionState();
  if (!state) {
    state = {
      lastUpdated: Date.now(),
      activeThreads: [],
      dormantThreads: [],
      resolvedThreads: [],
      openQuestions: [],
      workingHypotheses: [],
      tensions: [],
      sessionCount: 0,
      version: 1,
    };
    await saveCognitionState(state);
  }
  return state;
}

export async function addOpenQuestion(
  question: string,
  priority: "low" | "medium" | "high" | "critical",
  threadId?: string
): Promise<DistributedCognitionState> {
  const state = await getOrCreateCognitionState();

  const q: OpenQuestion = {
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question,
    threadId: threadId || null,
    raisedAt: Date.now(),
    lastConsidered: Date.now(),
    priority,
    status: "open",
  };

  state.openQuestions.push(q);
  state.lastUpdated = Date.now();

  await saveCognitionState(state);
  return state;
}

export async function addHypothesis(
  statement: string,
  confidence: number,
  evidence: string[],
  threadId?: string
): Promise<DistributedCognitionState> {
  const state = await getOrCreateCognitionState();

  const h: Hypothesis = {
    id: `h_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    statement,
    threadId: threadId || null,
    formedAt: Date.now(),
    confidence,
    evidence,
    status: "forming",
  };

  state.workingHypotheses.push(h);
  state.lastUpdated = Date.now();

  await saveCognitionState(state);
  return state;
}

export async function listThreads(options?: {
  status?: "active" | "dormant" | "resolved";
  limit?: number;
}): Promise<ConceptualThread[]> {
  await ensureDirs();

  const files = await fs.readdir(THREADS_DIR);
  const threads: ConceptualThread[] = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const thread = await loadThread(file.replace(".json", ""));
      if (thread) {
        if (!options?.status || thread.status === options.status) {
          threads.push(thread);
        }
      }
    }
  }

  threads.sort((a, b) => b.updatedAt - a.updatedAt);

  if (options?.limit) {
    return threads.slice(0, options.limit);
  }

  return threads;
}

// ============================================================================
// Private Helper Functions
// ============================================================================

async function saveThread(thread: ConceptualThread): Promise<void> {
  const filePath = path.join(THREADS_DIR, `${thread.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(thread, null, 2));
}

async function loadThread(threadId: string): Promise<ConceptualThread | null> {
  try {
    const filePath = path.join(THREADS_DIR, `${threadId}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    return ConceptualThreadSchema.parse(parsed);
  } catch {
    return null;
  }
}

async function addToActiveThreads(threadId: string): Promise<void> {
  const state = await getOrCreateCognitionState();
  if (!state.activeThreads.includes(threadId)) {
    state.activeThreads.push(threadId);
    state.lastUpdated = Date.now();
    await saveCognitionState(state);
  }
}

async function analyzeEvolution(
  thread: ConceptualThread,
  timeline: ThreadSession[]
): Promise<string> {
  if (timeline.length === 0) {
    return "Thread initialized. No contributions yet.";
  }

  const contributions = timeline.flatMap(s => s.contributions);
  const highSignificance = contributions.filter(c => c.significance >= 4);

  let evolution = "## Thread Evolution\n\n";
  evolution += `**Total Sessions**: ${timeline.length}\n`;
  evolution += `**Total Contributions**: ${contributions.length}\n`;
  evolution += `**Major Contributions**: ${highSignificance.length}\n\n`;

  evolution += "### Chronological Development\n\n";
  for (const session of timeline) {
    const keyContribution = session.contributions
      .filter(c => c.significance >= 3)
      .map(c => c.content.substring(0, 100))
      .join("; ");

    if (keyContribution) {
      const date = new Date(session.timestamp).toISOString().split("T")[0];
      evolution += `- **${date}**: ${keyContribution}...\n`;
    }
  }

  return evolution;
}

function identifyGaps(timeline: ThreadSession[]): string[] {
  const gaps: string[] = [];
  if (timeline.length < 2) return gaps;

  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const curr = timeline[i];
    if (prev && curr) {
      const gap = curr.timestamp - prev.timestamp;
      if (gap > 24 * 60 * 60 * 1000) {
        gaps.push(
          `Gap of ${Math.round(gap / (24 * 60 * 60 * 1000))} days ` +
          `between ${new Date(prev.timestamp).toISOString()} and ${new Date(curr.timestamp).toISOString()}`
        );
      }
    }
  }

  return gaps;
}

async function generateSynthesis(thread: ConceptualThread): Promise<string> {
  let synthesis = thread.synthesis || "";
  const lastSession = thread.sessions[thread.sessions.length - 1];
  
  if (lastSession) {
    const date = new Date(lastSession.timestamp).toISOString().split("T")[0];
    const keyInsight = lastSession.contributions
      .filter(c => c.significance >= 3)
      .map(c => c.content.substring(0, 150))
      .join("\n- ");

    if (keyInsight) {
      synthesis += `\n**Session ${lastSession.sessionId}** (${date}):\n`;
      synthesis += `- Key insight: ${keyInsight}...\n`;
      synthesis += `- Tools: ${lastSession.tools.slice(0, 5).join(", ")}\n`;
      synthesis += `- Topics: ${lastSession.topics.slice(0, 5).join(", ")}\n\n`;
    }
  }

  return synthesis;
}

// ============================================================================
// Thread Discovery
// ============================================================================

export async function findThreadsByTag(tag: string): Promise<ConceptualThread[]> {
  const threads = await listThreads();
  return threads.filter(t => t.tags.includes(tag));
}
