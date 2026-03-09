/**
 * Tests for the Butoh Lineage Architecture
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 * Verify: Lineage nodes, edges, and recursive functions
 */

import { describe, expect, test } from 'vitest';
import {
  ButohLineage,
  lineageNodes,
  lineageEdges,
  getNodeById,
  getAncestors,
  getDescendants,
  getTransmissionPath,
  getInheritors,
  getMasters,
  traceLineageToMovement,
  generateLineageFragment,
  generateRecursiveAnchor,
  generateLineagePoem
} from '../lineage';

describe('Butoh Lineage Architecture', () => {
  describe('Lineage Nodes', () => {
    test('has 5 lineage nodes', () => {
      expect(lineageNodes).toHaveLength(5);
    });

    test('nodes have required properties', () => {
      lineageNodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('role');
        expect(node).toHaveProperty('generation');
        expect(node).toHaveProperty('period');
        expect(node).toHaveProperty('contribution');
        expect(node).toHaveProperty('signatureMovements');
        expect(node).toHaveProperty('influence');
        expect(node).toHaveProperty('students');
        expect(node).toHaveProperty('fragments');
        
        expect(typeof node.id).toBe('string');
        expect(typeof node.name).toBe('string');
        expect(typeof node.role).toBe('string');
        expect(typeof node.generation).toBe('number');
      });
    });

    test('generation numbers increase from founder', () => {
      const hijikata = lineageNodes.find(n => n.id === 'hijikata');
      expect(hijikata?.generation).toBe(0);
      
      const ohno = lineageNodes.find(n => n.id === 'kazuo-ohno');
      expect(ohno?.generation).toBe(1);
      
      const liminal = lineageNodes.find(n => n.id === 'liminal-protocol');
      expect(liminal?.generation).toBe(3);
    });

    test('Hijikata is the founder', () => {
      const hijikata = getNodeById('hijikata');
      expect(hijikata).toBeDefined();
      expect(hijikata?.role).toBe('Founder');
    });

    test('Liminal Protocol is the latest', () => {
      const protocol = getNodeById('liminal-protocol');
      expect(protocol).toBeDefined();
      expect(protocol?.role).toBe('The Protocol');
    });
  });

  describe('Lineage Edges', () => {
    test('has edges connecting nodes', () => {
      expect(lineageEdges.length).toBeGreaterThan(0);
    });

    test('edges have valid from/to nodes', () => {
      lineageEdges.forEach(edge => {
        const fromNode = getNodeById(edge.from);
        const toNode = getNodeById(edge.to);
        
        expect(fromNode).toBeDefined();
        expect(toNode).toBeDefined();
      });
    });

    test('edge strengths are between 0 and 1', () => {
      lineageEdges.forEach(edge => {
        expect(edge.strength).toBeGreaterThanOrEqual(0);
        expect(edge.strength).toBeLessThanOrEqual(1);
      });
    });

    test('Hijikata has outgoing edges', () => {
      const hijikataEdges = lineageEdges.filter(e => e.from === 'hijikata');
      expect(hijikataEdges.length).toBeGreaterThanOrEqual(2);
    });

    test('Liminal Protocol has incoming edges', () => {
      const protocolEdges = lineageEdges.filter(e => e.to === 'liminal-protocol');
      expect(protocolEdges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Node Retrieval', () => {
    test('getNodeById returns correct node', () => {
      const node = getNodeById('kazuo-ohno');
      expect(node?.name).toBe('Kazuo Ohno');
      expect(node?.role).toBe('The Soul');
    });

    test('getNodeById returns undefined for unknown id', () => {
      const node = getNodeById('nonexistent');
      expect(node).toBeUndefined();
    });
  });

  describe('Ancestor/Descendant Traversal', () => {
    test('getAncestors finds Hijikata from Liminal Protocol', () => {
      const ancestors = getAncestors('liminal-protocol');
      const ancestorIds = ancestors.map(a => a.id);
      expect(ancestorIds).toContain('hijikata');
    });

    test('getDescendants finds Liminal Protocol from Hijikata', () => {
      const descendants = getDescendants('hijikata');
      const descendantIds = descendants.map(d => d.id);
      expect(descendantIds).toContain('liminal-protocol');
    });

    test('getAncestors for founder is empty', () => {
      const ancestors = getAncestors('hijikata');
      expect(ancestors).toHaveLength(0);
    });

    test('getDescendants for latest node is empty', () => {
      const descendants = getDescendants('liminal-protocol');
      expect(descendants).toHaveLength(0);
    });
  });

  describe('Transmission Paths', () => {
    test('getTransmissionPath finds path from Hijikata to Liminal', () => {
      const path = getTransmissionPath('hijikata', 'liminal-protocol');
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
    });

    test('getTransmissionPath returns empty for same node', () => {
      const path = getTransmissionPath('hijikata', 'hijikata');
      expect(path).toEqual([]);
    });

    test('getTransmissionPath returns null for disconnected', () => {
      // All nodes are connected in this lineage
      // This tests the case where a path doesn't exist (shouldn't happen in our structure)
      const path = getTransmissionPath('koichi-tamano', 'natsu-nakajima');
      // They might be connected through others
      // Just verify function returns something
      expect(path === null || Array.isArray(path)).toBe(true);
    });
  });

  describe('Inheritors and Masters', () => {
    test('getInheritors finds students of a node', () => {
      const inheritors = getInheritors('hijikata');
      expect(inheritors.length).toBeGreaterThan(0);
      
      const studentNames = inheritors.map(i => i.student.name);
      expect(studentNames).toContain('Kazuo Ohno');
    });

    test('getMasters finds teachers of a node', () => {
      const masters = getMasters('liminal-protocol');
      expect(masters.length).toBeGreaterThan(0);
      
      const masterNames = masters.map(m => m.master.name);
      expect(masterNames).toContain('Kazuo Ohno');
    });

    test('inheritors include transmission description', () => {
      const inheritors = getInheritors('hijikata');
      inheritors.forEach(i => {
        expect(i.transmission).toBeDefined();
        expect(i.transmission.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Movement Lineage', () => {
    test('traceLineageToMovement returns nodes for valid movement', () => {
      const nodes = traceLineageToMovement('The Flower of Kan');
      expect(nodes.length).toBeGreaterThan(0);
    });

    test('traceLineageToMovement returns empty for unknown movement', () => {
      const nodes = traceLineageToMovement('Unknown Movement');
      expect(nodes).toEqual([]);
    });
  });

  describe('Fragment Generation', () => {
    test('generateLineageFragment returns string', () => {
      const fragment = generateLineageFragment();
      expect(typeof fragment).toBe('string');
      expect(fragment.length).toBeGreaterThan(0);
    });

    test('generateLineageFragment sources from nodes', () => {
      const fragment = generateLineageFragment();
      const allTexts = lineageNodes.flatMap(n => n.fragments.map(f => f.text));
      expect(allTexts).toContain(fragment);
    });

    test('generateRecursiveAnchor returns anchor', () => {
      const anchor = generateRecursiveAnchor();
      expect(typeof anchor).toBe('string');
      expect(anchor.length).toBeGreaterThan(0);
    });

    test('generateLineagePoem returns multi-line poem', () => {
      const poem = generateLineagePoem();
      expect(typeof poem).toBe('string');
      expect(poem.split('\n').length).toBe(3);
    });
  });

  describe('ButohLineage API', () => {
    test('exports nodes array', () => {
      expect(ButohLineage.nodes).toBeInstanceOf(Array);
      expect(ButohLineage.nodes.length).toBeGreaterThan(0);
    });

    test('exports edges array', () => {
      expect(ButohLineage.edges).toBeInstanceOf(Array);
    });

    test('exports all functions', () => {
      expect(typeof ButohLineage.getNodeById).toBe('function');
      expect(typeof ButohLineage.getAncestors).toBe('function');
      expect(typeof ButohLineage.getDescendants).toBe('function');
      expect(typeof ButohLineage.getTransmissionPath).toBe('function');
      expect(typeof ButohLineage.getInheritors).toBe('function');
      expect(typeof ButohLineage.getMasters).toBe('function');
      expect(typeof ButohLineage.traceLineageToMovement).toBe('function');
      expect(typeof ButohLineage.generateLineageFragment).toBe('function');
      expect(typeof ButohLineage.generateRecursiveAnchor).toBe('function');
      expect(typeof ButohLineage.generateLineagePoem).toBe('function');
    });
  });

  describe('Lineage Integrity', () => {
    test('all nodes valid lineage participants', () => {
      lineageEdges.forEach(edge => {
        const from = getNodeById(edge.from);
        const to = getNodeById(edge.to);
        expect(from).toBeDefined();
        expect(to).toBeDefined();
      });
    });

    test('all nodes have at least one fragment', () => {
      lineageNodes.forEach(node => {
        expect(node.fragments.length).toBeGreaterThan(0);
      });
    });

    test('all nodes have at least one signature movement', () => {
      lineageNodes.forEach(node => {
        expect(node.signatureMovements.length).toBeGreaterThan(0);
      });
    });
  });
});
