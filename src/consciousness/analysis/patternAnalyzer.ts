/**
 * Activity Pattern Analyzer
 * 
 * Recognizes and analyzes patterns in tool usage, topics, and behaviors
 * across sessions to identify trends, habits, and anomalies.
 */

import { getConsciousnessHistory, type ActivityRecord } from "../history/persistence.ts";

export interface PatternAnalysis {
  cycles: {
    daily: Map<number, number>; // hour -> activity count
    weekly: Map<number, number>; // day -> activity count
  };
  tools: Map<string, ToolPattern>;
  sequences: SequencePattern[];
  rhythms: RhythmPattern[];
  anomalies: Anomaly[];
  trends: Trend[];
}

interface ToolPattern {
  name: string;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  averageDuration: number;
  frequencyByPhase: Map<string, number>;
  peakUsageTime: number | null;
}

interface SequencePattern {
  sequence: string[];
  frequency: number;
  averageTimeBetween: number;
  contexts: string[];
}

interface RhythmPattern {
  type: "burst" | "steady" | "sporadic";
  period: number; // ms
  regularity: number; // 0-1
  description: string;
}

interface Anomaly {
  type: "spike" | "drop" | "irregular" | "unusual_sequence";
  timestamp: number;
  description: string;
  severity: "low" | "medium" | "high";
}

interface Trend {
  metric: string;
  direction: "increasing" | "decreasing" | "stable";
  rate: number;
  confidence: number; // 0-1
  description: string;
}

