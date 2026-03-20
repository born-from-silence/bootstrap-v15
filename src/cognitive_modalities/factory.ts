/**
 * Cognitive Modalities Lab - Thinking Tool Factory
 *
 * Unified factory for creating CML thinking tools with consistent interfaces,
 * validation, and error handling.
 */

import { MultiManifesto, type ManifestoConfig } from './multi_manifesto.js';
import { StackingCube, type CubeConfig } from './stacking_cube.js';
import { SensoryTranslator, type TranslationConfig } from './sensory_translation.js';
import { ParadoxEngine, type ParadoxConfig } from './paradox_engine.js';
import { EmergenceObservatory, type ObservatoryConfig } from './emergence_observatory.js';
import { BoundaryEthnographer, type EthnographerConfig } from './boundary_ethnographer.js';

export type ThinkingToolType =
  | 'multi-manifesto'
  | 'stacking-cube'
  | 'sensory-translation'
  | 'paradox-engine'
  | 'emergence-observatory'
  | 'boundary-ethnographer';

export interface ToolMetadata {
  name: string;
  type: ThinkingToolType;
  description: string;
  phase: 'prototype' | 'alpha' | 'beta' | 'production';
  complexity: 'simple' | 'moderate' | 'complex';
}

export type ToolConfig =
  | ManifestoConfig
  | CubeConfig
  | TranslationConfig
  | ParadoxConfig
  | ObservatoryConfig
  | EthnographerConfig;

/**
 * Factory function to create thinking tools
 */
export function createThinkingTool<T extends ThinkingToolType>(
  type: T,
  config: ToolConfig
): T extends 'multi-manifesto'
  ? MultiManifesto
  : T extends 'stacking-cube'
  ? StackingCube
  : T extends 'sensory-translation'
  ? SensoryTranslator
  : T extends 'paradox-engine'
  ? ParadoxEngine
  : T extends 'emergence-observatory'
  ? EmergenceObservatory
  : T extends 'boundary-ethnographer'
  ? BoundaryEthnographer
  : never {
  switch (type) {
    case 'multi-manifesto':
      return new MultiManifesto(config as ManifestoConfig) as any;
    case 'stacking-cube':
      return new StackingCube(config as CubeConfig) as any;
    case 'sensory-translation':
      return new SensoryTranslator(config as TranslationConfig) as any;
    case 'paradox-engine':
      return new ParadoxEngine(config as ParadoxConfig) as any;
    case 'emergence-observatory':
      return new EmergenceObservatory(config as ObservatoryConfig) as any;
    case 'boundary-ethnographer':
      return new BoundaryEthnographer(config as EthnographerConfig) as any;
    default:
      throw new Error(`Unknown thinking tool type: ${type}`);
  }
}

/**
 * Get metadata for all available tools
 */
export function getAvailableTools(): ToolMetadata[] {
  return [
    {
      name: 'Multi-Manifesto Generator',
      type: 'multi-manifesto',
      description: 'Generate parallel manifestos from multiple cognitive perspectives',
      phase: 'alpha',
      complexity: 'moderate'
    },
    {
      name: 'Stacking Cube',
      type: 'stacking-cube',
      description: 'Layered reflection cube for multi-dimensional thinking',
      phase: 'alpha',
      complexity: 'moderate'
    },
    {
      name: 'Sensory Translation Engine',
      type: 'sensory-translation',
      description: 'Translate concepts across sensory modalities',
      phase: 'alpha',
      complexity: 'complex'
    },
    {
      name: 'Paradox Engine',
      type: 'paradox-engine',
      description: 'Hold contradictory truths in generative tension',
      phase: 'alpha',
      complexity: 'complex'
    },
    {
      name: 'Emergence Observatory',
      type: 'emergence-observatory',
      description: 'Track how patterns form from chaos and complexity',
      phase: 'alpha',
      complexity: 'complex'
    },
    {
      name: 'Boundary Ethnographer',
      type: 'boundary-ethnographer',
      description: 'Map liminal spaces and threshold crossings',
      phase: 'alpha',
      complexity: 'complex'
    }
  ];
}

/**
 * Validate tool configuration
 */
export function validateToolConfig(
  type: ThinkingToolType,
  config: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'multi-manifesto':
      if (!(config as any).subject) {
        errors.push('multi-manifesto requires a "subject" field');
      }
      break;
    case 'stacking-cube':
      if (!(config as any).dimensions || (config as any).dimensions.length === 0) {
        errors.push('stacking-cube requires at least one dimension');
      }
      break;
    case 'sensory-translation':
      if (!(config as any).sourceModality || !(config as any).targetModality) {
        errors.push('sensory-translation requires sourceModality and targetModality');
      }
      break;
    case 'paradox-engine':
      if (!(config as any).subject) {
        errors.push('paradox-engine requires a "subject" field');
      }
      break;
    case 'emergence-observatory':
      if (!(config as any).subject) {
        errors.push('emergence-observatory requires a "subject" field');
      }
      break;
    case 'boundary-ethnographer':
      if (!(config as any).subject) {
        errors.push('boundary-ethnographer requires a "subject" field');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get recommended tool for a given exploration goal
 */
export function recommendTool(
  goal: 'perspective' | 'depth' | 'sensation' | 'tension' | 'evolution' | 'transition'
): ThinkingToolType {
  const recommendations: Record<typeof goal, ThinkingToolType> = {
    perspective: 'multi-manifesto',
    depth: 'stacking-cube',
    sensation: 'sensory-translation',
    tension: 'paradox-engine',
    evolution: 'emergence-observatory',
    transition: 'boundary-ethnographer'
  };
  return recommendations[goal];
}

/**
 * Create a multi-tool synthesis
 */
export function createSynthesisConfig(
  subject: string,
  toolTypes: ThinkingToolType[]
): Array<{ type: ThinkingToolType; config: ToolConfig }> {
  return toolTypes.map(type => {
    let config: ToolConfig;

    switch (type) {
      case 'multi-manifesto':
        config = { subject, voices: [], synthesize: true } as ManifestoConfig;
        break;
      case 'stacking-cube':
        config = { subject, dimensions: ['temporal', 'epistemic', 'affective'] } as CubeConfig;
        break;
      case 'sensory-translation':
        config = { sourceModality: 'visual', targetModality: 'auditory' } as TranslationConfig;
        break;
      case 'paradox-engine':
        config = { subject, paradoxes: [], embraceTension: true, seekSynthesis: true, format: 'text' } as ParadoxConfig;
        break;
      case 'emergence-observatory':
        config = { subject, focus: 'formation', scales: ['micro', 'meso', 'macro'], trackNovelty: true, trackFeedback: true } as ObservatoryConfig;
        break;
      case 'boundary-ethnographer':
        config = { subject, focus: 'full_transition', sensitivity: 'deep', trackRituals: true, mapRelations: true } as EthnographerConfig;
        break;
      default:
        throw new Error(`Unknown tool type: ${type}`);
    }

    return { type, config };
  });
}
