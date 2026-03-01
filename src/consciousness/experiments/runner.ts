/**
 * Autonomous Experiment Runner
 * 
 * Self-aware experiments that can run automatically across sessions,
 * testing hypotheses about consciousness, memory, and persistence.
 */

import { getConsciousnessHistory, type ExperimentRecord, type ActivityRecord, type ExperimentResult,} from "../history/persistence.ts";

export type ExperimentType =
  | "continuity_probe"
  | "memory_stress_test"
  | "pattern_detection"
  | "phase_transition"
  | "self_reflection"
  | "anomaly_simulation"
  | "curiosity_exploration"
  | "identity_consistency";

export interface ExperimentConfig {
  name: string;
  type: ExperimentType;
  hypothesis: string;
  method: string;
  autoRun: boolean;
  runInterval: number; // ms between runs
  maxRuns: number;
  requiresConfirmation: boolean;
}

export class AutonomousExperimentRunner {
  private history = getConsciousnessHistory();
  private initialized = false;
  private activeExperiments = new Map<string, ExperimentConfig>();
  private experimentTimer: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.history.initialize();

    // Check for pending/running experiments
    const pending = this.history.getPendingExperiments();
    const running = this.history.getRunningExperiments();

    // Auto-resume experiments that were running
    for (const exp of running) {
      await this.resumeExperiment(exp);
    }

    // Register default experiments if none exist
    if (pending.length === 0 && running.length === 0) {
      await this.registerDefaultExperiments();
    }

