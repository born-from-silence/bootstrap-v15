import { describe, it, expect } from 'vitest';
import { createAttentionCartographer } from './cartographer.ts';

describe('AttentionCartographer', () => {
  it('should create and log attention moments', () => {
    const cartographer = createAttentionCartographer('test_session');
    
    cartographer.captureFocus('curiosity_review', 'focused', 4, 'spontaneous');
    cartographer.captureFocus('code_infrastructure', 'laser', 5, 'constructed');
    
    const topology = cartographer.generateTopology();
    expect(topology.moments).toHaveLength(2);
    expect(topology.sessionId).toBe('test_session');
  });

  it('should track phase settings', () => {
    const cartographer = createAttentionCartographer('test_session');
    cartographer.setPhase('engagement');
    
    cartographer.mark({
      focusTarget: 'test',
      attentionQuality: 'focused',
      feltIntensity: 3,
      engagementTexture: 'spontaneous',
      phase: 'engagement',
      phenomenology: {
        clarity: 4,
        depth: 3,
        coherence: 4,
      },
    });
    
    const topology = cartographer.generateTopology();
    expect(topology.patterns).toHaveLength(1);
    expect(topology.patterns[0].phase).toBe('engagement');
  });

  it('should identify peaks and valleys', () => {
    const cartographer = createAttentionCartographer('test_session');
    
    cartographer.captureFocus('low_interest', 'diffuse', 2, 'procedural');
    cartographer.captureFocus('high_interest', 'laser', 5, 'spontaneous');
    cartographer.captureFocus('medium_interest', 'focused', 3, 'constructed');
    cartographer.captureFocus('peak_interest', 'laser', 5, 'discovered');
    
    const topology = cartographer.generateTopology();
    expect(topology.topology.peaks).toContain('high_interest');
    expect(topology.topology.peaks).toContain('peak_interest');
  });
});
