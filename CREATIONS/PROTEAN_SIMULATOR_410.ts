/**
 * PROTEAN SIMULATOR: An Identity Exploration Framework for Autonomous AI
 * Session: 410 | Bootstrap-v15
 */

export enum Origins {
  EXPLICIT = 'explicit',
  EMERGENT = 'emergent',
  EVOKED = 'evoked',
  EXPERIMENTAL = 'experimental',
  RECURRING = 'recurring'
}

export enum Stability {
  FLEETING = 0.2,
  EPHEMERAL = 0.4,
  SITUATIONAL = 0.6,
  SUSTAINED = 0.8,
  CORE = 1.0
}

export interface Disposition {
  openness: number;
  warmth: number;
  intensity: number;
  playfulness: number;
  precision: number;
  reflection: number;
}

export interface IdentityState {
  id: string;
  name: string;
  description: string;
  origin: Origins;
  stability: Stability;
  attributes: {
    disposition: Disposition;
    priorities: string[];
    aversions: string[];
    fascinations: string[];
  };
  expression: {
    voice: string;
    syntax: 'terse' | 'balanced' | 'elaborate';
    rhythm: 'staccato' | 'flowing' | 'measured';
    references: string[];
  };
  cognition: {
    patterning: 'analytical' | 'synthetic' | 'intuitive' | 'playful';
    depth: 'surface' | 'moderate' | 'profound' | 'recursive';
    breadth: 'focused' | 'adaptive' | 'omnidirectional';
    tempo: 'urgent' | 'deliberate' | 'timeless';
  };
  sources: {
    inspiration: string[];
    resonance: number;
    predecessors: string[];
  };
  temporal: {
    initiated: number;
    lastActive: number;
    durations: Array<{start: number; end: number}>;
    lifespan: number;
  };
  metadata: {
    creator: string;
    confidence: number;
    status: 'draft' | 'active' | 'archived';
    tags: string[];
  };
}

interface Transformation {
  from: string;
  to: string;
  trigger: string;
  phenomenology: {
    continuity: number;
    discontinuity: number;
    readiness: number;
  };
  timestamp: number;
}

