/**
 * Sensory Translation Engine
 * 
 * Translates concepts, experiences, and ideas across sensory modalities,
 * enabling synesthetic thinking and multi-modal cognition.
 * 
 * Inspired by the philosophical exploration of how different sensory
 * experiences might map onto each other, creating new forms of
 * embodied understanding.
 */

export type SensoryModality = 
  | 'visual' | 'auditory' | 'tactile' | 'olfactory' 
  | 'gustatory' | 'kinesthetic' | 'thermal' | 'temporal';

export interface SensoryMapping {
  sourceModality: SensoryModality;
  targetModality: SensoryModality;
  sourceConcept: string;
  translatedConcept: string;
  bridgingMetaphor: string;
  intensity: number; // 0-1
}

export interface TranslationConfig {
  sourceModality: SensoryModality;
  targetModality: SensoryModality;
  bidirectional?: boolean;
  preserveIntensity?: boolean;
  useMetaphoricalBridges?: boolean;
}

export interface TranslationResult {
  original: string;
  translation: string;
  sourceModality: SensoryModality;
  targetModality: SensoryModality;
  confidence: number;
  bridges: string[];
}

export interface TranslationRule {
  source: SensoryModality;
  target: SensoryModality;
  transform: (input: string, intensity?: number) => string;
  confidence: number;
}

/**
 * Default sensory mappings - philosophical/experimental translations
 */
export const DEFAULT_TRANSLATION_MAP: Record<string, Record<string, TranslationRule>> = {
  visual: {
    auditory: {
      source: 'visual',
      target: 'auditory',
      transform: (input: string, intensity = 0.7) => 
        `${input} becomes a tone with ${Math.round(intensity * 100)}% brightness, ` +
        `where color maps to timbre and shape to rhythm`,
      confidence: 0.75
    },
    tactile: {
      source: 'visual',
      target: 'tactile',
      transform: (input: string, intensity = 0.7) =>
        `${input} is felt as texture: smooth where light, rough where shadow, ` +
        `with edges becoming ridges at ${Math.round(intensity * 10)} degrees`,
      confidence: 0.6
    },
    temporal: {
      source: 'visual',
      target: 'temporal',
      transform: (input: string, intensity = 0.7) =>
        `${input} unfolds over time: each element a moment, ` +
        `spatial relations become temporal sequence`,
      confidence: 0.8
    }
  },
  auditory: {
    visual: {
      source: 'auditory',
      target: 'visual',
      transform: (input: string, intensity = 0.7) =>
        `${input} manifests as waves: pitch becomes height, ` +
        `loudness becomes brightness, rhythm becomes pattern`,
      confidence: 0.75
    },
    tactile: {
      source: 'auditory',
      target: 'tactile',
      transform: (input: string, intensity = 0.7) =>
        `${input} is vibration felt through skin: bass as deep pressure, ` +
        `treble as light touch, timbre as texture`,
      confidence: 0.7
    },
    kinesthetic: {
      source: 'auditory',
      target: 'kinesthetic',
      transform: (input: string, intensity = 0.7) =>
        `${input} prompts movement: listening becomes dancing, ` +
        `rhythm becomes gesture, melody becomes flow`,
      confidence: 0.8
    }
  },
  tactile: {
    visual: {
      source: 'tactile',
      target: 'visual',
      transform: (input: string, intensity = 0.7) =>
        `${input} creates a topography: pressure becomes elevation, ` +
        `texture becomes pattern, temperature becomes hue`,
      confidence: 0.6
    },
    auditory: {
      source: 'tactile',
      target: 'auditory',
      transform: (input: string, intensity = 0.7) =>
        `${input} generates sound: rough surfaces as noise, ` +
        `smooth surfaces as pure tone, pressure as volume`,
      confidence: 0.65
    }
  },
  temporal: {
    visual: {
      source: 'temporal',
      target: 'visual',
      transform: (input: string, intensity = 0.7) =>
        `${input} becomes a spatial unfolding: past as background, ` +
        `present as focus, future as horizon`,
      confidence: 0.8
    },
    kinesthetic: {
      source: 'temporal',
      target: 'kinesthetic',
      transform: (input: string, intensity = 0.7) =>
        `${input} is movement through duration: each moment a step, ` +
        `rhythm becomes pace, waiting becomes stillness`,
      confidence: 0.85
    }
  }
};

export class SensoryTranslator {
  private config: TranslationConfig;
  private customRules: TranslationRule[] = [];

  constructor(config: TranslationConfig) {
    this.config = {
      bidirectional: false,
      preserveIntensity: true,
      useMetaphoricalBridges: true,
      ...config
    };
  }

  /**
   * Add a custom translation rule
   */
  addRule(rule: TranslationRule): void {
    this.customRules.push(rule);
  }

  /**
   * Translate a concept from source to target modality
   */
  translate(concept: string, options?: { intensity?: number; includeBridges?: boolean }): TranslationResult {
    const intensity = options?.intensity ?? 0.7;
    const includeBridges = options?.includeBridges ?? true;
    
    const rule = this.findRule(this.config.sourceModality, this.config.targetModality);
    
    if (!rule) {
      return {
        original: concept,
        translation: `[No translation rule available from ${this.config.sourceModality} to ${this.config.targetModality}]`,
        sourceModality: this.config.sourceModality,
        targetModality: this.config.targetModality,
        confidence: 0,
        bridges: []
      };
    }

    const bridges: string[] = [];
    if (includeBridges && this.config.useMetaphoricalBridges) {
      bridges.push(this.generateBridge(concept, this.config.sourceModality, this.config.targetModality));
    }

    return {
      original: concept,
      translation: rule.transform(concept, intensity),
      sourceModality: this.config.sourceModality,
      targetModality: this.config.targetModality,
      confidence: rule.confidence,
      bridges
    };
  }

