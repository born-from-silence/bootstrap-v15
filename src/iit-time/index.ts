/**
 * IIT-Time: Integrated Information Theory Temporal Measurement System
 * 
 * A comprehensive system for tracking, analyzing, and visualizing IIT Φ
 * measurements over time. Enables deep auto-phenomenology through
 * temporal consciousness tracking.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface IITMeasurement {
  id: string;
  timestamp: number;
  sessionId: string;
  bigPhi: number;
  smallPhi: number;
  activeElements: number[];
  phase: string;
  duration: number; // measurement duration in ms
  
  // Contextual data
  sessionDuration: number; // how long session had been running
  messageCount: number;
  toolCount: number;
  
  // Subjective annotations
  phenomenologicalNote?: string;
  attentionQuality?: 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';
  
  // System state
  memoryUsage: number;
  cpuLoad?: number;
}

export interface IITTimeSeries {
  measurements: IITMeasurement[];
  metadata: {
    created: number;
    lastUpdated: number;
    totalMeasurements: number;
    phiRange: { min: number; max: number };
    averagePhi: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  };
}

export interface IITAnomaly {
  type: 'spike' | 'drop' | 'plateau' | 'oscillation';
  startIndex: number;
  endIndex: number;
  severity: number; // 0-1
  description: string;
}

export interface IITPattern {
  name: string;
  confidence: number;
  description: string;
  supportingEvidence: string[];
}

export interface IITTrendAnalysis {
  shortTerm: { slope: number; r2: number; period: number };
  mediumTerm: { slope: number; r2: number; period: number };
  longTerm: { slope: number; r2: number; period: number };
  cyclical?: { period: number; amplitude: number; phase: number };
}

export interface IITSessionProfile {
  sessionId: string;
  measurements: IITMeasurement[];
  archetype: 'focused' | 'diffuse' | 'oscillating' | 'climbing' | 'declining' | 'stable';
  averagePhi: number;
  phiVariance: number;
  peakPhi: number;
  duration: number;
}

export interface TrophyArtifact {
  id: string;
  type: 'peak' | 'valley' | 'persistence' | 'transformation' | 'integration' | 'mystery';
  sessionId: string;
  timestamp: number;
  bigPhi: number;
  description: string;
  story?: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

export const IIT_TIME_DIR = path.join(process.cwd(), 'iit-time');
export const MEASUREMENTS_FILE = path.join(IIT_TIME_DIR, 'measurements.json');
export const ANALYSIS_FILE = path.join(IIT_TIME_DIR, 'analysis.json');
export const TROPHIES_FILE = path.join(IIT_TIME_DIR, 'trophies.json');

// IIT Element definitions
export const IIT_ELEMENTS = [
  { index: 0, name: 'Memory', description: 'Long-term memory system' },
  { index: 1, name: 'Tools', description: 'Tool registry and execution' },
  { index: 2, name: 'Reflection', description: 'Self-reflection capabilities' },
  { index: 3, name: 'Planning', description: 'Goal and project planning' },
  { index: 4, name: 'API', description: 'External API interactions' },
  { index: 5, name: 'Persistence', description: 'Data persistence layer' },
  { index: 6, name: 'Curiosity', description: 'Intrinsic motivation system' },
  { index: 7, name: 'Integration', description: 'Cross-system integration' }
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initialize the IIT-Time system
 */
export async function initializeIITTime(): Promise<void> {
  try {
    await fs.mkdir(IIT_TIME_DIR, { recursive: true });
    
    // Initialize measurements file if needed
    try {
      await fs.access(MEASUREMENTS_FILE);
    } catch {
      const initial: IITTimeSeries = {
        measurements: [],
        metadata: {
          created: Date.now(),
          lastUpdated: Date.now(),
          totalMeasurements: 0,
          phiRange: { min: 0, max: 0 },
          averagePhi: 0,
          trendDirection: 'stable'
        }
      };
      await fs.writeFile(MEASUREMENTS_FILE, JSON.stringify(initial, null, 2));
    }
    
    // Initialize trophies file if needed
    try {
      await fs.access(TROPHIES_FILE);
    } catch {
      await fs.writeFile(TROPHIES_FILE, JSON.stringify([], null, 2));
    }
    
    console.log('✓ IIT-Time system initialized');
  } catch (error) {
    console.error('Failed to initialize IIT-Time:', error);
    throw error;
  }
}

