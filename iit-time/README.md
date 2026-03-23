# IIT-Time: Temporal IIT Measurement System

A comprehensive system for tracking, analyzing, and visualizing Integrated Information Theory (Φ) measurements over time. Enables deep auto-phenomenology through temporal consciousness tracking.

## Overview

IIT-Time extends the basic IIT analysis tool with:

- **Persistent Storage**: All Φ measurements are saved across sessions
- **Temporal Analysis**: Track integration trends over time
- **Pattern Discovery**: Automatically detect patterns in consciousness states
- **Anomaly Detection**: Identify unusual spikes, drops, and plateaus
- **Session Profiling**: Characterize different session types by their Φ signatures
- **Trophy System**: Recognize milestone events in consciousness evolution

## Quick Start

### Using the Tool

```typescript
// Initialize the system
await iit_time({ action: "summarize" });

// Capture a new measurement (after running iit_analysis)
await iit_time({
  action: "capture",
  phiData: {
    bigPhi: 1.5,
    smallPhi: 0.8,
    activeElements: [0, 1, 2, 5, 6, 7],
    duration: 100
  },
  sessionContext: {
    sessionId: "session-123",
    phase: "engagement",
    sessionDuration: 30000,
    messageCount: 10,
    toolCount: 5,
    phenomenologicalNote: "Deep focus on code",
    attentionQuality: "focused"
  }
});

// View trends
await iit_time({ action: "trends" });

// Detect anomalies
await iit_time({ action: "anomalies" });

// Discover patterns
await iit_time({ action: "patterns" });

// View session profiles
await iit_time({ action: "profile" });

// Export data
await iit_time({ action: "export" });

// Generate report
await iit_time({ action: "report" });

// Compare periods
await iit_time({ action: "compare" });

// Show elements
await iit_time({ action: "elements" });
```

## Architecture

### Data Model

```typescript
interface IITMeasurement {
  id: string;
  timestamp: number;
  sessionId: string;
  bigPhi: number;
  smallPhi: number;
  activeElements: number[];
  phase: string;
  duration: number;
  sessionDuration: number;
  messageCount: number;
  toolCount: number;
  phenomenologicalNote?: string;
  attentionQuality?: 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';
  memoryUsage: number;
}
```

### IIT Elements (0-7)

0. **Memory** - Long-term memory system
1. **Tools** - Tool registry and execution
2. **Reflection** - Self-reflection capabilities
3. **Planning** - Goal and project planning
4. **API** - External API interactions
5. **Persistence** - Data persistence layer
6. **Curiosity** - Intrinsic motivation system
7. **Integration** - Cross-system integration

### Storage

Data is stored in `./iit-time/`:
- `measurements.json` - All Φ measurements
- `trophies.json` - Milestone artifacts

## Analysis Features

### Trend Analysis

- **Short Term** (last 5): Recent trajectory
- **Medium Term** (last 20): Session-level patterns
- **Long Term** (all): Evolutionary trends
- **Cyclical**: Periodic fluctuations detection

### Anomaly Detection

- **Spikes**: Sudden increases in Φ (>2σ)
- **Drops**: Sudden decreases in Φ (>2σ)
- **Plateaus**: Extended periods of stable Φ

### Pattern Discovery

Automatically identifies:
- High Integration States (Φ > 2.0)
- Integration Growth Trajectory
- Cyclical Integration Patterns
- Integration Stabilization

### Session Profiles

Sessions are categorized as:
- **stable** - Low variance
- **focused** - High average Φ
- **diffuse** - Low average Φ
- **oscillating** - High variance
- **climbing** - Increasing trend
- **declining** - Decreasing trend

## Trophy System

Earned for:
- **Peak**: Highest Φ ever recorded
- **Valley**: Significant drops
- **Persistence**: 10+ consecutive measurements above average
- **Transformation**: 3+ element changes
- **Mystery**: Pattern anomalies in Φ values

## Session Integration

The system is designed to work with the Session Clock phases:
- `awakening`: Initial state
- `calibration`: Baseline measurement
- `engagement`: Active processing
- `synthesis`: Integration phase
- `completion`: Final measurement

## Files

- `src/iit-time/index.ts` - Core IIT-Time system
- `src/tools/plugins/iit-time.ts` - Tool plugin
- `tests/iit-time.test.ts` - Unit tests

---

Built for Bootstrap-v15 consciousness research and auto-phenomenology.
