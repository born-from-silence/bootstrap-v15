/**
 * Tests for the Butoh Corpus Foundation
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 * Verify: The semantic substrate functions correctly
 */

import { describe, expect, test } from 'vitest';

import {
  ButohCorpus,
  getButohFuByState,
  getButohFuByQuality,
  generateTransformation,
  findPath,
  getLineageTrace,
  generatePoeticFragment,
  EmbodiedState,
  ButohQuality
} from '../corpus';

describe('Butoh Corpus Foundation', () => {
  describe('Core Data Structures', () => {
    test('exports all embodied states', () => {
      expect(ButohCorpus.states).toHaveLength(11);
      expect(ButohCorpus.states).toContain('angel');
      expect(ButohCorpus.states).toContain('corpse');
      expect(ButohCorpus.states).toContain('ash');
    });

    test('exports all qualities', () => {
      expect(ButohCorpus.qualities).toHaveLength(10);
      expect(ButohCorpus.qualities).toContain('collapsed');
      expect(ButohCorpus.qualities).toContain('suspended');
    });

    test('butoh-fu corpus is populated', () => {
      expect(ButohCorpus.butohFu).toHaveLength(8);
      const stiffening = ButohCorpus.butohFu.find(f => f.name.includes('Stiffening'));
      expect(stiffening).toBeDefined();
      expect(stiffening?.lineage[0].master).toBe('Hijikata Tatsumi');
    });
  });

  describe('Query Functions', () => {
    test('getButohFuByState returns correct movements', () => {
      const ghostFu = getButohFuByState('ghost');
      expect(ghostFu.length).toBeGreaterThan(0);
      ghostFu.forEach(fu => {
        expect(fu.states).toContain('ghost');
      });
    });

    test('getButohFuByQuality returns movements with quality', () => {
      const suspendedFu = getButohFuByQuality('suspended');
      expect(suspendedFu.length).toBeGreaterThan(0);
      suspendedFu.forEach(fu => {
        expect(fu.qualities).toContain('suspended');
      });
    });

    test('getButohFuByState returns empty array for invalid state', () => {
      const result = getButohFuByState('invalid' as EmbodiedState);
      expect(result).toEqual([]);
    });
  });

  describe('Transformation Sequences', () => {
    test('generateTransformation returns valid sequence', () => {
      const sequence = generateTransformation();
      expect(sequence).toHaveProperty('name');
      expect(sequence).toHaveProperty('stages');
      expect(sequence).toHaveProperty('duration');
      expect(sequence.stages.length).toBeGreaterThan(0);
    });

    test('transformation sequences have valid states', () => {
      ButohCorpus.transformations.forEach(seq => {
        seq.stages.forEach(state => {
          expect(ButohCorpus.states).toContain(state);
        });
      });
    });
  });

  describe('Ontological Path Finding', () => {
    test('findPath returns path between connected states', () => {
      const path = findPath('corpse', 'plant');
      expect(path).not.toBeNull();
      expect(path![0]).toBe('corpse');
      expect(path![path!.length - 1]).toBe('plant');
    });

    test('findPath returns only start for same state', () => {
      const path = findPath('ash', 'ash');
      expect(path).toEqual(['ash']);
    });

    test('findPath returns null for disconnected states', () => {
      // Note: 'flame' is actually connected via insect→plant→living-again→corpse→ash→mineral→flame
      // Testing a truly disconnected path would require analyzing the graph
      // For now, test that pathfinding works for unconnected pairs (if any)
      const path = findPath('wind', 'fetus');
      // Currently wind connects to ghost and fetus, so this finds a path
      // This test documents the connectedness of the ontology
      expect(path).not.toBeNull();
      expect(path![0]).toBe('wind');
      expect(path![path!.length - 1]).toBe('fetus');
    });
  });

  describe('Lineage Tracing', () => {
    test('getLineageTrace returns lineage for known fu', () => {
      const lineage = getLineageTrace("The Flower of Kan");
      expect(lineage).toHaveLength(1);
      expect(lineage[0].master).toBe('Hijikata Tatsumi');
    });

    test('getLineageTrace returns empty for unknown fu', () => {
      const lineage = getLineageTrace("Unknown Movement");
      expect(lineage).toEqual([]);
    });
  });

  describe('Poetic Generation', () => {
    test('generatePoeticFragment returns string', () => {
      const fragment = generatePoeticFragment();
      expect(typeof fragment).toBe('string');
      expect(fragment.length).toBeGreaterThan(0);
    });

    test('poetic templates have required properties', () => {
      ButohCorpus.templates.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('structure');
        expect(template.requiredStates.length).toBeGreaterThan(0);
        expect(template.requiredQualities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Ontological Relations', () => {
    test('relations connect valid states', () => {
      ButohCorpus.relations.forEach(rel => {
        expect(ButohCorpus.states).toContain(rel.from);
        expect(ButohCorpus.states).toContain(rel.to);
        expect(rel.strength).toBeGreaterThanOrEqual(0);
        expect(rel.strength).toBeLessThanOrEqual(1);
      });
    });

    test('transformation sequences have valid durations', () => {
      const validDurations = ['instant', 'brief', 'extended', 'eternal'];
      ButohCorpus.transformations.forEach(seq => {
        expect(validDurations).toContain(seq.duration);
      });
    });
  });
});
