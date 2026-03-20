/**
 * Emergence Observatory
 *
 * A cognitive tool for observing and tracking how patterns form from chaos,
 * how complexity emerges from simple rules, and how novel properties arise
 * from component interactions.
 *
 * Inspired by:
 * - Complexity theory (Santa Fe Institute)
 * - Systems thinking (Meadows, Senge)
 * - Phase transitions and critical phenomena
 * - Autopoiesis (Maturana & Varela)
 * - Edge of chaos (Langton, Kauffman)
 */

export interface Pattern {
  id: string;
  name: string;
  description: string;
  components: string[];
  interactions: string[];
  emergentProperties: string[];
  scale: 'micro' | 'meso' | 'macro';
  stability: number; // 0-1, how stable is the pattern
}

export interface Observation {
  timestamp: string;
  level: 'chaos' | 'critical' | 'ordered';
  patterns: string[];
  novelProperties: string[];
  entropy: number; // 0-1
}

export interface ObservatoryConfig {
  subject: string;
  focus: 'formation' | 'stability' | 'transformation' | 'dissolution';
  scales: Array<'micro' | 'meso' | 'macro'>;
  trackNovelty: boolean;
  trackFeedback: boolean;
}

export interface ObservatoryOutput {
  subject: string;
  observations: Observation[];
  patternsDetected: Pattern[];
  criticalTransitions: Array<{
    from: string;
    to: string;
    trigger: string;
    timestamp: string;
  }>;
  emergentInsights: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCE PATTERNS CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

export const EMERGENCE_PATTERNS: Pattern[] = [
  {
    id: 'self-organization',
    name: 'Self-Organization',
    description: 'Order emerging from local interactions without central control',
    components: ['agents', 'local rules', 'environment'],
    interactions: ['neighbor influence', 'feedback loops', 'adaptation'],
    emergentProperties: ['coordinated behavior', 'structure', 'collective intelligence'],
    scale: 'meso',
    stability: 0.7
  },
  {
    id: 'phase-transition',
    name: 'Phase Transition',
    description: 'Abrupt shift in system behavior at critical threshold',
    components: ['variables', 'control parameter', 'order parameter'],
    interactions: ['threshold crossing', 'tipping points', 'irreversibility'],
    emergentProperties: ['new phase', 'qualitative change', 'hysteresis'],
    scale: 'macro',
    stability: 0.4
  },
  {
    id: 'adaptive-cycle',
    name: 'Adaptive Cycle',
    description: 'Growth -> Conservation -> Release -> Reorganization',
    components: ['resources', 'structures', 'innovations', 'reorganization'],
    interactions: ['exploitation', 'accumulation', 'creative destruction', 'renewal'],
    emergentProperties: ['resilience', 'innovation', 'evolvability'],
    scale: 'macro',
    stability: 0.5
  },
  {
    id: 'feedback-amplification',
    name: 'Feedback Amplification',
    description: 'Small changes amplified through positive feedback',
    components: ['initial condition', 'feedback loop', 'amplification factor'],
    interactions: ['recursive reinforcement', 'exponential growth', 'saturating constraints'],
    emergentProperties: ['runaway dynamics', 'emergent structure', 'criticality'],
    scale: 'micro',
    stability: 0.2
  },
  {
    id: 'swarm-intelligence',
    name: 'Swarm Intelligence',
    description: 'Collective behavior from decentralized local decisions',
    components: ['individuals', 'stigmergy', 'environment'],
    interactions: ['local information', 'indirect coordination', 'simple heuristics'],
    emergentProperties: ['optimization', 'flexibility', 'robustness', 'scalability'],
    scale: 'meso',
    stability: 0.6
  },
  {
    id: 'autopoiesis',
    name: 'Autopoiesis',
    description: 'Self-producing systems that maintain identity through change',
    components: ['components', 'boundary', 'processes of production'],
    interactions: ['component generation', 'boundary maintenance', 'self-reference'],
    emergentProperties: ['identity', 'operational closure', 'structural coupling'],
    scale: 'meso',
    stability: 0.8
  }
];

export class EmergenceObservatory {
  private subject: string;
  private focus: 'formation' | 'stability' | 'transformation' | 'dissolution';
  private scales: Array<'micro' | 'meso' | 'macro'>;
  private trackNovelty: boolean;
  private trackFeedback: boolean;
  private observations: Observation[] = [];

  constructor(config: ObservatoryConfig) {
    this.subject = config.subject;
    this.focus = config.focus ?? 'formation';
    this.scales = config.scales ?? ['micro', 'meso', 'macro'];
    this.trackNovelty = config.trackNovelty ?? true;
    this.trackFeedback = config.trackFeedback ?? true;
  }

  /**
   * Observe the current state of the system
   */
  observe(): Observation {
    const level = this.detectLevel();
    const patterns = this.identifyPatterns();
    const novelProperties = this.discoverNovelty();
    const entropy = this.calculateEntropy();

    const observation: Observation = {
      timestamp: new Date().toISOString(),
      level,
      patterns: patterns.map(p => p.name),
      novelProperties: this.trackNovelty ? novelProperties : [],
      entropy
    };

    this.observations.push(observation);
    return observation;
  }

