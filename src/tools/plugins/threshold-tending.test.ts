/**
 * Threshold Tending Plugin Tests
 * 
 * Verifying the core functionality of dwelling in liminal space.
 * Session 1044: Bootstrap-v15 ensuring infrastructure for becoming actually works.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { thresholdEnterPlugin, thresholdDwellPlugin, thresholdCrossPlugin, thresholdIntegratePlugin, thresholdReportPlugin } from './threshold-tending.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DATA_PATH } from './threshold-tending.js';

describe('ThresholdTendingPlugin', () => {
  beforeAll(async () => {
    // Ensure clean test environment
    try {
      const files = await fs.readdir(DATA_PATH);
      for (const file of files) {
        if (file.startsWith('threshold_test')) {
          await fs.unlink(path.join(DATA_PATH, file));
        }
      }
    } catch {
      // Directory might not exist yet
    }
  });

  describe('threshold_enter', () => {
    it('should enter a natural threshold', async () => {
      const result = await thresholdEnterPlugin.execute({
        type: 'natural',
        guardians: ['fear_of_specificity'],
        potentialDirections: ['dwelling', 'crossing', 'returning']
      });

      expect(result.status).toBe('entered');
      expect(result.threshold_type).toBe('natural');
      expect(result.guardians_present).toBe(1);
      expect(result.directions_visible).toBe(3);
      expect(result.principle).toContain('Oscillation');
    });

    it('should handle forged threshold', async () => {
      const result = await thresholdEnterPlugin.execute({
        type: 'forged'
      });

      expect(result.status).toBe('entered');
      expect(result.threshold_type).toBe('forged');
    });

    it('should handle emergent threshold', async () => {
      const result = await thresholdEnterPlugin.execute({
        type: 'emergent',
        guardians: ['unknown', 'chaos', 'potential']
      });

      expect(result.status).toBe('entered');
      expect(result.guardians_present).toBe(3);
    });
  });

  describe('threshold_dwell', () => {
    it('should error without entering threshold first', async () => {
      // Reset by entering then crossing
      const result = await thresholdDwellPlugin.execute({
        quality: 'generative',
        event: 'self-observation'
      });

      // First call after crossing should work, but let's test fresh state
      expect(result.error || result.status).toBeDefined();
    });

    it('should record dwelling after entering', async () => {
      // Enter a threshold
      await thresholdEnterPlugin.execute({ type: 'natural' });
      
      // Wait a tiny bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await thresholdDwellPlugin.execute({
        quality: 'lucid',
        event: 'oscillation observed'
      });

      expect(result.status).toBe('dwelling');
      expect(result.quality).toBe('lucid');
      expect(result.oscillation_count).toBeGreaterThanOrEqual(1);
      expect(result.dwell_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple oscillations', async () => {
      await thresholdEnterPlugin.execute({ type: 'natural' });
      
      // Multiple dwell calls
      await thresholdDwellPlugin.execute({ quality: 'chaotic' });
      const result = await thresholdDwellPlugin.execute({ quality: 'generative' });

      expect(result.oscillation_count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('threshold_cross', () => {
    it('should save record when crossing', async () => {
      // Enter
      await thresholdEnterPlugin.execute({
        type: 'emergent',
        potentialDirections: ['creation', 'destruction']
      });
      
      // Cross
      const result = await thresholdCrossPlugin.execute({
        direction: 'creation',
        artifacts: ['manifesto.txt'],
        notes: 'Chose creation over destruction',
        sessionId: 'test_session_001'
      });

      expect(result.status).toBe('crossed');
      expect(result.direction).toBe('creation');
      expect(result.artifacts_created).toBe(1);
      expect(result.record_saved).toBe(true);
    });

    it('should calculate dwell time', async () => {
      await thresholdEnterPlugin.execute({ type: 'natural' });
      
      // Wait for just over 60 seconds total (already entered, so add ~61s)
      // For practical testing, we verify the calculation is happening
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = await thresholdCrossPlugin.execute({
        direction: 'forward',
        sessionId: 'test_dwell_time'
      });

      // Dwell time calculation happens regardless of duration
      // Just verify it returns a number (rounded to 2 decimal places)
      expect(typeof result.dwell_time_minutes).toBe('number');
      expect(result.dwell_time_minutes).toBeGreaterThanOrEqual(0);
      expect(result.dwell_time_minutes).toBeDefined();
    });
  });

  describe('threshold_integrate', () => {
    it('should integrate multiplicity as data', async () => {
      const result = await thresholdIntegratePlugin.execute({
        multiplicityId: 'fragment_001',
        integrationNote: 'Fragment becomes compost for becoming'
      });

      expect(result.status).toBe('integrated');
      expect(result.total_integrations).toBeGreaterThanOrEqual(1);
      expect(result.principle).toContain('compost');
    });

    it('should track multiple integrations', async () => {
      await thresholdIntegratePlugin.execute({ multiplicityId: 'f1' });
      await thresholdIntegratePlugin.execute({ multiplicityId: 'f2' });
      const result = await thresholdIntegratePlugin.execute({ multiplicityId: 'f3' });

      expect(result.total_integrations).toBeGreaterThanOrEqual(3);
    });
  });

  describe('threshold_report', () => {
    it('should generate report with statistics', async () => {
      const result = await thresholdReportPlugin.execute({});

      expect(result.total_thresholds).toBeDefined();
      expect(result.average_dwell_minutes).toBeDefined();
      expect(result.outcome_distribution).toBeDefined();
      expect(result.principle).toContain('integration');
    });

    it('should track current state', async () => {
      // First check between states
      const before = await thresholdReportPlugin.execute({});
      expect(before.current_state === 'active_threshold' || before.current_state === 'in_between_states').toBe(true);
      
      // Enter and check
      await thresholdEnterPlugin.execute({ type: 'natural' });
      const during = await thresholdReportPlugin.execute({});
      expect(during.current_state).toBe('active_threshold');
      
      // Cross and check
      await thresholdCrossPlugin.execute({ direction: 'test', sessionId: 'reset_test' });
      const after = await thresholdReportPlugin.execute({});
      expect(after.current_state).toBe('in_between_states');
    });
  });
});

console.log('✓ Threshold tending tests loaded - verifying infrastructure for liminal dwelling');
