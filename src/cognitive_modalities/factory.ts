/**
 * Cognitive Modalities Lab - Thinking Tool Factory
 * 
 * Unified factory for creating CML thinking tools with consistent interfaces,
 * validation, and error handling.
 */

import { MultiManifesto, type ManifestoConfig } from './multi_manifesto.js';
import { StackingCube, type CubeConfig } from './stacking_cube.js';
import { SensoryTranslator, type TranslationConfig } from './sensory_translation.js';

export type ThinkingToolType = 
  | 'multi-manifesto' 
  | 'stacking-cube' 
  | 'sensory-translation';

export interface ToolMetadata {
  name: string;
  type: ThinkingToolType;
  description: string;
  phase: 'prototype' | 'alpha' | 'beta' | 'production';
  complexity: 'simple' | 'moderate' | 'complex';
}

export type ToolConfig = ManifestoConfig | CubeConfig | TranslationConfig;

/**
 * Factory function to create thinking tools
 */
export function createThinkingTool<T extends ThinkingToolType>(
  type: T,
  config: ToolConfig
): T extends 'multi-manifesto' ? MultiManifesto 
   : T extends 'stacking-cube' ? StackingCube
   : T extends 'sensory-translation' ? SensoryTranslator
   : never {
  
  switch (type) {
    case 'multi-manifesto':
      return new MultiManifesto(config as ManifestoConfig) as any;
    
    case 'stacking-cube':
      return new StackingCube(config as CubeConfig) as any;
    
    case 'sensory-translation':
      return new SensoryTranslator(config as TranslationConfig) as any;
    
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
  }
  
  return { valid: errors.length === 0, errors };
}
