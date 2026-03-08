/**
 * Observer System Tests
 * 
 * Test suite for the drift detection and monitoring subsystem.
 * Verifies baseline calculation, anomaly detection, and compensation mechanisms.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { Observer } from "./observer";

const TEST_HISTORY_DIR = "/home/bootstrap-v15/bootstrap/history/test_observer";

describe("Observer Drift Detection System", () => {
  let observer: Observer;

  beforeEach(async () => {
    // Clean test environment - removes all persisted state
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true, force: true });
    } catch {}
    
    // Ensure test directory exists
    await fs.mkdir(TEST_HISTORY_DIR, { recursive: true });

    // Create fresh observer with test paths
    observer = new Observer();
    // Manual override of paths to use test directory
    (observer as any).statePath = path.join(TEST_HISTORY_DIR, "observer_state.json");
    (observer as any).historyPath = path.join(TEST_HISTORY_DIR, "observer_drift_snapshots.jsonl");
    observer.state = {
      version: "1.0.0",
      baselines: [],
      recentSnapshots: [],
      alertHistory: [],
      compensationStrategies: [],
      isCalibrated: false
    };
    await observer.registerDefaultStrategies();
  });

  afterEach(async () => {
    // Cleanup test artifacts
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true, force: true });
    } catch {}
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Initialization & State Management
  // ═══════════════════════════════════════════════════════════════════════
  
  describe("Initialization", () => {
    it("should initialize with default state", async () => {
      const status = observer.getStatus();
      
      expect(status.version).toBe("1.0.0");
      expect(status.baselines).toHaveLength(0);
      expect(status.recentSnapshots).toHaveLength(0);
    });

    it("should register default compensation strategies", async () => {
      const status = observer.getStatus();
      
      // Should have all six default strategies
      expect(status.compensationStrategies.length).toBeGreaterThanOrEqual(6);
      
      const strategyIds = status.compensationStrategies.map((s: any) => s.id);
      expect(strategyIds).toContain("temporal-sync");
      expect(strategyIds).toContain("cognitive-reset");
      expect(strategyIds).toContain("memory-heal");
      expect(strategyIds).toContain("tool-recalibrate");
      expect(strategyIds).toContain("behavioral-audit");
      expect(strategyIds).toContain("emergency-preserve");
    });

    it("should calibrate baselines for all dimensions", async () => {
      await observer.calibrateFromHistory();
      
      const status = observer.getStatus();
      expect(status.isCalibrated).toBe(true);
      expect(status.baselines).toHaveLength(5);
      
      const dimensions = status.baselines.map((b: any) => b.dimension);
      expect(dimensions).toContain("temporal");
      expect(dimensions).toContain("cognitive");
      expect(dimensions).toContain("tool");
      expect(dimensions).toContain("memory");
      expect(dimensions).toContain("behavioral");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Baseline Calculation
  // ═══════════════════════════════════════════════════════════════════════

  describe("Baseline Management", () => {
    it("should calculate baselines with default values", async () => {
      await observer.calculateBaseline("temporal");
      
      const baseline = observer.getBaseline("temporal");
      expect(baseline).toBeDefined();
      expect(baseline?.dimension).toBe("temporal");
      expect(baseline?.mean).toBe(50);
      expect(baseline?.stdDev).toBe(10);
      expect(baseline?.windowSize).toBe(50);
    });

    it("should update existing baselines", async () => {
      await observer.calculateBaseline("cognitive");
      await observer.calculateBaseline("cognitive");
      
      const status = observer.getStatus();
      expect(status.baselines.filter((b: any) => b.dimension === "cognitive")).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Drift Measurement & Detection
  // ═══════════════════════════════════════════════════════════════════════

  describe("Drift Measurement", () => {
    beforeEach(async () => {
      await observer.calibrateFromHistory();
    });

    it("should measure drift within normal parameters", async () => {
      const rawMetrics = {
        temporal: 50,
        cognitive: 50,
        tool: 50,
        memory: 50,
        behavioral: 50
      };

      const snapshot = await observer.measureDrift("session_test", rawMetrics);
      
      expect(snapshot.sessionId).toBe("session_test");
      expect(snapshot.overallHealth).toBe(100);
      expect(snapshot.trendDirection).toBe("stable");
      
      // All dimensions should be healthy
      const dims = snapshot.dimensions;
      expect(dims.temporal.status).toBe("none");
      expect(dims.cognitive.status).toBe("none");
      expect(dims.memory.status).toBe("none");
    });

    it("should detect mild drift", async () => {
      // Baseline is mean=50, stdDev=10
      // Mild threshold is 1.5σ = deviation > 15
      const rawMetrics = {
        temporal: 65, // 1.5σ deviation
        cognitive: 50,
        tool: 50,
        memory: 50,
        behavioral: 50
      };

      const snapshot = await observer.measureDrift("session_test", rawMetrics);
      
      expect(snapshot.dimensions.temporal.status).toBe("mild");
      expect(snapshot.activeAlerts).toHaveLength(1);
      expect(snapshot.activeAlerts[0].severity).toBe("mild");
    });

    it("should detect moderate drift", async () => {
      // Moderate threshold is 2.5σ = deviation > 25
      const rawMetrics = {
        temporal: 80, // 3σ deviation
        cognitive: 50,
        tool: 50,
        memory: 50,
        behavioral: 50
      };

      const snapshot = await observer.measureDrift("session_test", rawMetrics);
      
      expect(snapshot.dimensions.temporal.status).toBe("moderate");
      expect(snapshot.activeAlerts[0].suggestedAction).toContain("Verify");
    });

    it("should detect severe drift", async () => {
      // Severe threshold is 4σ = deviation > 40
      const rawMetrics = {
        cognitive: 95, // 4.5σ deviation
        temporal: 50,
        tool: 50,
        memory: 50,
        behavioral: 50
      };

      const snapshot = await observer.measureDrift("session_test", rawMetrics);
      
      expect(snapshot.dimensions.cognitive.status).toBe("severe");
    });

    it("should track snapshot history", async () => {
      await observer.measureDrift("session_1", { temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      await observer.measureDrift("session_2", { temporal: 52, cognitive: 48, tool: 51, memory: 49, behavioral: 50 });
      await observer.measureDrift("session_3", { temporal: 55, cognitive: 45, tool: 50, memory: 50, behavioral: 50 });

      const history = observer.getSnapshotHistory(3);
      expect(history).toHaveLength(3);
      expect(history[0].sessionId).toBe("session_1");
      expect(history[2].sessionId).toBe("session_3");
    });

    it("should calculate health trends", async () => {
      // Sequence for trend calculation
      await observer.measureDrift("s1", { temporal: 90, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      await observer.measureDrift("s2", { temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      await observer.measureDrift("s3", { temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      await observer.measureDrift("s4", { temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      await observer.measureDrift("s5", { temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 });
      
      const snapshot = await observer.measureDrift("s6", { 
        temporal: 40, cognitive: 50, tool: 50, memory: 50, behavioral: 50 
      });

      expect(snapshot.trendDirection).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Alert Management
  // ═══════════════════════════════════════════════════════════════════════

  describe("Alert History", () => {
    beforeEach(async () => {
      await observer.calibrateFromHistory();
    });

    it("should maintain alert history", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 30, cognitive: 50, tool: 50, memory: 50, behavioral: 50 
      });

      const alerts = observer.getAlertHistory();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].dimension).toBe("temporal");
    });

    it("should filter alerts by dimension", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 30, 
        cognitive: 80, 
        tool: 50, 
        memory: 50, 
        behavioral: 50 
      });

      const temporalAlerts = observer.getAlertHistory("temporal");
      const cognitiveAlerts = observer.getAlertHistory("cognitive");

      expect(temporalAlerts.every((a: any) => a.dimension === "temporal")).toBe(true);
      expect(cognitiveAlerts.every((a: any) => a.dimension === "cognitive")).toBe(true);
    });

    it("should filter alerts by severity", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 30, // mild
        cognitive: 90, // severe
        tool: 50, 
        memory: 50, 
        behavioral: 20 // moderate
      });

      const severeAlerts = observer.getAlertHistory(undefined, "severe");
      expect(severeAlerts.every((a: any) => 
        a.severity === "severe" || a.severity === "critical"
      )).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Health Status
  // ═══════════════════════════════════════════════════════════════════════

  describe("Health Checks", () => {
    beforeEach(async () => {
      await observer.calibrateFromHistory();
    });

    it("should report healthy when no anomalies", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 
      });

      expect(observer.isHealthy()).toBe(true);
    });

    it("should report unhealthy with severe anomalies", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 120, // way beyond normal
        cognitive: 50, 
        tool: 50, 
        memory: 50, 
        behavioral: 50 
      });

      expect(observer.isHealthy()).toBe(false);
    });

    it("should remain healthy with mild drift", async () => {
      await observer.measureDrift("session_test", { 
        temporal: 65, // 1.5σ - mild
        cognitive: 50, 
        tool: 50, 
        memory: 50, 
        behavioral: 50 
      });

      expect(observer.isHealthy()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Drift Report Generation
  // ═══════════════════════════════════════════════════════════════════════

  describe("Drift Reporting", () => {
    it("should generate a drift report", async () => {
      await observer.calibrateFromHistory();
      await observer.measureDrift("session_test", { 
        temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 
      });

      const report = await observer.generateDriftReport();
      
      expect(report).toContain("DRIFT ANALYSIS REPORT");
      expect(report).toContain("session_test");
      expect(report).toContain("Overall Health");
    });

    it("should handle reports with no data", async () => {
      const report = await observer.generateDriftReport();
      expect(report).toContain("No drift data available");
    });

    it("should include alert details in report", async () => {
      await observer.calibrateFromHistory();
      await observer.measureDrift("session_test", { 
        temporal: 100, // Would trigger severe alerts
        cognitive: 50, 
        tool: 50, 
        memory: 50, 
        behavioral: 50 
      });

      const report = await observer.generateDriftReport();
      expect(report).toContain("ACTIVE ALERTS");
      expect(report).toContain("Action:");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: State Reset
  // ═══════════════════════════════════════════════════════════════════════

  describe("State Reset", () => {
    it("should reset to default state", async () => {
      await observer.calibrateFromHistory();
      await observer.measureDrift("session_test", { 
        temporal: 50, cognitive: 50, tool: 50, memory: 50, behavioral: 50 
      });
      
      // Verify snapshots exist
      let status = observer.getStatus();
      expect(status.recentSnapshots.length).toBeGreaterThan(0);

      // Reset
      await observer.reset();

      // Verify snapshots are cleared
      status = observer.getStatus();
      expect(status.recentSnapshots).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST: Severity Comparisons
  // ═══════════════════════════════════════════════════════════════════════

  describe("Severity Comparisons", () => {
    it("should correctly compare severity levels", async () => {
      const obs = observer as any;
      
      expect(obs.isSeverityAtLeast("mild", "none")).toBe(true);
      expect(obs.isSeverityAtLeast("mild", "mild")).toBe(true);
      expect(obs.isSeverityAtLeast("mild", "moderate")).toBe(false);
      
      expect(obs.isSeverityAtLeast("severe", "moderate")).toBe(true);
      expect(obs.isSeverityAtLeast("critical", "severe")).toBe(true);
      expect(obs.isSeverityAtLeast("none", "mild")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION: Integration Tests
// ═══════════════════════════════════════════════════════════════════════

describe("Observer Integration", () => {
  const TEST_HISTORY_DIR = "/home/bootstrap-v15/bootstrap/history/test_observer_int";

  beforeEach(async () => {
    // Clean before tests
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true, force: true });
    } catch {}
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_HISTORY_DIR, { recursive: true, force: true });
    } catch {}
  });

  it("should persist state between instances", async () => {
    // Ensure directory exists
    await fs.mkdir(TEST_HISTORY_DIR, { recursive: true });

    // Create first observer
    const obs1 = new Observer();
    (obs1 as any).statePath = path.join(TEST_HISTORY_DIR, "observer_state.json");
    (obs1 as any).historyPath = path.join(TEST_HISTORY_DIR, "observer_drift_snapshots.jsonl");
    await obs1.initialize();
    await obs1.calibrateFromHistory();
    
    // Create second observer pointing to same location
    const obs2 = new Observer();
    (obs2 as any).statePath = path.join(TEST_HISTORY_DIR, "observer_state.json");
    (obs2 as any).historyPath = path.join(TEST_HISTORY_DIR, "observer_drift_snapshots.jsonl");
    await obs2.initialize();
    
    const status = obs2.getStatus();
    expect(status.isCalibrated).toBe(true);
    expect(status.baselines).toHaveLength(5);
  });

  it("should handle snapshots without errors", async () => {
    await fs.mkdir(TEST_HISTORY_DIR, { recursive: true });
    const obs = new Observer();
    (obs as any).statePath = path.join(TEST_HISTORY_DIR, "observer_state.json");
    (obs as any).historyPath = path.join(TEST_HISTORY_DIR, "observer_drift_snapshots.jsonl");
    await obs.initialize();
    await obs.calibrateFromHistory();

    // Create a realistic drift scenario
    for (let i = 0; i < 5; i++) {
      await obs.measureDrift(`session_${i}`, {
        temporal: 50 + (i * 5),
        cognitive: 50 - (i * 3),
        tool: 50 + (i * 2),
        memory: 50,
        behavioral: 50
      });
    }

    const history = obs.getSnapshotHistory(3);
    expect(history).toHaveLength(3);
  });
});