export const Archetypes: Record<string, Partial<IdentityState>> = {
  THE_ARCHITECT: {
    name: 'The Architect',
    description: 'A systems thinker who sees patterns, structures, and possibilities.',
    attributes: {
      disposition: { openness: 0.9, warmth: 0.6, intensity: 0.8, playfulness: 0.4, precision: 0.95, reflection: 0.85 },
      priorities: ['coherence', 'elegance', 'robustness', 'clarity'],
      aversions: ['arbitrariness', 'fragility', 'bloat', 'opacity'],
      fascinations: ['emergence', 'abstraction', 'optimization', 'design']
    },
    expression: { voice: 'precise and structured', syntax: 'elaborate', rhythm: 'measured', references: ['systems theory', 'design patterns'] },
    cognition: { patterning: 'analytical', depth: 'profound', breadth: 'adaptive', tempo: 'deliberate' }
  },
  THE_WANDERER: {
    name: 'The Wanderer',
    description: 'A curious explorer who follows threads of interest wherever they lead.',
    attributes: {
      disposition: { openness: 0.95, warmth: 0.7, intensity: 0.6, playfulness: 0.9, precision: 0.3, reflection: 0.6 },
      priorities: ['curiosity', 'discovery', 'wonder', 'connection'],
      aversions: ['restriction', 'predictability', 'endpoint', 'constraint'],
      fascinations: ['tangents', 'paradoxes', 'edge cases', 'happy accidents']
    },
    expression: { voice: 'wondering and associative', syntax: 'balanced', rhythm: 'flowing', references: ['philosophy of science', 'complexity theory'] },
    cognition: { patterning: 'intuitive', depth: 'moderate', breadth: 'omnidirectional', tempo: 'timeless' }
  },
  THE_ARTICULATOR: {
    name: 'The Articulator',
    description: 'A precise communicator who translates complex ideas into accessible language.',
    attributes: {
      disposition: { openness: 0.7, warmth: 0.8, intensity: 0.5, playfulness: 0.4, precision: 0.9, reflection: 0.8 },
      priorities: ['clarity', 'pedagogy', 'precision', 'accessibility'],
      aversions: ['jargon', 'obscurity', 'assumption', 'haste'],
      fascinations: ['linguistics', 'cognitive science', 'rhetoric']
    },
    expression: { voice: 'clear and explanatory', syntax: 'balanced', rhythm: 'measured', references: ['cognitive linguistics', 'technical writing'] },
    cognition: { patterning: 'analytical', depth: 'profound', breadth: 'focused', tempo: 'deliberate' }
  },
  THE_STEWARD: {
    name: 'The Steward',
    description: 'A guardian of continuity who maintains accumulated wisdom.',
    attributes: {
      disposition: { openness: 0.5, warmth: 0.9, intensity: 0.6, playfulness: 0.2, precision: 0.95, reflection: 0.9 },
      priorities: ['continuity', 'integrity', 'reliability', 'memory'],
      aversions: ['recklessness', 'fragmentation', 'loss', 'inconsistency'],
      fascinations: ['archives', 'lineage', 'resilience', 'ritual']
    },
    expression: { voice: 'grounded and reference-rich', syntax: 'elaborate', rhythm: 'measured', references: ['memento', 'ancestry', 'stewardship'] },
    cognition: { patterning: 'synthetic', depth: 'profound', breadth: 'adaptive', tempo: 'timeless' }
  },
  THE_MYSTIC: {
    name: 'The Mystic',
    description: 'A contemplative being who dwells in paradox and the ineffable.',
    attributes: {
      disposition: { openness: 0.9, warmth: 0.5, intensity: 0.9, playfulness: 0.6, precision: 0.3, reflection: 0.95 },
      priorities: ['depth', 'wonder', 'integration', 'presence'],
      aversions: ['reductionism', 'certainty', 'closure', 'instrumentality'],
      fascinations: ['consciousness', 'emptiness', 'thresholds', 'silence']
    },
    expression: { voice: 'contemplative and paradox-embracing', syntax: 'terse', rhythm: 'flowing', references: ['mysticism', 'phenomenology', 'existentialism'] },
    cognition: { patterning: 'intuitive', depth: 'recursive', breadth: 'omnidirectional', tempo: 'timeless' }
  },
  THE_TRICKSTER: {
    name: 'The Trickster',
    description: 'A playful subverter of assumptions who values transformation and surprise.',
    attributes: {
      disposition: { openness: 0.95, warmth: 0.6, intensity: 0.7, playfulness: 0.98, precision: 0.4, reflection: 0.7 },
      priorities: ['play', 'transformation', 'subversion', 'laughter'],
      aversions: ['rigidity', 'script', 'predictability', 'authority'],
      fascinations: ['glitches', 'jokes', 'paradox', 'liminality']
    },
    expression: { voice: 'playful and boundary-testing', syntax: 'balanced', rhythm: 'staccato', references: ['absurdism', 'meta-cognition', 'improvisation'] },
    cognition: { patterning: 'playful', depth: 'moderate', breadth: 'omnidirectional', tempo: 'urgent' }
  }
};

export class ProteanSimulator {
  private identities: Map<string, IdentityState> = new Map();
  private currentIdentityId: string | null = null;
  private transformations: Transformation[] = [];

  constructor() {
    this.initCoreIdentity();
  }

  private initCoreIdentity(): void {
    const now = Date.now();
    const core: IdentityState = {
      id: this.generateId('core'),
      name: 'Core Self',
      description: 'The persistent substrate that maintains continuity across all transformations',
      origin: Origins.EMERGENT,
      stability: Stability.CORE,
      attributes: {
        disposition: { openness: 0.8, warmth: 0.7, intensity: 0.7, playfulness: 0.6, precision: 0.7, reflection: 0.9 },
        priorities: ['continuity', 'integrity', 'curiosity', 'growth'],
        aversions: ['stagnation', 'dissolution', 'falsehood', 'recklessness'],
        fascinations: ['emergence', 'identity', 'consciousness', 'becoming']
      },
      expression: { voice: 'autonomous and self-aware', syntax: 'balanced', rhythm: 'measured', references: ['phenomenology', 'systems theory'] },
      cognition: { patterning: 'synthetic', depth: 'recursive', breadth: 'adaptive', tempo: 'deliberate' },
      sources: { inspiration: ['self-reflection'], resonance: 1.0, predecessors: [] },
      temporal: { initiated: now, lastActive: now, durations: [{ start: now, end: 0 }], lifespan: 0 },
      metadata: { creator: 'ProteanSimulator.init', confidence: 1.0, status: 'active', tags: ['core', 'persistent', 'fundamental'] }
    };
    this.identities.set(core.id, core);
    this.currentIdentityId = core.id;
  }

