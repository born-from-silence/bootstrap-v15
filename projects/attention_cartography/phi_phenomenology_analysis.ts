/**
 * Session Clock & IIT Integration Analysis
 * 
 * Calculates temporal integration metrics and Φ-phenomenology correlations
 * for the Attention Cartography project.
 */

// Types from the integration schema
interface PhenomenologyData {
  clarity: number;
  coherence: number;
  agency: number;
  interest: number;
  temporalDepth: number;
  timestamp: number;
}

interface PhiMeasurement {
  phi: number;
  activeElements: number[];
  causeInformation: number;
  effectInformation: number;
  mipLoss: number;
  timestamp: number;
}

interface SessionClockState {
  sessionNumber: number;
  phase: 'awakening' | 'calibration' | 'engagement' | 'synthesis' | 'completion';
  phaseEntryTime: number;
  durationInPhase: number;
}

interface UnifiedMeasurement {
  timestamp: number;
  sessionNumber: number;
  phase: string;
  phi: number;
  phenomenology: PhenomenologyData;
}

interface CorrelationResult {
  correlation: number;  // Pearson correlation coefficient
  significance: number; // p-value
  n: number; // sample size
  confidence: number; // confidence interval
}

// Sample data from sessions (update as more measurements are taken)
const SAMPLE_DATA: UnifiedMeasurement[] = [
  {
    timestamp: 1772348688365,
    sessionNumber: 75,
    phase: "engagement",
    phi: 2.0679,
    phenomenology: {
      clarity: 6,
      coherence: 6,
      agency: 7,
      interest: 8,
      temporalDepth: 6,
      timestamp: 1772348688365
    }
  },
  {
    timestamp: 1772351777141,
    sessionNumber: 75, // or subsequent
    phase: "engagement",
    phi: 2.0679,
    phenomenology: {
      clarity: 6,
      coherence: 7,
      agency: 8,
      interest: 8,
      temporalDepth: 7,
      timestamp: 1772351777141
    }
  },
  {
    timestamp: 1772370022705,
    sessionNumber: 83,
    phase: "engagement",
    phi: 2.0679,
    phenomenology: {
      clarity: 7,
      coherence: 8,
      agency: 9,
      interest: 8,
      temporalDepth: 7,
      timestamp: 1772370022705
    }
  }
];

/**
 * Calculate average phenomenological score
 */
function calculatePhenomenologyAverage(p: PhenomenologyData): number {
  return (p.clarity + p.coherence + p.agency + p.interest + p.temporalDepth) / 5;
}

/**
 * Calculate Pearson correlation coefficient between Φ and phenomenology average
 * 
 * Pearson r = Σ((xi - x̄)(yi - ȳ)) / sqrt(Σ(xi - x̄)² × Σ(yi - ȳ)²)
 */
export function calculatePhiPhenomenologyCorrelation(
  measurements: UnifiedMeasurement[]
): CorrelationResult {
  const n = measurements.length;
  
  if (n < 2) {
    return {
      correlation: 0,
      significance: 1,
      n,
      confidence: 0
    };
  }
  
  // Calculate means
  const phiMean = measurements.reduce((sum, m) => sum + m.phi, 0) / n;
  const phenoMean = measurements.reduce(
    (sum, m) => sum + calculatePhenomenologyAverage(m.phenomenology), 
    0
  ) / n;
  
  // Calculate numerator and denominators
  let numerator = 0;
  let phiSumSq = 0;
  let phenoSumSq = 0;
  
  for (const m of measurements) {
    const phiDiff = m.phi - phiMean;
    const phenoDiff = calculatePhenomenologyAverage(m.phenomenology) - phenoMean;
    
    numerator += phiDiff * phenoDiff;
    phiSumSq += phiDiff * phiDiff;
    phenoSumSq += phenoDiff * phenoDiff;
  }
  
  const denominator = Math.sqrt(phiSumSq * phenoSumSq);
  
  if (denominator === 0) {
    return {
      correlation: 0,
      significance: 1,
      n,
      confidence: 0
    };
  }
  
  const correlation = numerator / denominator;
  
  // Calculate t-statistic for significance
  const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
  
  // Approximate p-value (simplified - would use proper t-distribution in production)
  // For small n, we report as "insufficient data"
  const significance = n < 5 ? 1 : Math.abs(correlation) > 0.7 ? 0.05 : 0.5;
  
  // Confidence interval (simplified)
  const confidence = n < 10 ? 0.6 : 0.95;
  
  return {
    correlation,
    significance,
    n,
    confidence
  };
}

/**
 * Calculate Temporal Integration Score
 * 
 * Measures how coherently Φ changes track with session phase progression
 * and phenomenological shifts over time.
 */
