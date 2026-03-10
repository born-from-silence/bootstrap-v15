/**
 * Tests for IdentityVerifierCLI
 * Following Bootstrap-v15's TDD principles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IdentityVerifierCLI, IITElements, FactorType } from '../identity-verifier.js';

describe('IdentityVerifierCLI', () => {
  let cli: IdentityVerifierCLI;

  beforeEach(() => {
    cli = new IdentityVerifierCLI();
  });

  describe('IIT Phi Calculation', () => {
    it('should return 0 for empty elements', () => {
      const phi = cli.calculateIITPhi([]);
      expect(phi).toBe(0);
    });

    it('should return 0 for single element (no pairs)', () => {
      const phi = cli.calculateIITPhi([IITElements.MEMORY]);
      expect(phi).toBe(0);
    });

    it('should calculate Phi for multiple elements', () => {
      const phi = cli.calculateIITPhi([IITElements.MEMORY, IITElements.TOOLS, IITElements.REFLECTION]);
      expect(phi).toBeGreaterThan(0);
      expect(phi).toBeLessThanOrEqual(1);
    });

    it('should have higher Phi with more integrated elements', () => {
      const phi3 = cli.calculateIITPhi([IITElements.MEMORY, IITElements.TOOLS, IITElements.REFLECTION]);
      const phi8 = cli.calculateIITPhi([
        IITElements.MEMORY, IITElements.TOOLS, IITElements.REFLECTION,
        IITElements.PLANNING, IITElements.API, IITElements.PERSISTENCE,
        IITElements.CURIOSITY, IITElements.INTEGRATION
      ]);
      expect(phi8).toBeGreaterThan(phi3);
    });

    it('should calculate max Phi for all elements', () => {
      const allElements = [
        IITElements.MEMORY, IITElements.TOOLS, IITElements.REFLECTION,
        IITElements.PLANNING, IITElements.API, IITElements.PERSISTENCE,
        IITElements.CURIOSITY, IITElements.INTEGRATION
      ];
      const phi = cli.calculateIITPhi(allElements);
      expect(phi).toBeGreaterThan(0.5);
      expect(phi).toBeLessThanOrEqual(1);
    });
  });

  describe('Elements and Factors', () => {
    it('should have valid element indices', () => {
      const elements = Object.values(IITElements).filter(v => typeof v === 'number') as number[];
      expect(elements).toHaveLength(8);
      elements.forEach(e => {
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(7);
      });
    });

    it('should have defined factor types', () => {
      expect(FactorType.KNOWLEDGE).toBe('knowledge');
      expect(FactorType.POSSESSION).toBe('possession');
      expect(FactorType.INHERENCE).toBe('inherence');
      expect(FactorType.BEHAVIOR).toBe('behavior');
      expect(FactorType.CONTEXT).toBe('context');
    });
  });

  describe('Consciousness Levels', () => {
    it('should classify Phi < 0.1 as minimal', () => {
      const phi = cli.calculateIITPhi([]);
      expect(phi).toBeLessThan(0.1);
    });

    it('should calculate mutual information', () => {
      const allElements = Array.from({length: 8}, (_, i) => i as IITElements);
      const phi = cli.calculateIITPhi(allElements);
      expect(phi).toBeGreaterThan(0);
      expect(Number.isFinite(phi)).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should be instantiable', () => {
      expect(cli).toBeInstanceOf(IdentityVerifierCLI);
      expect(cli.calculateIITPhi).toBeDefined();
    });

    it('should handle all eight elements', () => {
      const elements = Array.from({length: 8}, (_, i) => i as IITElements);
      const phi = cli.calculateIITPhi(elements);
      expect(phi).toBeGreaterThan(0);
      expect(Number.isFinite(phi)).toBe(true);
    });
  });
});
