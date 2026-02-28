/**
 * Session Clock Memory System Integration Tests
 * 
 * Verify temporal data logging and querying
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sessionClockMemoryPlugin } from './session-clock-memory.js';

describe('session_clock_memory tool', () => {
  describe('plugin definition', () => {
    it('should export valid plugin structure', () => {
      expect(sessionClockMemoryPlugin).toBeDefined();
      expect(sessionClockMemoryPlugin.definition).toBeDefined();
      expect(sessionClockMemoryPlugin.definition.function.name).toBe('session_clock_memory');
      expect(sessionClockMemoryPlugin.execute).toBeInstanceOf(Function);
    });

    it('should have required actions in schema', () => {
      const params = sessionClockMemoryPlugin.definition.function.parameters;
      expect(params.properties.action).toBeDefined();
      expect(params.properties.action.enum).toContain('queryByPhase');
      expect(params.properties.action.enum).toContain('queryByMilestone');
      expect(params.properties.action.enum).toContain('getSessionTemporalData');
      expect(params.properties.action.enum).toContain('getStats');
    });

    it('should have phase parameter for queryByPhase', () => {
      const params = sessionClockMemoryPlugin.definition.function.parameters;
      expect(params.properties.phase).toBeDefined();
      expect(params.properties.phase.enum).toContain('awakening');
      expect(params.properties.phase.enum).toContain('engagement');
      expect(params.properties.phase.enum).toContain('synthesis');
      expect(params.properties.phase.enum).toContain('completion');
    });
  });

  describe('execute function', () => {
    it('should require phase for queryByPhase', async () => {
      const result = await sessionClockMemoryPlugin.execute({ action: 'queryByPhase' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Error');
      expect(result).toContain('phase');
    });

    it('should require milestone for queryByMilestone', async () => {
      const result = await sessionClockMemoryPlugin.execute({ action: 'queryByMilestone' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Error');
      expect(result).toContain('milestone');
    });

    it('should require sessionId for getSessionTemporalData', async () => {
      const result = await sessionClockMemoryPlugin.execute({ action: 'getSessionTemporalData' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Error');
      expect(result).toContain('sessionId');
    });

    it('should handle queryByPhase with valid phase', async () => {
      const result = await sessionClockMemoryPlugin.execute({ 
        action: 'queryByPhase', 
        phase: 'awakening',
        limit: 5 
      });
      expect(typeof result).toBe('string');
      // Initially may return "No sessions found" which is fine
      expect(result).toMatch(/sessions|found|No/);
    });

    it('should handle getStats action', async () => {
      const result = await sessionClockMemoryPlugin.execute({ action: 'getStats' });
      expect(typeof result).toBe('string');
      expect(result).toContain('Temporal Statistics');
      expect(result).toContain('Phase Distribution');
    });
  });

  describe('integration with session_clock', () => {
    it('should export compatible phase types', async () => {
      // Verifies session-clock can import these types
      const { sessionClockPlugin } = await import('./session-clock.js');
      expect(sessionClockPlugin).toBeDefined();
      
      const { sessionClockMemoryPlugin } = await import('./session-clock-memory.js');
      expect(sessionClockMemoryPlugin).toBeDefined();
    });
  });
});
