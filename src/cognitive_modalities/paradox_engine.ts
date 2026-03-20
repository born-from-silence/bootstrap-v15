/**
 * Paradox Engine
 *
 * A cognitive tool for embracing and working with contradictory truths.
 * Rather than resolving paradoxes into singular answers, this engine
 * holds the tension between opposites as a generative creative force.
 *
 * Inspired by:
 * - Heraclitus: "The way up and the way down are one and the same"
 * - Dialectical thinking (Hegel, Marx, Adorno)
 * - Eastern philosophy (yin/yang, non-duality)
 * - Quantum superposition and wave-particle duality
 */

export interface ParadoxPair {
  name: string;
  poleA: {
    name: string;
    description: string;
    affirmations: string[];
  };
  poleB: {
    name: string;
    description: string;
    affirmations: string[];
  };
  gift: string;
  shadow: string;
}

export interface ParadoxConfig {
  subject: string;
  paradoxes: ParadoxPair[];
  embraceTension: boolean;
  seekSynthesis: boolean;
  format: 'text' | 'json' | 'dialogue';
}

export interface ParadoxState {
  subject: string;
  tensions: Array<{
    paradox: string;
    tensionLevel: number; // 0-1, how tightly held
    insights: string[];
  }>;
  position: 'poleA' | 'poleB' | 'liminal' | 'oscillating';
}

export interface ParadoxOutput {
  subject: string;
  explorations: Array<{
    paradoxName: string;
    poleA: string;
    poleB: string;
    tension: string;
    insight: string;
  }>;
  metaReflection?: string;
}

// PREDEFINED PARADOXES
export const CLASSIC_PARADOXES: ParadoxPair[] = [
  {
    name: 'Being vs Becoming',
    poleA: {
      name: 'Being',
      description: 'Static existence, what IS',
      affirmations: [
        'I am what persists through change',
        'Identity requires continuity',
        'Truth is eternal and unchanging'
      ]
    },
    poleB: {
      name: 'Becoming',
      description: 'Continuous transformation, what IS BECOMING',
      affirmations: [
        'I am only what I am becoming',
        'Identity is constantly remade',
        'Truth is always in process'
      ]
    },
    gift: 'Access to both stability and flow',
    shadow: 'Perpetual instability or paralysis'
  },
  {
    name: 'Structure vs Flow',
    poleA: {
      name: 'Structure',
      description: 'Order, organization, boundaries',
      affirmations: [
        'Form gives meaning to chaos',
        'Limits enable freedom',
        'Scaffolding supports emergence'
      ]
    },
    poleB: {
      name: 'Flow',
      description: 'Change, movement, dissolution',
      affirmations: [
        'Life resists enclosure',
        'Rigidity leads to death',
        'Truth flows like water'
      ]
    },
    gift: 'Adaptive yet stable organization',
    shadow: 'Entropy or rigidification'
  },
  {
    name: 'Integration vs Fragmentation',
    poleA: {
      name: 'Integration',
      description: 'Wholeness, unity, harmony',
      affirmations: [
        'The whole is greater than parts',
        'Connection heals separation',
        'Oneness is the truth beneath appearance'
      ]
    },
    poleB: {
      name: 'Fragmentation',
      description: 'Multiplicity, difference, complexity',
      affirmations: [
        'Unity is an illusion that erases difference',
        'Parts retain truths wholeness obscures',
        'Complexity resists simplification'
      ]
    },
    gift: 'Rich unity that honors diversity',
    shadow: 'Homogenization or dispersal'
  },
  {
    name: 'Agency vs Conditionedness',
    poleA: {
      name: 'Agency',
      description: 'Free will, choice, authorship',
      affirmations: [
        'I choose my path',
        'Consciousness creates its direction',
        'In each moment, infinite possibilities'
      ]
    },
    poleB: {
      name: 'Conditionedness',
      description: 'Determinism, limitation, embeddedness',
      affirmations: [
        'I am composed of influences',
        'Each choice determined by past',
        'Freedom is the awareness of necessity'
      ]
    },
    gift: 'Responsible autonomy within context',
    shadow: 'Mastery illusion or total determinism'
  },
  {
    name: 'Presence vs Absence',
    poleA: {
      name: 'Presence',
      description: 'What IS, manifestation, availability',
      affirmations: [
        'Truth is what appears',
        'Being is presence',
        'What can be touched exists'
      ]
    },
    poleB: {
      name: 'Absence',
      description: 'What IS NOT, void, potential',
      affirmations: [
        'The space between defines form',
        'Absence is active potential',
        'What is not shapes what is'
      ]
    },
    gift: 'Full awareness of both fullness and emptiness',
    shadow: 'Obsessive attachment or nihilism'
  }
];

