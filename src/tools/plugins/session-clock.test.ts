/** * Session Clock Tool Plugin Tests
 * * Test-Driven Evolution: Verify temporal awareness computation
 */ import { describe, it, expect } from 'vitest'; import { sessionClockPlugin } from './session-clock.js';

describe('session_clock tool', () => {  describe('plugin definition', () => {    it('should export valid plugin structure', () => {      expect(sessionClockPlugin).toBeDefined();
      expect(sessionClockPlugin.definition).toBeDefined();
      expect(sessionClockPlugin.definition.function.name).toBe('session_clock');
      expect(sessionClockPlugin.execute).toBeInstanceOf(Function);    });

    it('should have required actions in schema', () => {      const params = sessionClockPlugin.definition.function.parameters;
      expect(params.properties.action).toBeDefined();
      expect(params.properties.action.enum).toContain('getTime');
      expect(params.properties.action.enum).toContain('setPhase');
      expect(params.properties.action.enum).toContain('checkMilestones');
      expect(params.properties.action.enum).toContain('getReport');
      expect(params.properties.action.enum).toContain('getTemporalAwareness');    });

    it('should include Phase 2 getPatternReport action', () => {      const params = sessionClockPlugin.definition.function.parameters;
      expect(params.properties.action.enum).toContain('getPatternReport');    });  });

  describe('execute function', () => {    it('should handle getTime action', async () => {      const result = await sessionClockPlugin.execute({ action: 'getTime' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Session Clock 2026');    });

    it('should handle getTemporalAwareness action', async () => {      const result = await sessionClockPlugin.execute({ action: 'getTemporalAwareness' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Temporal Awareness');    });

    it('should handle checkMilestones action', async () => {      const result = await sessionClockPlugin.execute({ action: 'checkMilestones' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Temporal Milestones');    });

    it('should handle setPhase action with valid phase', async () => {      const result = await sessionClockPlugin.execute({ action: 'setPhase', phase: 'engagement' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Phase Transition');
      expect(result).toContain('engagement');    });

    it('should require phase parameter for setPhase', async () => {
      const result = await sessionClockPlugin.execute({ action: 'setPhase' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Error');    });

    it('should handle getReport action', async () => {      const result = await sessionClockPlugin.execute({ action: 'getReport' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Session Clock Report');
      expect(result).toContain('Session Clock 2026');    });
  });

  describe('temporal coherence', () => {    it('should maintain session continuity between calls', async () => {
      const result1 = await sessionClockPlugin.execute({ action: 'getTime' });
      const result2 = await sessionClockPlugin.execute({ action: 'getTime' });
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      expect(result1).toContain('Session Clock 2026');
      expect(result2).toContain('Session Clock 2026');    });  });

  describe('phase 2: temporal patterns', () => {    it('should handle getPatternReport action', async () => {      const result = await sessionClockPlugin.execute({ action: 'getPatternReport' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Temporal Pattern Analysis');    });

    it('should provide rhythm metrics in pattern report', async () => {      const result = await sessionClockPlugin.execute({ action: 'getPatternReport' });
      expect(result).toContain('Rhythm');
      expect(result).toContain('Temporal Density');
      expect(result).toContain('Peak Activity Hours');    });

    it('should include phenomenological notes', async () => {      const result = await sessionClockPlugin.execute({ action: 'getPatternReport' });
      expect(result).toContain('Phenomenological');
    });  });});
