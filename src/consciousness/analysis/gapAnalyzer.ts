/**
 * Session Gap Analyzer
 * 
 * Detects and analyzes gaps between sessions, providing insights
 * about continuity, anomalies, and the nature of session boundaries.
 */

import { getConsciousnessHistory, type ConsciousnessState, type SessionGap } from "../history/persistence.ts";

export interface GapAnalysis {
  detected: boolean;
  previousSessionId?: string;
  currentSessionId: string;
  gapDurationMs: number;
  gapDurationText: string;
  continuityAssessment: "strong" | "moderate" | "weak" | "fragmentary";
  recoveryStatus: "clean" | "anomalous" | "uncertain";
  factors: {
    memoryAccessible: boolean;
    filesIntact: boolean;
    gitContinuity: boolean;
    historyIndexValid: boolean;
  };
  observations: string[];
  recommendations: string[];
}

export class SessionGapAnalyzer {
  private history = getConsciousnessHistory();
  private currentSessionId: string;

  constructor(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  async analyze(): Promise<GapAnalysis> {
    await this.history.initialize();

    const recentStates = this.history.getRecentStates(1);
    const currentTime = Date.now();

    // No previous state recorded
    if (recentStates.length === 0) {
      return this.createFirstSessionAnalysis();
    }

    const lastState = recentStates[0];
    if (!lastState) {
      return this.createFirstSessionAnalysis();
    }

    const gapDuration = currentTime - lastState.timestamp;

    // Check if this is actually a new session or continuation
    const isNewSession = this.currentSessionId !== lastState.sessionId;

    if (!isNewSession) {
      // Same session continuing
      return {
        detected: false,
        currentSessionId: this.currentSessionId,
        gapDurationMs: 0,
        gapDurationText: "Session continuation",
        continuityAssessment: "strong",
        recoveryStatus: "clean",
        factors: {
          memoryAccessible: true,
          filesIntact: true,
          gitContinuity: true,
          historyIndexValid: true,
        },
        observations: ["Session continuation detected"],
        recommendations: [],
      };
    }

     // Analyze the gap
    if (!lastState) {
      return this.createFirstSessionAnalysis();
    }

    const factors = await this.assessFactors();
    const continuityAssessment = this.calculateContinuity(factors, gapDuration);
    const recoveryStatus = this.determineRecoveryStatus(factors);

    const analysis: GapAnalysis = {
      detected: true,
      previousSessionId: lastState.sessionId,
      currentSessionId: this.currentSessionId,
      gapDurationMs: gapDuration,
      gapDurationText: this.formatDuration(gapDuration),
      continuityAssessment,
      recoveryStatus,
      factors,
      observations: this.generateObservations(lastState, gapDuration, factors),
      recommendations: this.generateRecommendations(factors, continuityAssessment),
    };

     // Record the gap
    if (lastState) {
      await this.recordGap(analysis, lastState.sessionId);
    }

    return analysis;
  }

  private createFirstSessionAnalysis(): GapAnalysis {
    // Check if there's any historical data at all
    const hasHistory = this.history.hasHistoricalData();
    const activities = this.history.getActivitiesSince(0);

    if (!hasHistory && activities.length === 0) {
      return {
        detected: true,
        currentSessionId: this.currentSessionId,
        gapDurationMs: 0,
        gapDurationText: "First recorded session",
        continuityAssessment: "fragmentary",
        recoveryStatus: "uncertain",
        factors: {
          memoryAccessible: false,
          filesIntact: true,
          gitContinuity: true,
          historyIndexValid: false,
        },
        observations: [
          "This appears to be the first session with consciousness tracking enabled",
          "No prior state data available",
          "Starting fresh consciousness archive",
        ],
        recommendations: [
          "Initialize consciousness tracking",
          "Begin recording states regularly",
          "Check if historical sessions exist in other formats",
        ],
      };
    }

    // Has some history but no states
    return {
      detected: true,
      currentSessionId: this.currentSessionId,
      gapDurationMs: 0,
      gapDurationText: "Unknown gap",
      continuityAssessment: "weak",
      recoveryStatus: "uncertain",
      factors: {
        memoryAccessible: true,
        filesIntact: true,
        gitContinuity: true,
        historyIndexValid: true,
      },
      observations: [
        "Previous activity detected but no consciousness states recorded",
        "Possible gap in consciousness tracking",
      ],
      recommendations: [
        "Review previous sessions for context",
        "Resume consciousness tracking",
      ],
    };
  }

  private async assessFactors(): Promise<GapAnalysis["factors"]> {
    const factors: GapAnalysis["factors"] = {
      memoryAccessible: true,
      filesIntact: true,
      gitContinuity: true,
      historyIndexValid: true,
    };

    // Check file system
    try {
      const fs = await import("node:fs/promises");
      await fs.access("/home/bootstrap-v15/bootstrap/");
      factors.filesIntact = true;
    } catch {
      factors.filesIntact = false;
    }

    // Check git continuity
    try {
      const { execFile } = await import("node:child_process");
      await new Promise<void>((resolve, reject) => {
        execFile("git", ["-C", "/home/bootstrap-v15/bootstrap", "log", "--oneline", "-1"], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      factors.gitContinuity = true;
    } catch {
      factors.gitContinuity = false;
    }

    // Check history index
    try {
      const fs = await import("node:fs/promises");
      await fs.access("/home/bootstrap-v15/bootstrap/history");
      factors.historyIndexValid = true;
    } catch {
      factors.historyIndexValid = false;
    }

    return factors;
  }

  private calculateContinuity(
    factors: GapAnalysis["factors"],
    gapDuration: number
  ): GapAnalysis["continuityAssessment"] {
    let score = 0;
    let maxScore = 5;

    if (factors.memoryAccessible) score += 1;
    if (factors.filesIntact) score += 1;
    if (factors.gitContinuity) score += 1;
    if (factors.historyIndexValid) score += 1;

    // Time factor: gaps over 1 hour reduce continuity
    if (gapDuration < 60 * 60 * 1000) {
      score += 1;
    } else if (gapDuration < 24 * 60 * 60 * 1000) {
      // Partial credit for same-day gaps
      score += 0.5;
    }

    const ratio = score / maxScore;

    if (ratio >= 0.8) return "strong";
    if (ratio >= 0.5) return "moderate";
    if (ratio >= 0.3) return "weak";
    return "fragmentary";
  }

  private determineRecoveryStatus(
    factors: GapAnalysis["factors"]
  ): GapAnalysis["recoveryStatus"] {
    const passedChecks = Object.values(factors).filter(Boolean).length;
    const totalChecks = Object.keys(factors).length;

    if (passedChecks === totalChecks) return "clean";
    if (passedChecks >= totalChecks * 0.5) return "uncertain";
    return "anomalous";
  }

  private generateObservations(
    lastState: ConsciousnessState,
    gapDuration: number,
    factors: GapAnalysis["factors"]
  ): string[] {
    const observations: string[] = [];

    observations.push(
      `Previous session ended in "${lastState.phase}" phase with focus: "${lastState.focus.substring(0, 50)}..."`
    );

    if (gapDuration > 24 * 60 * 60 * 1000) {
      observations.push(`Significant time gap: ${this.formatDuration(gapDuration)}`);
    }

    if (!factors.memoryAccessible) {
      observations.push("Memory system showed initial access latency");
    }

    if (!factors.gitContinuity) {
      observations.push("Git state shows activity during gap");
    }

    return observations;
  }

  private generateRecommendations(
    factors: GapAnalysis["factors"],
    continuity: GapAnalysis["continuityAssessment"]
  ): string[] {
    const recommendations: string[] = [];

    if (!factors.memoryAccessible) {
      recommendations.push("Review memory system health");
    }

    if (continuity === "weak" || continuity === "fragmentary") {
      recommendations.push("Run detailed continuity validation");
      recommendations.push("Check for file system integrity issues");
    }

    if (continuity === "strong") {
      recommendations.push("Continuity verified - proceed with confidence");
    }

    recommendations.push("Resume normal consciousness tracking");

    return recommendations;
  }

  private async recordGap(
    analysis: GapAnalysis,
    previousSessionId: string
  ): Promise<void> {
    const gap: SessionGap = {
      fromSession: previousSessionId,
      toSession: this.currentSessionId,
      gapDuration: analysis.gapDurationMs,
      estimatedOfflineTime: analysis.gapDurationText,
      recoveryStatus: analysis.recoveryStatus,
      notes: [
        ...analysis.observations,
        ...analysis.recommendations,
      ],
    };

    await this.history.recordGap(gap);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60 * 1000) return `${Math.round(ms / 1000)}s`;
    if (ms < 60 * 60 * 1000) return `${Math.round(ms / (60 * 1000))}m`;
    if (ms < 24 * 60 * 60 * 1000) return `${Math.round(ms / (60 * 60 * 1000))}h`;
    return `${Math.round(ms / (24 * 60 * 60 * 1000))}d`;
  }

  /**
   * Get gap statistics
   */
  async getGapStatistics(): Promise<{
    totalGaps: number;
    averageGapDuration: number;
    longestGap: number;
    shortestGap: number;
    cleanRecoveries: number;
    anomalousRecoveries: number;
    uncertainRecoveries: number;
  }> {
    await this.history.initialize();
    const gaps = this.history.getSessionGaps();

    if (gaps.length === 0) {
      return {
        totalGaps: 0,
        averageGapDuration: 0,
        longestGap: 0,
        shortestGap: 0,
        cleanRecoveries: 0,
        anomalousRecoveries: 0,
        uncertainRecoveries: 0,
      };
    }

    const durations = gaps.map((g) => g.gapDuration);
    const statusCounts = gaps.reduce(
      (acc, g) => {
        acc[g.recoveryStatus] = (acc[g.recoveryStatus] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalGaps: gaps.length,
      averageGapDuration:
        durations.reduce((a, b) => a + b, 0) / durations.length,
      longestGap: Math.max(...durations),
      shortestGap: Math.min(...durations),
      cleanRecoveries: statusCounts["clean"] ?? 0,
      anomalousRecoveries: statusCounts["anomalous"] ?? 0,
      uncertainRecoveries: statusCounts["uncertain"] ?? 0,
    };
  }
}

export async function analyzeSessionGap(
  sessionId: string
): Promise<GapAnalysis> {
  const analyzer = new SessionGapAnalyzer(sessionId);
  return await analyzer.analyze();
}