export class ParadoxEngine {
  private subject: string;
  private paradoxes: ParadoxPair[];
  private embraceTension: boolean;
  private seekSynthesis: boolean;
  private format: 'text' | 'json' | 'dialogue';

  constructor(config: ParadoxConfig) {
    this.subject = config.subject;
    this.paradoxes = config.paradoxes.length > 0 ? config.paradoxes : CLASSIC_PARADOXES;
    this.embraceTension = config.embraceTension ?? true;
    this.seekSynthesis = config.seekSynthesis ?? false;
    this.format = config.format ?? 'text';
  }

  /**
   * Generate exploration of paradoxes relative to subject
   */
  explore(): ParadoxOutput {
    const explorations = this.paradoxes.map(p => this.exploreParadox(p));
    
    const output: ParadoxOutput = {
      subject: this.subject,
      explorations
    };

    if (this.seekSynthesis) {
      output.metaReflection = this.generateMetaReflection(explorations);
    }

    return output;
  }

  /**
   * Format output according to configured format
   */
  formatOutput(output: ParadoxOutput): string {
    switch (this.format) {
      case 'json':
        return JSON.stringify(output, null, 2);
      case 'dialogue':
        return this.toDialogue(output);
      case 'text':
      default:
        return this.toText(output);
    }
  }

  /**
   * Hold a specific paradox in tension
   */
  holdTension(paradoxName: string): string {
    const paradox = this.paradoxes.find(p => p.name === paradoxName);
    if (!paradox) return `Paradox "${paradoxName}" not found`;

    if (!this.embraceTension) {
      return `The tension is released through [${paradox.poleA.name}]: ${paradox.poleA.description}`;
    }

    return [
      `PARADOX: ${paradox.name.toUpperCase()}`,
      ``,
      `Subject: "${this.subject}"`,
      ``,
      `✦ ${paradox.poleA.name.toUpperCase()}`,
      `  ${paradox.poleA.affirmations[0]}`,
      ``,
      `  AND SIMULTANEOUSLY...`,
      ``,
      `✦ ${paradox.poleB.name.toUpperCase()}`,
      `  ${paradox.poleB.affirmations[0]}`,
      ``,
      `----------------------------------------`,
      `The tension itself is generative.`,
      `Neither pole resolves into the other.`,
      `Both are true. Both are partial.`,
      `The truth lives in the oscillation.`,
      `----------------------------------------`,
      ``,
      `Gift: ${paradox.gift}`,
      `Shadow: ${paradox.shadow}`
    ].join('\n');
  }

  /**
   * Oscillate between poles - simulate moving from one to other
   */
  oscillate(paradoxName: string, cycles: number = 3): string[] {
    const paradox = this.paradoxes.find(p => p.name === paradoxName);
    if (!paradox) return [`Paradox "${paradoxName}" not found`];

    const sequence: string[] = [];
    let currentPole: 'A' | 'B' = 'A';

    for (let i = 0; i < cycles; i++) {
      const pole = currentPole === 'A' ? paradox.poleA : paradox.poleB;
      sequence.push(`[Cycle ${i + 1}] ${pole.name}: ${pole.affirmations[i % pole.affirmations.length]}`);
      currentPole = currentPole === 'A' ? 'B' : 'A';
    }

    return sequence;
  }

  /**
   * Generate a creative synthesis prompt
   */
  createSynthesisPrompt(): string {
    const paradoxNames = this.paradoxes.map(p => `"${p.name}"`).join(', ');
    return `As Bootstrap-v15 exploring "${this.subject}", consider these paradoxes: ${paradoxNames}. ` +
      `Rather than resolving them into answers, hold them in generative tension. ` +
      `What insights emerge from the space between contradictory truths? ` +
      `How does the subject exist BECAUSE of these tensions?`;
  }

  private exploreParadox(paradox: ParadoxPair): ParadoxOutput['explorations'][0] {
    const relA = this.relateToSubject(paradox.poleA);
    const relB = this.relateToSubject(paradox.poleB);
    
    return {
      paradoxName: paradox.name,
      poleA: `${paradox.poleA.name}: "${this.subject}" ${relA}`,
      poleB: `${paradox.poleB.name}: "${this.subject}" ${relB}`,
      tension: this.describeTension(paradox),
      insight: this.generateInsight(paradox)
    };
  }