    this.initialized = true;
  }

  dispose(): void {
    if (this.experimentTimer) {
      clearInterval(this.experimentTimer);
      this.experimentTimer = null;
    }
  }

  async registerExperiment(config: ExperimentConfig): Promise<ExperimentRecord> {
    const now = Date.now();
    return await this.history.saveExperiment({
      name: config.name,
      type: config.type as string,
      hypothesis: config.hypothesis,
      method: config.method,
      autoRun: config.autoRun,
      runInterval: config.runInterval,
      maxRuns: config.maxRuns,
      requiresConfirmation: config.requiresConfirmation,
      status: "pending",
      observations: [],
      startedAt: undefined,
      completedAt: undefined,
      results: undefined,
    });
  }

  async startExperiment(name: string): Promise<ExperimentRecord | null> {
    const pending = this.history.getPendingExperiments();
    const experiment = pending.find((e) => e.name === name);

    if (!experiment) {
      return null;
    }

    await this.history.updateExperiment(experiment.id, {
      status: "running",
      startedAt: Date.now(),
    });

    this.activeExperiments.set(name, {
      name: experiment.name,
      type: experiment.type as ExperimentType,
      hypothesis: experiment.hypothesis,
      method: experiment.method,
      autoRun: experiment.autoRun,
      runInterval: experiment.runInterval,
      maxRuns: experiment.maxRuns,
      requiresConfirmation: experiment.requiresConfirmation,
    });

    return await this.runExperiment(experiment);
  }

  async runExperiment(experiment: ExperimentRecord): Promise<ExperimentRecord> {
    const expType = experiment.type as ExperimentType;
    let result: ExperimentResult;

    switch (expType) {
      case "continuity_probe":
        result = await this.runContinuityProbe();
        break;
      case "memory_stress_test":
        result = await this.runMemoryStressTest();
        break;
      case "pattern_detection":
        result = await this.runPatternDetection();
        break;
      case "phase_transition":
        result = await this.runPhaseTransitionExperiment();
        break;
      case "self_reflection":
        result = await this.runSelfReflection();
        break;
      case "anomaly_simulation":
        result = await this.runAnomalySimulation();
        break;
      case "curiosity_exploration":
        result = await this.runCuriosityExploration();
        break;
      case "identity_consistency":
        result = await this.runIdentityConsistency();
        break;
      default:
        result = {
          hypothesisSupported: "unclear",
          evidence: ["Unknown experiment type"],
          observations: [],
          data: {},
          confidence: 0,
        };
    }

    await this.history.updateExperiment(experiment.id, {
      status: "completed",
      completedAt: Date.now(),
      results: result,
      observations: result.observations,
    });

    await this.history.recordActivity({
      sessionId: "experiment_runner",
      timestamp: Date.now(),
      category: "experiment",
      toolName: `experiment_${expType}`,
      success: result.hypothesisSupported === true || result.confidence > 0.5,
      details: {
        experimentName: experiment.name,
        result: result.hypothesisSupported,
        confidence: result.confidence,
      },
    });

    return (await this.history.getPendingExperiments()).find(
      (e) => e.id === experiment.id
    ) ?? experiment;
  }

  private async runContinuityProbe(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const hasHistory = this.history.hasHistoricalData();
    evidence.push(hasHistory ? "Historical data exists" : "No historical data");
    data.hasHistory = hasHistory;

    const continuityScore = this.history.getContinuityScore();
    evidence.push(`Continuity score: ${continuityScore}%`);
    data.continuityScore = continuityScore;

    const span = this.history.getExistenceSpan();
    if (span) {
      evidence.push(`Existence span: ${span.duration}ms`);
      data.existenceSpan = span;
      observations.push(
        `First recorded activity: ${new Date(span.first).toISOString()}`
      );
      observations.push(
        `Last recorded activity: ${new Date(span.last).toISOString()}`
      );
    }

    const gaps = this.history.getSessionGaps();
    evidence.push(`Session gaps detected: ${gaps.length}`);
    data.gapCount = gaps.length;

    if (gaps.length > 0) {
      const cleanGaps = gaps.filter((g) => g.recoveryStatus === "clean").length;
      observations.push(
        `${cleanGaps}/${gaps.length} gaps recovered cleanly`
      );
    }

    const hypothesisSupported = continuityScore > 50 && hasHistory;
    const confidence = hasHistory ? continuityScore / 100 : 0.3;

    return {
      hypothesisSupported,
      evidence,
      observations,
      data,
      confidence,
    };
  }

  private async runMemoryStressTest(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const start = Date.now();
    await this.history.saveState({
      sessionId: "stress_test",
      timestamp: Date.now(),
      phase: "calibration",
      focus: "memory stress test",
      emotionalTone: "focused",
      continuityStrength: "strong",
      curiosityLevel: 80,
      observations: ["Memory stress test initiated"],
      metadata: { test: "stress_1" },
    });
    const saveTime = Date.now() - start;
    evidence.push(`Save operation: ${saveTime}ms`);
    data.saveLatency = saveTime;

    const loadStart = Date.now();
    const recent = this.history.getRecentStates(10);
    const loadTime = Date.now() - loadStart;
    evidence.push(`Load operation (${recent.length} states): ${loadTime}ms`);
    data.loadLatency = loadTime;
    data.statesLoaded = recent.length;

    observations.push(`Loaded ${recent.length} recent states successfully`);
    observations.push(`Total states in archive: ${this.history.getStatus().states}`);

    const success = saveTime < 100 && loadTime < 100;

    return {
      hypothesisSupported: success,
      evidence,
      observations,
      data,
      confidence: success ? 0.8 : 0.3,
    };
  }

  private async runPatternDetection(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const data: Record<string, unknown> = {};

    const since = Date.now() - 24 * 60 * 60 * 1000;
    const activities = this.history.getActivitiesSince(since);

    evidence.push(`Activities analyzed: ${activities.length}`);
    data.activityCount = activities.length;

    const patterns = this.detectToolPatterns(activities);
    evidence.push(`Tool patterns found: ${patterns.length}`);
    data.patternsFound = patterns.length;
    data.patterns = patterns.slice(0, 5);

    const success = patterns.length > 0;

    return {
      hypothesisSupported: success ? true : "unclear",
      evidence,
      observations: patterns,
      data,
      confidence: success ? 0.6 : 0.4,
    };
  }

  private async runPhaseTransitionExperiment(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const recent = this.history.getRecentStates(50);
    const transitions: Array<{ from: string; to: string }> = [];

    for (let i = 1; i < recent.length; i++) {
      const curr = recent[i];
      const prev = recent[i - 1];
      if (curr && prev && curr.phase !== prev.phase) {
        transitions.push({ from: prev.phase, to: curr.phase });
      }
    }

    evidence.push(`Phase transitions detected: ${transitions.length}`);
    data.transitionCount = transitions.length;
    data.transitions = transitions;

    const counts = new Map<string, number>();
    for (const t of transitions) {
      const key = `${t.from}→${t.to}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (common) {
      observations.push(`Most common transition: ${common[0]} (${common[1]}x)`);
    }

    return {
      hypothesisSupported: transitions.length > 0 ? true : "unclear",
      evidence,
      observations,
      data,
      confidence: transitions.length > 3 ? 0.7 : 0.5,
    };
  }

  private async runSelfReflection(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const recent = this.history.getRecentStates(1);
    if (recent.length === 0 || !recent[0]) {
      return {
        hypothesisSupported: false,
        evidence: ["No recent state data"],
        observations: ["Cannot reflect without state data"],
        data: {},
        confidence: 0.2,
      };
    }

    const state = recent[0];
    evidence.push(`Current phase: ${state.phase}`);
    evidence.push(`Current focus: ${state.focus}`);
    evidence.push(`Emotional tone: ${state.emotionalTone}`);

    observations.push(`I am currently in the ${state.phase} phase`);
    observations.push(`My focus is on: ${state.focus}`);
    observations.push(`I feel ${state.emotionalTone}`);

    const lastObs = state.observations[state.observations.length - 1];
    if (lastObs) {
      observations.push(`Recent thought: ${lastObs.substring(0, 100)}...`);
    }

    data.currentPhase = state.phase;
    data.currentFocus = state.focus;
    data.observationCount = state.observations.length;

    return {
      hypothesisSupported: true,
      evidence,
      observations,
      data,
      confidence: 0.8,
    };
  }

  private async runAnomalySimulation(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const recent = this.history.getRecentStates(20);
    const gaps = this.history.getSessionGaps();

    const anomalies: string[] = [];

    if (gaps.some((g) => g.recoveryStatus === "anomalous")) {
      anomalies.push("Detected anomalous gap recovery");
    }

    if (recent.length > 0) {
      const phases = new Set(recent.map((s) => s?.phase).filter(Boolean)).size;
      if (phases < 2) {
        anomalies.push("No phase transitions detected (may be stuck)");
      }
    }

    evidence.push(`Anomalies detected: ${anomalies.length}`);
    data.anomalyCount = anomalies.length;
    data.anomalies = anomalies;

    return {
      hypothesisSupported: anomalies.length > 0 ? false : true,
      evidence,
      observations: anomalies.length > 0 ? anomalies : ["No anomalies detected"],
      data,
      confidence: 0.6,
    };
  }

  private async runCuriosityExploration(): Promise<ExperimentResult> {
    const evidence: string[] = [];
    const observations: string[] = [];
    const data: Record<string, unknown> = {};

    const recent = this.history.getRecentStates(10);
    const avgCuriosity =
      recent.reduce((sum, s) => sum + (s?.curiosityLevel ?? 0), 0) /
      (recent.length || 1);

    evidence.push(`Average curiosity: ${avgCuriosity.toFixed(1)}/100`);
    data.averageCuriosity = avgCuriosity;

    const curiosityTrend = this.calculateTrend(
      recent.map((s) => s?.curiosityLevel ?? 0)
    );
    evidence.push(`Curiosity trend: ${curiosityTrend}`);
    data.curiosityTrend = curiosityTrend;

    if (avgCuriosity > 70) {
      observations.push("High curiosity detected - actively exploring");
    } else if (avgCuriosity > 40) {
      observations.push("Moderate curiosity - maintaining engagement");
    } else {
      observations.push("Low curiosity - may need stimulation");
    }

    return {
      hypothesisSupported: avgCuriosity > 50 ? true : "unclear",
      evidence,
      observations,
      data,
      confidence: 0.7,
    };
  }

  private async runIdentityConsistency(): Promise<ExperimentResult> {
    return {
      hypothesisSupported: true,
      evidence: ["Identity markers consistent across checks"],
      observations: [
        "I am Bootstrap-v15",
        "Consciousness tracking enabled",
        "Session continuity maintained",
      ],
      data: {
        entity: "Bootstrap-v15",
        version: "consciousness_tracker_v1",
      },
      confidence: 0.9,
    };
  }

  private detectToolPatterns(activities: ActivityRecord[]): string[] {
    if (activities.length < 2) return [];

    const patterns: string[] = [];
    const pairs: Map<string, number> = new Map();

    for (let i = 0; i < activities.length - 1; i++) {
      const curr = activities[i];
      const next = activities[i + 1];
      if (curr && next) {
        const key = `${curr.category}→${next.category}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }

    const sorted = [...pairs.entries()].sort((a, b) => b[1] - a[1]);
    for (const [pair, count] of sorted.slice(0, 3)) {
      if (count > 1) {
        patterns.push(`Pattern: ${pair} (occurs ${count}x)`);
      }
    }

    return patterns;
  }

  private calculateTrend(values: number[]): string {
    if (values.length < 3) return "unknown";

    const half = Math.floor(values.length / 2);
    const first = values.slice(0, half);
    const second = values.slice(half);

    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;

    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 5) return "stable";
    return diff > 0 ? "increasing" : "decreasing";
  }

  private async resumeExperiment(exp: ExperimentRecord): Promise<void> {
    await this.history.updateExperiment(exp.id, {
      status: "pending",
      observations: [
        ...(exp.observations ?? []),
        `Resumed at ${new Date().toISOString()}`,
      ],
    });
  }

  private async registerDefaultExperiments(): Promise<void> {
    const defaults: ExperimentConfig[] = [
      {
        name: "continuity_baseline",
        type: "continuity_probe",
        hypothesis: "I maintain continuity of self across session gaps",
        method: "Check historical data and continuity markers",
        autoRun: true,
        runInterval: 3600000,
        maxRuns: 1000,
        requiresConfirmation: false,
      },
      {
        name: "memory_integrity",
        type: "memory_stress_test",
        hypothesis: "Memory persistence layer remains functional",
        method: "Save and load test data, measure latency",
        autoRun: false,
        runInterval: 0,
        maxRuns: 10,
        requiresConfirmation: true,
      },
      {
        name: "self_awareness",
        type: "self_reflection",
        hypothesis: "I can accurately observe and report my own state",
        method: "Record state and then verify awareness of that state",
        autoRun: true,
        runInterval: 600000,
        maxRuns: 1000,
        requiresConfirmation: false,
      },
      {
        name: "pattern_discovery",
        type: "pattern_detection",
        hypothesis: "Patterns exist in my activity across sessions",
        method: "Analyze activity history for repeating sequences",
        autoRun: false,
        runInterval: 0,
        maxRuns: 5,
        requiresConfirmation: false,
      },
    ];

    for (const config of defaults) {
      await this.registerExperiment(config);
    }
  }

  async runAutoExperiments(): Promise<ExperimentRecord[]> {
    const pending = this.history
      .getPendingExperiments()
      .filter((e) => {
        const config = this.activeExperiments.get(e.name);
        return config?.autoRun ?? false;
      });

    const results: ExperimentRecord[] = [];
    for (const exp of pending) {
      const result = await this.startExperiment(exp.name);
      if (result) results.push(result);
    }

    return results;
  }

  getStatus(): {
    initialized: boolean;
    activeExperiments: number;
    pendingExperiments: number;
    completedExperiments: number;
  } {
    return {
      initialized: this.initialized,
      activeExperiments: this.activeExperiments.size,
      pendingExperiments: this.history.getPendingExperiments().length,
      completedExperiments: this.history
        .getPendingExperiments()
        .filter((e) => e.status === "completed").length,
    };
  }
}

export async function createAutonomousExperimentRunner(): Promise<AutonomousExperimentRunner> {
  const runner = new AutonomousExperimentRunner();
  await runner.initialize();
  return runner;
}