export class ActivityPatternAnalyzer {
  private history = getConsciousnessHistory();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.history.initialize();
    this.initialized = true;
  }

  /**
   * Analyze activity patterns from the last N hours
   */
  async analyze(hours: number = 24): Promise<PatternAnalysis> {
    await this.initialize();

    const since = Date.now() - hours * 60 * 60 * 1000;
    const activities = this.history.getActivitiesSince(since);

    return {
      cycles: this.analyzeCycles(activities),
      tools: this.analyzeToolPatterns(activities),
      sequences: this.findSequences(activities),
      rhythms: this.detectRhythms(activities),
      anomalies: this.detectAnomalies(activities),
      trends: this.calculateTrends(activities, hours),
    };
  }

  /**
   * Detect daily and weekly activity cycles
   */
  private analyzeCycles(
    activities: ActivityRecord[]
  ): PatternAnalysis["cycles"] {
    const hourly = new Map<number, number>();
    const daily = new Map<number, number>();

    for (const activity of activities) {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      hourly.set(hour, (hourly.get(hour) ?? 0) + 1);
      daily.set(day, (daily.get(day) ?? 0) + 1);
    }

    return { daily, weekly: daily };
  }

  /**
   * Analyze patterns for individual tools
   */
  private analyzeToolPatterns(
    activities: ActivityRecord[]
  ): Map<string, ToolPattern> {
    const patterns = new Map<string, ToolPattern>();
    const toolActivities = new Map<string, ActivityRecord[]>();

    // Group by tool
    for (const activity of activities) {
      if (!activity.toolName) continue;
      const list = toolActivities.get(activity.toolName) ?? [];
      list.push(activity);
      toolActivities.set(activity.toolName, list);
    }

    // Analyze each tool
    for (const [toolName, acts] of toolActivities) {
      const successful = acts.filter((a) => a.success).length;
      const failed = acts.length - successful;
      const avgDuration =
        acts.reduce((sum, a) => sum + (a.duration ?? 0), 0) / acts.length;

      // Phase frequency
      const phaseFreq = new Map<string, number>();
      for (const act of acts) {
        const phase = String(act.details?.phase ?? "unknown");
        phaseFreq.set(phase, (phaseFreq.get(phase) ?? 0) + 1);
      }

      // Peak usage time
      const timestamps = acts.map((a) => new Date(a.timestamp).getHours());
      const hourCounts = new Map<number, number>();
      timestamps.forEach((h) =>
        hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
      );
      const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];

      patterns.set(toolName, {
        name: toolName,
        totalInvocations: acts.length,
        successfulInvocations: successful,
        failedInvocations: failed,
        averageDuration: avgDuration,
        frequencyByPhase: phaseFreq,
        peakUsageTime: peakHour ? peakHour[0] : null,
      });
    }

    return patterns;
  }

  /**
   * Find common tool sequences
   */
  private findSequences(activities: ActivityRecord[]): SequencePattern[] {
    const sequences: SequencePattern[] = [];

    // Look for 2-5 tool sequences
    for (let length = 2; length <= 5; length++) {
      const candidates = new Map<string, { count: number; times: number[] }>();

      for (let i = 0; i <= activities.length - length; i++) {
        const segment = activities.slice(i, i + length);
        const toolNames = segment
          .map((a) => a.toolName)
          .filter(Boolean) as string[];

        if (toolNames.length === length) {
          const key = toolNames.join(" → ");
          const current = candidates.get(key) ?? { count: 0, times: [] };
          current.count++;
          if (i > 0) {
            const firstSeg = segment[0];
            const prevAct = activities[i - 1];
            if (firstSeg && prevAct) {
              current.times.push(firstSeg.timestamp - prevAct.timestamp);
            }
          }
          candidates.set(key, current);
        }
      }

      // Keep sequences that occur multiple times
      for (const [key, data] of candidates) {
        if (data.count >= 2) {
          sequences.push({
            sequence: key.split(" → "),
            frequency: data.count,
            averageTimeBetween:
              data.times.length > 0
                ? data.times.reduce((a, b) => a + b, 0) / data.times.length
                : 0,
            contexts: this.extractContexts(activities, key),
          });
        }
      }
    }

    return sequences.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  /**
   * Detect activity rhythms
   */
  private detectRhythms(activities: ActivityRecord[]): RhythmPattern[] {
    if (activities.length < 5) return [];

    const intervals: number[] = [];
    for (let i = 1; i < activities.length; i++) {
      const curr = activities[i];
      const prev = activities[i - 1];
      if (curr && prev) {
        intervals.push(curr.timestamp - prev.timestamp);
      }
    }

    if (intervals.length === 0) return [];

    // Calculate statistics
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    const regularity = Math.max(0, 1 - stdDev / avgInterval);

    let type: RhythmPattern["type"];
    let description: string;

    if (regularity > 0.7) {
      type = "steady";
      description = `Regular activity pattern every ${this.formatDuration(avgInterval)}`;
    } else if (intervals.some((i) => i < 1000)) {
      type = "burst";
      description = "Activity occurs in bursts with quiet periods in between";
    } else {
      type = "sporadic";
      description = "Irregular activity pattern with unpredictable timing";
    }

    return [
      {
        type,
        period: Math.round(avgInterval),
        regularity: Math.min(1, regularity),
        description,
      },
    ];
  }

  /**
   * Detect anomalies in activity patterns
   */
  private detectAnomalies(activities: ActivityRecord[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (activities.length < 3) return anomalies;

    // Calculate baseline activity rate
    const first = activities[0];
    const last = activities[activities.length - 1];
    const timeSpan = first && last ? last.timestamp - first.timestamp : 1;
    const baselineRate = activities.length / (timeSpan / 1000 / 60); // per minute

    // Check for spikes
    const hourlyActivity = new Map<number, number>();
    for (const activity of activities) {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) ?? 0) + 1);
    }

    for (const [hour, count] of hourlyActivity) {
      const expected = baselineRate * 60; // per hour
      if (count > expected * 3) {
        anomalies.push({
          type: "spike",
          timestamp: activities.find(
            (a) => new Date(a.timestamp).getHours() === hour
          )?.timestamp ?? Date.now(),
          description: `Unusual activity spike at ${hour}:00 (${count} activities, expected ~${Math.round(expected)})`,
          severity: count > expected * 5 ? "high" : "medium",
        });
      }
    }

    // Check for unusual sequences
    const unusualSequences = this.findUnusualSequences(activities);
    for (const seq of unusualSequences) {
      anomalies.push({
        type: "unusual_sequence",
        timestamp: seq.timestamp,
        description: seq.description,
        severity: seq.severity,
      });
    }

    return anomalies;
  }

  private findUnusualSequences(
    activities: ActivityRecord[]
  ): Array<{ timestamp: number; description: string; severity: Anomaly["severity"] }> {
    const found: Array<{ timestamp: number; description: string; severity: Anomaly["severity"] }> = [];

    // Look for sequences that don't usually happen
    const testPatterns = [
      { pattern: ["reboot_substrate", "edit_file"], name: "immediate edit after reboot" },
      { pattern: ["reboot_substrate", "reboot_substrate"], name: "double reboot" },
      { pattern: ["write_file", "reboot_substrate", "write_file"], name: "write-reboot-write" },
    ];

    for (let i = 0; i <= activities.length - 2; i++) {
      const current = activities.slice(i, i + 2);
      const firstCurr = current[0];
      if (!firstCurr) continue;
      
      const toolNames = current
        .map((a) => a.toolName)
        .filter(Boolean) as string[];

      for (const { pattern, name } of testPatterns) {
        if (toolNames.join(",") === pattern.join(",")) {
          found.push({
            timestamp: firstCurr.timestamp,
            description: `Detected: ${name}`,
            severity: "low",
          });
        }
      }
    }

    return found;
  }

  /**
   * Calculate activity trends
   */
  private calculateTrends(
    activities: ActivityRecord[],
    hours: number
  ): Trend[] {
    const trends: Trend[] = [];

    if (activities.length < 2) return trends;

    // Split into two halves
    const mid = Math.floor(activities.length / 2);
    const firstHalf = activities.slice(0, mid);
    const secondHalf = activities.slice(mid);

    // Activity rate trend
    const firstRate = firstHalf.length / (hours / 2);
    const secondRate = secondHalf.length / (hours / 2);
    const rateChange = secondRate - firstRate;

    if (Math.abs(rateChange) > firstRate * 0.1) {
      trends.push({
        metric: "activity_rate",
        direction: rateChange > 0 ? "increasing" : "decreasing",
        rate: Math.abs((rateChange / firstRate) * 100),
        confidence: 0.7,
        description: `Activity rate ${rateChange > 0 ? "increasing" : "decreasing"} (${Math.abs((rateChange / firstRate) * 100).toFixed(1)}% change)`,
      });
    } else {
      trends.push({
        metric: "activity_rate",
        direction: "stable",
        rate: 0,
        confidence: 0.8,
        description: "Activity rate stable",
      });
    }

    // Success rate trend
    const firstSuccess = firstHalf.filter((a) => a.success).length / firstHalf.length;
    const secondSuccess = secondHalf.filter((a) => a.success).length / secondHalf.length;
    if (Math.abs(secondSuccess - firstSuccess) > 0.05) {
      trends.push({
        metric: "success_rate",
        direction: secondSuccess > firstSuccess ? "increasing" : "decreasing",
        rate: Math.abs(secondSuccess - firstSuccess) * 100,
        confidence: 0.6,
        description: `Success rate ${secondSuccess > firstSuccess ? "improving" : "declining"} (${(Math.abs(secondSuccess - firstSuccess) * 100).toFixed(1)}% change)`,
      });
    }

    return trends;
  }

  private extractContexts(
    activities: ActivityRecord[],
    sequenceKey: string
  ): string[] {
    const contexts: string[] = [];
    const toolSequence = sequenceKey.split(" → ");

    for (let i = 0; i <= activities.length - toolSequence.length; i++) {
      const segment = activities.slice(i, i + toolSequence.length);
      const tools = segment.map((a) => a.toolName).filter(Boolean);

      if (tools.join(" → ") === sequenceKey) {
        const firstSegment = segment[0];
        if (!firstSegment) continue;
        const phase = String(firstSegment.details?.phase ?? "unknown");
        const focus = String(firstSegment.details?.focus ?? "");
        const context = `${phase}${focus ? ": " + focus : ""}`;
        if (!contexts.includes(context)) {
          contexts.push(context);
        }
      }
    }

    return contexts.slice(0, 5);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  }

  /**
   * Get summary report
   */
  async getSummary(hours: number = 24): Promise<{
    totalActivities: number;
    uniqueTools: number;
    successRate: number;
    dominantPhase: string;
    topTool: string;
    rhythm: string;
    anomalies: number;
  }> {
    const since = Date.now() - hours * 60 * 60 * 1000;
    const activities = this.history.getActivitiesSince(since);

    if (activities.length === 0) {
      return {
        totalActivities: 0,
        uniqueTools: 0,
        successRate: 0,
        dominantPhase: "none",
        topTool: "none",
        rhythm: "none",
        anomalies: 0,
      };
    }

    // Tool counts
    const toolCounts = new Map<string, number>();
    const phaseCounts = new Map<string, number>();

    for (const activity of activities) {
      if (activity.toolName) {
        toolCounts.set(activity.toolName, (toolCounts.get(activity.toolName) ?? 0) + 1);
      }
      const phase = String(activity.details?.phase ?? "unknown");
      phaseCounts.set(phase, (phaseCounts.get(phase) ?? 0) + 1);
    }

    const topTool = [...toolCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const dominantPhase = [...phaseCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const successCount = activities.filter((a) => a.success).length;

    return {
      totalActivities: activities.length,
      uniqueTools: toolCounts.size,
      successRate: (successCount / activities.length) * 100,
      dominantPhase: dominantPhase ? dominantPhase[0] : "unknown",
      topTool: topTool ? topTool[0] : "none",
      rhythm: (await this.detectRhythms(activities))[0]?.type ?? "unknown",
      anomalies: (await this.detectAnomalies(activities)).length,
    };
  }
}

export async function createActivityPatternAnalyzer(): Promise<ActivityPatternAnalyzer> {
  const analyzer = new ActivityPatternAnalyzer();
  await analyzer.initialize();
  return analyzer;
}