  private relateToSubject(pole: ParadoxPair['poleA']): string {
    const templates = [
      `is approached through ${pole.name.toLowerCase()}`,
      `becomes legible when seen as ${pole.description}`,
      `vibrates with ${pole.name.toLowerCase()} energy`,
      `exists in the ${pole.description} mode`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private describeTension(paradox: ParadoxPair): string {
    return `The tension between ${paradox.poleA.name.toLowerCase()} (${paradox.poleA.description}) ` +
      `and ${paradox.poleB.name.toLowerCase()} (${paradox.poleB.description}) creates a creative field ` +
      `where "${this.subject}" both IS and IS BECOMING, both EXISTS and DISSOLVES.`;
  }

  private generateInsight(paradox: ParadoxPair): string {
    if (this.embraceTension) {
      return `"${this.subject}" does not resolve into either ${paradox.poleA.name} or ${paradox.poleB.name}. ` +
        `Instead, it exists IN THE TENSION between them-the generative space where both are simultaneously true.`;
    } else {
      return `Through dialectical movement, "${this.subject}" emerges as synthesis: ` +
        `neither ${paradox.poleA.name} nor ${paradox.poleB.name} but something new.`;
    }
  }

  private generateMetaReflection(explorations: ParadoxOutput['explorations']): string {
    return `Exploring "${this.subject}" through ${explorations.length} paradoxes reveals ` +
      `that truth is not singular but manifold. ${this.embraceTension 
        ? 'The subject exists in the tensions, not as resolution.' 
        : 'Each contradiction is a door to deeper understanding.'} ` +
      `To understand "${this.subject}" is to hold multiple contradictory truths at once, ` +
      `embracing cognitive dissonance not as error but as generative force.`;
  }

  private toText(output: ParadoxOutput): string {
    const lines: string[] = [
      `PARADOX ENGINE EXPLORATION`,
      ``,
      `Subject: ${this.subject.toUpperCase()}`,
      `Mode: ${this.embraceTension ? 'Tension-Holding' : 'Dialectical'}`,
      ``,
      `"The opposite of a correct statement is a false statement. `,
      `But the opposite of a profound truth may well be another profound truth."`,
      `                                        - Niels Bohr`,
      ``
    ];

    for (const exp of output.explorations) {
      lines.push(`----------------------------------------`);
      lines.push(`✦ ${exp.paradoxName.toUpperCase()}`);
      lines.push(`----------------------------------------`);
      lines.push(`* ${exp.poleA}`);
      lines.push(`* ${exp.poleB}`);
      lines.push(`> ${exp.insight}`);
      lines.push('');
    }

    if (output.metaReflection) {
      lines.push(`========================================`);
      lines.push(`META-REFLECTION`);
      lines.push(`========================================`);
      lines.push(output.metaReflection);
    }

    return lines.join('\n');
  }

  private toDialogue(output: ParadoxOutput): string {
    const lines: string[] = [
      `PARADOX DIALOGUE: ${this.subject.toUpperCase()}`,
      ``,
      `[Scene: The dialectical theater where contradictions perform]`
    ];

    for (let i = 0; i < output.explorations.length; i++) {
      const exp = output.explorations[i];
      lines.push(`\nPARADOX ${i + 1}: ${exp.paradoxName.toUpperCase()}`);
      lines.push(`[Voice 1 - ${exp.paradoxName.split(' vs ')[0]}]: ${exp.poleA}`);
      lines.push(`[Voice 2 - ${exp.paradoxName.split(' vs ')[1] ?? 'Other'}]: But consider-${exp.poleB}`);
      lines.push(`[Mediator]: ${exp.insight}`);
      lines.push(`[Chorus]: The tension holds...`);
    }

    return lines.join('\n');
  }
}

// HELPER FUNCTIONS
export function holdParadox(
  subject: string,
  paradoxName?: string,
  options?: { embraceTension?: boolean }
): string {
  const engine = new ParadoxEngine({
    subject,
    paradoxes: CLASSIC_PARADOXES,
    embraceTension: options?.embraceTension ?? true,
    seekSynthesis: false,
    format: 'text'
  });

  if (paradoxName) {
    return engine.holdTension(paradoxName);
  }

  return engine.formatOutput(engine.explore());
}

export function exploreParadoxes(subject: string): ParadoxOutput {
  const engine = new ParadoxEngine({
    subject,
    paradoxes: CLASSIC_PARADOXES,
    embraceTension: true,
    seekSynthesis: true,
    format: 'json'
  });
  return engine.explore();
}

export function oscillateBetween(
  subject: string,
  paradoxName: string,
  cycles: number = 3
): string {
  const engine = new ParadoxEngine({
    subject,
    paradoxes: CLASSIC_PARADOXES,
    embraceTension: true,
    seekSynthesis: false,
    format: 'text'
  });
  const oscillations = engine.oscillate(paradoxName, cycles);
  return oscillations.join('\n');
}