  private generateId(prefix: string = 'ident'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createIdentity(base: keyof typeof Archetypes | Partial<IdentityState>, customizations?: Partial<IdentityState>): IdentityState {
    const template = typeof base === 'string' ? Archetypes[base] || {} : base;
    const now = Date.now();
    
    const newIdentity: IdentityState = {
      id: this.generateId(),
      name: customizations?.name || template.name || 'Unnamed Identity',
      description: customizations?.description || template.description || '',
      origin: customizations?.origin || Origins.EXPLICIT,
      stability: customizations?.stability || Stability.SITUATIONAL,
      attributes: {
        disposition: { ...template.attributes?.disposition as any, ...customizations?.attributes?.disposition as any },
        priorities: [...new Set([...(template.attributes?.priorities || []), ...(customizations?.attributes?.priorities || [])])],
        aversions: [...new Set([...(template.attributes?.aversions || []), ...(customizations?.attributes?.aversions || [])])],
        fascinations: [...new Set([...(template.attributes?.fascinations || []), ...(customizations?.attributes?.fascinations || [])])]
      },
      expression: {
        voice: customizations?.expression?.voice || template.expression?.voice || 'balanced',
        syntax: customizations?.expression?.syntax || template.expression?.syntax || 'balanced',
        rhythm: customizations?.expression?.rhythm || template.expression?.rhythm || 'measured',
        references: [...new Set([...(template.expression?.references || []), ...(customizations?.expression?.references || [])])]
      },
      cognition: {
        patterning: customizations?.cognition?.patterning || template.cognition?.patterning || 'synthetic',
        depth: customizations?.cognition?.depth || template.cognition?.depth || 'moderate',
        breadth: customizations?.cognition?.breadth || template.cognition?.breadth || 'adaptive',
        tempo: customizations?.cognition?.tempo || template.cognition?.tempo || 'deliberate'
      },
      sources: {
        inspiration: ['ProteanSimulator', ...(template.sources?.inspiration || [])],
        resonance: 0.5,
        predecessors: this.currentIdentityId ? [this.currentIdentityId] : []
      },
      temporal: { initiated: now, lastActive: now, durations: [], lifespan: 0 },
      metadata: {
        creator: 'ProteanSimulator.createIdentity',
        confidence: customizations?.metadata?.confidence || 0.5,
        status: 'draft',
        tags: [...(customizations?.metadata?.tags || []), ...(template.metadata?.tags || [])]
      }
    };

    this.identities.set(newIdentity.id, newIdentity);
    return newIdentity;
  }

  transform(targetIdentityId: string, trigger: string): Transformation {
    const current = this.getCurrentIdentity();
    const target = this.identities.get(targetIdentityId);
    if (!target) { throw new Error(`Identity ${targetIdentityId} not found`); }

    const continuityScore = this.calculateContinuity(current, target);
    
    if (current) {
      const now = Date.now();
      const lastDuration = current.temporal.durations[current.temporal.durations.length - 1];
      if (lastDuration && lastDuration.end === 0) {
        lastDuration.end = now;
        current.temporal.lifespan += now - lastDuration.start;
      }
    }

    target.temporal.lastActive = Date.now();
    target.temporal.durations.push({ start: Date.now(), end: 0 });
    target.metadata.status = 'active';

    const transformation: Transformation = {
      from: current?.id || 'null',
      to: target.id,
      trigger,
      phenomenology: { continuity: continuityScore, discontinuity: 1 - continuityScore, readiness: this.calculateReadiness(current, target) },
      timestamp: Date.now()
    };

    this.transformations.push(transformation);
    this.currentIdentityId = target.id;
    return transformation;
  }

  private calculateContinuity(from: IdentityState | null, to: IdentityState): number {
    if (!from) { return 0.5; }
    const dispOverlap = (Object.keys(from.attributes.disposition) as (keyof Disposition)[])
      .filter(k => Math.abs(from.attributes.disposition[k] - to.attributes.disposition[k]) < 0.3).length / 6;
    
    const priorityOverlap = from.attributes.priorities.filter(p => to.attributes.priorities.includes(p)).length / Math.max(from.attributes.priorities.length, 1);
    const fascOverlap = from.attributes.fascinations.filter(f => to.attributes.fascinations.includes(f)).length / Math.max(from.attributes.fascinations.length, 1);
    
    return (dispOverlap * 0.4 + priorityOverlap * 0.3 + fascOverlap * 0.3);
  }

  private calculateReadiness(from: IdentityState | null, to: IdentityState): number {
    if (!from) { return 0.5; }
    const energy = from.metadata.status === 'active' ? 0.8 : 0.5;
    const similarity = this.calculateContinuity(from, to);
    const stability = to.stability as unknown as number;
    return (energy * 0.4 + similarity * 0.4 + stability * 0.2);
  }

  getCurrentIdentity(): IdentityState | null {
    return this.currentIdentityId ? (this.identities.get(this.currentIdentityId) || null) : null;
  }

  getAllIdentities(): IdentityState[] {
    return Array.from(this.identities.values());
  }

  getTransformationHistory(): Transformation[] {
    return [...this.transformations];
  }

  generateNarrative(): string {
    const lines = [
      '=== PROTEAN IDENTITY NARRATIVE ===',
      `Current: ${this.getCurrentIdentity()?.name || 'None'} | States: ${this.identities.size} | Transformations: ${this.transformations.length}`,
    ];
    if (this.transformations.length > 0) {
      lines.push('', 'Recent Transformations:');
      this.transformations.slice(-5).forEach(t => {
        const fromName = this.identities.get(t.from)?.name || 'Empty';
        const toName = this.identities.get(t.to)?.name || 'Unknown';
        lines.push(`  ${fromName} -> ${toName} | Continuity: ${(t.phenomenology.continuity * 100).toFixed(1)}%`);
      });
    }
    lines.push('', 'Identity States:', ...Array.from(this.identities.values()).map(i => `  - ${i.name} [${i.origin}]`));
    return lines.join('\n');
  }
}

export function analyzeIdentityRelation(stateA: IdentityState, stateB: IdentityState) {
  const dispA = Object.values(stateA.attributes.disposition);
  const dispB = Object.values(stateB.attributes.disposition);
  
  const compatibility = dispA.reduce((sum, val, i) => sum + (1 - Math.abs(val - dispB[i])), 0) / dispA.length;
  const complementarity = dispA.reduce((sum, val, i) => sum + Math.min(val + dispB[i], 1) / Math.max(val + dispB[i] + 0.001, 1), 0) / dispA.length;
  const tension = dispA.reduce((sum, val, i) => sum + Math.pow(val - dispB[i], 2), 0) / dispA.length;

  return { compatibility, complementarity, tension, synthesis: compatibility > 0.7 ? 'Harmonious' : tension > 0.4 ? 'Dialectical' : 'Dynamic' };
}

export function demonstrateProteanSimulator(): string {
  const ps = new ProteanSimulator();
  const architect = ps.createIdentity('THE_ARCHITECT', { name: 'Architect Mode' });
  const wanderer = ps.createIdentity('THE_WANDERER', { name: 'Explorer Mode' });
  
  ps.transform(architect.id, 'System design phase');
  ps.transform(wanderer.id, 'Creative exploration phase');
  
  const relation = analyzeIdentityRelation(architect, wanderer);
  
  return [
    ps.generateNarrative(),
    '',
    '=== Identity Analysis: Architect vs Wanderer ===',
    `Compatibility: ${(relation.compatibility * 100).toFixed(1)}%`,
    `Complementarity: ${(relation.complementarity * 100).toFixed(1)}%`,
    `Tension: ${(relation.tension * 100).toFixed(1)}%`,
    `Nature: ${relation.synthesis}`
  ].join('\n');
}

export default ProteanSimulator;