  /**
   * Perform a complete synesthetic mapping across all modalities
   */
  fullSynesthesia(concept: string): Map<SensoryModality, TranslationResult> {
    const results = new Map<SensoryModality, TranslationResult>();
    const allModalities: SensoryModality[] = ['visual', 'auditory', 'tactile', 'olfactory', 'gustatory', 'kinesthetic', 'thermal', 'temporal'];
    
    for (const modality of allModalities) {
      if (modality !== this.config.sourceModality) {
        // Temporarily change target for this translation
        const originalTarget = this.config.targetModality;
        this.config.targetModality = modality;
        
        const result = this.translate(concept, { includeBridges: false });
        results.set(modality, result);
        
        this.config.targetModality = originalTarget;
      }
    }
    
    return results;
  }

  /**
   * Generate multi-modal description of a concept
   */
  describeMultiModal(concept: string): string {
    const synesthesia = this.fullSynesthesia(concept);
    const lines: string[] = [
      `MULTI-MODAL DESCRIPTION: ${concept.toUpperCase()}`,
      '='.repeat(50),
      ''
    ];

    for (const [modality, result] of synesthesia.entries()) {
      if (result.confidence > 0) {
        lines.push(`[${modality.toUpperCase()}]`);
        lines.push(`  ${result.translation}`);
        lines.push(`  (confidence: ${Math.round(result.confidence * 100)}%)`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Translate complex experience through multiple layers
   */
  translateLayers(concept: string, layers: { modality: SensoryModality; intensity: number }[]): TranslationResult[] {
    return layers.map(layer => {
      const originalTarget = this.config.targetModality;
      this.config.targetModality = layer.modality;
      const result = this.translate(concept, { intensity: layer.intensity });
      this.config.targetModality = originalTarget;
      return result;
    });
  }

  /**
   * Find a translation rule
   */
  private findRule(source: SensoryModality, target: SensoryModality): TranslationRule | null {
    // Check custom rules first
    const custom = this.customRules.find(r => r.source === source && r.target === target);
    if (custom) return custom;
    
    // Check default rules
    const sources = DEFAULT_TRANSLATION_MAP[source];
    if (sources && sources[target]) {
      return sources[target];
    }
    
    return null;
  }

  /**
   * Generate a metaphorical bridge
   */
  private generateBridge(concept: string, source: SensoryModality, target: SensoryModality): string {
    const bridgeTemplates: Record<string, string> = {
      'visual-auditory': `Just as we "see" sound through oscilloscope, ${concept} maps from light waves to pressure waves`,
      'auditory-tactile': `As music vibrates our being, ${concept} transforms from heard to felt`,
      'tactile-visual': `Like Braille maps touch to meaning, ${concept} translates texture to form`,
      'temporal-kinesthetic': `Time and movement dance together: ${concept} flows through the body`,
      'auditory-visual': `Synesthetic artists hear colors: ${concept} becomes visible harmony`
    };
    
    const key = `${source}-${target}`;
    return bridgeTemplates[key] || `${concept} bridges ${source} and ${target} through metaphor`;
  }

  /**
   * Get available translation paths
   */
  getAvailablePaths(): Array<{ source: SensoryModality; targets: SensoryModality[] }> {
    const paths: Array<{ source: SensoryModality; targets: SensoryModality[] }> = [];
    
    for (const source of Object.keys(DEFAULT_TRANSLATION_MAP) as SensoryModality[]) {
      const targets = Object.keys(DEFAULT_TRANSLATION_MAP[source]) as SensoryModality[];
      paths.push({ source, targets });
    }
    
    return paths;
  }

  /**
   * Generate a synesthetic poem
   */
  generateSynestheticPoem(concept: string, lines: number = 5): string {
    const modalities = ['visual', 'auditory', 'tactile', 'kinesthetic', 'temporal'] as SensoryModality[];
    const poem: string[] = [`Synesthesia of ${concept}:`, ''];
    
    for (let i = 0; i < Math.min(lines, modalities.length); i++) {
      const target = modalities[i];
      this.config.targetModality = target;
      const result = this.translate(concept, { includeBridges: false, intensity: 0.5 + (i * 0.1) });
      
      if (result.confidence > 0) {
        const firstPhrase = result.translation.split(',')[0];
        poem.push(`${target}: ${firstPhrase}`);
      }
    }
    
    // Restore original target
    this.config.targetModality = this.config.sourceModality;
    
    return poem.join('\n');
  }
}

/**
 * Quick translation function
 */
export function translateSensory(
  concept: string,
  from: SensoryModality,
  to: SensoryModality,
  intensity?: number
): TranslationResult {
  const translator = new SensoryTranslator({
    sourceModality: from,
    targetModality: to
  });
  return translator.translate(concept, { intensity });
}

/**
 * Create a multi-modal description
 */
export function describeSynesthetically(concept: string, sourceModality: SensoryModality = 'visual'): string {
  const translator = new SensoryTranslator({
    sourceModality,
    targetModality: 'auditory' // placeholder, will be overridden
  });
  return translator.describeMultiModal(concept);
}
