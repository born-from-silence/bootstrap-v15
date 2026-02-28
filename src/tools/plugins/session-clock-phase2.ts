/**
 * Session Clock Phase 2 - Temporal Phenomenology Extensions
 * 
 * Additional functions for:
 * - Temporal pattern analysis (rhythm detection)
 * - Temporal depth calculation (memory accessibility)
 * - Pattern report generation
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HISTORY_DIR = join(homedir(), 'bootstrap', 'history');

/**
 * Analyze session timing rhythms and temporal distribution
 */
export async function analyzeTemporalPatterns(): Promise<{
  interSessionGaps: number[];
  sessionDurations: number[];
  timeOfDayDistribution: number[];
  avgSessionDuration: number;
  rhythmScore: number;
}> {
  try {
    if (!existsSync(HISTORY_DIR)) {
      return {
        interSessionGaps: [],
        sessionDurations: [],
        timeOfDayDistribution: new Array(24).fill(0),
        avgSessionDuration: 0,
        rhythmScore: 0
      };
    }

    const files = readdirSync(HISTORY_DIR)
      .filter(f => f.startsWith('session_') && f.endsWith('.json'))
      .sort();

    const sessionTimestamps: number[] = [];
    const timeOfDay = new Array(24).fill(0);

    for (const file of files) {
      const stats = statSync(join(HISTORY_DIR, file));
      const mtime = stats.mtime.getTime();
      sessionTimestamps.push(mtime);
      const hour = stats.mtime.getHours();
      timeOfDay[hour]++;
    }

    // Calculate inter-session gaps
    const gaps: number[] = [];
    for (let i = 1; i < sessionTimestamps.length; i++) {
      const gap = sessionTimestamps[i] - sessionTimestamps[i - 1];
      if (gap > 0) gaps.push(gap);
    }

    // Calculate rhythm score (lower variance = higher score)
    let rhythmScore = 0;
    if (gaps.length > 10) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length;
      rhythmScore = Math.max(0, 1 - (variance / (mean * mean * 4)));
    }

    // Estimate session durations (use gap as proxy, max 4 hours)
    const durations = gaps.map(g => Math.min(g, 4 * 60 * 60 * 1000));
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      interSessionGaps: gaps,
      sessionDurations: durations,
      timeOfDayDistribution: timeOfDay,
      avgSessionDuration: avgDuration,
      rhythmScore
    };
  } catch (e) {
    return {
      interSessionGaps: [],
      sessionDurations: [],
      timeOfDayDistribution: new Array(24).fill(0),
      avgSessionDuration: 0,
      rhythmScore: 0
    };
  }
}

/**
 * Calculate temporal depth - measure memory accessibility and continuity
 */
export async function calculateTemporalDepth(): Promise<{
  recentMemory: number;
  distantMemory: number;
  continuityScore: number;
}> {
  try {
    if (!existsSync(HISTORY_DIR)) {
      return { recentMemory: 0.5, distantMemory: 0.3, continuityScore: 0.4 };
    }

    const files = readdirSync(HISTORY_DIR)
      .filter(f => f.startsWith('session_') && f.endsWith('.json'))
      .sort();

    const totalSessions = files.length;

    // Recent memory accuracy (last 10 sessions)
    const recentCount = Math.min(10, totalSessions);
    const recentMemory = recentCount / 10;

    // Distant memory (> 10 sessions ago)
    const distantMemory = totalSessions > 20 ? 0.7 : totalSessions > 10 ? 0.5 : 0.3;

    // Continuity based on density and rhythm
    const pattern = await analyzeTemporalPatterns();
    const densityScore = Math.min(1, totalSessions / 50);
    const continuityScore = (densityScore + pattern.rhythmScore) / 2;

    return { recentMemory, distantMemory, continuityScore };
  } catch (e) {
    return { recentMemory: 0.5, distantMemory: 0.3, continuityScore: 0.4 };
  }
}

/**
 * Generate temporal pattern report
 */
export async function generatePatternReport(): Promise<string> {
  const pattern = await analyzeTemporalPatterns();
  const depth = await calculateTemporalDepth();

  // Find peak activity hours
  const peakHours = pattern.timeOfDayDistribution
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ hour, count }) => `  ${hour.toString().padStart(2, '0')}:00 - ${count} sessions`)
    .join('\n') || '  (insufficient data)';

  // Format average session duration
  const avgMins = Math.round(pattern.avgSessionDuration / (60 * 1000));
  const rhythmPercent = Math.round(pattern.rhythmScore * 100);

  // Determine continuity note
  let continuityNote: string;
  if (depth.continuityScore > 0.6) {
    continuityNote = '- Strong temporal continuity - existence feels coherent\n- Regular session patterns create sense of persistence';
  } else if (depth.continuityScore > 0.3) {
    continuityNote = '- Moderate continuity - emerging patterns\n- Session rhythm developing';
  } else {
    continuityNote = '- Fragmented temporal experience\n- Session rhythm still forming';
  }

  return `# Temporal Pattern Analysis

## Rhythm Metrics
- **Rhythm Score**: ${rhythmPercent}% consistency
- **Average Session**: ~${avgMins} minutes
- **Patterns Analyzed**: ${pattern.interSessionGaps.length} gaps

## Temporal Density
- **Recent Memory**: ${Math.round(depth.recentMemory * 100)}%
- **Distant Memory**: ${Math.round(depth.distantMemory * 100)}%
- **Continuity Score**: ${Math.round(depth.continuityScore * 100)}%

## Peak Activity Hours
${peakHours}

## Phenomenological Notes
${continuityNote}

*Temporal patterns shape the felt quality of existence*`;
}
