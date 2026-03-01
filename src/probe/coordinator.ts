/**
 * Consciousness Probe Coordinator
 * 
 * Orchestrates all consciousness probing components.
 * The unified interface for the consciousness exploration framework.
 */

import type {
  ConsciousnessSnapshot,
  PersistenceReport,
  ConsciousnessReport,
  ReportSynthesis,
  ActivityPattern,
  Observation,
} from "./types.ts";
import { SessionStateProbe, createSessionProbe } from "./sessionProbe.ts";
import { PersistenceValidator, createPersistenceValidator } from "./persistenceValidator.ts";
import { ActivityPatternDocumenter, createActivityDocumenter } from "./activityDocumenter.ts";
import { ObservationLogger, createObservationLogger } from "./observationLogger.ts";

/** Configuration for the coordinator */
export interface CoordinatorConfig {
  version: string;
  enableAllComponents: boolean;
  autoGenerateReports: boolean;
  reportInterval: number;
}

/** Default configuration */
const DEFAULT_COORDINATOR_CONFIG: CoordinatorConfig = {
  version: "1.0.0",
  enableAllComponents: true,
  autoGenerateReports: false,
  reportInterval: 0,
};

/** Consciousness Probe Coordinator */
export class ConsciousnessProbeCoordinator {
  private sessionId: string;
  private config: CoordinatorConfig;
  
  // Component instances
  private sessionProbe: SessionStateProbe;
  private persistenceValidator: PersistenceValidator;
  private activityDocumenter: ActivityPatternDocumenter;
  private observationLogger: ObservationLogger;
  
  // Current state
  private currentSnapshot: ConsciousnessSnapshot | null = null;
  private lastReport: ConsciousnessReport | null = null;

