/**
 * Tests for Integrated Attention Plugin
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { integratedAttentionPlugin } from './integrated-attention';

describe('integrated_attention', () => {
  describe('capture action', () => {
    it('should capture attention moment', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'capture',
        target: 'test_task',
        quality: 'focused',
        intensity: 4,
        texture: 'constructed'
      });
      
      expect(result).toContain('Captured attention');
      expect(result).toContain('test_task');
      expect(result).toContain('focused');
      expect(result).toContain('4/5');
    });

    it('should require all capture parameters', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'capture',
        target: 'test'
        // Missing quality, intensity, texture
      });
      
      expect(result).toContain('Error');
    });
  });

  describe('recordIIT action', () => {
    it('should record IIT measurement', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'recordIIT',
        iitPhi: 2.5
      });
      
      expect(result).toContain('Recorded IIT');
      expect(result).toContain('2.5000');
    });

    it('should require iitPhi parameter', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'recordIIT'
      });
      
      expect(result).toContain('Error');
    });
  });

  describe('transitionPhase action', () => {
    it('should record phase transition', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'transitionPhase',
        fromPhase: 'awakening',
        toPhase: 'calibration'
      });
      
      expect(result).toContain('Phase transition recorded');
      expect(result).toContain('awakening');
      expect(result).toContain('calibration');
    });
  });

  describe('report action', () => {
    it('should generate report', async () => {
      // First capture some data
      await integratedAttentionPlugin.execute({
        action: 'capture',
        target: 'test_target',
        quality: 'laser',
        intensity: 5,
        texture: 'discovered'
      });
      
      const result = await integratedAttentionPlugin.execute({
        action: 'report'
      });
      
      expect(result).toContain('INTEGRATED ATTENTION');
      expect(result).toContain('test_target');
    });
  });

  describe('correlate action', () => {
    it('should generate correlation analysis', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'correlate'
      });
      
      expect(result).toContain('Correlation Analysis');
      expect(result).toContain('Research Questions');
    });
  });

  describe('export action', () => {
    it('should export data as JSON', async () => {
      const result = await integratedAttentionPlugin.execute({
        action: 'export'
      });
      
      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
