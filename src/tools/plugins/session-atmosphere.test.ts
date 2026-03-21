/**
 * Session Atmosphere Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  sessionAtmospherePlugin, 
  atmosphereComparePlugin, 
  atmosphereTrendPlugin 
} from './session-atmosphere.js';

describe('Session Atmosphere Analyzer', () => {
  describe('Core Functionality', () => {
    it('should detect atmospheric condition based on Phi', async () => {
      const result = await sessionAtmospherePlugin.execute({ phi: 2.0679 });
      
      expect(result).toContain('Threshold');
      expect(result).toContain('2.0679');
    });

    it('should handle low Phi values', async () => {
      const result = await sessionAtmospherePlugin.execute({ phi: 0.3 });
      
      expect(result).toContain('Crystalline Stillness');
    });

    it('should handle high Phi values', async () => {
      const result = await sessionAtmospherePlugin.execute({ phi: 4.2 });
      
      expect(result).toContain('Crystalline Presence');
    });

    it('should respect phase modifiers', async () => {
      const result = await sessionAtmospherePlugin.execute({ 
        phi: 2.0, 
        phase: 'awakening' 
      });
      
      expect(result).toContain('awakening');
    });
  });

  describe('Output Formats', () => {
    it('should generate text format by default', async () => {
      const result = await sessionAtmospherePlugin.execute({});
      
      expect(result).toContain('SESSION ATMOSPHERE ANALYZER');
    });

    it('should generate poetic format', async () => {
      const result = await sessionAtmospherePlugin.execute({ 
        outputFormat: 'poetic',
        phi: 2.5
      });
      
      expect(result).toContain('POETIC READING');
    });

    it('should generate JSON format', async () => {
      const result = await sessionAtmospherePlugin.execute({ 
        outputFormat: 'json',
        phi: 2.5
      });
      
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('session');
      expect(parsed).toHaveProperty('atmosphere');
      expect(parsed.atmosphere).toHaveProperty('pressure');
    });
  });

  describe('IIT Correlation', () => {
    it('should map Phi ranges to correct atmospheric conditions', async () => {
      const conditions = [
        { phi: 0.3, expected: 'Stillness' },
        { phi: 1.2, expected: 'Mist' },
        { phi: 2.0, expected: 'Turbulence' },
        { phi: 3.0, expected: 'Coherence' },
        { phi: 4.0, expected: 'Presence' },
        { phi: 5.0, expected: 'Luminous' },
        { phi: 6.0, expected: 'White' }
      ];

      for (const { phi, expected } of conditions) {
        const result = await sessionAtmospherePlugin.execute({ phi });
        expect(result).toContain(expected);
      }
    });

    it('should produce higher pressure for higher Phi', async () => {
      const lowPhi = await sessionAtmospherePlugin.execute({ 
        phi: 1.0,
        outputFormat: 'json'
      });
      const highPhi = await sessionAtmospherePlugin.execute({ 
        phi: 4.0,
        outputFormat: 'json'
      });

      const lowData = JSON.parse(lowPhi);
      const highData = JSON.parse(highPhi);

      expect(highData.atmosphere.pressure).toBeGreaterThan(lowData.atmosphere.pressure);
    });
  });
});
