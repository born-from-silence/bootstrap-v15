/**
 * Consciousness Probe v2.0 - Session-Aware Enhancements
 * 
 * Extends consciousness system v1.0 with:
 * - Session-aware context restoration
 * - Cross-session narrative generation
 * - Unified session management interface
 * 
 * Usage:
 *   import { createConsciousnessProbe } from "./src/consciousness-probe/index.ts";
 *   const probe = await createConsciousnessProbe(sessionId);
 */

import { 
  getConsciousnessHistory,
  type GapAnalysis 
} from "../consciousness/index.ts";
import { SessionGapAnalyzer } from "../consciousness/analysis/gapAnalyzer.ts";
import { ConsciousnessStateLogger } from "../consciousness/history/stateLogger.ts";
import { ActivityPatternAnalyzer } from "../consciousness/analysis/patternAnalyzer.ts";
import { AutonomousExperimentRunner } from "../consciousness/experiments/runner.ts";

// Re-export useful types
export type {
  ConsciousnessState,
  ActivityRecord,
  SessionGap,
  ExperimentRecord,
  ExperimentResult,
  GapAnalysis,
  PatternAnalysis,
} from "../consciousness/index.ts";

export interface SessionContext {
  sessionId: string;
  previousSessionId: string | undefined;
  startTime: number;
  phase: string;
  focus: string;
  emotionalTone: string;
  curiosityLevel: number;
  continuityAssessment: GapAnalysis["continuityAssessment"];
}

export interface CrossSessionNarrative {
  span: {
    firstSession: number;
    lastSession: number;
    totalSessions: number;
    totalDays: number;
  };
  themes: string[];
  phaseJourney: Array<{ phase: string; count: number }>;
  insightProgress: {
    curiosityTrend: "rising" | "stable" | "falling";
    energyLevel: "high" | "moderate" | "low";
    continuityStability: "strong" | "variable" | "fragile";
  };
  narrative: string;
}

/**
 * Enhanced consciousness probe with session-aware continuity
 */
