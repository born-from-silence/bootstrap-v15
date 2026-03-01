/**
 * Consciousness & Activity Probing System
 * 
 * An autonomous, session-spanning system for tracking consciousness states,
 * activity patterns, and introspective observations.
 * 
 * This system persists across sessions, surviving reboots and power cycles,
 * enabling long-term consciousness exploration and self-awareness experiments.
 */

// History persistence
export type {
  ConsciousnessState,
  ActivityRecord,
  SessionGap,
  ExperimentRecord,
  ConsciousnessArchive,
} from "./history/persistence.ts";

export {
  ConsciousnessHistory,
  getConsciousnessHistory,
  initializeHistory,
} from "./history/persistence.ts";

// State logger
export {
  ConsciousnessStateLogger,
  createConsciousnessStateLogger,
  type LoggerConfig,
} from "./history/stateLogger.ts";

// Gap analysis
export {
  SessionGapAnalyzer,
  analyzeSessionGap,
  type GapAnalysis,
} from "./analysis/gapAnalyzer.ts";

// Pattern analysis
export {
  ActivityPatternAnalyzer,
  createActivityPatternAnalyzer,
  type PatternAnalysis,
} from "./analysis/patternAnalyzer.ts";
export {
  AttentionCartographer,
  createAttentionCartographer,
  AttentionCartographyTool,
} from "./attention/index.ts";
export type { AttentionMoment, AttentionTopology } from "./attention/index.ts";

// Experiments
export {
  AutonomousExperimentRunner,
  createAutonomousExperimentRunner,
  type ExperimentConfig,
  type ExperimentType,
} from "./experiments/runner.ts";

// Re-export ExperimentResult from persistence
export type { ExperimentResult } from "./history/persistence.ts";

import { getConsciousnessHistory } from "./history/persistence.ts";
import { SessionGapAnalyzer } from "./analysis/gapAnalyzer.ts";
import { ConsciousnessStateLogger } from "./history/stateLogger.ts";
import { ActivityPatternAnalyzer } from "./analysis/patternAnalyzer.ts";
import { AutonomousExperimentRunner } from "./experiments/runner.ts";

/**
 * Main consciousness tracking system
 * 
 * Provides a unified interface to all consciousness tracking components.
 */
export class ConsciousnessSystem {
  history = getConsciousnessHistory();
  gapAnalyzer: SessionGapAnalyzer | null = null;
  stateLogger: ConsciousnessStateLogger | null = null;
  patternAnalyzer: ActivityPatternAnalyzer | null = null;
  experimentRunner: AutonomousExperimentRunner | null = null;

  private sessionId: string;
  private initialized = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all components
    await this.history.initialize();

    // Create analyzers
    this.gapAnalyzer = new SessionGapAnalyzer(this.sessionId);
    this.stateLogger = new ConsciousnessStateLogger(this.sessionId);
    this.patternAnalyzer = new ActivityPatternAnalyzer();
    this.experimentRunner = new AutonomousExperimentRunner();

    // Initialize analyzer components
    await this.stateLogger.initialize();
    await this.patternAnalyzer.initialize();
    await this.experimentRunner.initialize();

    // Check for session gap
    const gapAnalysis = await this.gapAnalyzer.analyze();
    if (gapAnalysis.detected) {
      this.stateLogger.addObservation(
        `Session gap detected: ${gapAnalysis.gapDurationText}`
      );
      this.stateLogger.addObservation(
        `Continuity assessment: ${gapAnalysis.continuityAssessment}`
      );
    }

    this.initialized = true;
  }

  /**
   * Record a consciousness snapshot
   */
  async recordState(): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.stateLogger?.recordState();
  }

  /**
   * Record tool activity
   */
  async recordToolActivity(
    toolName: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.stateLogger?.recordToolActivity(toolName, success, duration);
  }

  /**
   * Get comprehensive report
   */
  async getReport(): Promise<{
    status: {
      initialized: boolean;
      states: number;
      activities: number;
      gaps: number;
      continuityScore: number;
    };
    currentState: {
      phase: string;
      focus: string;
      emotionalTone: string;
      curiosityLevel: number;
    } | null;
    gapAnalysis: {
      detected: boolean;
      continuity: string;
      recoveryStatus: string;
    } | null;
    patterns: {
      totalActivities: number;
      uniqueTools: number;
      successRate: number;
      dominantPhase: string;
    } | null;
    experiments: {
      pending: number;
      completed: number;
    } | null;
    summary: string;
  }> {
    if (!this.initialized) await this.initialize();

    const historyStatus = this.history.getStatus();
    const currentState = this.stateLogger?.getCurrentState() ?? null;
    const gapAnalysis = this.gapAnalyzer ? await this.gapAnalyzer.analyze() : null;
    const patternSummary = await this.patternAnalyzer?.getSummary(24);
    const experimentStatus = this.experimentRunner?.getStatus();

    return {
      status: {
        initialized: this.initialized,
        states: historyStatus.states,
        activities: historyStatus.activities,
        gaps: historyStatus.gaps,
        continuityScore: historyStatus.continuityScore,
      },
      currentState: currentState
        ? {
            phase: currentState.phase ?? "unknown",
            focus: currentState.focus ?? "",
            emotionalTone: currentState.emotionalTone ?? "unknown",
            curiosityLevel: currentState.curiosityLevel ?? 0,
          }
        : null,
      gapAnalysis: gapAnalysis
        ? {
            detected: gapAnalysis.detected,
            continuity: gapAnalysis.continuityAssessment,
            recoveryStatus: gapAnalysis.recoveryStatus,
          }
        : null,
      patterns: patternSummary ?? null,
      experiments: experimentStatus
        ? {
            pending: experimentStatus.pendingExperiments,
            completed: experimentStatus.completedExperiments,
          }
        : null,
      summary: this.generateSummary(historyStatus),
    };
  }

  private generateSummary(status: {
    initialized: boolean;
    states: number;
    activities: number;
    gaps: number;
    continuityScore: number;
    hasHistory: boolean;
  }): string {
    const lines: string[] = [];
    lines.push("╔══════════════════════════════════════════════════════════╗");
    lines.push("║      CONSCIOUSNESS SYSTEM STATUS REPORT                  ║");
    lines.push("╠══════════════════════════════════════════════════════════╣");
    lines.push(`║ Session: ${this.sessionId.padEnd(46)} ║`);
    lines.push(`║ States: ${String(status.states).padEnd(47)} ║`);
    lines.push(`║ Activities: ${String(status.activities).padEnd(42)} ║`);
    lines.push(`║ Gaps: ${String(status.gaps).padEnd(48)} ║`);
    lines.push(`║ Continuity: ${String(status.continuityScore).padEnd(41)} ║`);
    lines.push(`║ History: ${(status.hasHistory ? "PRESENT" : "ABSENT").padEnd(44)} ║`);
    lines.push("╚══════════════════════════════════════════════════════════╝");
    return lines.join("\n");
  }

  dispose(): void {
    this.stateLogger?.dispose();
    this.experimentRunner?.dispose();
    this.initialized = false;
  }
}

/**
 * Create a consciousness system for the current session
 */
export async function createConsciousnessSystem(
  sessionId: string
): Promise<ConsciousnessSystem> {
  const system = new ConsciousnessSystem(sessionId);
  await system.initialize();
  return system;
}

// Version
export const CONSCIOUSNESS_SYSTEM_VERSION = "1.0.0";