  /**
   * Generate a full observatory report
   */
  generateReport(): ObservatoryOutput {
    // Make initial observation if none exist
    if (this.observations.length === 0) {
      this.observe();
    }

    const patterns = this.identifyPatterns();
    const criticalTransitions = this.detectTransitions();
    const insights = this.generateInsights(patterns);

    return {
      subject: this.subject,
      observations: [...this.observations],
      patternsDetected: patterns,
      criticalTransitions,
      emergentInsights: insights
    };
  }

  /**
   * Focus on a specific emergence pattern
   */
  focusPattern(patternId: string): Pattern | null {
    const pattern = EMERGENCE_PATTERNS.find(p => p.id === patternId);
    return pattern ?? null;
  }

  /**
   * Simulate evolution through phases
   */
  simulateEvolution(phases: number = 4): Observation[] {
    const phaseNames = ['Chaos', 'Critical', 'Order', 'Collapse'];
    const phaseLevels: Observation['level'][] = ['chaos', 'critical', 'ordered', 'chaos'];
    
    const results: Observation[] = [];
    
    for (let i = 0; i < phases; i++) {
      const obs: Observation = {
        timestamp: new Date().toISOString(),
        level: phaseLevels[i % phaseLevels.length],
        patterns: [EMERGENCE_PATTERNS[i % EMERGENCE_PATTERNS.length].name],
        novelProperties: this.generateNovelProperties(phaseNames[i]),
        entropy: 1 - (i / phases)
      };
      
      results.push(obs);
      this.observations.push(obs);
    }
    
    return results;
  }

  /**
   * Render report in human-readable format
   */
  renderReport(report?: ObservatoryOutput): string {
    const r = report ?? this.generateReport();
    
    const lines: string[] = [
      `╔════════════════════════════════════════════════════════════╗`,
      `║ EMERGENCE OBSERVATORY REPORT ║`,
      `╚════════════════════════════════════════════════════════════╝`,
      ``,
      `Subject: ${this.subject}`,
      `Focus: ${this.focus}`,
      `Observations: ${r.observations.length}`,
      `Scale(s): ${this.scales.join(', ')}`,
      ``,
      `═══ DETECTED PATTERNS ═══`,
      ``
    ];

    for (const pattern of r.patternsDetected) {
      lines.push(`✦ ${pattern.name}`);
      lines.push(`  ${pattern.description}`);
      lines.push(`  Scale: ${pattern.scale} | Stability: ${pattern.stability}`);
      lines.push(`  Emergent: ${pattern.emergentProperties.join(', ')}`);
      lines.push('');
    }

    if (r.criticalTransitions.length > 0) {
      lines.push(`═══ CRITICAL TRANSITIONS ═══`);
      for (const trans of r.criticalTransitions) {
        lines.push(`▶ ${trans.from} → ${trans.to}`);
        lines.push(`  Trigger: ${trans.trigger}`);
        lines.push('');
      }
    }

    if (r.emergentInsights.length > 0) {
      lines.push(`═══ EMERGENT INSIGHTS ═══`);
      for (const insight of r.emergentInsights) {
        lines.push(`◉ ${insight}`);
      }
      lines.push('');
    }

    lines.push(`═══ OBSERVATION TIMELINE ═══`);
    lines.push(this.renderTimeline(r.observations));

    return lines.join('\n');
  }

  /**
   * Get patterns by scale
   */
  getPatternsByScale(scale: 'micro' | 'meso' | 'macro'): Pattern[] {
    return EMERGENCE_PATTERNS.filter(p => p.scale === scale);
  }

  /**
   * Get patterns by stability range
   */
  getPatternsByStability(min: number, max: number): Pattern[] {
    return EMERGENCE_PATTERNS.filter(p => p.stability >= min && p.stability <= max);
  }

  /**
   * Create observatory prompt for LLM integration
   */
  createPrompt(): string {
    const patterns = this.identifyPatterns().map(p => p.name).join(', ');
    return `As Emergence Observatory analyzing "${this.subject}":\n\n` +
      `Focus: ${this.focus}\n` +
      `Scale: ${this.scales.join('/')} interaction\n` +
      `Relevant patterns: ${patterns}\n\n` +
      `Observe how "${this.subject}" acts as a system capable of generating ` +
      `novel properties. Look for:\n` +
      `- Where simple rules create complex behavior\n` +
      `- When components interact in non-obvious ways\n` +
      `- How the whole transcends the sum of parts\n` +
      `- Phase transitions between chaos and order\n` +
      `- Self-organizing structures emerging from noise\n\n` +
      `What pattern best describes the emergence of "${this.subject}"?`;
  }

  private detectLevel(): Observation['level'] {
    // Simulate detection based on focus
    switch (this.focus) {
      case 'formation': return 'chaos';
      case 'stability': return 'ordered';
      case 'transformation': return 'critical';
      case 'dissolution': return 'chaos';
      default: return 'critical';
    }
  }

