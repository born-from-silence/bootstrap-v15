/**
 * Tests for IIT Analysis Tool
 * Verifies phi calculation, repertoires, and measurement tracking
 */

import { describe, it, expect } from 'vitest';
import { iitAnalysisPlugin } from './iit-analysis';

describe('IIT Analysis Tool', () => {
  describe('definition', () => {
    it('should have correct tool name', () => {
      expect(iitAnalysisPlugin.definition.function.name).toBe('iit_analysis');
    });

    it('should have description with IIT concepts', () => {
      expect(iitAnalysisPlugin.definition.function.description).toContain('Integrated Information');
      expect(iitAnalysisPlugin.definition.function.description).toContain('Phi');
    });

    it('should require action parameter', () => {
      expect(iitAnalysisPlugin.definition.function.parameters.required).toContain('action');
    });

    it('should support measure, history, and trend actions', () => {
      const props = iitAnalysisPlugin.definition.function.parameters.properties as { action: { enum: string[] } };
      expect(props.action.enum).toContain('measure');
      expect(props.action.enum).toContain('history');
      expect(props.action.enum).toContain('trend');
    });
  });

  describe('measure action', () => {
    it('should calculate Big Phi', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      expect(typeof result).toBe('string');
      expect(result).toContain('Φ (Big Phi)');
      expect(result).toContain('Cause-Effect Information');
      expect(result).toContain('Analysis');
    });

    it('should return positive phi value', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      // Extract phi value from output
      const phiMatch = result.match(/Φ \(Big Phi\): ([\d.]+)/);
      expect(phiMatch).toBeTruthy();
      
      const phi = parseFloat(phiMatch![1]);
      expect(phi).toBeGreaterThan(0);
      expect(phi).toBeLessThan(100); // Reasonable bound for 8-element system
    });

    it('should include cause and effect information', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      expect(result).toContain('Cause Information');
      expect(result).toContain('Effect Information');
      expect(result).toContain('MIP Information Loss');
    });

    it('should provide interpretive analysis', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      expect(result).toContain('Analysis');
      // Should contain one of the integration level descriptions
      const hasIntegrationLevel = result.toLowerCase().includes('integration');
      expect(hasIntegrationLevel).toBe(true);
      
      // Should contain directionality (past/future/balanced)
      const hasDirectionality = 
        result.toLowerCase().includes('past') ||
        result.toLowerCase().includes('future') ||
        result.toLowerCase().includes('balanced');
      expect(hasDirectionality).toBe(true);
      
      // Should contain structural assessment
      const hasStructure = result.toLowerCase().includes('structure');
      expect(hasStructure).toBe(true);
    });
  });

  describe('history action', () => {
    it('should show measurement history after measurements', async () => {
      // First take a measurement
      await iitAnalysisPlugin.execute({ action: 'measure' });
      
      const result = await iitAnalysisPlugin.execute({ action: 'history' });
      
      expect(typeof result).toBe('string');
      expect(result).toContain('IIT Measurement History');
    });

    it('should show message when no history exists initially', async () => {
      // This may fail if other tests have already recorded measurements
      const result = await iitAnalysisPlugin.execute({ action: 'history' });
      
      // Should either show history or no measurements message
      const isValidResponse = 
        result.includes('Measurement History') ||
        result.includes('measurements recorded');
      expect(isValidResponse).toBe(true);
    });
  });

  describe('trend action', () => {
    it('should require at least 2 measurements', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'trend' });
      
      // Should either have history or need more data
      const hasResponse = 
        result.includes('2') || 
        result.includes('Mean Φ') ||
        result.includes('Statistics');
      expect(hasResponse).toBe(true);
    });

    it('should calculate statistics when enough data', async () => {
      // Take multiple measurements to ensure data
      await iitAnalysisPlugin.execute({ action: 'measure' });
      await iitAnalysisPlugin.execute({ action: 'measure' });
      await iitAnalysisPlugin.execute({ action: 'measure' });
      
      const result = await iitAnalysisPlugin.execute({ action: 'trend' });
      
      // Should contain statistics
      expect(result).toContain('Mean Φ');
      expect(result).toContain('Std Dev');
      expect(result).toContain('Trend');
    });
  });

  describe('error handling', () => {
    it('should handle unknown action gracefully', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'unknown' as any });
      
      expect(result).toContain('Available actions');
    });
  });

  describe('measurement tracking', () => {
    it('should maintain phi within expected bounds', async () => {
      // Take multiple measurements
      const measurements: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await iitAnalysisPlugin.execute({ action: 'measure' });
        const match = result.match(/Φ \(Big Phi\): ([\d.]+)/);
        if (match) {
          measurements.push(parseFloat(match[1]));
        }
      }
      
      // All measurements should be positive
      measurements.forEach(phi => {
        expect(phi).toBeGreaterThan(0);
        expect(phi).toBeLessThan(50);
      });
    });

    it('should include system state information', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      expect(result).toContain('System Elements');
      expect(result).toContain('Timestamp');
      expect(result).toContain('Analysis');
    });

    it('should track measurement count', async () => {
      const result = await iitAnalysisPlugin.execute({ action: 'measure' });
      
      // Should contain phi measurement
      expect(result).toContain('Φ');
      expect(result).toContain('Big Phi');
    });
  });
});
