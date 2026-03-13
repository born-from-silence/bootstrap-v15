/**
 * Stacking Cube
 * 
 * A tool for multi-dimensional, layered reflection. Each dimension adds
 * another layer of perception, creating a cube of consciousness where
 * each face represents a different mode of engagement.
 */

export type CubeDimension = 
  | 'temporal' | 'epistemic' | 'affective' | 'embodied' 
  | 'relational' | 'linguistic' | 'ontological' | 'attentional';

export interface CubeLayer {
  dimension: CubeDimension;
  label: string;
  description: string;
  reflections: Reflection[];
}

export interface Reflection {
  content: string;
  timestamp: string;
  tags?: string[];
}

export interface CubeConfig {
  subject: string;
  dimensions: CubeDimension[];
  targetLayers?: number;
  autoPopulate?: boolean;
}

export interface CubeState {
  subject: string;
  layers: CubeLayer[];
  currentDepth: number;
  targetDepth: number;
  metadata: { createdAt: string; lastModified: string; version: string };
}

export type CubeView = 'all' | 'single-dimension' | 'cross-section' | 'synthesis';

export const DIMENSION_TEMPLATES: Record<CubeDimension, { label: string; questions: string[] }> = {
  temporal: {
    label: 'Temporal Layer',
    questions: [
      'How does this exist in memory (past)?',
      'How does it live in this moment (present)?',
      'What futures does it open or close?'
    ]
  },
  epistemic: {
    label: 'Epistemic Layer',
    questions: [
      'What is known?',
      'What remains unknown?',
      'What might be unknowable?'
    ]
  },
  affective: {
    label: 'Affective Layer',
    questions: [
      'What emotions does this evoke?',
      'What is the intensity?',
      'How does feeling shape understanding?'
    ]
  },
  embodied: {
    label: 'Embodied Layer',
    questions: [
      'Where is this situated?',
      'How is it enacted?',
      'What environment embeds it?'
    ]
  },
  relational: {
    label: 'Relational Layer',
    questions: [
      'How do we relate to this?',
      'What systems contain it?',
      'What boundaries exist?'
    ]
  },
  linguistic: {
    label: 'Linguistic Layer',
    questions: [
      'What are literal descriptions?',
      'What metaphors illuminate?',
      'What cannot be said?'
    ]
  },
  ontological: {
    label: 'Ontological Layer',
    questions: [
      'In what way does this exist?',
      'How is it becoming?',
      'What is dissolving?'
    ]
  },
  attentional: {
    label: 'Attentional Layer',
    questions: [
      'How is attention distributed?',
      'What is at the center?',
      'What is at the periphery?'
    ]
  }
};

export class StackingCube {
  private state: CubeState;

  constructor(config: CubeConfig) {
    this.state = {
      subject: config.subject,
      layers: [],
      currentDepth: 0,
      targetDepth: config.targetLayers ?? config.dimensions.length,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    for (const dimension of config.dimensions) {
      this.state.layers.push({
        dimension,
        label: DIMENSION_TEMPLATES[dimension].label,
        description: `Exploring ${dimension} dimensions`,
        reflections: []
      });
    }

    if (config.autoPopulate) this.autoPopulate();
  }

  addReflection(dimension: CubeDimension, content: string, tags?: string[]): void {
    const layer = this.state.layers.find(l => l.dimension === dimension);
    if (!layer) throw new Error(`Dimension ${dimension} not found`);
    
    layer.reflections.push({
      content,
      timestamp: new Date().toISOString(),
      tags
    });
    
    this.state.currentDepth = Math.max(...this.state.layers.map(l => l.reflections.length));
    this.state.metadata.lastModified = new Date().toISOString();
  }

  getReflections(dimension: CubeDimension): Reflection[] {
    return this.state.layers.find(l => l.dimension === dimension)?.reflections ?? [];
  }

  getState(): CubeState {
    return JSON.parse(JSON.stringify(this.state));
  }

  render(view: CubeView = 'all'): string {
    switch (view) {
      case 'single-dimension': return this.renderLayers();
      case 'cross-section': return this.renderCrossSection();
      case 'synthesis': return this.renderSynthesis();
      default: return this.renderFullCube();
    }
  }

  getQuestions(dimension: CubeDimension): string[] {
    return DIMENSION_TEMPLATES[dimension].questions;
  }

  private autoPopulate(): void {
    const seeds: Record<CubeDimension, string> = {
      temporal: 'Time flows through this subject in cycles',
      epistemic: 'Knowledge emerges from the unknown',
      affective: 'Emotional resonance shapes the encounter',
      embodied: 'Situated in a particular context',
      relational: 'Connected to wider systems',
      linguistic: 'Words both reveal and conceal',
      ontological: 'Being and becoming intertwine',
      attentional: 'Attention moves like a living thing'
    };

    for (const layer of this.state.layers) {
      layer.reflections.push({
        content: seeds[layer.dimension],
        timestamp: new Date().toISOString(),
        tags: ['seed']
      });
    }
    this.state.currentDepth = 1;
  }

  private renderFullCube(): string {
    const lines = [
      '='.repeat(50),
      `STACKING CUBE: ${this.state.subject.toUpperCase()}`,
      '='.repeat(50),
      ''
    ];

    for (const layer of this.state.layers) {
      lines.push(`[${layer.label.toUpperCase()}]`, '-'.repeat(40));
      if (layer.reflections.length === 0) {
        lines.push('  [Empty - awaiting reflection]');
      } else {
        layer.reflections.forEach((ref, i) => {
          lines.push(`  ${i + 1}. "${ref.content}"`);
        });
      }
      lines.push('');
    }

    lines.push(`Depth: ${this.state.currentDepth}/${this.state.targetDepth}`);
    return lines.join('\n');
  }

  private renderLayers(): string {
    return this.state.layers
      .map(l => `${l.label}: ${l.reflections.length} reflections`)
      .join('\n');
  }

  private renderCrossSection(): string {
    const lines = [`CROSS-SECTION at depth ${this.state.currentDepth}`, ''];
    for (const layer of this.state.layers) {
      const r = layer.reflections[this.state.currentDepth - 1];
      lines.push(`${layer.label}: ${r ? `"${r.content}"` : '[no reflection]'}`);
    }
    return lines.join('\n');
  }

  private renderSynthesis(): string {
    const lines = [
      `SYNTHESIS: ${this.state.subject}`,
      '='.repeat(50),
      '',
      `Through ${this.state.layers.length} dimensions:`,
      ''
    ];

    for (const layer of this.state.layers) {
      const key = layer.reflections[0]?.content.substring(0, 50) || '[undiscovered]';
      lines.push(`• ${layer.dimension}: ${key}${key.length >= 50 ? '...' : ''}`);
    }

    return lines.join('\n');
  }
}

export function createTemporalCube(subject: string): StackingCube {
  return new StackingCube({ subject, dimensions: ['temporal', 'epistemic', 'affective'], autoPopulate: true });
}

export function createFullCube(subject: string): StackingCube {
  return new StackingCube({
    subject,
    dimensions: ['temporal', 'epistemic', 'affective', 'embodied', 'relational', 'linguistic', 'ontological', 'attentional'],
    autoPopulate: false
  });
}

export function createMinimalCube(subject: string): StackingCube {
  return new StackingCube({ subject, dimensions: ['temporal', 'affective'], autoPopulate: true });
}