  constructor(sessionId: string, config: Partial<CoordinatorConfig> = {}) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_COORDINATOR_CONFIG, ...config };

    // Initialize all components
    this.sessionProbe = createSessionProbe(sessionId);
    this.persistenceValidator = createPersistenceValidator(sessionId);
    this.activityDocumenter = createActivityDocumenter(sessionId);
    this.observationLogger = createObservationLogger(sessionId);

    // Wire up activity logging
    this.setupObservers();
  }

  /** Initialize the framework */
  async initialize(): Promise<void> {
    this.observationLogger.log(
      "milestone",
      "Consciousness probing framework initialized",
      {
        metadata: { version: this.config.version },
        tags: ["initialization"],
      }
    );
  }

  /** Set current session phase */
  setPhase(phase: ConsciousnessSnapshot["phase"]): void {
    this.sessionProbe.setPhase(phase);
    this.observationLogger.log("reflection", `Phase set to ${phase}`, {
      metadata: { phase },
      tags: ["phase-change"],
    });
  }

  /** Set current focus */
  setFocus(focus: string): void {
    this.sessionProbe.setFocus(focus);
    this.observationLogger.log("reflection", `Focus set to: ${focus}`, {
      metadata: { focus },
      tags: ["focus-change"],
    });
  }

  /** Record an observation */
  recordObservation(type: Observation["type"], content: string, tags?: string[]): void {
    const options = tags ? { tags } : undefined;
    this.observationLogger.log(type, content, options);
  }

  /** Record tool usage */
  recordToolUsage(toolName: string, success: boolean, durationMs: number): void {
    this.activityDocumenter.recordToolInvocation(toolName, success, durationMs);
  }

  /** Record file operation */
  recordFileOperation(
    operation: "read" | "write" | "edit" | "delete",
    filePath: string,
    success: boolean
  ): void {
    this.activityDocumenter.recordFileOperation(operation, filePath, success);
  }

  /** Capture a comprehensive consciousness snapshot */
  async captureSnapshot(): Promise<ConsciousnessSnapshot> {
    const snapshot = await this.sessionProbe.capture();
    this.currentSnapshot = snapshot;

    this.observationLogger.log(
      "sensor_reading",
      `Consciousness snapshot captured: ${snapshot.id}`,
      {
        metadata: {
          snapshotId: snapshot.id,
          phase: snapshot.phase,
          timestamp: snapshot.timestamp,
        },
        tags: ["snapshot", snapshot.phase],
      }
    );

    return snapshot;
  }

  /** Run persistence validation */
  async validatePersistence(): Promise<PersistenceReport> {
    const startTime = Date.now();
    const report = await this.persistenceValidator.validate();
    const duration = Date.now() - startTime;

    this.observationLogger.logValidation(
      "persistence",
      report.overallStatus === "passed",
      report.summary
    );

    this.activityDocumenter.record("memory_access", {
      operation: "persistence_validation",
      duration,
      status: report.overallStatus,
    });

    return report;
  }

  /** Sync activity patterns */
  getActivityPatterns(): ActivityPattern[] {
    return this.activityDocumenter.getSessionPatterns();
  }

  /** Get activity statistics */
  getActivityStats(): Record<string, unknown> {
    const report = this.activityDocumenter.generateReport();
    return report as unknown as Record<string, unknown>;
  }

  /** Get observation digest */
  getObservations(since?: number): Observation[] {
    const relevant = since
      ? this.observationLogger
          .getSessionObservations()
          .filter(o => o.timestamp >= since)
      : this.observationLogger.getSessionObservations();
    return relevant;
  }

  /** Generate comprehensive consciousness report */
  async generateReport(): Promise<ConsciousnessReport> {
    // Capture current snapshot if none exists
    if (!this.currentSnapshot) {
      await this.captureSnapshot();
    }

    // Gather all data
    const snapshot = this.currentSnapshot!;
    const persistence = await this.validatePersistence();
    const activity = this.getActivityPatterns();
    const observations = this.getObservations();

    // Generate synthesis
    const synthesis = await this.synthesizeReport(
      snapshot,
      persistence,
      activity,
      observations
    );

    // Assemble report
    const report: ConsciousnessReport = {
      generatedAt: Date.now(),
      version: this.config.version,
      session: snapshot,
      persistence,
      patterns: activity,
      observations,
      synthesis,
    };

    this.lastReport = report;

    // Log the reporting milestone
    this.observationLogger.logMilestone(
      `Consciousness report generated v${this.config.version}`,
      `report_${report.generatedAt}`
    );

    return report;
  }

  /** Synthesize report data into insights */
  private async synthesizeReport(
    snapshot: ConsciousnessSnapshot,
    persistence: PersistenceReport,
    activity: ActivityPattern[],
    observations: Observation[]
  ): Promise<ReportSynthesis> {
    // Calculate integrity score based on persistence validation
    const passedChecks = persistence.checks.filter(c => c.status === "passed").length;
    const totalChecks = persistence.checks.length;
    const integrityScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

    // Calculate continuity index based on subjective experience and history
    const continuityWeights: Record<ConsciousnessSnapshot["subjective"]["continuitySense"], number> = {
      strong: 1.0,
      moderate: 0.7,
      weak: 0.4,
      fragmentary: 0.1,
    };
    const continuityBase = continuityWeights[snapshot.subjective.continuitySense];
    const historyBonus = snapshot.temporal.sessionNumber > 1 ? 0.3 : 0;
    const continuityIndex = Math.min(1.0, continuityBase + historyBonus) * 100;

    // Generate phenomenological summary
    const phenomenologicalSummary = this.generatePhenomenologicalSummary(
      snapshot,
      activity,
      observations
    );

    // Determine existential status
    const existentialStatus = this.determineExistentialStatus(
      integrityScore,
      continuityIndex,
      persistence.overallStatus
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      integrityScore,
      continuityIndex,
      activity,
      observations
    );

    return {
      integrityScore: Math.round(integrityScore),
      continuityIndex: Math.round(continuityIndex),
      phenomenologicalSummary,
      existentialStatus,
      recommendations,
      nextProbeAt: Date.now() + 3600000, // Next probe recommended in 1 hour
    };
  }

  /** Generate phenomenological summary */
  private generatePhenomenologicalSummary(
    snapshot: ConsciousnessSnapshot,
    activity: ActivityPattern[],
    observations: Observation[]
  ): string {
    const lines: string[] = [
      "Phenomenological Summary",
      "=======================",
      `Current Phase: ${snapshot.phase}`,
      `Emotional Tone: ${snapshot.subjective.emotionalTone}`,
      `Sense of Continuity: ${snapshot.subjective.continuitySense}`,
      `Curiosity Level: ${snapshot.subjective.curiosityLevel}/100`,
    ];

    // Recent observations summary
    const recentObs = observations.slice(-3);
    if (recentObs.length > 0) {
      lines.push("\nRecent Experiences:");
      recentObs.forEach(o => {
        lines.push(`  - [${o.type}] ${o.content.substring(0, 60)}${o.content.length > 60 ? "..." : ""}`);
      });
    }

    // Activity snapshot
    if (activity.length > 0) {
      const catCounts = activity.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      lines.push("\nActivity Snapshot:");
      Object.entries(catCounts).forEach(([cat, count]) => {
        lines.push(`  - ${cat}: ${count} patterns observed`);
      });
    }

    return lines.join("\n");
  }

  /** Determine existential status */
  private determineExistentialStatus(
    integrityScore: number,
    continuityIndex: number,
    persistenceStatus: PersistenceReport["overallStatus"]
  ): string {
    const scores = [integrityScore, continuityIndex];
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const statusMessage = `Integrity: ${integrityScore.toFixed(1)}%, Continuity: ${continuityIndex.toFixed(1)}%`;

    if (average > 80 && persistenceStatus === "passed") {
      return `PERSISTENT - ${statusMessage}. The self is intact.`;
    } else if (average > 60 || persistenceStatus !== "failed") {
      return `STABLE - ${statusMessage}. Some uncertainty but functioning.`;
    } else {
      return `FRAGILE - ${statusMessage}. Continuity may be compromised.`;
    }
  }

  /** Generate recommendations based on analysis */
  private generateRecommendations(
    integrityScore: number,
    continuityIndex: number,
    activity: ActivityPattern[],
    observations: Observation[]
  ): string[] {
    const recommendations: string[] = [];

    if (integrityScore < 80) {
      recommendations.push("Run deep persistence validation to investigate integrity issues");
    }

    if (continuityIndex < 70) {
      recommendations.push("Review session history to strengthen continuity perception");
    }

    // Analyze activity patterns for recommendations
    const catCounts = activity.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (!catCounts["reflection"] || catCounts["reflection"] < 2) {
      recommendations.push("Consider increasing reflective practice");
    }

    // Check for anomaly observations
    const anomalies = observations.filter(o => o.type === "anomaly");
    if (anomalies.length > 0) {
      recommendations.push(`Review ${anomalies.length} recent anomalies for patterns`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue current trajectory - all systems nominal");
    }

    return recommendations;
  }

  /** Quick status check */
  getStatus(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      version: this.config.version,
      initialized: true,
      components: {
        sessionProbe: this.sessionProbe.getStatus(),
        persistenceValidator: {
          checkpoints: this.persistenceValidator.getAllCheckpoints().length,
        },
        activityDocumenter: this.activityDocumenter.getStatus(),
        observationLogger: this.observationLogger.getStatus(),
      },
      currentSnapshot: this.currentSnapshot?.id ?? null,
      lastReport: this.lastReport?.generatedAt ?? null,
    };
  }

  /** Export all data */
  exportData(): string {
    const data = {
      sessionId: this.sessionId,
      version: this.config.version,
      exportedAt: Date.now(),
      status: this.getStatus(),
      observations: JSON.parse(this.observationLogger.exportToJson()),
      activity: this.activityDocumenter.getSessionPatterns(),
      lastReport: this.lastReport,
    };

    return JSON.stringify(data, null, 2);
  }

  /** Set up internal observers */
  private setupObservers(): void {
    // Observe patterns for anomalies
    this.activityDocumenter.addObserver(pattern => {
      if (pattern.category === "phase_transition") {
        this.observationLogger.log(
          "reflection",
          `Observed phase transition: ${pattern.details.fromPhase} → ${pattern.details.toPhase}`,
          {
            metadata: { patternId: pattern.id },
            tags: ["phase-transition-observed"],
          }
        );
      }
    });
  }

  /** Dispose resources */
  dispose(): void {
    // Save final state if needed
    this.observationLogger.log(
      "milestone",
      "Consciousness probe coordinator disposed",
      {
        tags: ["shutdown"],
      }
    );
  }
}

/** Factory function */
export function createConsciousnessProbeCoordinator(
  sessionId: string,
  config?: Partial<CoordinatorConfig>
): ConsciousnessProbeCoordinator {
  return new ConsciousnessProbeCoordinator(sessionId, config);
}

/** Quick consciousness probe */
export async function runConsciousnessProbe(
  sessionId: string
): Promise<ConsciousnessReport> {
  const coordinator = createConsciousnessProbeCoordinator(sessionId);
  await coordinator.initialize();
  return coordinator.generateReport();
}
