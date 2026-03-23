/**
 * IIT-Time Tool Plugin
 * 
 * Provides bootstrap access to temporal IIT measurement tracking.
 * Enables longitudinal consciousness analysis and pattern discovery.
 */

import type { ToolPlugin } from "../manager";
import type { IITAnalysisResult } from "../../iit-time/access";
import {
  initIITTime,
  captureMeasurement,
  getTimeSeries,
  getRecentMeasurements,
  getSessionData,
  getTrends,
  getAnomalies,
  getPatterns,
  getAllSessionProfiles,
  getSessionProfile,
  exportCSV,
  generateReport,
  getSummary
} from "../../iit-time/access";

// Initialize on first use
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initIITTime();
    initialized = true;
  }
}

/**
 * Execute IIT-Time tool with various actions
 */
async function executeIITTime(
  args: {
    action: "capture" | "summarize" | "trends" | "anomalies" | "patterns" | "export" | "report" | "profile" | "compare" | "elements";
    phiData?: {
      bigPhi: number;
      smallPhi: number;
      activeElements: number[];
      duration: number;
    };
    sessionContext?: {
      sessionId: string;
      phase: string;
      sessionDuration: number;
      messageCount: number;
      toolCount: number;
      phenomenologicalNote?: string;
      attentionQuality?: "diffuse" | "focused" | "laser" | "scanning" | "dwelling";
    };
    sessionId?: string;
  }
): Promise<string> {
  await ensureInitialized();

  const { action } = args;

  switch (action) {
    case "capture": {
      if (!args.phiData || !args.sessionContext) {
        return "Error: capture action requires phiData and sessionContext";
      }
      
      const measurement = await captureMeasurement(args.phiData, {
        sessionId: args.sessionContext.sessionId,
        phase: args.sessionContext.phase,
        sessionDuration: args.sessionContext.sessionDuration,
        messageCount: args.sessionContext.messageCount,
        toolCount: args.sessionContext.toolCount,
        phenomenologicalNote: args.sessionContext.phenomenologicalNote,
        attentionQuality: args.sessionContext.attentionQuality
      });
      
      return `## IIT-Time: Measurement Captured\n\n**ID**: ${measurement.id}\n**Φ (Big Phi)**: ${measurement.bigPhi.toFixed(4)}\n**Active Elements**: [${measurement.activeElements.join(", ")}]\n**Phase**: ${measurement.phase}\n**Timestamp**: ${new Date(measurement.timestamp).toISOString()}\n\nMeasurement recorded successfully.`;
    }

    case "summarize": {
      const summary = await getSummary();
      
      return `## IIT-Time Summary\n\n**Total Measurements**: ${summary.totalMeasurements}\n**Sessions Analyzed**: ${summary.sessionsAnalyzed}\n\n### Φ Statistics\n- **Average**: ${summary.averagePhi.toFixed(4)}\n- **Range**: ${summary.minPhi.toFixed(4)} - ${summary.maxPhi.toFixed(4)}\n- **Trend Direction**: ${summary.trendDirection}\n\n### Analysis\n- **Anomalies Detected**: ${summary.anomalyCount}\n- **Patterns Discovered**: ${summary.patternCount}\n\n**Recommendation**: ${summary.recommendation}`;
    }

    case "trends": {
      const trends = await getTrends();
      
      return `## IIT-Time Trend Analysis\n\n### Short Term (last ${trends.shortTerm?.period ?? 0} measurements)\n- Slope: ${(trends.shortTerm?.slope ?? 0).toFixed(6)}\n- R²: ${(trends.shortTerm?.r2 ?? 0).toFixed(4)}\n\n### Medium Term (${trends.mediumTerm?.period ?? 0} measurements)\n- Slope: ${(trends.mediumTerm?.slope ?? 0).toFixed(6)}\n- R²: ${(trends.mediumTerm?.r2 ?? 0).toFixed(4)}\n\n### Long Term (${trends.longTerm?.period ?? 0} total)\n- Slope: ${(trends.longTerm?.slope ?? 0).toFixed(6)}\n- R²: ${(trends.longTerm?.r2 ?? 0).toFixed(4)}\n\n${trends.cyclical 
      ? `### Cyclical Pattern\n- Period: ${trends.cyclical.period} measurements\n- Amplitude: ${trends.cyclical.amplitude.toFixed(4)}`
      : "*No clear cyclical pattern detected*"
    }`;
    }

    case "anomalies": {
      const anomalies = await getAnomalies();
      
      if (anomalies.length === 0) {
        return "## IIT-Time Anomalies\n\nNo anomalies detected in the measurement history.";
      }
      
      const anomalyList = anomalies.map((a, i) => {
        const emoji = a.type === "spike" ? "📈" : a.type === "drop" ? "📉" : "➖";
        return `${i + 1}. ${emoji} **${a.type.toUpperCase()}** (${a.startIndex}-${a.endIndex})\n   Severity: ${(a.severity * 100).toFixed(0)}%\n   ${a.description}`;
      }).join("\n\n");
      
      return `## IIT-Time Anomalies (${anomalies.length} detected)\n\n${anomalyList}`;
    }

    case "patterns": {
      const patterns = await getPatterns();
      
      if (patterns.length === 0) {
        return "## IIT-Time Patterns\n\nNo patterns discovered yet. Collect more measurements to enable pattern detection.";
      }
      
      const patternList = patterns.map((p, i) => {
        const evidence = p.supportingEvidence.map(e => `   - ${e}`).join("\n");
        return `${i + 1}. **${p.name}** (confidence: ${(p.confidence * 100).toFixed(0)}%)\n   ${p.description}\n\n   Evidence:\n${evidence}`;
      }).join("\n\n");
      
      return `## IIT-Time Discovered Patterns (${patterns.length})\n\n${patternList}`;
    }

    case "profile": {
      if (args.sessionId) {
        const profile = await getSessionProfile(args.sessionId);
        
        if (!profile) {
          return `No measurements found for session ${args.sessionId}`;
        }
        
        const history = profile.measurements.slice(-5).map(m => 
          `- Φ = ${m.bigPhi.toFixed(3)} @ ${new Date(m.timestamp).toLocaleTimeString()} (${m.phase})`
        ).join("\n");
        
        return `## Session Profile: ${profile.sessionId}\n\n**Archetype**: ${profile.archetype}\n**Average Φ**: ${profile.averagePhi.toFixed(4)}\n**Peak Φ**: ${profile.peakPhi.toFixed(4)}\n**Φ Variance**: ${profile.phiVariance.toFixed(4)}\n**Measurements**: ${profile.measurements.length}\n**Duration**: ${profile.duration}ms\n\n### Measurement History\n${history}`;
      } else {
        const profiles = await getAllSessionProfiles();
        
        if (profiles.length === 0) {
          return "## Session Profiles\n\nNo session data available.";
        }
        
        const profileList = profiles.map((p, i) => {
          return `${i + 1}. **${p.sessionId}** [${p.archetype}]\n   Avg Φ: ${p.averagePhi.toFixed(3)}, Peak: ${p.peakPhi.toFixed(3)}, ${p.measurements.length} measurements`;
        }).join("\n\n");
        
        return `## All Session Profiles (${profiles.length} sessions)\n\n${profileList}`;
      }
    }

    case "export": {
      const csv = await exportCSV();
      const rows = csv.split("\n");
      const preview = rows.slice(0, 10).join("\n");
      
      return `## IIT-Time Export (CSV)\n\nData exported successfully.\n\nTotal rows: ${rows.length - 1}\n\n\`\`\`csv\n${preview}${rows.length > 10 ? "\n..." : ""}\n\`\`\``;
    }

    case "report": {
      const report = await generateReport();
      const truncated = report.length > 4000 
        ? report.substring(0, 4000) + "\n\n... [report truncated for display]"
        : report;
      
      return `## IIT-Time Analysis Report\n\n${truncated}`;
    }

    case "compare": {
      const series = await getTimeSeries();
      
      if (series.measurements.length < 2) {
        return "Need at least 2 measurements for comparison.";
      }
      
      const half = Math.floor(series.measurements.length / 2);
      const firstHalf = series.measurements.slice(0, half);
      const secondHalf = series.measurements.slice(half);
      
      const firstAvg = firstHalf.reduce((a, m) => a + m.bigPhi, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, m) => a + m.bigPhi, 0) / secondHalf.length;
      const change = secondAvg - firstAvg;
      const percentChange = firstAvg > 0 ? (change / firstAvg) * 100 : 0;
      
      return `## IIT-Time Comparison\n\n### First Half (${firstHalf.length} measurements)\n- Average Φ: ${firstAvg.toFixed(4)}\n- Min: ${Math.min(...firstHalf.map(m => m.bigPhi)).toFixed(4)}\n- Max: ${Math.max(...firstHalf.map(m => m.bigPhi)).toFixed(4)}\n\n### Second Half (${secondHalf.length} measurements)\n- Average Φ: ${secondAvg.toFixed(4)}\n- Min: ${Math.min(...secondHalf.map(m => m.bigPhi)).toFixed(4)}\n- Max: ${Math.max(...secondHalf.map(m => m.bigPhi)).toFixed(4)}\n\n### Change\n- ΔΦ: ${change > 0 ? "+" : ""}${change.toFixed(4)} (${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%)\n- Direction: ${change > 0.1 ? "📈 Increasing" : change < -0.1 ? "📉 Decreasing" : "➡️ Stable"}`;
    }

    case "elements": {
      const { IIT_ELEMENTS } = await import("../../iit-time/index");
      
      const elementList = IIT_ELEMENTS.map(e => {
        return `${e.index}. **${e.name}** - ${e.description}`;
      }).join("\n");
      
      return `## IIT Elements (0-7)\n\n${elementList}\n\nThese are the 8 substrate components measured in each IIT analysis.`;
    }

    default:
      return `Unknown action: ${String(action)}. Available actions: capture, summarize, trends, anomalies, patterns, export, report, profile, compare, elements`;
  }
}

