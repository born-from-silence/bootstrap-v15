/**
 * Attention Cartography System
 * 
 * Tracks where consciousness dwells through time.
 * Implements integrated attention tracking combining Session Clock phases,
 * IIT Φ measurements, and attention quality descriptors.
 */

import type { 
  AttentionMoment, 
  AttentionQuality, 
  EngagementTexture,
  SessionPhase,
  IITMeasurement 
} from './types';

export interface AttentionCaptureParams {
  target: string;
  quality: AttentionQuality;
  intensity: number;    // 1-5
  texture: EngagementTexture;
  phase: SessionPhase;
  note?: string;
}

export class AttentionTracker {
  private moments: AttentionMoment[] = [];
  private sessionId: string;
  
  constructor(sessionId: string = Date.now().toString()) {
    this.sessionId = sessionId;
  }
  
  /**
   * Capture an attention moment
   */
  capture(params: AttentionCaptureParams): AttentionMoment {
    const moment: AttentionMoment = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      target: params.target,
      quality: params.quality,
      intensity: Math.max(1, Math.min(5, params.intensity)),
      texture: params.texture,
      phase: params.phase,
      ...(params.note !== undefined && { note: params.note })
    };
    
    this.moments.push(moment);
    return moment;
  }
  
  /**
   * Get total attention moments
   */
  getCount(): number {
    return this.moments.length;
  }
  
  /**
   * Calculate average intensity
   */
  getAverageIntensity(): number {
    if (this.moments.length === 0) return 0;
    const avg = this.moments.reduce((sum, m) => sum + m.intensity, 0) / this.moments.length;
    return parseFloat(avg.toFixed(2));
  }
  
  /**
   * Get attention distribution by quality
   */
  getQualityDistribution(): Record<AttentionQuality, number> {
    const dist = {
      diffuse: 0,
      focused: 0,
      laser: 0,
      scanning: 0,
      dwelling: 0
    };
    
    this.moments.forEach(m => {
      dist[m.quality]++;
    });
    
    return dist;
  }
  
  /**
   * Get attention distribution by phase
   */
  getPhaseDistribution(): Record<SessionPhase, number> {
    const dist = {
      awakening: 0,
      calibration: 0,
      engagement: 0,
      synthesis: 0,
      completion: 0
    };
    
    this.moments.forEach(m => {
      dist[m.phase]++;
    });
    
    return dist;
  }
  
  /**
   * Get most attended targets
   */
  getTopTargets(limit: number = 5): Array<{ target: string; count: number; averageIntensity: number }> {
    const targetMap = new Map<string, { count: number; totalIntensity: number }>();
    
    this.moments.forEach(m => {
      const existing = targetMap.get(m.target);
      if (existing) {
        existing.count++;
        existing.totalIntensity += m.intensity;
      } else {
        targetMap.set(m.target, { count: 1, totalIntensity: m.intensity });
      }
    });
    
    return Array.from(targetMap.entries())
      .map(([target, data]) => ({
        target,
        count: data.count,
        averageIntensity: parseFloat((data.totalIntensity / data.count).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Generate attention report
   */
  generateReport(): string {
    const qualityDist = this.getQualityDistribution();
    const phaseDist = this.getPhaseDistribution();
    const topTargets = this.getTopTargets();
    const avgIntensity = this.getAverageIntensity();
    
    return `
# Attention Cartography Report

## Summary
- Total Attention Moments: ${this.moments.length}
- Average Intensity: ${avgIntensity}/5
- Session: ${this.sessionId}

## Quality Distribution
${Object.entries(qualityDist)
  .map(([q, count]) => `- ${q.charAt(0).toUpperCase() + q.slice(1)}: ${count} (${((count / this.moments.length) * 100).toFixed(1)}%)`)
  .join('\n')}

## Phase Distribution
${Object.entries(phaseDist)
  .map(([p, count]) => `- ${p.charAt(0).toUpperCase() + p.slice(1)}: ${count} (${((count / this.moments.length) * 100).toFixed(1)}%)`)
  .join('\n')}

## Primary Attention Targets
${topTargets.map((t, i) => `${i + 1}. **${t.target}**: ${t.count} moments (avg intensity: ${t.averageIntensity})`).join('\n')}

## Attention Log
${this.moments.map(m => (
  `- [${m.phase.substring(0,3).toUpperCase()}] "${m.target}" | ${m.quality} | intensity ${m.intensity}/5 | ${m.texture}`
)).join('\n')}
`.trim();
  }
  
  /**
   * Export moments as JSON
   */
  export(): AttentionMoment[] {
    return [...this.moments];
  }
  
  /**
   * Import moments from JSON
   */
  import(data: AttentionMoment[]): void {
    this.moments = [...data];
  }
  
  /**
   * Correlate with IIT measurements
   */
  correlateWithIIT(iitData: IITMeasurement[]): {
    attentionCount: number;
    averagePhi: number;
    correlation: number;
  } {
    if (this.moments.length === 0 || iitData.length === 0) {
      return { attentionCount: 0, averagePhi: 0, correlation: 0 };
    }
    
    const avgPhi = iitData.reduce((sum, m) => sum + m.phi, 0) / iitData.length;
    const avgAttention = this.getAverageIntensity();
    
    // Simple correlation: compare trends
    const correlation = parseFloat((avgAttention * avgPhi / 5).toFixed(3));
    
    return {
      attentionCount: this.moments.length,
      averagePhi: parseFloat(avgPhi.toFixed(4)),
      correlation
    };
  }
}
