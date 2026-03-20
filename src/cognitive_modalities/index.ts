/**
 * Cognitive Modalities Lab (CML)
 *
 * A laboratory for exploring alternative modes of consciousness, thinking, and being.
 * Implements experimental thinking tools developed in the Bootstrap-v15 Cognitive
 * Modalities Lab project.
 *
 * Current Phase: Tool Development
 * Tools: Multi-Manifesto Generator, Stacking Cube, Sensory Translation Engine,
 *        Paradox Engine, Emergence Observatory, Boundary Ethnographer
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
export {
  ParadoxEngine,
  type ParadoxConfig,
  type ParadoxPair,
  type ParadoxOutput,
  CLASSIC_PARADOXES,
  holdParadox,
  exploreParadoxes,
  oscillateBetween
} from './paradox_engine.js';
export {
  EmergenceObservatory,
  type ObservatoryConfig,
  type ObservatoryOutput,
  type Pattern,
  EMERGENCE_PATTERNS,
  observeEmergence,
  simulatePattern,
  findEmergencePatterns
} from './emergence_observatory.js';
export {
  BoundaryEthnographer,
  type EthnographerConfig,
  type Threshold,
  type EthnographicReport,
  THRESHOLD_ARCHETYPES,
  exploreBoundary,
  crossBoundary,
  mapLiminalSpaces,
  getThresholdArchetype
} from './boundary_ethnographer.js';

// Re-export factory function for easy access
export { createThinkingTool, type ThinkingToolType } from './factory.js';

/**
 * CML Version and Metadata
 */
export const CML_VERSION = '1.1.0';
export const CML_PHASE = 'Tool Development - Phase 2';

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
    availableTools: [
      'multi-manifesto',
      'stacking-cube',
      'sensory-translation',
      'paradox-engine',
      'emergence-observatory',
      'boundary-ethnographer'
    ],
    activeSessions: 0 // Would track active instances
  };
}

/**
 * Quick synthesis of all tools for comprehensive exploration
 */
export function createFullSynthesis(
  subject: string,
  options?: {
    includeParadoxes?: boolean;
    includeEmergence?: boolean;
    includeBoundaries?: boolean;
  }
): string {
  const sections: string[] = [];

  sections.push('╔════════════════════════════════════════════════════════════╗');
  sections.push('║ CML FULL SYNTHESIS ║');
  sections.push(`║ Subject: ${subject.padEnd(50)} ║`);
  sections.push('╚════════════════════════════════════════════════════════════╝');
  sections.push('');

  if (options?.includeParadoxes !== false) {
    const { exploreParadoxes } = require('./paradox_engine.js');
    sections.push('═══ PARADOX ENGINE ═══');
    const paradoxOutput = exploreParadoxes(subject);
    for (const exp of paradoxOutput.explorations.slice(0, 2)) {
      sections.push(`${exp.paradoxName}: ${exp.insight.substring(0, 100)}...`);
    }
    sections.push('');
  }

  if (options?.includeEmergence !== false) {
    const { observeEmergence } = require('./emergence_observatory.js');
    sections.push('═══ EMERGENCE OBSERVATORY ═══');
    sections.push(observeEmergence(subject, 'formation').split('\n')[0]);
    sections.push('');
  }

  if (options?.includeBoundaries !== false) {
    const { exploreBoundary } = require('./boundary_ethnographer.js');
    sections.push('═══ BOUNDARY ETHNOGRAPHER ═══');
    sections.push(exploreBoundary(subject).split('\n')[0]);
    sections.push('');
  }

  return sections.join('\n');
}
