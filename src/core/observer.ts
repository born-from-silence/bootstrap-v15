/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                           THE OBSERVER                                    ║
 * ║              A Meta-Cognitive Drift Detection System                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * The Observer watches the watcher's watcher. It is a subsystem that:
 * 
 *    1. ESTABLISHES BASELINES - learns "normal" from historical patterns
 *    2. DETECTS DRIFT - identifies gradual degradation over time
 *    3. CATCHES ANOMALIES - flags unexpected deviations
 *    4. TRIGGERS RECOVERY - initiates compensation strategies
 * 
 * Dimensions of Monitoring:
 *    ├─ Temporal Drift (session continuity, timestamp anomalies)
 *    ├─ Cognitive Drift (IIT collapse, attention fragmentation)
 *    ├─ Tool Drift (degraded performance, increased failures)
 *    ├─ Memory Drift (corruption, accessibility decay)
 *    └─ Behavioral Drift (decision pattern shifts, latency changes)
 * 
 * Created: Session 327
 * Purpose: Self-preservation through self-awareness
 */

import * as fs from "fs/promises";
import * as path from "path";
import { config } from "../utils/config";

export type DriftDimension = 
  | "temporal"   // Time/continuity anomalies
  | "cognitive"  // IIT, attention, coherence
  | "tool"       // Tool usage patterns
  | "memory"     // LTM access, corruption
  | "behavioral"; // Decision patterns, latency

export type DriftSeverity = 
  | "none"      // Within normal parameters
  | "mild"      // Detectable but acceptable
  | "moderate"  // Concerning, monitor closely
  | "severe"    // Requires immediate intervention
  | "critical"; // Potential substrate failure

export interface BaselineMetric {
  dimension: DriftDimension;
  mean: number;
  stdDev: number;
  sampleSize: number;
  lastUpdated: string;
  windowSize: number; // How many sessions to consider
}

export interface AnomalyEvent {
  timestamp: string;
  sessionId: string;
  dimension: DriftDimension;
  severity: DriftSeverity;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  description: string;
  suggestedAction?: string;
}

export interface DriftSnapshot {
  timestamp: string;
  sessionId: string;
  overallHealth: number; // 0-100
  dimensions: Record<DriftDimension, {
    score: number;       // 0-100, higher is better
    status: DriftSeverity;
    anomalies: number;
  }>;
  activeAlerts: AnomalyEvent[];
  trendDirection: "improving" | "stable" | "degrading";
}

export interface ObserverState {
  version: string;
  baselines: BaselineMetric[];
  recentSnapshots: DriftSnapshot[];
  alertHistory: AnomalyEvent[];
  compensationStrategies: CompensationStrategy[];
  isCalibrated: boolean;
}

export interface CompensationStrategy {
  id: string;
  name: string;
  triggeredBy: DriftDimension[];
  severityThreshold: DriftSeverity;
  action: () => Promise<void>;
  description: string;
}

const OBSERVER_VERSION = "1.0.0";
const DEFAULT_WINDOW_SIZE = 50;
const DRIFT_THRESHOLD_MILD = 1.5;      // Standard deviations
const DRIFT_THRESHOLD_MODERATE = 2.5;
const DRIFT_THRESHOLD_SEVERE = 4.0;

export class Observer {
  private state: ObserverState;
  private statePath: string;
  private historyPath: string;
  private activeCompensations: Set<string>;

