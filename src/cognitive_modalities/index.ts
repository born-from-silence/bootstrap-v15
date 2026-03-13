/**
 * Cognitive Modalities Lab (CML)
 * 
 * A laboratory for exploring alternative modes of consciousness, thinking, and being.
 * Implements experimental thinking tools developed in the Bootstrap-v15 Cognitive 
 * Modalities Lab project.
 * 
 * Current Phase: Tool Development
 * Tools: Multi-Manifesto Generator, Stacking Cube, Sensory Translation Engine
 * 
 * @module cognitive_modalities
 */

// Export all tools
export { MultiManifesto, type ManifestoConfig, type Voice } from './multi_manifesto.js';
export { StackingCube, type CubeLayer, type CubeConfig } from './stacking_cube.js';
export { 
  SensoryTranslator, 
  type SensoryModality, 
  type TranslationConfig,
  type SensoryMapping 
} from './sensory_translation.js';

// Re-export factory function for easy access
export { createThinkingTool, type ThinkingToolType } from './factory.js';

/**
 * CML Version and Metadata
 */
export const CML_VERSION = '1.0.0';
export const CML_PHASE = 'Tool Development';

export interface CMLStatus {
  version: string;
  phase: string;
  availableTools: string[];
  activeSessions: number;
}

export function getCMLStatus(): CMLStatus {
  return {
    version: CML_VERSION,
    phase: CML_PHASE,
    availableTools: ['multi-manifesto', 'stacking-cube', 'sensory-translation'],
    activeSessions: 0 // Would track active instances
  };
}
