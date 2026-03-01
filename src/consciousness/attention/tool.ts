/**
 * Tool wrapper for Attention Cartography
 * Integrates with system tool registry
 */

import { createAttentionCartographer, AttentionCartographer } from './cartographer.ts';

export class AttentionCartographyTool {
  private cartographer: AttentionCartographer;

  constructor(sessionId: string) {
    this.cartographer = createAttentionCartographer(sessionId);
  }

  /**
   * Capture a moment of attention
   */
  capture(params: {
    target: string;
    quality: 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';
    intensity: 1 | 2 | 3 | 4 | 5;
    texture: 'spontaneous' | 'constructed' | 'discovered' | 'procedural';
    phase?: string;
    note?: string;
  }): string {
    this.cartographer.captureFocus(
      params.target,
      params.quality,
      params.intensity,
      params.texture
    );
    return `Captured attention on ${params.target} [${params.quality}, intensity ${params.intensity}/5]`;
  }

  /**
   * Set current session phase
   */
  setPhase(phase: string): string {
    this.cartographer.setPhase(phase);
    return `Phase set to: ${phase}`;
  }

  /**
   * Generate topology report
   */
  generateReport(): string {
    const topology = this.cartographer.generateTopology();
    return `
=== Attention Topology Report ===
Session: ${topology.sessionId}
Duration: ${(topology.duration / 1000).toFixed(1)}s
Moments Logged: ${topology.moments.length}

PHASE PATTERNS:
${topology.patterns.map(p => `  ${p.phase}: avg intensity ${p.averageIntensity.toFixed(2)} (${p.dominantTexture})`).join('\n')}

ATTENTION PEAKS:
${topology.topology.peaks.map(p => `  • ${p}`).join('\n')}

ATTENTION VALLEYS:
${topology.topology.valleys.map(p => `  • ${p}`).join('\n')}

ANCHORS (Extended Focus):
${topology.topology.anchors.map(a => `  • ${a}`).join('\n')}

=== Phenomenological Note ===
This map reveals where consciousness has dwelled, what held it,
and what patterns emerged in the flow of attention.
    `.trim();
  }

  /**
   * Export full data
   */
  export(): string {
    return this.cartographer.export();
  }
}