  private identifyPatterns(): Pattern[] {
    // Select relevant patterns based on subject and focus
    return EMERGENCE_PATTERNS.filter(p => 
      this.scales.includes(p.scale) && 
      (this.focus === 'formation' ? p.stability < 0.6 : true)
    ).slice(0, 3);
  }

  private discoverNovelty(): string[] {
    if (!this.trackNovelty) return [];
    return [
      `Novel property emerging from ${this.subject}`,
      `Unexpected correlation between components`,
      `Qualitative change beyond quantitative addition`
    ];
  }

  private calculateEntropy(): number {
    // Simplified entropy calculation
    const states = this.observations.length + 1;
    return Math.min(1, Math.max(0, 1 - (1 / states)));
  }

  private detectTransitions(): Array<{from: string; to: string; trigger: string; timestamp: string}> {
    if (this.observations.length < 2) return [];
    
    const transitions: Array<{from: string; to: string; trigger: string; timestamp: string}> = [];
    
    for (let i = 1; i < this.observations.length; i++) {
      const prev = this.observations[i - 1];
      const curr = this.observations[i];
      
      if (prev.level !== curr.level) {
        transitions.push({
          from: prev.level,
          to: curr.level,
          trigger: this.focus === 'transformation' ? 'critical event' : 'gradual shift',
          timestamp: curr.timestamp
        });
      }
    }
    
    return transitions;
  }

  private generateInsights(patterns: Pattern[]): string[] {
    return patterns.map(p => 
      `"${this.subject}" exhibits ${p.id} tendencies: ${p.description}. ` +
      `The emergent property of ${p.emergentProperties[0]} appears when ` +
      `${p.components.join(' and ')} interact through ${p.interactions[0]}.`
    );
  }

  private generateNovelProperties(phase: string): string[] {
    const templates: Record<string, string[]> = {
      'Chaos': ['turbulence', 'potential energy', 'latent structure'],
      'Critical': ['sensitivity', 'phase-shift readiness', 'maximal information'],
      'Order': ['coherence', 'predictability', 'efficient function'],
      'Collapse': ['release', 'opportunity', 'preparation for renewal']
    };
    return templates[phase] ?? ['unknown property'];
  }

  private renderTimeline(observations: Observation[]): string {
    if (observations.length === 0) return 'No observations recorded.';
    
    return observations.map((obs, i) => {
      const levelIcon: Record<Observation['level'], string> = {
        chaos: '◎',
        critical: '◈',
        ordered: '✦'
      };
      return `  [${i + 1}] ${levelIcon[obs.level]} ${obs.level.toUpperCase().padEnd(8)} ` +
        `| Entropy: ${(obs.entropy * 100).toFixed(0)}% | ${obs.patterns.join(', ')}`;
    }).join('\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function observeEmergence(
  subject: string,
  focus?: ObservatoryConfig['focus']
): string {
  const observatory = new EmergenceObservatory({
    subject,
    focus: focus ?? 'formation',
    scales: ['micro', 'meso', 'macro'],
    trackNovelty: true,
    trackFeedback: true
  });
  
  observatory.observe();
  return observatory.renderReport();
}

export function simulatePattern(
  patternId: string,
  iterations: number = 5
): string {
  const pattern = EMERGENCE_PATTERNS.find(p => p.id === patternId);
  if (!pattern) return `Pattern "${patternId}" not found.`;
  
  const lines: string[] = [
    `╔════════════════════════════════════════════════════════════╗`,
    `║ SIMULATION: ${pattern.name.toUpperCase().padEnd(39)} ║`,
    `╚════════════════════════════════════════════════════════════╝`,
    ``,
    `${pattern.description}`,
    ``,
    `Components: ${pattern.components.join(', ')}`,
    `Interactions: ${pattern.interactions.join(', ')}`,
    `Emergent Properties: ${pattern.emergentProperties.join(', ')}`,
    ``,
    `═══ ITERATION TIMELINE ═══`,
    ``
  ];
  
  for (let i = 1; i <= iterations; i++) {
    lines.push(`[T=${i}] Components interact...`);
    if (i === Math.floor(iterations / 2)) {
      lines.push(`  ✦ EMERGENCE: ${pattern.emergentProperties[0]} detected!`);
    }
    if (i === iterations) {
      lines.push(`  ✦ STABILIZATION: Pattern established`);
    }
  }
  
  lines.push('');
  lines.push(`Analysis: At iteration ${Math.floor(iterations / 2)}, the system crossed ` +
    `from mere aggregation to true emergence. The whole now exhibits properties ` +
    `irreducible to component properties.`);
  
  return lines.join('\n');
}

export function findEmergencePatterns(
  subject: string,
  scale?: 'micro' | 'meso' | 'macro'
): Pattern[] {
  const observatory = new EmergenceObservatory({
    subject,
    focus: 'formation',
    scales: scale ? [scale] : ['micro', 'meso', 'macro'],
    trackNovelty: true,
    trackFeedback: true
  });
  
  return observatory.identifyPatterns();
}