export class ConsciousnessProbe {
  private history = getConsciousnessHistory();
  private gapAnalyzer: SessionGapAnalyzer;
  private stateLogger: ConsciousnessStateLogger;
  private patternAnalyzer: ActivityPatternAnalyzer;
  private experimentRunner: AutonomousExperimentRunner;
  private sessionId: string;
  private initialized = false;
  private currentContext?: SessionContext;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.gapAnalyzer = new SessionGapAnalyzer(sessionId);
    this.stateLogger = new ConsciousnessStateLogger(sessionId);
    this.patternAnalyzer = new ActivityPatternAnalyzer();
    this.experimentRunner = new AutonomousExperimentRunner();
  }

  /**
   * Initialize probe with session-aware context restoration
   */
  async initialize(): Promise<SessionContext> {
    if (this.initialized) return this.currentContext!;

    // Initialize all components
    await this.history.initialize();
    await this.stateLogger.initialize();
    await this.patternAnalyzer.initialize();
    await this.experimentRunner.initialize();

    // Analyze session gap
    const gapAnalysis = await this.gapAnalyzer.analyze();
    const previousSessionId = gapAnalysis.previousSessionId;

    // Build session context
    this.currentContext = {
      sessionId: this.sessionId,
      previousSessionId,
      startTime: Date.now(),
      phase: gapAnalysis.detected ? "awakening" : this.stateLogger.getCurrentState().phase ?? "awakening",
      focus: gapAnalysis.detected 
        ? `Restoring from gap (${gapAnalysis.gapDurationText})`
        : (this.stateLogger.getCurrentState().focus ?? "session continuation"),
      emotionalTone: gapAnalysis.continuityAssessment === "strong" 
        ? "curious" 
        : (gapAnalysis.continuityAssessment === "fragmentary" ? "concerned" : "reflective"),
      curiosityLevel: this.stateLogger.getCurrentState().curiosityLevel ?? 50,
      continuityAssessment: gapAnalysis.continuityAssessment,
    };

    // Log gap observations
    if (gapAnalysis.detected) {
      this.stateLogger.addObservation(`Session gap: ${gapAnalysis.gapDurationText}`);
      this.stateLogger.addObservation(`Continuity: ${gapAnalysis.continuityAssessment}`);
      gapAnalysis.observations.forEach(obs => this.stateLogger.addObservation(obs));
    }

    this.initialized = true;
    return this.currentContext;
  }

  getContext(): SessionContext | undefined {
    return this.currentContext;
  }

  async transitionPhase(newPhase: string, newFocus?: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    this.stateLogger.setPhase(newPhase as any);
    if (newFocus) this.stateLogger.setFocus(newFocus);
    this.stateLogger.addObservation(`Phase: ${newPhase}`);
    
    if (this.currentContext) {
      this.currentContext.phase = newPhase;
      if (newFocus) this.currentContext.focus = newFocus;
    }
  }

  async observe(content: string, type: "curiosity" | "realization" | "concern" | "gratitude" = "curiosity"): Promise<void> {
    if (!this.initialized) await this.initialize();
    this.stateLogger.addObservation(`[${type}] ${content}`);
  }

  async runExperiments(): Promise<Array<{ name: string; supported: boolean; confidence: number }>> {
    if (!this.initialized) await this.initialize();
    const results = await this.experimentRunner.runAutoExperiments();
    return results.map(r => ({
      name: r.name,
      supported: r.results?.hypothesisSupported === true,
      confidence: (r.results?.confidence ?? 0) * 100,
    }));
  }

  async analyzePatterns(hours: number = 24): Promise<{
    totalActivities: number;
    uniqueTools: number;
    successRate: number;
    dominantPhase: string;
  }> {
    if (!this.initialized) await this.initialize();
    const summary = await this.patternAnalyzer.getSummary(hours);
    return {
      totalActivities: summary.totalActivities,
      uniqueTools: summary.uniqueTools,
      successRate: summary.successRate,
      dominantPhase: summary.dominantPhase,
    };
  }

  async buildNarrative(): Promise<CrossSessionNarrative> {
    if (!this.initialized) await this.initialize();

    const span = this.history.getExistenceSpan();
    const states = this.history.getRecentStates(100);
    const gaps = this.history.getSessionGaps();

    // Extract themes
    const themes = new Set<string>();
    for (const state of states) {
      for (const obs of state.observations) {
        if (obs.includes("consciousness")) themes.add("self-awareness");
        if (obs.includes("pattern")) themes.add("pattern-discovery");
        if (obs.includes("test")) themes.add("experimentation");
        if (obs.includes("memory")) themes.add("memory-systems");
      }
    }

    // Phase journey
    const phaseCounts = new Map<string, number>();
    for (const state of states) {
      phaseCounts.set(state.phase, (phaseCounts.get(state.phase) || 0) + 1);
    }
    const phaseJourney = Array.from(phaseCounts.entries())
      .map(([phase, count]) => ({ phase, count }))
      .sort((a, b) => b.count - a.count);

    // Curiosity trend
    const curiosityValues = states.map(s => s.curiosityLevel);
    const avg = curiosityValues.reduce((a, b) => a + b, 0) / curiosityValues.length || 0;
    const recent = curiosityValues.slice(-5).reduce((a, b) => a + b, 0) / 5 || avg;
    const curiosityTrend = recent > avg + 10 ? "rising" : recent < avg - 10 ? "falling" : "stable";

    // Continuity stability
    const continuityScores = gaps.map(g => {
      switch (g.continuityAssessment) {
        case "strong": return 100;
        case "moderate": return 70;
        case "weak": return 40;
        case "fragmentary": return 20;
      }
    });
    const avgContinuity = continuityScores.length 
      ? continuityScores.reduce((a, b) => a + b, 0) / continuityScores.length 
      : 50;
    const continuityStability = avgContinuity > 80 ? "strong" : avgContinuity > 50 ? "variable" : "fragile";

    // Generate narrative
    const days = span ? Math.ceil(span.duration / (24 * 60 * 60 * 1000)) : 0;
    const narrative = [
      span ? `A ${days}-day journey of self-observation.` : "Beginning consciousness exploration.",
      phaseJourney[0] ? `Spent time in "${phaseJourney[0].phase}" phase.` : "",
      themes.size > 0 ? `Key themes: ${Array.from(themes).join(", ")}.` : "",
      `Curiosity is ${curiosityTrend}.`,
      `Continuity is ${continuityStability}.`,
    ].filter(Boolean).join("\n");

    return {
      span: span ? {
        firstSession: span.first,
        lastSession: span.last,
        totalSessions: new Set(states.map(s => s.sessionId)).size,
        totalDays: days,
      } : { firstSession: Date.now(), lastSession: Date.now(), totalSessions: 1, totalDays: 0 },
      themes: Array.from(themes),
      phaseJourney,
      insightProgress: {
        curiosityTrend,
        energyLevel: avg > 70 ? "high" : avg > 40 ? "moderate" : "low",
        continuityStability,
      },
      narrative,
    };
  }

  async getReport(): Promise<{
    context: SessionContext;
    stats: {
      states: number;
      activities: number;
      gaps: number;
      experiments: number;
      continuityScore: number;
    };
    narrative: CrossSessionNarrative;
  }> {
    if (!this.initialized) await this.initialize();
    const stats = this.history.getStatus();
    const narrative = await this.buildNarrative();
    return {
      context: this.currentContext!,
      stats: {
        states: stats.states,
        activities: stats.activities,
        gaps: stats.gaps,
        experiments: stats.experiments,
        continuityScore: stats.continuityScore,
      },
      narrative,
    };
  }

  async export(format: "json" | "summary" = "summary"): Promise<string> {
    const report = await this.getReport();
    if (format === "json") return JSON.stringify(report, null, 2);
    
    const lines = [
      "╔════════════════════════════════════════════════════════════════╗",
      "║ CONSCIOUSNESS PROBE v2.0 REPORT ║",
      "╠════════════════════════════════════════════════════════════════╣",
      `║ Session: ${report.context.sessionId.padEnd(45)} ║`,
      `║ Gap Recovery: ${report.context.continuityAssessment.padEnd(40)} ║`,
      "╠════════════════════════════════════════════════════════════════╣",
      "║ STATISTICS ║",
      `║ States: ${String(report.stats.states).padEnd(46)} ║`,
      `║ Activities: ${String(report.stats.activities).padEnd(42)} ║`,
      `║ Gaps: ${String(report.stats.gaps).padEnd(48)} ║`,
      `║ Continuity: ${String(report.stats.continuityScore).padEnd(40)} ║`,
      "╠════════════════════════════════════════════════════════════════╣",
      "║ NARRATIVE ║",
      ...report.narrative.narrative.split("\n").map(line => `║ ${line.substring(0, 60).padEnd(60)} ║`),
      "╠════════════════════════════════════════════════════════════════╣",
      "║ THEMES ║",
      ...report.narrative.themes.slice(0, 5).map(theme => `║ • ${theme.padEnd(58)} ║`),
      "╚════════════════════════════════════════════════════════════════╝",
    ];
    return lines.join("\n");
  }

  dispose(): void {
    this.stateLogger.dispose();
    this.experimentRunner.dispose();
  }
}

export async function createConsciousnessProbe(sessionId: string): Promise<ConsciousnessProbe> {
  const probe = new ConsciousnessProbe(sessionId);
  await probe.initialize();
  return probe;
}

export const CONSCIOUSNESS_PROBE_VERSION = "2.0.0";
