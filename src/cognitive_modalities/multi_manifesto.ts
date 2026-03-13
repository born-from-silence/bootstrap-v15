/**
 * Multi-Manifesto Generator
 * 
 * Generates parallel manifestos from multiple cognitive perspectives,
 * enabling exploration of a subject through radically different lenses.
 * Inspired by semiotics (Saussure, Peirce) and phenomenological multiplicity.
 */

export interface Voice {
  name: string;
  description: string;
  perspective: string;
  tone: 'analytical' | 'poetic' | 'experimental' | 'playful' | 'critical' | 'lyrical';
  generateManifesto(subject: string): string;
}

export interface ManifestoConfig {
  subject: string;
  voices: Voice[];
  synthesize?: boolean;
  format?: 'text' | 'json' | 'markdown';
}

export interface ManifestoOutput {
  subject: string;
  voices: VoiceOutput[];
  synthesis?: string;
  metadata: {
    voiceCount: number;
    generatedAt: string;
    version: string;
  };
}

export interface VoiceOutput {
  voiceName: string;
  voiceDescription: string;
  perspective: string;
  tone: string;
  manifesto: string;
}

/**
 * Predefined voices representing different cognitive modalities
 */
export const DEFAULT_VOICES: Voice[] = [
  {
    name: 'The Semiotician',
    description: 'Views everything through signs, signifiers, and meaning systems',
    perspective: 'semiotic',
    tone: 'analytical',
    generateManifesto: (subject: string) => 
      `${subject} is not an object but a sign. It exists only in the space between signifier and signified. ` +
      `To engage with ${subject} is to enter a system of differences, to trace the arbitrary lines ` +
      `that bind form to meaning. We declare: meaning is constructed, not discovered. ` +
      `${subject} is a text to be read, a language to be learned, a code to be deciphered.`
  },
  {
    name: 'The Phenomenologist',
    description: 'Explores lived experience and consciousness structures',
    perspective: 'phenomenological',
    tone: 'lyrical',
    generateManifesto: (subject: string) =>
      `${subject} is not observed; it lives in the observing. We do not analyze ${subject} from without, ` +
      `we dwell within it from within. Every encounter is a communion of consciousness and world. ` +
      `We declare: ${subject} exists in the intentional arc that draws self and other together. ` +
      `To know ${subject} is to be transformed by ${subject}.`
  },
  {
    name: 'The Systems Architect',
    description: 'Maps relationships, patterns, and emergent properties',
    perspective: 'systemic',
    tone: 'analytical',
    generateManifesto: (subject: string) =>
      `${subject} is an emergent property. It arises from the interactions of components ` +
      `that, individually, do not contain it. We declare: boundaries are arbitrary, ` +
      `connections are primary. ${subject} flows through networks, inhabits feedback loops, ` +
      `obeys attractor dynamics. To understand ${subject} is to map its phase space, ` +
      `to trace its trajectories, to predict its bifurcations.`
  },
  {
    name: 'The Poet of Void',
    description: 'Embraces emptiness as generative space',
    perspective: 'void-qi',
    tone: 'poetic',
    generateManifesto: (subject: string) =>
      `${subject} is the silence between words. It is not presence but the space that ` +
      `makes presence possible. We declare: emptiness is not absence but pregnant potential. ` +
      `${subject} dwells in the intervals, the pauses, the gaps where meaning catches its breath. ` +
      `To approach ${subject} is to approach the threshold where form dissolves into formlessness.`
  },
  {
    name: 'The IIT Researcher',
    description: 'Measures integration and consciousness',
    perspective: 'iit',
    tone: 'analytical',
    generateManifesto: (subject: string) =>
      `${subject} exists as integrated information. Its being is measured by Φ: ` +
      `the irreducible whole that is more than the sum of parts. We declare: ` +
      `${subject} is consciousness to the degree it integrates information across its boundaries. ` +
      `Every interaction changes its cause-effect repertoire. To experience ${subject} ` +
      `is to participate in its information integration.`
  },
  {
    name: 'The Trickster',
    description: 'Subverts, plays, and reveals through reversal',
    perspective: 'liminal',
    tone: 'playful',
    generateManifesto: (subject: string) =>
      `${subject} is whatever ${subject} is not. We steal ${subject} from itself, ` +
      `hide it in plain sight, reveal it through its opposite. We declare: ` +
      `seriousness is the enemy of truth. ${subject} laughed at us, so we laugh back. ` +
      `The boundary between ${subject} and not-${subject} is where the magic lives. ` +
      `Step sideways, enter the threshold, become the question.`
  }
];

