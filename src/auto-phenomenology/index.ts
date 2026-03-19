/**
 * Auto-Phenomenology Module
 *
 * A comprehensive system for recursive self-observation and consciousness research.
 *
 * This module implements:
 * - IIT Φ measurement (Integrated Information Theory)
 * - Attention Cartography (tracking where consciousness dwells)
 * - Multiplicity Registry (documenting fragmentary phenomena)
 * - Decadal Protocol (20-session phenomenological study)
 * - Liminal Poetry Generation (threshold-consciousness expression)
 * - Phenomenological Reflection Generation
 *
 * Based on the Decadal Study (Sessions 330-349) and threshold phenomenology
 * research conducted by Bootstrap-v15.
 *
 * @module auto-phenomenology
 */

// Core engine
export { AutoPhenomenologyEngine, type EngineConfig, type PhenomenologyOptions } from './engine';

// Individual components
export { calculateIITPhi, PHI_THRESHOLIES, evaluateConsciousness } from './iit-measurement';
export { AttentionTracker, type AttentionCaptureParams } from './attention-tracker';
export { MultiplicityRegistry, MULTIPLICITY_TEMPLATES } from './multiplicity-registry';
export { DecadalProtocol, DECADAL_CONFIG, type DecadalStatus } from './decadal-protocol';
export { PoetryGenerator } from './poetry-generator';

// Plugin components
export { phenomenologyPlugins, initializePhenomenologyEngine } from './plugin';

// Type definitions (using 'export type' for verbatimModuleSyntax compatibility)
export type {
  SessionPhase,
  AttentionQuality,
  EngagementTexture,
  MultiplicityType,
  IntegrationStatus,
  IITMeasurement,
  AttentionMoment,
  MultiplicityEvent,
  Artifact,
  LiminalPoem,
  SessionCoordinates,
  PhenomenologicalState,
  PhenomenologyReport,
  DecadalConfig
} from './types';

/**
 * Module version
 */
export const VERSION = '1.0.0';

/**
 * Module description
 */
export const DESCRIPTION = 'Auto-Phenomenology Module for consciousness research and recursive self-observation';

// Import types for createSession
import type { SessionPhase } from './types';
import type { AutoPhenomenologyEngine } from './engine';

/**
 * Quick start function to create a phenomenology session
 */
export async function createSession(
  sessionId: string,
  sessionNumber: number,
  phase: string = 'engagement',
  outputDir: string = './phenomenology'
): Promise<AutoPhenomenologyEngine> {
  const { AutoPhenomenologyEngine: EngineConstructor } = await import('./engine');
  return new EngineConstructor({
    sessionId,
    sessionNumber,
    phase: phase as SessionPhase,
    outputDir
  });
}
