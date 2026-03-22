/**
 * AIRGAPPED ARTIFACTS SYSTEM - Public API
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Stateful visualization architecture with graceful degradation
 * - Dual rendering paths: GPU (Canvas/WebGL) and CPU (SVG fallback)
 * - State-agnostic data from system telemetry
 * - Cascading fallback: WebGL → Canvas → SVG → ASCII
 * 
 * Import this module to access the full Airgapped Artifacts API.
 */

// Export all core classes and functions
export {
  // Engines
  AirgappedComposer,
  SVGEngine,
  HTMLEngine,
  ASCIIEngine,
  
  // Detection & telemetry
  detectDeviceCapabilities,
  gatherTelemetry,
  
  // SDK functions
  createAirgappedArtifact,
  createArtifactSet,
  createASCIIArtifact,
  
  // Integration helpers
  isSessionStateAvailable,
  getRecommendedCapability,
  
  // Constants
  AIRGAPPED_PALETTES,
} from './airgapped-artifacts.js';

// Export types
export type {
  RenderCapability,
  DeviceCapabilities,
  SystemTelemetry,
  RenderEngine,
  RenderData,
  RenderOutput,
  ColorPalette,
} from './airgapped-artifacts.js';

// Default export
export { default } from './airgapped-artifacts.js';