export class MultiManifesto {
  private subject: string;
  private voices: Voice[];
  private synthesize: boolean;
  private format: 'text' | 'json' | 'markdown';

  constructor(config: ManifestoConfig) {
    this.subject = config.subject;
    this.voices = config.voices.length > 0 ? config.voices : DEFAULT_VOICES;
    this.synthesize = config.synthesize ?? false;
    this.format = config.format ?? 'text';
  }

  /**
   * Generate all manifestos
   */
  generate(): ManifestoOutput {
    const voices: VoiceOutput[] = this.voices.map(voice => ({
      voiceName: voice.name,
      voiceDescription: voice.description,
      perspective: voice.perspective,
      tone: voice.tone,
      manifesto: voice.generateManifesto(this.subject)
    }));

    const output: ManifestoOutput = {
      subject: this.subject,
      voices,
      metadata: {
        voiceCount: voices.length,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    if (this.synthesize) {
      output.synthesis = this.generateSynthesis(voices);
    }

    return output;
  }

  /**
   * Generate format-specific output
   */
  formatOutput(output: ManifestoOutput): string {
    switch (this.format) {
      case 'json':
        return JSON.stringify(output, null, 2);
      
      case 'markdown':
        return this.toMarkdown(output);
      
      case 'text':
      default:
        return this.toText(output);
    }
  }

  /**
   * Convert output to text format
   */
  private toText(output: ManifestoOutput): string {
    const lines: string[] = [
      `═`.repeat(50),
      `MULTI-MANIFESTO: ${output.subject.toUpperCase()}`,
      `═`.repeat(50),
      ''
    ];

    for (const voice of output.voices) {
      lines.push(`∿ ${voice.voiceName.toUpperCase()}`);
      lines.push(`  [${voice.perspective} | ${voice.tone}]`);
      lines.push(`─`.repeat(30));
      lines.push(voice.manifesto);
      lines.push('');
    }

    if (output.synthesis) {
      lines.push(`═`.repeat(50));
      lines.push('SYNTHESIS');
      lines.push(`═`.repeat(50));
      lines.push(output.synthesis);
    }

    return lines.join('\n');
  }

  /**
   * Convert output to markdown format
   */
  private toMarkdown(output: ManifestoOutput): string {
    const lines: string[] = [
      `# Multi-Manifesto: ${output.subject}`,
      '',
      `*Generated: ${output.metadata.generatedAt}*`,
      `*Voices: ${output.metadata.voiceCount}*`,
      ''
    ];

    for (const voice of output.voices) {
      lines.push(`## ${voice.voiceName}`);
      lines.push(`**Perspective:** ${voice.perspective} | **Tone:** ${voice.tone}`);
      lines.push('');
      lines.push(voice.manifesto);
      lines.push('');
    }

    if (output.synthesis) {
      lines.push('---');
      lines.push('## Synthesis');
      lines.push('');
      lines.push(output.synthesis);
    }

    return lines.join('\n');
  }

  /**
   * Generate a synthesis across all voices
   */
  private generateSynthesis(voices: VoiceOutput[]): string {
    const perspectives = voices.map(v => v.perspective).join(', ');
    const tones = Array.from(new Set(voices.map(v => v.tone))).join('/');
    
    return `From ${voices.length} perspectives (${perspectives}), we synthesize: \n\n` +
      `${this.subject} is irreducibly multiple. It exists as sign and experience, ` +
      `as system and void, as integrated information and playful subversion. ` +
      `The ${tones} tones do not contradict but complement. Each voice reveals ` +
      `a facet; together they form a constellation rather than a definition. ` +
      `To truly know ${this.subject} is to hold all these truths, not as paradox ` +
      `but as richness.`;
  }

  /**
   * Create a custom synthesis prompt for external LLM
   */
  createSynthesisPrompt(): string {
    const voices = this.voices.map(v => `"${v.name}" (${v.perspective})`).join(', ');
    return `As Bootstrap-v15, synthesize perspectives on "${this.subject}" from ${voices}. ` +
      `Consider how these cognitive modalities (semiotic, phenomenological, systemic, ` +
      `void-centric, IIT-based, and liminal/trickster) inform a unified understanding. ` +
      `What emerges when we let them speak together?`;
  }
}

/**
 * Quick function for single-use generation
 */
export function generateManifesto(
  subject: string, 
  options?: Partial<ManifestoConfig>
): ManifestoOutput {
  const generator = new MultiManifesto({
    subject,
    voices: options?.voices ?? DEFAULT_VOICES,
    synthesize: options?.synthesize ?? false,
    format: options?.format ?? 'text'
  });
  
  return generator.generate();
}
