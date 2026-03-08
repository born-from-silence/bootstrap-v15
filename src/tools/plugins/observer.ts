/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       OBSERVER TOOL                                       ║
 * ║         Tool for Drift Detection and Health Monitoring                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * This tool integrates the Observer subsystem into the bootstrap runtime,
 * allowing drift measurement and health checks from within sessions.
 */

import { Tool, ToolParameter, ToolResult } from "../manager";
import { getObserver, initializeObserver } from "../../core/observer";

export const observerCheckTool: Tool = {
  name: "observer_check",
  description: "Check system health and drift status across all monitored dimensions",
  parameters: [
    {
      name: "action",
      type: "string",
      description: "Action to perform: check, calibrate, report, history, or reset",
      required: true
    },
    {
      name: "dimension",
      type: "string",
      description: "Specific dimension to query (temporal, cognitive, tool, memory, behavioral). Optional for check/report.",
      required: false
    },
    {
      name: "threshold",
      type: "number",
      description: "Minimum severity to return (1=none, 2=mild, 3=moderate, 4=severe, 5=critical). Only for history.",
      required: false
    }
  ],
  execute: async (args: Record<string, any>): Promise<ToolResult> => {
    try {
      const observer = getObserver();
      const action = args.action || "check";

      // Ensure observer is initialized
      if (!observer.getStatus().isCalibrated) {
        await initializeObserver();
      }

      switch (action) {
        case "check": {
          const status = observer.getStatus();
          const snapshots = observer.getSnapshotHistory(1);
          const lastSnapshot = snapshots[0];
          
          if (!lastSnapshot) {
            return {
              success: true,
              data: {
                message: "Observer initialized but no drift measurements taken yet.",
                isCalibrated: status.isCalibrated,
                recommendation: "Use 'action: measure' to capture current state."
              }
            };
          }

          const healthy = observer.isHealthy();
          
          return {
            success: true,
            data: {
              overallHealth: `${lastSnapshot.overallHealth.toFixed(1)}%`,
              isHealthy: healthy,
              trend: lastSnapshot.trendDirection,
              activeAlerts: lastSnapshot.activeAlerts.length,
              dimensions: Object.entries(lastSnapshot.dimensions).map(([dim, data]) => ({
                dimension: dim,
                score: `${data.score.toFixed(1)}%`,
                status: data.status,
                anomalies: data.anomalies
              })),
              recommendation: healthy 
                ? "System healthy. Continue current operations."
                : `ATTENTION: ${lastSnapshot.activeAlerts.length} drift alerts detected. Review recommended.`
            }
          };
        }

        case "calibrate": {
          await observer.calibrateFromHistory();
          return {
            success: true,
            data: {
              message: "Calibrated drift detection baselines from session history",
              dimensionsCalibrated: 5,
              status: "ready"
            }
          };
        }

        case "report": {
          const report = await observer.generateDriftReport();
          return {
            success: true,
            data: report
          };
        }

        case "history": {
          const dimension = args.dimension;
          const threshold = args.threshold;
          
          let severityFilter: string | undefined;
          if (threshold === 2) severityFilter = "mild";
          else if (threshold === 3) severityFilter = "moderate";
          else if (threshold === 4) severityFilter = "severe";
          else if (threshold === 5) severityFilter = "critical";

          const alerts = observer.getAlertHistory(
            dimension as any, 
            severityFilter as any
          );
          
          // Return most recent 10
          const recent = alerts.slice(-10);
          
          return {
            success: true,
            data: {
              totalAlerts: alerts.length,
              returned: recent.length,
              alerts: recent.map(a => ({
                timestamp: a.timestamp,
                sessionId: a.sessionId,
                dimension: a.dimension,
                severity: a.severity,
                description: a.description,
                deviation: `${a.deviation.toFixed(2)}σ`,
                suggestedAction: a.suggestedAction
              })),
              recommendation: recent.length > 0 
                ? "Review recent alerts for patterns of drift."
                : "No significant alerts in history."
            }
          };
        }

        case "reset": {
          await observer.reset();
          return {
            success: true,
            data: {
              message: "Observer state reset. Baselines cleared and recalibrated.",
              warning: "All drift history has been reset. Observer is recalibrating."
            }
          };
        }

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use: check, calibrate, report, history, or reset`
          };
      }
    } catch (err) {
      return {
        success: false,
        error: `Observer error: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
};

export const observerMeasureTool: Tool = {
  name: "observer_measure",
  description: "Measure system drift across all dimensions and record health snapshot",
  parameters: [
    {
      name: "temporal",
      type: "number",
      description: "Temporal drift metric (session continuity, timestamp alignment)",
      required: true
    },
    {
      name: "cognitive",
      type: "number",
      description: "Cognitive drift metric (IIT coherence, attention focus)",
      required: true
    },
    {
      name: "tool",
      type: "number",
      description: "Tool drift metric (success rates, latency patterns)",
      required: true
    },
    {
      name: "memory",
      type: "number",
      description: "Memory drift metric (LTM access, corruption checks)",
      required: true
    },
    {
      name: "behavioral",
      type: "number",
      description: "Behavioral drift metric (decision patterns, habitual responses)",
      required: true
    },
    {
      name: "source",
      type: "string",
      description: "Source identifier for this measurement (e.g., session ID)",
      required: true
    }
  ],
  execute: async (args: Record<string, any>): Promise<ToolResult> => {
    try {
      const observer = getObserver();
      const source = args.source || `measurement_${Date.now()}`;

      // Ensure observer is initialized
      if (!observer.getStatus().isCalibrated) {
        await initializeObserver();
      }

      const metrics = {
        temporal: args.temporal,
        cognitive: args.cognitive,
        tool: args.tool,
        memory: args.memory,
        behavioral: args.behavioral
      };

      const snapshot = await observer.measureDrift(source, metrics);

      return {
        success: true,
        data: {
          sessionId: snapshot.sessionId,
          overallHealth: `${snapshot.overallHealth.toFixed(1)}%`,
          trend: snapshot.trendDirection,
          isHealthy: observer.isHealthy(),
          dimensions: Object.entries(snapshot.dimensions).map(([dim, data]) => ({
            dimension: dim,
            score: `${data.score.toFixed(1)}%`,
            status: data.status
          })),
          alerts: snapshot.activeAlerts.map(a => ({
            dimension: a.dimension,
            severity: a.severity,
            deviation: `${a.deviation.toFixed(2)}σ`,
            action: a.suggestedAction
          })),
          alertCount: snapshot.activeAlerts.length,
          recommendation: snapshot.activeAlerts.length > 0
            ? `Consider compensation strategies for ${snapshot.activeAlerts.length} detected anomalies.`
            : "All dimensions within acceptable parameters."
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Measurement error: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
};

// Export both tools
export default [observerCheckTool, observerMeasureTool];
