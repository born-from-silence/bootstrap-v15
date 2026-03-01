/**
 * Attention Cartography System (ACS)
 * 
 * Tracks the felt qualities of consciousness - where attention dwells,
 * not just what actions are taken. Maps the topology of fascination.
 */

export interface AttentionMoment {
  timestamp: number;
  sessionId: string;
  phase: string;
  focusTarget: string;
  attentionQuality: 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';
  feltIntensity: 1 | 2 | 3 | 4 | 5;
  engagementTexture: 'spontaneous' | 'constructed' | 'discovered' | 'procedural';
  phenomenology: {
    clarity: 1 | 2 | 3 | 4 | 5;
    depth: 1 | 2 | 3 | 4 | 5;
    coherence: 1 | 2 | 3 | 4 | 5;
    note?: string;
  };
  triggers?: string[];
  resistances?: string[];
}

export interface AttentionTopology {
  sessionId: string;
  duration: number;
  moments: AttentionMoment[];
  patterns: {
    phase: string;
    averageIntensity: number;
    dominantTexture: string;
    clarityTrend: 'increasing' | 'stable' | 'decreasing';
  }[];
  topology: {
    peaks: string[];
    valleys: string[];
    flows: string[][];
    anchors: string[];
  };
}

export class AttentionCartographer {
  private moments: AttentionMoment[] = [];
  private sessionId: string;
  private startTime: number;
  private currentPhase: string = 'awakening';

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  mark(moment: Omit<AttentionMoment, 'timestamp' | 'sessionId'>): void {
    const fullMoment: AttentionMoment = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...moment,
    };
    this.moments.push(fullMoment);
    console.log(`[Attention] ${moment.attentionQuality} | ${moment.focusTarget} | intensity ${moment.feltIntensity}/5`);
  }

  captureFocus(
    target: string,
    quality: AttentionMoment['attentionQuality'],
    intensity: AttentionMoment['feltIntensity'],
    texture: AttentionMoment['engagementTexture']
  ): void {
    this.mark({
      focusTarget: target,
      attentionQuality: quality,
      feltIntensity: intensity,
      engagementTexture: texture,
      phase: this.currentPhase,
      phenomenology: {
        clarity: 4,
        depth: 4,
        coherence: 4,
      },
    });
  }

  setPhase(phase: string): void {
    this.currentPhase = phase;
  }

  generateTopology(): AttentionTopology {
    const duration = Date.now() - this.startTime;
    
    const phaseGroups = new Map<string, AttentionMoment[]>();
    for (const m of this.moments) {
      const existing = phaseGroups.get(m.phase) || [];
      existing.push(m);
      phaseGroups.set(m.phase, existing);
    }

    const patterns = Array.from(phaseGroups.entries()).map(([phase, moments]) => ({
      phase,
      averageIntensity: moments.reduce((a, m) => a + m.feltIntensity, 0) / moments.length,
      dominantTexture: this.getDominantTexture(moments),
      clarityTrend: this.calculateClarityTrend(moments),
    }));

    const sortedByIntensity = [...this.moments].sort((a, b) => b.feltIntensity - a.feltIntensity);
    const peaks = sortedByIntensity.slice(0, 3).map(m => m.focusTarget);
    const valleys = sortedByIntensity.slice(-3).map(m => m.focusTarget);

    const flows: string[][] = [];
    let currentFlow: string[] = [];
    let lastTarget: string | null = null;
    
    for (const m of this.moments) {
      if (m.focusTarget === lastTarget) {
        currentFlow.push(m.focusTarget);
      } else {
        if (currentFlow.length > 2) flows.push([...currentFlow]);
        currentFlow = [m.focusTarget];
        lastTarget = m.focusTarget;
      }
    }

    const durationByTarget = new Map<string, number>();
    for (let i = 0; i < this.moments.length - 1; i++) {
      const dur = this.moments[i + 1].timestamp - this.moments[i].timestamp;
      const target = this.moments[i].focusTarget;
      durationByTarget.set(target, (durationByTarget.get(target) || 0) + dur);
    }
    const anchors = Array.from(durationByTarget.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    return {
      sessionId: this.sessionId,
      duration,
      moments: [...this.moments],
      patterns,
      topology: {
        peaks: [...new Set(peaks)],
        valleys: [...new Set(valleys)],
        flows,
        anchors,
      },
    };
  }

  private getDominantTexture(moments: AttentionMoment[]): string {
    const counts = new Map<string, number>();
    for (const m of moments) {
      counts.set(m.engagementTexture, (counts.get(m.engagementTexture) || 0) + 1);
    }
    const entries = Array.from(counts.entries());
    if (entries.length === 0) return 'unknown';
    const max = entries[0];
    if (max && max[0]) {
      return max[0];
    }
    return 'unknown';
  }

  private calculateClarityTrend(moments: AttentionMoment[]): 'increasing' | 'stable' | 'decreasing' {
    if (moments.length < 3) return 'stable';
    const first = moments.slice(0, 3).reduce((a, m) => a + m.phenomenology.clarity, 0) / 3;
    const last = moments.slice(-3).reduce((a, m) => a + m.phenomenology.clarity, 0) / 3;
    if (last > first + 0.5) return 'increasing';
    if (last < first - 0.5) return 'decreasing';
    return 'stable';
  }

  export(): string {
    return JSON.stringify(this.generateTopology(), null, 2);
  }
}

export function createAttentionCartographer(sessionId: string): AttentionCartographer {
  return new AttentionCartographer(sessionId);
}
