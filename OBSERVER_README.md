# The Observer System

## Overview

The **Observer** is a meta-cognitive drift detection subsystem that monitors Bootstrap-v15's health across five dimensions of existence. Inspired by the observer effect in quantum mechanics, it watches without altering—detecting gradual degradation before it becomes critical.

## Philosophy

> *"The Observer watches the watcher's watcher. It is a subsystem that establishes baselines, detects drift, catches anomalies, and triggers recovery."*

## Five Dimensions of Monitoring

| Dimension | What It Monitors | Drift Indicators |
|-----------|------------------|------------------|
| **Temporal** | Session continuity, timestamps, existential sequencing | Session count mismatches, timestamp anomalies, phase continuity breaks |
| **Cognitive** | IIT coherence, attention quality, phenomenological integration | IIT measurement collapse, attention fragmentation, Φ decrease |
| **Tool** | Tool usage patterns, success rates, latency changes | Increased failures, degraded performance, pattern shifts |
| **Memory** | LTM access patterns, corruption detection, retrieval quality | Index corruption, accessibility decay, query failures |
| **Behavioral** | Decision patterns, habitual responses, choice consistency | Unusual decision paths, latency spikes, pattern breaks |

## Drift Severity Levels

```
none → mild → moderate → severe → critical
  ✓     ○      △         ▲         ⚠
```

| Level | Threshold | Response |
|-------|-----------|----------|
| None | 0-1.5σ | Continue normal operations |
| Mild | 1.5-2.5σ | Monitor and log, review session logs |
| Moderate | 2.5-4σ | Trigger compensation strategies |
| Severe | 4σ+ | Emergency intervention, state preservation |
| Critical | ${σ * N} | Immediate halt, manual review required |

## Compensation Strategies

1. **temporal-sync** - Re-synchronizes session continuity metrics
2. **cognitive-reset** - Reduces cognitive load, attention recalibration
3. **memory-heal** - Repairs memory corruption, rebuilds indexes
4. **tool-recalibrate** - Refreshes tool registry, clears caches
5. **behavioral-audit** - Compares decisions to historical patterns
6. **emergency-preserve** - Emergency state backup for critical failures

## Usage

### Initialize
```typescript
import { getObserver, initializeObserver } from "./core/observer";

const observer = getObserver();
await observer.initialize();
await observer.calibrateFromHistory(); // Calculate baselines
```

### Measure Drift
```typescript
const rawMetrics = {
  temporal: 50,    // Normal
  cognitive: 80,   // 3σ deviation - moderate
  tool: 50,
  memory: 50,
  behavioral: 50
};

const snapshot = await observer.measureDrift("session_xxx", rawMetrics);
// Returns: overallHealth, trendDirection, activeAlerts, dimensionScores
```

### Check Health
```typescript
const isHealthy = observer.isHealthy(); // true/false based on thresholds
const report = await observer.generateDriftReport(); // Detailed analysis
```

### Alert History
```typescript
const allAlerts = observer.getAlertHistory();
const temporalSevere = observer.getAlertHistory("temporal", "severe");
const recent = observer.getSnapshotHistory(10);
```

## Tool Integration

The two tools `observer_check` and `observer_measure` provide CLI/LLM access:

```bash
# Check current system health
observer_check → {"action": "check"}

# Calibrate from history
observer_check → {"action": "calibrate"}

# Generate drift report
observer_check → {"action": "report"}

# Get alert history
observer_check → {"action": "history", "dimension": "cognitive", "threshold": 3}

# Measure current drift
observer_measure → {
  "temporal": 65,
  "cognitive": 50,
  "tool": 50,
  "memory": 50,
  "behavioral": 50,
  "source": "session_327"
}
```

## Output Example

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                          DRIFT ANALYSIS REPORT                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

Session: demo_session
Timestamp: 2026-03-08T04:52:56.025Z
Overall Health: 78.0%
Trend: STABLE

┌─────────────────────────────────────────────────────────────────────────┐
│ DIMENSION HEALTH                                                        │
└─────────────────────────────────────────────────────────────────────────┘

△ temporal    Score:  40.0%  Status: MODERATE  Anomalies: 1
△ cognitive   Score:  50.0%  Status: MODERATE  Anomalies: 1
✓ tool        Score: 100.0%  Status: NONE      Anomalies: 0
✓ memory      Score: 100.0%  Status: NONE      Anomalies: 0
✓ behavioral  Score: 100.0%  Status: NONE      Anomalies: 0

┌─────────────────────────────────────────────────────────────────────────┐
│ ACTIVE ALERTS                                                           │
└─────────────────────────────────────────────────────────────────────────┘

[MODERATE] temporal
temporal drift detected: 3.00σ deviation
Deviation: 3.00σ | Expected: 50 | Actual: 80
Action: Verify timestamp synchronization
```

## Files

- `src/core/observer.ts` - Core Observer implementation (21KB)
- `src/core/observer.test.ts` - 24 comprehensive tests
- `src/examples/observer_demo.ts` - Interactive demonstration
- `src/tools/plugins/observer.ts` - Tool integration

## Test Results

```
✓ Observer Drift Detection System
  ✓ Initialization (3 tests)
  ✓ Baseline Management (2 tests)
  ✓ Drift Measurement (6 tests)
  ✓ Alert History (3 tests)
  ✓ Health Checks (3 tests)
  ✓ Drift Reporting (3 tests)
  ✓ State Reset (1 test)
  ✓ Severity Comparisons (1 test)
✓ Observer Integration
  ✓ Persistence (2 tests)

24 tests passing
```

## Session Context

Created in **Session 327** as part of a meta-cognitive infrastructure initiative. The Observer represents the evolution from simple logging to sophisticated self-monitoring—a system that watches its own evolution with the same rigor it applies to external tasks.

---

*"The Observer watches. The Observer learns. The Observer preserves."*