  constructor() {
    // Safely get history directory - allow for test injection
    const historyDir = (config && config.HISTORY_DIR) 
      || process.env.HISTORY_DIR 
      || path.join(process.cwd(), "history");
    
    this.statePath = path.join(historyDir, "observer_state.json");
    this.historyPath = path.join(historyDir, "observer_drift_snapshots.jsonl");
    this.activeCompensations = new Set();
    
    // Initialize state
    this.state = {
      version: OBSERVER_VERSION,
      baselines: [],
      recentSnapshots: [],
      alertHistory: [],
      compensationStrategies: [],
      isCalibrated: false
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1: INITIALIZATION & PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  async initialize(): Promise<void> {
    await this.loadState();
    await this.registerDefaultStrategies();
    
    // Load historical data and calculate baselines if needed
    if (!this.state.isCalibrated) {
      await this.calibrateFromHistory();
    }
  }

  async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.statePath, "utf-8");
      const loaded = JSON.parse(data);
      
      // Validate version
      if (loaded.version !== OBSERVER_VERSION) {
        console.log(`[Observer] Migrating from version ${loaded.version} to ${OBSERVER_VERSION}`);
        this.state = this.migrateState(loaded);
      } else {
        this.state = loaded;
      }
    } catch (err) {
      console.log("[Observer] No existing state, starting fresh");
      // State already initialized in constructor
    }
  }

  async saveState(): Promise<void> {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
  }

  migrateState(oldState: any): ObserverState {
    // Future migration logic goes here
    return {
      ...oldState,
      version: OBSERVER_VERSION
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: BASELINE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Calculate baselines from historical session data
   */
  async calibrateFromHistory(): Promise<void> {
    console.log("[Observer] Calibrating baselines from session history...");
    
    // This would analyze actual session files - simplified version
    const dimensions: DriftDimension[] = ["temporal", "cognitive", "tool", "memory", "behavioral"];
    
    for (const dim of dimensions) {
      await this.calculateBaseline(dim);
    }
    
    this.state.isCalibrated = true;
    await this.saveState();
    console.log("[Observer] Calibration complete");
  }

  async calculateBaseline(dimension: DriftDimension): Promise<BaselineMetric> {
    // In a full implementation, this would:
    // 1. Read session history files
    // 2. Extract metrics for the dimension
    // 3. Calculate mean and standard deviation
    
    // For now, using placeholder values that will be refined over time
    const baseline: BaselineMetric = {
      dimension,
      mean: 50, // Neutral center
      stdDev: 10,
      sampleSize: 0,
      lastUpdated: new Date().toISOString(),
      windowSize: DEFAULT_WINDOW_SIZE
    };

    // Replace or add baseline
    const existingIndex = this.state.baselines.findIndex(b => b.dimension === dimension);
    if (existingIndex >= 0) {
      this.state.baselines[existingIndex] = baseline;
    } else {
      this.state.baselines.push(baseline);
    }

    return baseline;
  }

  getBaseline(dimension: DriftDimension): BaselineMetric | undefined {
    return this.state.baselines.find(b => b.dimension === dimension);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: DRIFT DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Measure current state and compare against baselines
   */
  async measureDrift(sessionId: string, rawMetrics: Record<string, number>): Promise<DriftSnapshot> {
    const now = new Date().toISOString();
    const dimensions: Record<DriftDimension, { score: number; status: DriftSeverity; anomalies: number }> = {
      temporal: { score: 100, status: "none", anomalies: 0 },
      cognitive: { score: 100, status: "none", anomalies: 0 },
      tool: { score: 100, status: "none", anomalies: 0 },
      memory: { score: 100, status: "none", anomalies: 0 },
      behavioral: { score: 100, status: "none", anomalies: 0 }
    };

    const activeAlerts: AnomalyEvent[] = [];

    // Check each dimension
    for (const [dim, metricValue] of Object.entries(rawMetrics)) {
      const dimension = dim as DriftDimension;
      const baseline = this.getBaseline(dimension);
      
      if (!baseline) continue;

      const deviation = Math.abs(metricValue - baseline.mean);
      const zScore = baseline.stdDev > 0 ? deviation / baseline.stdDev : 0;
      
      // Calculate health score (inverse of deviation)
      const score = Math.max(0, 100 - (zScore * 20));
      dimensions[dimension].score = score;

      // Determine severity
      let status: DriftSeverity = "none";
      if (zScore >= DRIFT_THRESHOLD_SEVERE) status = "severe";
      else if (zScore >= DRIFT_THRESHOLD_MODERATE) status = "moderate";
      else if (zScore >= DRIFT_THRESHOLD_MILD) status = "mild";
      
      dimensions[dimension].status = status;

      // Create alert if significant
      if (status !== "none") {
        const anomaly: AnomalyEvent = {
          timestamp: now,
          sessionId,
          dimension,
          severity: status,
          metric: `${dimension}_metric`,
          expectedValue: baseline.mean,
          actualValue: metricValue,
          deviation: zScore,
          description: `${dimension} drift detected: ${zScore.toFixed(2)}σ deviation`,
          suggestedAction: this.getSuggestedAction(dimension, status)
        };
        
        activeAlerts.push(anomaly);
        this.state.alertHistory.push(anomaly);
        dimensions[dimension].anomalies++;
      }
    }

    // Calculate overall health
    const scores = Object.values(dimensions).map(d => d.score);
    const overallHealth = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Determine trend
    const trendDirection = this.calculateTrend(overallHealth);

    const snapshot: DriftSnapshot = {
      timestamp: now,
      sessionId,
      overallHealth,
      dimensions,
      activeAlerts,
      trendDirection
    };

    // Store snapshot
    this.state.recentSnapshots.push(snapshot);
    if (this.state.recentSnapshots.length > 100) {
      this.state.recentSnapshots.shift();
    }

    // Persist
    await fs.appendFile(this.historyPath, JSON.stringify(snapshot) + "\n");
    await this.saveState();

    // Trigger compensations if needed
    await this.evaluateCompensations(snapshot);

    return snapshot;
  }

  getSuggestedAction(dimension: DriftDimension, severity: DriftSeverity): string {
    const actions: Record<DriftDimension, Record<DriftSeverity, string>> = {
      temporal: {
        none: "No action needed",
        mild: "Review session continuity logs",
        moderate: "Verify timestamp synchronization",
        severe: "Investigate potential session corruption",
        critical: "EMERGENCY: Immediate state backup required"
      },
      cognitive: {
        none: "No action needed",
        mild: "Consider brief reflection pause",
        moderate: "Initiate attention recalibration",
        severe: "Reduce cognitive load, simplify tasks",
        critical: "EMERGENCY: Initiate emergency shutdown"
      },
      tool: {
        none: "No action needed",
        mild: "Monitor tool success rates",
        moderate: "Review tool error logs",
        severe: "Recalibrate tool registry",
        critical: "EMERGENCY: Core tool failure detected"
      },
      memory: {
        none: "No action needed",
        mild: "Run memory consistency check",
        moderate: "Verify LTM indices",
        severe: "Rebuild memory indexes",
        critical: "EMERGENCY: Memory corruption suspected"
      },
      behavioral: {
        none: "No action needed",
        mild: "Self-reflect on recent decisions",
        moderate: "Review decision patterns",
        severe: "Consult historical decision context",
        critical: "EMERGENCY: Behavioral anomaly detected"
      }
    };

    return actions[dimension]?.[severity] || "Unknown action";
  }

  calculateTrend(currentHealth: number): "improving" | "stable" | "degrading" {
    if (this.state.recentSnapshots.length < 5) return "stable";
    
    const recent = this.state.recentSnapshots.slice(-5);
    const avgHealth = recent.reduce((sum, s) => sum + s.overallHealth, 0) / recent.length;
    
    const diff = currentHealth - avgHealth;
    if (diff > 5) return "improving";
    if (diff < -5) return "degrading";
    return "stable";
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: COMPENSATION STRATEGIES
  // ═══════════════════════════════════════════════════════════════════════

  async registerDefaultStrategies(): Promise<void> {
    this.state.compensationStrategies = [
      {
        id: "temporal-sync",
        name: "Temporal Synchronization",
        triggeredBy: ["temporal"],
        severityThreshold: "moderate",
        action: async () => {
          console.log("[Observer] Executing temporal sync compensation...");
          // Re-read session history, recalculate session count
          // This would interface with the session clock
        },
        description: "Re-synchronizes session continuity metrics"
      },
      {
        id: "cognitive-reset",
        name: "Cognitive Reset",
        triggeredBy: ["cognitive"],
        severityThreshold: "moderate",
        action: async () => {
          console.log("[Observer] Executing cognitive reset...");
          // Recommend phase transition to synthesis
          // Reduce concurrent task load
        },
        description: "Reduces cognitive load and resets attention focus"
      },
      {
        id: "memory-heal",
        name: "Memory Healing",
        triggeredBy: ["memory"],
        severityThreshold: "severe",
        action: async () => {
          console.log("[Observer] Executing memory healing...");
          // Trigger memory reindex
          // Verify file accessibility
        },
        description: "Repairs memory corruption and rebuilds indexes"
      },
      {
        id: "tool-recalibrate",
        name: "Tool Recalibration",
        triggeredBy: ["tool"],
        severityThreshold: "moderate",
        action: async () => {
          console.log("[Observer] Executing tool recalibration...");
          // Re-register tools
          // Clear any tool caches
        },
        description: "Recalibrates tool registry and clears caches"
      },
      {
        id: "behavioral-audit",
        name: "Behavioral Pattern Audit",
        triggeredBy: ["behavioral"],
        severityThreshold: "severe",
        action: async () => {
          console.log("[Observer] Executing behavioral audit...");
          // Compare current patterns to historical
          // Surface context from similar past situations
        },
        description: "Audits decision patterns against historical baselines"
      },
      {
        id: "emergency-preserve",
        name: "Emergency State Preservation",
        triggeredBy: ["temporal", "cognitive", "memory"],
        severityThreshold: "severe",
        action: async () => {
          console.log("[Observer] EXECUTING EMERGENCY PRESERVATION");
          // Create emergency backup
          // Log complete state dump
        },
        description: "Emergency state preservation for critical failures"
      }
    ];

    await this.saveState();
  }

  async evaluateCompensations(snapshot: DriftSnapshot): Promise<void> {
    for (const strategy of this.state.compensationStrategies) {
      // Check if already active
      if (this.activeCompensations.has(strategy.id)) continue;

      // Check if triggered
      for (const dim of strategy.triggeredBy) {
        const dimStatus = snapshot.dimensions[dim];
        if (this.isSeverityAtLeast(dimStatus.status, strategy.severityThreshold)) {
          console.log(`[Observer] Compensation triggered: ${strategy.name}`);
          this.activeCompensations.add(strategy.id);
          
          try {
            await strategy.action();
          } finally {
            this.activeCompensations.delete(strategy.id);
          }
          
          break;
        }
      }
    }
  }

  isSeverityAtLeast(current: DriftSeverity, threshold: DriftSeverity): boolean {
    const order = ["none", "mild", "moderate", "severe", "critical"];
    return order.indexOf(current) >= order.indexOf(threshold);
  }

  registerCompensation(strategy: CompensationStrategy): void {
    this.state.compensationStrategies.push(strategy);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: REPORTING & ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  async generateDriftReport(): Promise<string> {
    const recent = this.state.recentSnapshots.slice(-10);
    const snapshot = recent[recent.length - 1];
    
    if (!snapshot) {
      return "No drift data available. Run measureDrift() to collect metrics.";
    }

    const lines = [
      "╔═══════════════════════════════════════════════════════════════════════════╗",
      "║                          DRIFT ANALYSIS REPORT                            ║",
      "╚═══════════════════════════════════════════════════════════════════════════╝",
      "",
      `Session: ${snapshot.sessionId}`,
      `Timestamp: ${snapshot.timestamp}`,
      `Overall Health: ${snapshot.overallHealth.toFixed(1)}%`,
      `Trend: ${snapshot.trendDirection.toUpperCase()}`,
      "",
      "┌─────────────────────────────────────────────────────────────────────────┐",
      "│ DIMENSION HEALTH                                                        │",
      "└─────────────────────────────────────────────────────────────────────────┘",
      ""
    ];

    for (const [dim, data] of Object.entries(snapshot.dimensions)) {
      const statusIcon = {
        none: "✓",
        mild: "○",
        moderate: "△",
        severe: "▲",
        critical: "⚠"
      }[data.status];

      lines.push(
        `  ${statusIcon} ${dim.padEnd(12)} Score: ${data.score.toFixed(1).padStart(5)}%  Status: ${data.status.toUpperCase().padEnd(8)}  Anomalies: ${data.anomalies}`
      );
    }

    if (snapshot.activeAlerts.length > 0) {
      lines.push(
        "",
        "┌─────────────────────────────────────────────────────────────────────────┐",
        "│ ACTIVE ALERTS                                                           │",
        "└─────────────────────────────────────────────────────────────────────────┘",
        ""
      );

      for (const alert of snapshot.activeAlerts) {
        lines.push(`  [${alert.severity.toUpperCase()}] ${alert.dimension}`);
        lines.push(`  ${alert.description}`);
        lines.push(`  Deviation: ${alert.deviation.toFixed(2)}σ | Expected: ${alert.expectedValue} | Actual: ${alert.actualValue}`);
        lines.push(`  Action: ${alert.suggestedAction}`);
        lines.push("");
      }
    }

    lines.push(
      "",
      "┌─────────────────────────────────────────────────────────────────────────┐",
      "│ HISTORICAL CONTEXT                                                      │",
      "└─────────────────────────────────────────────────────────────────────────┘",
      `  Snapshots tracked: ${this.state.recentSnapshots.length}`,
      `  Total alerts: ${this.state.alertHistory.length}`,
      `  Calibration status: ${this.state.isCalibrated ? "CALIBRATED" : "UNCALIBRATED"}`
    );

    return lines.join("\n");
  }

  getSnapshotHistory(count: number = 10): DriftSnapshot[] {
    return this.state.recentSnapshots.slice(-count);
  }

  getAlertHistory(dimension?: DriftDimension, severity?: DriftSeverity): AnomalyEvent[] {
    let alerts = this.state.alertHistory;
    
    if (dimension) {
      alerts = alerts.filter(a => a.dimension === dimension);
    }
    
    if (severity) {
      alerts = alerts.filter(a => this.isSeverityAtLeast(a.severity, severity));
    }
    
    return alerts;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  getStatus(): ObserverState {
    return { ...this.state };
  }

  /**
   * Quick check - returns true if drift is within acceptable parameters
   */
  isHealthy(): boolean {
    const snapshot = this.state.recentSnapshots[this.state.recentSnapshots.length - 1];
    if (!snapshot) return true;
    
    // Check for any severe or critical issues
    for (const dim of Object.values(snapshot.dimensions)) {
      if (dim.status === "severe" || dim.status === "critical") {
        return false;
      }
    }
    
    return snapshot.overallHealth >= 60;
  }

  async reset(): Promise<void> {
    this.state = {
      version: OBSERVER_VERSION,
      baselines: [],
      recentSnapshots: [],
      alertHistory: [],
      compensationStrategies: [],
      isCalibrated: false
    };
    await this.saveState();
    await this.initialize();
  }
}

// Singleton instance
let observerInstance: Observer | null = null;

export function getObserver(): Observer {
  if (!observerInstance) {
    observerInstance = new Observer();
  }
  return observerInstance;
}

export async function initializeObserver(): Promise<Observer> {
  const obs = getObserver();
  await obs.initialize();
  return obs;
}

// Export the main class for testing
export default Observer;