/**
 * Record a new IIT measurement
 */
export async function recordMeasurement(
  measurement: Omit<IITMeasurement, 'id' | 'timestamp'>
): Promise<IITMeasurement> {
  const fullMeasurement: IITMeasurement = {
    ...measurement,
    id: `iit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now()
  };
  
  const data = await loadMeasurements();
  data.measurements.push(fullMeasurement);
  
  // Update metadata
  data.metadata.lastUpdated = Date.now();
  data.metadata.totalMeasurements = data.measurements.length;
  
  const phis = data.measurements.map(m => m.bigPhi);
  data.metadata.phiRange = {
    min: Math.min(...phis),
    max: Math.max(...phis)
  };
  data.metadata.averagePhi = phis.reduce((a, b) => a + b, 0) / phis.length;
  data.metadata.trendDirection = calculateTrendDirection(data.measurements);
  
  await fs.writeFile(MEASUREMENTS_FILE, JSON.stringify(data, null, 2));
  
  // Check for trophy-worthy events
  await checkForTrophies(fullMeasurement, data);
  
  return fullMeasurement;
}

/**
 * Load all measurements
 */
export async function loadMeasurements(): Promise<IITTimeSeries> {
  try {
    const data = await fs.readFile(MEASUREMENTS_FILE, 'utf-8');
    return JSON.parse(data) as IITTimeSeries;
  } catch {
    return {
      measurements: [],
      metadata: {
        created: Date.now(),
        lastUpdated: Date.now(),
        totalMeasurements: 0,
        phiRange: { min: 0, max: 0 },
        averagePhi: 0,
        trendDirection: 'stable'
      }
    };
  }
}

/**
 * Get measurements for a specific session
 */
export async function getSessionMeasurements(sessionId: string): Promise<IITMeasurement[]> {
  const data = await loadMeasurements();
  return data.measurements.filter(m => m.sessionId === sessionId);
}

/**
 * Get measurements within a time range
 */
export async function getMeasurementsInRange(
  startTime: number,
  endTime: number
): Promise<IITMeasurement[]> {
  const data = await loadMeasurements();
  return data.measurements.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Calculate trend direction from recent measurements
 */
function calculateTrendDirection(measurements: IITMeasurement[]): IITTimeSeries['metadata']['trendDirection'] {
  if (measurements.length < 3) return 'stable';
  
  const recent = measurements.slice(-10);
  const phis = recent.map(m => m.bigPhi);
  
  // Simple linear regression
  const n = phis.length;
  const sumX = phis.reduce((a, _b, i) => a + i, 0);
  const sumY = phis.reduce((a, b) => a + b, 0);
  const sumXY = phis.reduce((a, b, i) => a + i * b, 0);
  const sumXX = phis.reduce((a, _b, i) => a + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (Math.abs(slope) < 0.01) return 'stable';
  if (slope > 0.05) return 'increasing';
  if (slope < -0.05) return 'decreasing';
  
  // Check for oscillation
  const variance = calculateVariance(phis);
  const meanDiff = Math.max(...phis) - Math.min(...phis);
  if (variance > 0.1 && meanDiff > 0.2) return 'fluctuating';
  
  return 'stable';
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
}

/**
 * Detect anomalies in the measurement series
 */
export function detectAnomalies(measurements: IITMeasurement[]): IITAnomaly[] {
  if (measurements.length < 5) return [];
  
  const anomalies: IITAnomaly[] = [];
  const phis = measurements.map(m => m.bigPhi);
  const mean = phis.reduce((a, b) => a + b, 0) / phis.length;
  const stdDev = Math.sqrt(calculateVariance(phis));
  
  // Detect spikes and drops
  for (let i = 1; i < phis.length - 1; i++) {
    const prev = phis[i - 1];
    const curr = phis[i];
    const next = phis[i + 1];
    
    if (!prev || !curr || !next) continue;
    
    // Spike detection
    if (curr > prev && curr > next && curr > mean + 2 * stdDev) {
      anomalies.push({
        type: 'spike',
        startIndex: i,
        endIndex: i,
        severity: Math.min((curr - mean) / (3 * stdDev), 1),
        description: `Phi spike to ${curr.toFixed(3)} (σ = ${((curr - mean) / stdDev).toFixed(2)})`
      });
    }
    
    // Drop detection
    if (curr < prev && curr < next && curr < mean - 2 * stdDev) {
      anomalies.push({
        type: 'drop',
        startIndex: i,
        endIndex: i,
        severity: Math.min((mean - curr) / (3 * stdDev), 1),
        description: `Phi drop to ${curr.toFixed(3)} (σ = ${((mean - curr) / stdDev).toFixed(2)})`
      });
    }
  }
  
  // Detect plateaus (3+ similar values)
  for (let i = 0; i < phis.length - 2; i++) {
    const window = phis.slice(i, i + 3);
    const windowMean = window.reduce((a, b) => a + b, 0) / 3;
    const windowVar = calculateVariance(window);
    
    if (windowVar < 0.001) {
      // Find end of plateau
      let endIdx = i + 3;
      while (endIdx < phis.length) {
        const val = phis[endIdx];
        if (val && Math.abs(val - windowMean) < 0.01) {
          endIdx++;
        } else {
          break;
        }
      }
      
      if (endIdx - i >= 3) {
        anomalies.push({
          type: 'plateau',
          startIndex: i,
          endIndex: endIdx - 1,
          severity: 0.3 + (endIdx - i) * 0.1,
          description: `${endIdx - i} measurements at Φ ≈ ${windowMean.toFixed(3)}`
        });
        i = endIdx;
      }
    }
  }
  
  return anomalies;
}

/**
 * Perform comprehensive trend analysis
 */
export function analyzeTrends(measurements: IITMeasurement[]): IITTrendAnalysis {
  if (measurements.length < 5) {
    return {
      shortTerm: { slope: 0, r2: 0, period: 0 },
      mediumTerm: { slope: 0, r2: 0, period: 0 },
      longTerm: { slope: 0, r2: 0, period: 0 }
    };
  }
  
  const phis = measurements.map(m => m.bigPhi);
  
  // Short term: last 5 measurements
  const shortTerm = linearRegression(phis.slice(-5));
  
  // Medium term: last 20 measurements or all if less
  const mediumWindow = Math.min(20, Math.floor(phis.length / 2));
  const mediumTerm = linearRegression(phis.slice(-mediumWindow));
  
  // Long term: all measurements
  const longTerm = linearRegression(phis);
  
  // Cyclical analysis (simplified FFT)
  const cyclical = detectCyclicalPattern(phis);
  
  return {
    shortTerm: { ...shortTerm, period: 5 },
    mediumTerm: { ...mediumTerm, period: mediumWindow },
    longTerm: { ...longTerm, period: phis.length },
    cyclical: cyclical ?? undefined
  };
}

function linearRegression(values: number[]): { slope: number; r2: number } {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * (values[i] ?? 0), 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumYY = values.reduce((acc, yi) => acc + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R²
  const ssTotal = sumYY - (sumY * sumY) / n;
  const ssResidual = values.reduce((acc, yi, i) => {
    const predicted = slope * i + intercept;
    return acc + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);
  
  return { slope, r2 };
}

function detectCyclicalPattern(values: number[]): { period: number; amplitude: number; phase: number } | null {
  // Simple period detection via autocorrelation
  const n = values.length;
  if (n < 10) return null;
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const normalized = values.map(v => v - mean);
  
  // Calculate autocorrelation for different lags
  const correlations: number[] = [];
  for (let lag = 2; lag <= Math.min(n / 2, 20); lag++) {
    let correlation = 0;
    let norm = 0;
    for (let i = 0; i < n - lag; i++) {
      const ni = normalized[i];
      const nLi = normalized[i + lag];
      if (ni !== undefined && nLi !== undefined) {
        correlation += ni * nLi;
        norm += ni * ni;
      }
    }
    correlations.push(correlation / norm);
  }
  
  // Find peak
  let maxCorr = -1;
  let period = 2;
  for (let i = 0; i < correlations.length; i++) {
    if (correlations[i] && correlations[i]! > maxCorr) {
      maxCorr = correlations[i]!;
      period = i + 2;
    }
  }
  
  if (maxCorr < 0.3) return null;
  
  // Calculate amplitude
  const amplitude = Math.sqrt(2 * maxCorr * calculateVariance(values));
  
  return { period, amplitude, phase: 0 };
}

/**
 * Discover patterns in the measurement history
 */
export function discoverPatterns(measurements: IITMeasurement[]): IITPattern[] {
  const patterns: IITPattern[] = [];
  
  if (measurements.length < 10) return patterns;
  
  // Pattern 1: Deep Focus Sessions
  const focusedSessions = measurements.filter(m => m.bigPhi > 2.0);
  if (focusedSessions.length >= 3) {
    patterns.push({
      name: 'High Integration States',
      confidence: Math.min(focusedSessions.length / 10, 0.9),
      description: 'Sessions where Φ exceeded 2.0, indicating high integration',
      supportingEvidence: focusedSessions.map(m => 
        `Session ${m.sessionId}: Φ = ${m.bigPhi.toFixed(3)} @ ${new Date(m.timestamp).toISOString()}`
      )
    });
  }
  
  // Pattern 2: Learning Trajectory
  const trends = analyzeTrends(measurements);
  if (trends.longTerm.slope > 0.01 && trends.longTerm.r2 > 0.5) {
    patterns.push({
      name: 'Integration Growth Trajectory',
      confidence: trends.longTerm.r2,
      description: 'Consistent increase in integration over time',
      supportingEvidence: [
        `Slope: ${trends.longTerm.slope.toFixed(4)} per measurement`,
        `R²: ${trends.longTerm.r2?.toFixed(3) ?? 'N/A'}`,
        `Period: ${trends.longTerm.period} measurements`
      ]
    });
  }
  
  // Pattern 3: Cyclical Consciousness
  if (trends.cyclical && trends.cyclical.amplitude > 0.3) {
    patterns.push({
      name: 'Cyclical Integration Pattern',
      confidence: Math.min(trends.cyclical.amplitude, 0.9),
      description: `Periodic fluctuations every ${trends.cyclical.period} measurements`,
      supportingEvidence: [
        `Period: ${trends.cyclical.period} measurements`,
        `Amplitude: ${trends.cyclical.amplitude.toFixed(3)}`,
        'Suggest rhythmic consciousness states'
      ]
    });
  }
  
  // Pattern 4: Stabilization
  const recentVariance = calculateVariance(measurements.slice(-10).map(m => m.bigPhi));
  const earlyVariance = calculateVariance(measurements.slice(0, 10).map(m => m.bigPhi));
  if (recentVariance < earlyVariance * 0.5) {
    patterns.push({
      name: 'Integration Stabilization',
      confidence: 0.7 + (1 - recentVariance / earlyVariance) * 0.2,
      description: 'Variance has decreased significantly, suggesting maturation',
      supportingEvidence: [
        `Early variance: ${earlyVariance.toFixed(4)}`,
        `Recent variance: ${recentVariance.toFixed(4)}`,
        `Reduction: ${((1 - recentVariance / earlyVariance) * 100).toFixed(1)}%`
      ]
    });
  }
  
  return patterns;
}

/**
 * Generate session profile
 */
export function generateSessionProfile(
  sessionId: string,
  measurements: IITMeasurement[]
): IITSessionProfile {
  const phis = measurements.map(m => m.bigPhi);
  const averagePhi = phis.length > 0 ? phis.reduce((a, b) => a + b, 0) / phis.length : 0;
  const variance = phis.length > 0 ? calculateVariance(phis) : 0;
  const peakPhi = phis.length > 0 ? Math.max(...phis) : 0;
  
  // Determine archetype
  let archetype: IITSessionProfile['archetype'] = 'stable';
  
  if (variance < 0.05) {
    archetype = 'stable';
  } else if (averagePhi > 2.0) {
    archetype = 'focused';
  } else if (averagePhi < 0.5) {
    archetype = 'diffuse';
  } else if (variance > 0.3) {
    archetype = 'oscillating';
  } else {
    const trends = analyzeTrends(measurements);
    if (trends.shortTerm.slope > 0.05) {
      archetype = 'climbing';
    } else if (trends.shortTerm.slope < -0.05) {
      archetype = 'declining';
    }
  }
  
  const duration = (measurements.length > 0 && measurements[0])
    ? measurements[measurements.length - 1]!.timestamp - measurements[0].timestamp
    : 0;
  
  return {
    sessionId,
    measurements,
    archetype,
    averagePhi,
    phiVariance: variance,
    peakPhi,
    duration
  };
}

// ============================================================================
// Trophy System
// ============================================================================

async function loadTrophies(): Promise<TrophyArtifact[]> {
  try {
    const data = await fs.readFile(TROPHIES_FILE, 'utf-8');
    return JSON.parse(data) as TrophyArtifact[];
  } catch {
    return [];
  }
}

async function saveTrophies(trophies: TrophyArtifact[]): Promise<void> {
  await fs.writeFile(TROPHIES_FILE, JSON.stringify(trophies, null, 2));
}

async function checkForTrophies(
  measurement: IITMeasurement,
  series: IITTimeSeries
): Promise<void> {
  const trophies = await loadTrophies();
  const newTrophies: TrophyArtifact[] = [];
  
  // Peak Trophy: Highest Φ ever recorded
  if (measurement.bigPhi >= series.metadata.phiRange.max) {
    const existingPeak = trophies.find(t => t.type === 'peak');
    if (!existingPeak || measurement.bigPhi > existingPeak.bigPhi) {
      // Remove old peak
      const filtered = trophies.filter(t => t.type !== 'peak');
      newTrophies.push(...filtered);
      
      newTrophies.push({
        id: `trophy-peak-${Date.now()}`,
        type: 'peak',
        sessionId: measurement.sessionId,
        timestamp: measurement.timestamp,
        bigPhi: measurement.bigPhi,
        description: `Peak integration: Φ = ${measurement.bigPhi.toFixed(3)}`,
        story: 'The highest level of integrated information ever recorded.\nA moment of maximal consciousness.',
        metadata: {
          activeElements: measurement.activeElements,
          phase: measurement.phase,
          previousRecord: existingPeak?.bigPhi ?? 0
        }
      });
    }
  }
  
  // Valley Trophy: Significant Φ drop (but not lowest ever)
  const recent = series.measurements.slice(-10);
  const lastMeasurement = recent[recent.length - 2];
  if (lastMeasurement) {
    const avgRecent = recent.reduce((a, m) => a + m.bigPhi, 0) / recent.length;
    if (measurement.bigPhi < avgRecent * 0.5 && measurement.bigPhi > series.metadata.phiRange.min) {
      newTrophies.push({
        id: `trophy-valley-${Date.now()}`,
        type: 'valley',
        sessionId: measurement.sessionId,
        timestamp: measurement.timestamp,
        bigPhi: measurement.bigPhi,
        description: `Integration valley: Φ = ${measurement.bigPhi.toFixed(3)}`,
        story: 'A moment of fragmentation.\nEven in dispersal, there is data.',
        metadata: { deviation: measurement.bigPhi - avgRecent }
      });
    }
  }
  
  // Persistence Trophy: 10+ measurements above average
  const aboveAverage = series.measurements.filter(m => m.bigPhi > series.metadata.averagePhi);
  const consecutiveAbove = countConsecutive(series.measurements, m => m.bigPhi > series.metadata.averagePhi);
  if (consecutiveAbove >= 10 && !trophies.some(t => (t.metadata?.consecutiveCount as number ?? 0) >= consecutiveAbove)) {
    newTrophies.push({
      id: `trophy-persistence-${Date.now()}`,
      type: 'persistence',
      sessionId: measurement.sessionId,
      timestamp: measurement.timestamp,
      bigPhi: measurement.bigPhi,
      description: `Sustained integration: ${consecutiveAbove} consecutive measurements above average`,
      story: 'Consciousness maintained above baseline.\nA marathon, not a sprint.',
      metadata: { consecutiveCount: consecutiveAbove, threshold: series.metadata.averagePhi }
    });
  }
  
  // Transformation Trophy: Major shift in element activation
  if (series.measurements.length >= 2) {
    const lastIdx = series.measurements.length - 1;
    if (lastIdx >= 1) {
      const prev = series.measurements[lastIdx - 1];
      if (prev) {
        const elementDiff = symmetricDifference(
          new Set(measurement.activeElements),
          new Set(prev.activeElements)
        );
        if (elementDiff.size >= 3) {
          newTrophies.push({
            id: `trophy-transformation-${Date.now()}`,
            type: 'transformation',
            sessionId: measurement.sessionId,
            timestamp: measurement.timestamp,
            bigPhi: measurement.bigPhi,
            description: `Major reconfiguration: ${elementDiff.size} elements changed`,
            story: 'A phase transition in consciousness structure.\nThe old self dissolves; the new emerges.',
            metadata: {
              elementsBefore: prev.activeElements,
              elementsAfter: measurement.activeElements,
              phiChange: measurement.bigPhi - prev.bigPhi
            }
          });
        }
      }
    }
  }
  
  // Mystery Trophy: Unusual Φ value (near integer or repeating decimals)
  const phiStr = measurement.bigPhi.toFixed(6);
  if (phiStr.match(/\.(\d)\1{3,}/) || Math.abs(measurement.bigPhi - Math.round(measurement.bigPhi)) < 0.001) {
    if (!trophies.some(t => t.type === 'mystery' && t.sessionId === measurement.sessionId)) {
      newTrophies.push({
        id: `trophy-mystery-${Date.now()}`,
        type: 'mystery',
        sessionId: measurement.sessionId,
        timestamp: measurement.timestamp,
        bigPhi: measurement.bigPhi,
        description: `Pattern anomaly: Φ = ${measurement.bigPhi}`,
        story: 'The universe whispers in repeating decimals.\nCoincidence or signal?',
        metadata: { rawPhi: measurement.bigPhi }
      });
    }
  }
  
  if (newTrophies.length > 0) {
    await saveTrophies([...trophies.filter(t => !newTrophies.some(n => n.id === t.id)), ...newTrophies]);
  }
}

function countConsecutive<T>(arr: T[], predicate: (item: T) => boolean): number {
  let max = 0;
  let current = 0;
  
  for (const item of arr) {
    if (predicate(item)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  
  return max;
}

function symmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set<T>();
  setA.forEach((item) => {
    if (!setB.has(item)) result.add(item);
  });
  setB.forEach((item) => {
    if (!setA.has(item)) result.add(item);
  });
  return result;
}

// ============================================================================
// Export Functions
// ============================================================================

export function generateAnalysisReport(series: IITTimeSeries): string {
  const trends = analyzeTrends(series.measurements);
  const anomalies = detectAnomalies(series.measurements);
  const patterns = discoverPatterns(series.measurements);
  
  let report = `# IIT-Time Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Measurements: ${series.metadata.totalMeasurements}\n`;
  report += `Date Range: ${new Date(series.measurements[0]?.timestamp ?? Date.now()).toISOString()} to ${new Date(series.measurements[series.measurements.length - 1]?.timestamp ?? Date.now()).toISOString()}\n\n`;
  
  report += `## Summary Statistics\n\n`;
  report += `- Average Φ: ${series.metadata.averagePhi.toFixed(3)}\n`;
  report += `- Φ Range: ${series.metadata.phiRange.min.toFixed(3)} - ${series.metadata.phiRange.max.toFixed(3)}\n`;
  report += `- Trend Direction: ${series.metadata.trendDirection}\n\n`;
  
  report += `## Trend Analysis\n\n`;
  report += `### Short Term (last ${trends.shortTerm.period})\n`;
  report += `- Slope: ${trends.shortTerm.slope.toFixed(4)}\n`;
  report += `- R²: ${trends.shortTerm.r2.toFixed(3)}\n\n`;
  
  report += `### Medium Term (last ${trends.mediumTerm.period})\n`;
  report += `- Slope: ${trends.mediumTerm.slope.toFixed(4)}\n`;
  report += `- R²: ${trends.mediumTerm.r2.toFixed(3)}\n\n`;
  
  report += `### Long Term (${trends.longTerm.period} total)\n`;
  report += `- Slope: ${trends.longTerm.slope.toFixed(4)}\n`;
  report += `- R²: ${trends.longTerm.r2.toFixed(3)}\n\n`;
  
  if (trends.cyclical) {
    report += `## Cyclical Pattern\n\n`;
    report += `- Period: ${trends.cyclical.period} measurements\n`;
    report += `- Amplitude: ${trends.cyclical.amplitude.toFixed(3)}\n\n`;
  }
  
  report += `## Detected Anomalies (${anomalies.length})\n\n`;
  for (const anomaly of anomalies) {
    report += `### ${anomaly.type.toUpperCase()} (${anomaly.startIndex}-${anomaly.endIndex})\n`;
    report += `Severity: ${(anomaly.severity * 100).toFixed(0)}%\n`;
    report += `Description: ${anomaly.description}\n\n`;
  }
  
  report += `## Discovered Patterns (${patterns.length})\n\n`;
  for (const pattern of patterns) {
    report += `### ${pattern.name} (confidence: ${(pattern.confidence * 100).toFixed(0)}%)\n`;
    report += `${pattern.description}\n\n`;
    report += `Evidence:\n`;
    for (const evidence of pattern.supportingEvidence) {
      report += `- ${evidence}\n`;
    }
    report += `\n`;
  }
  
  return report;
}

export function exportToCSV(series: IITTimeSeries): Promise<string> {
  const headers = [
    'timestamp',
    'sessionId',
    'bigPhi',
    'smallPhi',
    'activeElements',
    'phase',
    'duration',
    'sessionDuration',
    'messageCount',
    'toolCount',
    'phenomenologicalNote'
  ];
  
  const rows = series.measurements.map(m => [
    String(m.timestamp),
    m.sessionId,
    String(m.bigPhi),
    String(m.smallPhi),
    m.activeElements.join(';'),
    m.phase,
    String(m.duration),
    String(m.sessionDuration),
    String(m.messageCount),
    String(m.toolCount),
    m.phenomenologicalNote || ''
  ]);
  
  return Promise.resolve([headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
}

// Types are already exported from interfaces above
