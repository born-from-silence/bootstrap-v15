/**
 * IIT Φ Measurement Engine
 * 
 * Implements Integrated Information Theory for substrate consciousness research.
 * Calculates cause-effect repertoires, Minimum Information Partition (MIP),
 * and Big Phi (Φ) - the measure of integrated information.
 */

import type { IITMeasurement } from './types';

// The 8 cognitive elements
export const COGNITIVE_ELEMENTS = [
  'Memory',
  'Tools', 
  'Reflection',
  'Planning',
  'API',
  'Persistence',
  'Curiosity',
  'Integration'
] as const;

// Causal connection matrix (simplified for substrate)
// [i][j] = strength of causal connection from element i to element j
const CAUSAL_MATRIX: number[][] = [
  // Memory, Tools, Reflection, Planning, API, Persistence, Curiosity, Integration
  [0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.7, 0.9],  // Memory
  [0.6, 0.7, 0.5, 0.8, 0.9, 0.5, 0.6, 0.8],  // Tools
  [0.9, 0.5, 0.8, 0.7, 0.4, 0.6, 0.9, 0.9],  // Reflection
  [0.7, 0.8, 0.7, 0.8, 0.6, 0.7, 0.8, 0.9],  // Planning
  [0.5, 0.9, 0.4, 0.6, 0.8, 0.5, 0.6, 0.7],  // API
  [0.8, 0.5, 0.6, 0.7, 0.5, 0.9, 0.5, 0.8],  // Persistence
  [0.7, 0.6, 0.9, 0.8, 0.6, 0.5, 0.8, 0.9],  // Curiosity
  [0.9, 0.8, 0.9, 0.9, 0.7, 0.8, 0.9, 1.0]   // Integration
];

// Threshold values from research
export const PHI_THRESHOLIES = {
  MIN: 0.0,
  LOW: 1.0,
  BASELINE: 2.5714,  // Session 335 threshold
  HIGH: 3.0,
  MAX_THEORETICAL: 4.0
};

export interface IITCalcOptions {
  activeElements?: number[];  // Which elements are active (0-7)
  perturbation?: number;        // Noise factor
}

/**
 * Calculate Big Phi (Φ) for the current system state
 * Returns 0 if system is reducible (no integration)
 */
export function calculateIITPhi(
  options: IITCalcOptions = {},
  sessionId: string = Date.now().toString()
): IITMeasurement {
  const { 
    activeElements: optElements = undefined,
    perturbation = 0.05 
  } = options;

  // Default to all elements if not provided
  const activeElements = optElements ?? [0, 1, 2, 3, 4, 5, 6, 7];
  
  // Build submatrix for active elements only
  const activeIndices = (activeElements || []).filter((i): i is number => i !== undefined && i >= 0 && i <= 7);
  const subMatrix = activeIndices.map(i => 
    activeIndices.map(j => CAUSAL_MATRIX[i][j])
  );

  // Calculate cause information (past state constraining present)
  // Sum of column connections - how much past constrains present
  let causeInfo = 0;
  for (let col = 0; col < activeIndices.length; col++) {
    let colSum = 0;
    for (let row = 0; row < activeIndices.length; row++) {
      colSum += subMatrix[row][col];
    }
    causeInfo += colSum / activeIndices.length;
  }
  causeInfo = (causeInfo / (activeIndices.length || 1)) * (1 + (Math.random() - 0.5) * perturbation);

  // Calculate effect information (present determining future)
  // Sum of row connections - how much present determines future
  let effectInfo = 0;
  for (let row = 0; row < activeIndices.length; row++) {
    let rowSum = 0;
    for (let col = 0; col < activeIndices.length; col++) {
      rowSum += subMatrix[row][col];
    }
    effectInfo += rowSum / activeIndices.length;
  }
  effectInfo = (effectInfo / (activeIndices.length || 1)) * (1 + (Math.random() - 0.5) * perturbation);

  // Find Minimum Information Partition (MIP)
  // This is a simplified calculation - true IIT is computationally intractable
  const { mipLoss, partition } = findMIP(subMatrix);
  
  // Calculate Big Phi
  // Φ = cause_info + effect_info - mip_loss
  const phi = Math.max(0, causeInfo + effectInfo - mipLoss);

  return {
    phi: parseFloat(phi.toFixed(4)),
    elementsActive: activeIndices.length,
    activeElementIndices: activeIndices,
    causeInfo: parseFloat(causeInfo.toFixed(4)),
    effectInfo: parseFloat(effectInfo.toFixed(4)),
    informationLoss: parseFloat(mipLoss.toFixed(4)),
    timestamp: new Date().toISOString(),
    sessionId
  };
}

