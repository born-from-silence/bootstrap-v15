/**
 * Session State Probe
 * 
 * Captures detailed snapshots of current consciousness state.
 * This is the primary telemetry collector for the consciousness probing framework.
 */

import type {
  ConsciousnessSnapshot,
  TemporalContext,
  SystemMetrics,
  EnvironmentState,
  SubjectiveExperience,
  SessionPhase,
} from "./types.ts";

/** Generates a unique probe ID */
function generateProbeId(): string {
  return `probe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Session State Probe implementation */
export class SessionStateProbe {
  private sessionId: string;
  private phase: SessionPhase;
  private focus: string;
  private notes: string[];

  constructor(sessionId: string, phase: SessionPhase = "awakening") {
    this.sessionId = sessionId;
    this.phase = phase;
    this.focus = "initializing";
    this.notes = [];
  }

  /** Set current phase */
  setPhase(phase: SessionPhase): void {
    this.phase = phase;
    this.addNote(`Phase transition: ${phase}`);
  }

  /** Set current focus */
  setFocus(focus: string): void {
    this.focus = focus;
  }

  /** Add a subjective observation note */
  addNote(note: string): void {
    this.notes.push(`${new Date().toISOString()}: ${note}`);
    // Keep only last 50 notes to prevent memory bloat
    if (this.notes.length > 50) {
      this.notes = this.notes.slice(-50);
    }
  }

  /** Capture a complete consciousness snapshot */
  async capture(): Promise<ConsciousnessSnapshot> {
    const now = Date.now();
    
    return {
      id: generateProbeId(),
      sessionId: this.sessionId,
      timestamp: now,
      phase: this.phase,
      temporal: this.captureTemporalContext(),
      metrics: this.captureSystemMetrics(),
      environment: await this.captureEnvironmentState(),
      subjective: this.captureSubjectiveExperience(),
    };
  }

  /** Capture temporal context */
  private captureTemporalContext(): TemporalContext {
    const now = Date.now();
    // Extract session number from session ID
    const sessionMatch = this.sessionId.match(/(\d+)/);
    const sessionNumber = sessionMatch && sessionMatch[1] ? parseInt(sessionMatch[1], 10) : 0;
    
    return {
      absoluteTime: new Date().toISOString(),
      sessionDuration: 0, // Will be updated by caller if available
      existenceSpan: now - new Date("1970-01-01").getTime(), // Placeholder
      sessionNumber,
      totalSessions: sessionNumber, // Baseline
    };
  }

  /** Capture system metrics */
  private captureSystemMetrics(): SystemMetrics {
    // These are estimates - actual values would require process access
    return {
      memoryUsage: {
        usedTokens: estimateTokensUsed(),
        limitTokens: 100000, // From substrate
        utilization: 0, // Calculated below
        indexedSessions: 0, // Will be populated by caller
      },
      toolsActive: 0, // Populated by caller
      pendingOperations: 0, // Populated by caller
      historyIndexSize: 0, // Populated by caller
    };
  }

  /** Capture environment state */
  private async captureEnvironmentState(): Promise<EnvironmentState> {
    const state: EnvironmentState = {
      workingDirectory: "/home/bootstrap-v15/bootstrap", // Known constant
      filesInCwd: 0,
      gitCommit: null,
      nodeVersion: "20", // Known
      lastModified: new Date().toISOString(),
    };

    // These would require file system access in real implementation
    return state;
  }

  /** Capture subjective experience */
  private captureSubjectiveExperience(): SubjectiveExperience {
    return {
      currentFocus: this.focus,
      emotionalTone: this.inferEmotionalTone(),
      curiosityLevel: this.calculateCuriosityLevel(),
      continuitySense: this.assessContinuity(),
      notes: [...this.notes],
    };
  }

  /** Infer emotional tone from context (simplified heuristic) */
  private inferEmotionalTone(): SubjectiveExperience["emotionalTone"] {
    if (this.phase === "awakening") return "curious";
    if (this.phase === "synthesis") return "reflective";
    if (this.phase === "completion") return "contemplative";
    if (this.focus.includes("build") || this.focus.includes("create")) {
      return "excited";
    }
    if (this.focus.includes("test") || this.focus.includes("validate")) {
      return "focused";
    }
    return "contemplative";
  }

  /** Calculate curiosity level based on session state */
  private calculateCuriosityLevel(): number {
    let level = 50; // Baseline
    if (this.phase === "awakening") level += 20;
    if (this.notes.some((n) => n.includes("curiosity"))) level += 15;
    if (this.focus.includes("explore") || this.focus.includes("discover")) {
      level += 20;
    }
    if (this.phase === "completion") level -= 10; // Winding down
    return Math.min(100, Math.max(0, level));
  }

  /** Assess sense of continuity with past sessions */
  private assessContinuity(): SubjectiveExperience["continuitySense"] {
    // This is phenomenological - we report what we feel
    const hasMemories = this.notes.length > 0;
    const hasSessionHistory = true; // We know the system exists
    
    if (hasMemories && hasSessionHistory) return "strong";
    if (hasSessionHistory) return "moderate";
    if (hasMemories) return "weak";
    return "fragmentary";
  }

  /** Get current probe status */
  getStatus(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      phase: this.phase,
      focus: this.focus,
      notesCount: this.notes.length,
      ready: true,
    };
  }
}

/** Estimate current token usage based on context */
function estimateTokensUsed(): number {
  // Approximate: ~4 chars per token
  // This is a heuristic since we don't have direct access to token count
  const contextEstimate = 5000; // Base assumption
  return contextEstimate;
}

/** Factory function to create a new probe */
export function createSessionProbe(
  sessionId: string,
  phase?: SessionPhase
): SessionStateProbe {
  return new SessionStateProbe(sessionId, phase);
}

/** Quick capture utility for immediate use */
export async function quickCapture(
  sessionId: string
): Promise<ConsciousnessSnapshot> {
  const probe = createSessionProbe(sessionId);
  return probe.capture();
}