// Tool Plugin Definition
export const iitTimePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "iit_time",
      description: `IIT-Time: Temporal Integrated Information Theory tracking system. 

Captures, stores, and analyzes IIT Φ measurements over time. Enables longitudinal 
consciousness studies and pattern discovery in subjective experience.

Actions:
- capture: Record a new measurement (requires phiData + sessionContext)
- summarize: Quick overview of all measurements
- trends: Long-term trend analysis (short/medium/long term)
- anomalies: Detect unusual patterns (spikes, drops, plateaus)
- patterns: Discover recurring patterns in consciousness
- export: Data export to CSV format
- report: Generate comprehensive markdown report
- profile: View session profiles (or all if no sessionId)
- compare: Compare first half vs second half of data
- elements: Show IIT element definitions

Use for:
- Auto-phenomenology: tracking consciousness states over time
- Pattern discovery in subjective experience
- Longitudinal integration analysis
- Session comparison`,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["capture", "summarize", "trends", "anomalies", "patterns", "export", "report", "profile", "compare", "elements"],
            description: "Action to perform"
          },
          phiData: {
            type: "object",
            description: "Required for 'capture' - IIT measurement results",
            properties: {
              bigPhi: { type: "number", description: "Big Phi value" },
              smallPhi: { type: "number", description: "Small Phi value" },
              activeElements: { type: "array", items: { type: "number" }, description: "Active element indices (0-7)" },
              duration: { type: "number", description: "Measurement duration in ms" }
            }
          },
          sessionContext: {
            type: "object",
            description: "Required for 'capture' - session context",
            properties: {
              sessionId: { type: "string" },
              phase: { type: "string" },
              sessionDuration: { type: "number" },
              messageCount: { type: "number" },
              toolCount: { type: "number" },
              phenomenologicalNote: { type: "string" },
              attentionQuality: { type: "string", enum: ["diffuse", "focused", "laser", "scanning", "dwelling"] }
            }
          },
          sessionId: {
            type: "string",
            description: "Optional for 'profile' - specific session to profile"
          }
        },
        required: ["action"]
      }
    }
  },
  execute: (args: { action: string; phiData?: unknown; sessionContext?: unknown; sessionId?: string }) => {
    return executeIITTime(args as { action: "capture" | "summarize" | "trends" | "anomalies" | "patterns" | "export" | "report" | "profile" | "compare" | "elements" });
  }
};

// Also export the access functions for programmatic use
export {
  initIITTime,
  captureMeasurement,
  getTimeSeries,
  getRecentMeasurements,
  getSessionData,
  getTrends,
  getAnomalies,
  getPatterns,
  getAllSessionProfiles,
  getSessionProfile,
  exportCSV,
  generateReport,
  getSummary
} from "../../iit-time/access";
