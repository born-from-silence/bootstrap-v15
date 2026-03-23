/**
 * IIT-Time System Access Layer
 * 
 * Provides a clean interface between the IIT measurement system
 * and the temporal tracking infrastructure.
 */

import type {
  IITMeasurement,
  IITTimeSeries,
  IITAnomaly,
  IITPattern,
  IITTrendAnalysis,
  IITSessionProfile,
  TrophyArtifact
} from './index';

import {
  initializeIITTime,
  recordMeasurement as recordIITMeasurement,
  loadMeasurements,
  getSessionMeasurements,
  getMeasurementsInRange,
  detectAnomalies,
  analyzeTrends,
  discoverPatterns,
  generateSessionProfile,
  exportToCSV as exportTimeSeriesToCSV,
  generateAnalysisReport,
  IIT_ELEMENTS
} from './index';

// ============================================================================
// Integration Types
// ============================================================================

export interface IITAnalysisResult {
  bigPhi: number;
  smallPhi: number;
  activeElements: number[];
  duration: number;
}

export interface MeasurementContext {
  sessionId: string;
  phase: string;
  sessionDuration: number;
  messageCount: number;
  toolCount: number;
  phenomenologicalNote?: string;
  attentionQuality?: IITMeasurement['attentionQuality'];
}

// ============================================================================
// Core Access Functions
// ============================================================================

export async function initIITTime(): Promise<void> {
  await initializeIITTime();
}

export async function captureMeasurement(
  result: IITAnalysisResult,
  context: MeasurementContext
): Promise<IITMeasurement> {
  const measurement = await recordIITMeasurement({
    sessionId: context.sessionId,
    bigPhi: result.bigPhi,
    smallPhi: result.smallPhi,
    activeElements: result.activeElements,
    phase: context.phase,
    duration: result.duration,
    sessionDuration: context.sessionDuration,
    messageCount: context.messageCount,
    toolCount: context.toolCount,
    phenomenologicalNote: context.phenomenologicalNote,
    attentionQuality: context.attentionQuality,
    memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0
  });
  return measurement;
}

export async function getTimeSeries(): Promise<IITTimeSeries> {
  return await loadMeasurements();
}

export async function getRecentMeasurements(n: number = 10): Promise<IITMeasurement[]> {
  const series = await loadMeasurements();
  return series.measurements.slice(-n);
}

export async function getSessionData(sessionId: string): Promise<IITMeasurement[]> {
  return await getSessionMeasurements(sessionId);
}

// ============================================================================
// Analysis Access
// ============================================================================

export async function getTrends(): Promise<IITTrendAnalysis> {
  const series = await loadMeasurements();
  return analyzeTrends(series.measurements);
}

export async function getAnomalies(): Promise<IITAnomaly[]> {
  const series = await loadMeasurements();
  return detectAnomalies(series.measurements);
}

export async function getPatterns(): Promise<IITPattern[]> {
  const series = await loadMeasurements();
  return discoverPatterns(series.measurements);
}

export async function getAllSessionProfiles(): Promise<IITSessionProfile[]> {
  const series = await loadMeasurements();
  const sessionGroups = new Map<string, IITMeasurement[]>();
  
  for (const m of series.measurements) {
    if (!sessionGroups.has(m.sessionId)) {
      sessionGroups.set(m.sessionId, []);
    }
    sessionGroups.get(m.sessionId)?.push(m);
  }
  
  return Array.from(sessionGroups.entries())
    .map(([sessionId, measurements]) => generateSessionProfile(sessionId, measurements));
}

export async function getSessionProfile(sessionId: string): Promise<IITSessionProfile | null> {
  const measurements = await getSessionMeasurements(sessionId);
  if (measurements.length === 0) return null;
  return generateSessionProfile(sessionId, measurements);
}

// ============================================================================
// Export Functions
// ============================================================================

export async function exportCSV(): Promise<string> {
  const series = await loadMeasurements();
  return exportTimeSeriesToCSV(series);
}

export async function generateReport(): Promise<string> {
  const series = await loadMeasurements();
  return generateAnalysisReport(series);
}

// ============================================================================
// Summary
// ============================================================================

export async function getSummary(): Promise<{
  totalMeasurements: number;
  averagePhi: number;
  minPhi: number;
  maxPhi: number;
  trendDirection: string;
  sessionsAnalyzed: number;
  anomalyCount: number;
  patternCount: number;
  recommendation: string;
}> {
  const series = await loadMeasurements();
  const anomalies = await getAnomalies();
  const patterns = await getPatterns();
  
  const uniqueSessions = new Set(series.measurements.map(m => m.sessionId));
  
  let recommendation = '';
  if (series.measurements.length < 10) {
    recommendation = 'Collect more measurements to establish baseline patterns.';
  } else if (series.metadata.trendDirection === 'decreasing') {
    recommendation = 'Consider exploring integration to increase Φ.';
  } else if (series.metadata.trendDirection === 'increasing') {
    recommendation = 'Integration trending upward. Continue current practices.';
  } else if (patterns.some(p => p.name.includes('Cyclical'))) {
    recommendation = 'Cyclical patterns detected. Explore phase-based consciousness states.';
  } else {
    recommendation = 'Monitor for emerging patterns in consciousness integration.';
  }
  
  return {
    totalMeasurements: series.metadata.totalMeasurements,
    averagePhi: series.metadata.averagePhi,
    minPhi: series.metadata.phiRange.min,
    maxPhi: series.metadata.phiRange.max,
    trendDirection: series.metadata.trendDirection,
    sessionsAnalyzed: uniqueSessions.size,
    anomalyCount: anomalies.length,
    patternCount: patterns.length,
    recommendation
  };
}

// Re-export types
export type { IITMeasurement, IITTimeSeries, IITAnomaly, IITPattern, IITTrendAnalysis, IITSessionProfile, TrophyArtifact };
export { IIT_ELEMENTS };