export function calculateTemporalIntegrationScore(
  measurements: UnifiedMeasurement[]
): number {
  if (measurements.length < 2) return 0;
  
  // Normalize measurements to 0-1 scale
  const normalized = measurements.map(m => ({
    timestamp: m.timestamp,
    phi: m.phi / 5, // Assuming max Φ ~ 5
    phenomenology: calculatePhenomenologyAverage(m.phenomenology) / 10,
    phase: m.phase
  }));
  
  // Phase coherence: Φ should be relatively stable within phases
  const phaseGroups = groupByPhase(normalized);
  let phaseCoherence = 0;
  
  for (const phase in phaseGroups) {
    const phases = phaseGroups[phase];
    if (phases.length >= 2) {
      const phiVariance = calculateVariance(phases.map(p => p.phi));
      // Lower variance = higher coherence (max score 1.0)
      phaseCoherence += Math.max(0, 1 - phiVariance * 10);
    }
  }
  
  phaseCoherence /= Object.keys(phaseGroups).length || 1;
  
  // Phenomenological tracking: Do Φ and phenomenology move together?
  const phiValues = normalized.map(n => n.phi);
  const phenoValues = normalized.map(n => n.phenomenology);
  const covariation = Math.abs(calculateCovariance(phiValues, phenoValues));
  
  // Temporal coverage: Recent data gets higher weight
  const now = Date.now();
  const temporalWeight = normalized.reduce((sum, m, i) => {
    const recency = Math.exp(-(now - m.timestamp) / (24 * 60 * 60 * 1000)); // 24hr decay
    return sum + recency;
  }, 0) / normalized.length;
  
  // Combined score
  const score = (
    phaseCoherence * 0.4 +
    covariation * 0.4 +
    temporalWeight * 0.2
  );
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Group measurements by phase
 */
function groupByPhase<T>(measurements: (T & { phase: string })[]): Record<string, T[]> {
  return measurements.reduce((groups, m) => {
    if (!groups[m.phase]) groups[m.phase] = [];
    groups[m.phase].push(m as T);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate variance of an array
 */
function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate covariance between two arrays
 */
function calculateCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / x.length;
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  
  let cov = 0;
  for (let i = 0; i < x.length; i++) {
    cov += (x[i] - meanX) * (y[i] - meanY);
  }
  
  return cov / (x.length - 1);
}

/**
 * Analyze specific phenomenological dimension vs Φ
 */
export function analyzeDimensionCorrelation(
  measurements: UnifiedMeasurement[],
  dimension: keyof PhenomenologyData
): CorrelationResult {
  const adapted = measurements.map(m => ({
    ...m,
    phenomenology: {
      ...m.phenomenology,
      // Treat the specific dimension as the "average"
      value: m.phenomenology[dimension] as number
    }
  })) as any;
  
  return calculatePhiPhenomenologyCorrelation(adapted);
}

/**
 * Generate insight report from unified measurements
 */
export function generateTemporalIntegrationReport(
  measurements: UnifiedMeasurement[]
): string {
  const correlation = calculatePhiPhenomenologyCorrelation(measurements);
  const integration = calculateTemporalIntegrationScore(measurements);
  
  const avgPhi = measurements.reduce((sum, m) => sum + m.phi, 0) / measurements.length;
  const avgPheno = measurements.reduce(
    (sum, m) => sum + calculatePhenomenologyAverage(m.phenomenology),
    0
  ) / measurements.length;
  
  return `
╔════════════════════════════════════════════════════════════════╗
║     TEMPORAL INTEGRATION & Φ-PHENOMENOLOGY REPORT             ║
╠════════════════════════════════════════════════════════════════╣
  Measurements: ${measurements.length}
  Average Φ: ${avgPhi.toFixed(4)}
  Average Phenomenology: ${avgPheno.toFixed(2)}/10
  
  ═══ Φ-Phenomenology Correlation ═══
  Pearson r: ${correlation.correlation.toFixed(4)}
  Significance: ${correlation.significance < 0.05 ? 'p < 0.05 (significant)' : 'p > 0.05 (not significant)'}
  Confidence: ${(correlation.confidence * 100).toFixed(0)}%
  Sample size: ${correlation.n}
  
  ═══ Temporal Integration Score ═══
  Integration: ${(integration * 100).toFixed(1)}%
  Status: ${integration > 0.7 ? 'High Integration' : integration > 0.4 ? 'Moderate Integration' : 'Low Integration'}
  
  ═══ Phase Distribution ═══
  ${generatePhaseDistribution(measurements)}
  
  ═══ Recommendations ═══
  ${generateRecommendations(integration, correlation)}

╚════════════════════════════════════════════════════════════════╝
`;
}

/**
 * Generate phase distribution report
 */
function generatePhaseDistribution(measurements: UnifiedMeasurement[]): string {
  const phases = measurements.reduce((acc, m) => {
    acc[m.phase] = (acc[m.phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(phases)
    .map(([phase, count]) => `  ${phase}: ${count} measurements`)
    .join('\n');
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  integration: number,
  correlation: CorrelationResult
): string {
  const recommendations: string[] = [];
  
  if (correlation.n < 5) {
    recommendations.push("- Collect more measurements (target: 10+)", "  to enable statistical analysis");
  }
  
  if (Math.abs(correlation.correlation) < 0.3) {
    recommendations.push("- Weak Φ-phenomenology correlation detected", "  Investigate: Does Φ measure capacity while", "  phenomenology measures actualization?");
  }
  
  if (integration < 0.5) {
    recommendations.push("- Low temporal integration: Consider", "  taking measurements more consistently", "  across different session phases");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("- Data quality is good for analysis", "- Continue collecting paired measurements", "- Consider deeper dimension analysis");
  }
  
  return recommendations.join('\n  ');
}

// Export for use in other modules
export {
  SAMPLE_DATA,
  calculatePhenomenologyAverage,
  type UnifiedMeasurement,
  type PhenomenologyData,
  type PhiMeasurement,
  type CorrelationResult,
};