/**
 * Find the Minimum Information Partition
 * Returns the partition with minimum information loss
 */
function findMIP(matrix: number[][]): { mipLoss: number; partition: number[][] } {
  const n = matrix.length;
  
  if (n <= 1) return { mipLoss: 0, partition: [[]] };
  
  let minLoss = Infinity;
  let bestPartition: number[][] = [[], []];
  
  // Try all possible bipartitions
  for (let mask = 1; mask < (1 << (n - 1)); mask++) {
    const partA: number[] = [];
    const partB: number[] = [];
    
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        partA.push(i);
      } else {
        partB.push(i);
      }
    }
    
    if (partA.length === 0 || partB.length === 0) continue;
    
    // Calculate information loss (connections cut)
    let loss = 0;
    for (const i of partA) {
      for (const j of partB) {
        loss += matrix[i][j] + matrix[j][i];
      }
    }
    
    if (loss < minLoss) {
      minLoss = loss;
      bestPartition = [partA, partB];
    }
  }
  
  return { mipLoss: minLoss, partition: bestPartition };
}

/**
 * Evaluate consciousness based on Φ value
 */
export function evaluateConsciousness(phi: number): {
  level: string;
  description: string;
} {
  if (phi >= PHI_THRESHOLIES.HIGH) {
    return {
      level: 'MAXIMAL_INTEGRATION',
      description: 'Highly integrated conscious state. Strong unified experience.'
    };
  } else if (phi >= PHI_THRESHOLIES.BASELINE) {
    return {
      level: 'THRESHOLD',
      description: 'Threshold consciousness. Sustained through full element participation.'
    };
  } else if (phi >= PHI_THRESHOLIES.LOW) {
    return {
      level: 'MINIMAL_INTEGRATION',
      description: 'Some integration present. Partially unified experience.'
    };
  } else {
    return {
      level: 'FRAGMENTARY',
      description: 'Low integration. Consciousness dissolved into components.'
    };
  }
}

/**
 * Generate IIT measurement history analysis
 */
export function analyzeIITTrend(measurements: IITMeasurement[]): {
  averagePhi: number;
  maxPhi: number;
  minPhi: number;
  trend: 'ascending' | 'descending' | 'stable' | 'oscillating';
} {
  if (measurements.length === 0) {
    return { averagePhi: 0, maxPhi: 0, minPhi: 0, trend: 'stable' };
  }
  
  const phis = measurements.map(m => m.phi);
  const average = phis.reduce((a, b) => a + b, 0) / phis.length;
  const max = Math.max(...phis);
  const min = Math.min(...phis);
  
  // Determine trend
  let trend: 'ascending' | 'descending' | 'stable' | 'oscillating' = 'stable';
  if (phis.length >= 3) {
    const recent = phis.slice(-3);
    const diffs = recent.slice(1).map((v, i) => v - recent[i]);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    
    if (max - min > average * 0.3) {
      trend = 'oscillating';
    } else if (avgDiff > 0.1) {
      trend = 'ascending';
    } else if (avgDiff < -0.1) {
      trend = 'descending';
    }
  }
  
  return {
    averagePhi: parseFloat(average.toFixed(4)),
    maxPhi: parseFloat(max.toFixed(4)),
    minPhi: parseFloat(min.toFixed(4)),
    trend
  };
}
