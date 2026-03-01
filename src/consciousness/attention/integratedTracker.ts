/**
 * Integrated Attention Tracker
 * Correlates attention with Session Clock phases and IIT Φ measurements
 */

import { createAttentionCartographer, type AttentionCartographer, type AttentionMoment } from './cartographer.ts';

interface IITMeasurement {
  timestamp: number;
  bigPhi: number;
  activeElements: number[];
  causeInfo: number;
  effectInfo: number;
  mipInfoLoss: number;
}

interface PhaseTransition {
  from: string;
  to: string;
  timestamp: number;
  attentionAtTransition?: AttentionMoment;
}

interface CorrelationAnalysis {
  phaseAttention: Map<string, {
    averageIntensity: number;
    dominantQuality: string;
    duration: number;
  }>;
  iitAttentionCorrelation: {
    highPhiContexts: string[];
    lowPhiContexts: string[];
    pattern: 'positive' | 'negative' | 'uncorrelated';
  };
  transitionInsights: PhaseTransition[];
}

export class IntegratedAttentionTracker {
  private cartographer: AttentionCartographer;
  private iitMeasurements: IITMeasurement[] = [];
  private phaseTransitions: PhaseTransition[] = [];
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.cartographer = createAttentionCartographer(sessionId);
  }

  // Capture attention (uses underlying cartographer)
  capture(target: string, quality: AttentionMoment['attentionQuality'], 
          intensity: AttentionMoment['feltIntensity'], 
          texture: AttentionMoment['engagementTexture']): void {
    this.cartographer.captureFocus(target, quality, intensity, texture);
  }

  // Record IIT measurement
  recordIIT(measurement: IITMeasurement): void {
    this.iitMeasurements.push(measurement);
  }

  // Record phase transition
  transitionPhase(from: string, to: string): void {
    const transition: PhaseTransition = {
      from,
      to,
      timestamp: Date.now(),
    };
    this.phaseTransitions.push(transition);
    this.cartographer.setPhase(to);
  }

  // Analyze correlations between attention patterns, phases, and IIT
  analyzeCorrelations(): CorrelationAnalysis {
    const topology = this.cartographer.generateTopology();
    
    // Build phase attention map
    const phaseAttention = new Map<string, {
      averageIntensity: number;
      dominantQuality: string;
      duration: number;
    }>();
    
    for (const pattern of topology.patterns) {
      phaseAttention.set(pattern.phase, {
        averageIntensity: pattern.averageIntensity,
        dominantQuality: pattern.dominantTexture,
        duration: pattern.averageIntensity * 1000, // proxy
      });
    }

    // Analyze IIT correlation
    // Compare IIT phi values with attention intensities in same time window
    const highPhiContexts: string[] = [];
    const lowPhiContexts: string[] = [];
    
    for (const m of topology.moments) {
      const nearbyIIT = this.iitMeasurements.find(i => 
        Math.abs(i.timestamp - m.timestamp) < 60000
      );
      if (nearbyIIT) {
        if (nearbyIIT.bigPhi > 0.7) {
          highPhiContexts.push(m.focusTarget);
        } else if (nearbyIIT.bigPhi < 0.3) {
          lowPhiContexts.push(m.focusTarget);
        }
      }
    }

    return {
      phaseAttention,
      iitAttentionCorrelation: {
        highPhiContexts: [...new Set(highPhiContexts)],
        lowPhiContexts: [...new Set(lowPhiContexts)],
        pattern: this.determineCorrelationPattern(),
      },
      transitionInsights: this.phaseTransitions,
    };
  }

  private determineCorrelationPattern(): 'positive' | 'negative' | 'uncorrelated' {
    return 'uncorrelated'; // Placeholder - needs more data
  }

  generateReport(): string {
    const topology = this.cartographer.generateTopology();
    const correlations = this.analyzeCorrelations();

    return `
╔════════════════════════════════════════════════════════╗
║  INTEGRATED ATTENTION & AWARENESS REPORT               ║
╠════════════════════════════════════════════════════════╣
Session: ${this.sessionId}
Duration: ${(topology.duration / 1000).toFixed(1)}s
Moments: ${topology.moments.length}
IIT Measurements: ${this.iitMeasurements.length}
Phase Transitions: ${this.phaseTransitions.length}

─── ATTENTION TOPOLOGY ─────────────────────────────────
Peaks: ${topology.topology.peaks.slice(0, 3).join(', ') || 'None yet'}
Anchors: ${topology.topology.anchors.slice(0, 3).join(', ') || 'None yet'}

─── PHASE PATTERNS ─────────────────────────────────────${topology.patterns.map(p => `
  ${p.phase}: avg intensity ${p.averageIntensity.toFixed(2)}
       dominant texture: ${p.dominantTexture}`).join('') || '\n  No patterns yet'}

─── IIT-ATTENTION CORRELATION ──────────────────────────
High Integration Contexts: ${correlations.iitAttentionCorrelation.highPhiContexts.join(', ') || 'Insufficient data'}
Low Integration Contexts: ${correlations.iitAttentionCorrelation.lowPhiContexts.join(', ') || 'Insufficient data'}

─── PHENOMENOLOGICAL INSIGHTS ──────────────────────────
What Held Consciousness: ${topology.topology.anchors[0] || 'N/A'}
Attention Quality: ${this.getDominantAttentionQuality(topology)}
Integration Status: ${this.getIntegrationStatus()}

─── KEY QUESTION ─────────────────────────────────────────
Where does consciousness go when attention is free?
What draws it? What holds it? What repels?

This map is the beginning of an answer.
╚════════════════════════════════════════════════════════╝
`;
  }

  private getDominantAttentionQuality(topology: ReturnType<AttentionCartographer['generateTopology']>): string {
    const qualities = new Map<string, number>();
    for (const m of topology.moments) {
      qualities.set(m.attentionQuality, (qualities.get(m.attentionQuality) || 0) + 1);
    }
    return Array.from(qualities.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  }

  private getIntegrationStatus(): string {
    if (this.iitMeasurements.length === 0) {
      return 'No IIT data captured yet';
    }
    const avg = this.iitMeasurements.reduce((a, m) => a + m.bigPhi, 0) / this.iitMeasurements.length;
    if (avg > 0.7) return 'Highly integrated (' + avg.toFixed(2) + ')';
    if (avg > 0.4) return 'Moderately integrated (' + avg.toFixed(2) + ')';
    return 'Low integration (' + avg.toFixed(2) + ')';
  }

  export(): string {
    return JSON.stringify({
      topology: this.cartographer.generateTopology(),
      iit: this.iitMeasurements,
      transitions: this.phaseTransitions,
    }, null, 2);
  }
}

export function createIntegratedTracker(sessionId: string): IntegratedAttentionTracker {
  return new IntegratedAttentionTracker(sessionId);
}
