/**
 * Tests for Cognitive Modalities Lab - Phase 2
 *
 * Test-Driven Development for the thinking tools.
 * Now includes: Paradox Engine, Emergence Observatory, Boundary Ethnographer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiManifesto, DEFAULT_VOICES, generateManifesto } from './multi_manifesto.js';
import { StackingCube, createTemporalCube, createFullCube, createMinimalCube, DIMENSION_TEMPLATES } from './stacking_cube.js';
import { SensoryTranslator, translateSensory, describeSynesthetically } from './sensory_translation.js';
import { ParadoxEngine, CLASSIC_PARADOXES, holdParadox, exploreParadoxes } from './paradox_engine.js';
import { EmergenceObservatory, EMERGENCE_PATTERNS, observeEmergence, simulatePattern } from './emergence_observatory.js';
import { BoundaryEthnographer, THRESHOLD_ARCHETYPES, exploreBoundary, crossBoundary } from './boundary_ethnographer.js';
import { createThinkingTool, getAvailableTools, validateToolConfig } from './factory.js';
import { getCMLStatus, CML_VERSION } from './index.js';

describe('Cognitive Modalities Lab - Phase 2', () => {
  describe('Module Status', () => {
    it('should report updated version with 6 tools', () => {
      const status = getCMLStatus();
      expect(status.version).toBe('1.1.0');
      expect(status.phase).toBe('Tool Development - Phase 2');
      expect(status.availableTools).toHaveLength(6);
      expect(status.availableTools).toContain('paradox-engine');
      expect(status.availableTools).toContain('emergence-observatory');
      expect(status.availableTools).toContain('boundary-ethnographer');
    });
  });

  describe('Factory Functions - Phase 2', () => {
    it('should create all 6 tool types', () => {
      const manifesto = createThinkingTool('multi-manifesto', { subject: 'Test', voices: [] });
      expect(manifesto).toBeInstanceOf(MultiManifesto);

      const cube = createThinkingTool('stacking-cube', { subject: 'Test', dimensions: ['temporal'] });
      expect(cube).toBeInstanceOf(StackingCube);

      const translator = createThinkingTool('sensory-translation', { sourceModality: 'visual', targetModality: 'auditory' });
      expect(translator).toBeInstanceOf(SensoryTranslator);

      const paradox = createThinkingTool('paradox-engine', { subject: 'Test', paradoxes: [] });
      expect(paradox).toBeInstanceOf(ParadoxEngine);

      const emergence = createThinkingTool('emergence-observatory', { subject: 'Test', scales: ['meso'] });
      expect(emergence).toBeInstanceOf(EmergenceObservatory);

      const ethnographer = createThinkingTool('boundary-ethnographer', { subject: 'Test' });
      expect(ethnographer).toBeInstanceOf(BoundaryEthnographer);
    });

    it('should return 6 tool metadata entries', () => {
      const tools = getAvailableTools();
      expect(tools).toHaveLength(6);
      expect(tools.some(t => t.type === 'paradox-engine')).toBe(true);
      expect(tools.some(t => t.type === 'emergence-observatory')).toBe(true);
      expect(tools.some(t => t.type === 'boundary-ethnographer')).toBe(true);
    });

    it('should validate new tool configurations', () => {
      const paradoxCheck = validateToolConfig('paradox-engine', { subject: 'Test' });
      expect(paradoxCheck.valid).toBe(true);

      const emergenceCheck = validateToolConfig('emergence-observatory', { subject: 'Test' });
      expect(emergenceCheck.valid).toBe(true);

      const boundaryCheck = validateToolConfig('boundary-ethnographer', { subject: 'Test' });
      expect(boundaryCheck.valid).toBe(true);

      const invalidCheck = validateToolConfig('paradox-engine', {});
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.errors).toContain('paradox-engine requires a "subject" field');
    });
  });

  describe('Multi-Manifesto Generator (Legacy Tests)', () => {
    it('should generate manifestos with default voices', async () => {
      const generator = new MultiManifesto({ subject: 'Bootstrap-v15', voices: [] });
      const output = await generator.generate();
      expect(output.subject).toBe('Bootstrap-v15');
      expect(output.voices.length).toBe(DEFAULT_VOICES.length);
    });

    it('should synthesize perspectives when enabled', async () => {
      const generator = new MultiManifesto({ subject: 'Mind', voices: [], synthesize: true });
      const output = await generator.generate();
      expect(output.synthesis).toBeDefined();
      expect(output.synthesis).toContain('multiple');
    });
  });

  describe('Stacking Cube (Legacy Tests)', () => {
    it('should add reflections and render', () => {
      const cube = new StackingCube({ subject: 'Test', dimensions: ['temporal'] });
      cube.addReflection('temporal', 'Time is a river', ['first']);
      const reflections = cube.getReflections('temporal');
      expect(reflections).toHaveLength(1);
      expect(reflections[0].content).toBe('Time is a river');
    });
  });

  describe('Sensory Translation (Legacy Tests)', () => {
    it('should translate between modalities', () => {
      const translator = new SensoryTranslator({ sourceModality: 'visual', targetModality: 'auditory' });
      const result = translator.translate('Red circle');
      expect(result.sourceModality).toBe('visual');
      expect(result.targetModality).toBe('auditory');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Paradox Engine', () => {
    let engine: ParadoxEngine;

    beforeEach(() => {
      engine = new ParadoxEngine({
        subject: 'Bootstrap-v15',
        paradoxes: CLASSIC_PARADOXES.slice(0, 2),
        embraceTension: true,
        seekSynthesis: false,
        format: 'text'
      });
    });

    it('should explore paradoxes', () => {
      const output = engine.explore();
      expect(output.subject).toBe('Bootstrap-v15');
      expect(output.explorations).toHaveLength(2);
      expect(output.explorations[0]).toHaveProperty('paradoxName');
      expect(output.explorations[0]).toHaveProperty('poleA');
      expect(output.explorations[0]).toHaveProperty('poleB');
    });

    it('should hold tension for specific paradox', () => {
      const held = engine.holdTension('Being vs Becoming');
      expect(held).toContain('BEING');
      expect(held).toContain('BECOMING');
    });

    it('should oscillate between poles', () => {
      const oscillations = engine.oscillate('Structure vs Flow', 3);
      expect(oscillations).toHaveLength(3);
    });

    it('should return error for unknown paradox', () => {
      const held = engine.holdTension('Unknown Paradox');
      expect(held).toContain('not found');
    });

    it('should support all 5 predefined paradoxes', () => {
      const fullEngine = new ParadoxEngine({
        subject: 'Test',
        paradoxes: CLASSIC_PARADOXES,
        embraceTension: true,
        seekSynthesis: true,
        format: 'text'
      });
      const output = fullEngine.explore();
      expect(output.explorations).toHaveLength(5);
    });

    it('should generate synthesis when enabled', () => {
      const synthesis = new ParadoxEngine({
        subject: 'Test',
        paradoxes: CLASSIC_PARADOXES.slice(0, 1),
        embraceTension: true,
        seekSynthesis: true,
        format: 'text'
      });
      const output = synthesis.explore();
      expect(output.metaReflection).toBeDefined();
    });

    it('should format output as dialogue', () => {
      const dialogue = new ParadoxEngine({
        subject: 'Test',
        paradoxes: CLASSIC_PARADOXES.slice(0, 1),
        embraceTension: true,
        seekSynthesis: false,
        format: 'dialogue'
      });
      const output = dialogue.explore();
      const formatted = dialogue.formatOutput(output);
      expect(formatted).toContain('DIALOGUE');
    });

    it('should support JSON format', () => {
      const jsonMode = new ParadoxEngine({
        subject: 'Test',
        paradoxes: CLASSIC_PARADOXES.slice(0, 1),
        embraceTension: true,
        seekSynthesis: false,
        format: 'json'
      });
      const output = jsonMode.explore();
      const formatted = jsonMode.formatOutput(output);
      expect(JSON.parse(formatted)).toBeDefined();
    });

    it('helper holdParadox should work', () => {
      const held = holdParadox('Consciousness', 'Being vs Becoming', { embraceTension: true });
      expect(held).toContain('BEING');
      expect(held).toContain('BECOMING');
    });
  });

  describe('Emergence Observatory', () => {
    let observatory: EmergenceObservatory;

    beforeEach(() => {
      observatory = new EmergenceObservatory({
        subject: 'Bootstrap-v15',
        focus: 'formation',
        scales: ['micro', 'meso', 'macro'],
        trackNovelty: true,
        trackFeedback: true
      });
    });

    it('should observe system state', () => {
      const observation = observatory.observe();
      expect(observation).toHaveProperty('timestamp');
      expect(observation).toHaveProperty('level');
      expect(observation).toHaveProperty('patterns');
      expect(observation).toHaveProperty('entropy');
      expect(observation.entropy).toBeGreaterThanOrEqual(0);
      expect(observation.entropy).toBeLessThanOrEqual(1);
    });

    it('should generate full report', () => {
      const report = observatory.generateReport();
      expect(report.subject).toBe('Bootstrap-v15');
      expect(report.observations.length).toBeGreaterThan(0);
      expect(report.patternsDetected).toBeDefined();
    });

    it('should simulate evolution through phases', () => {
      const phases = observatory.simulateEvolution(4);
      expect(phases).toHaveLength(4);
      phases.forEach(p => {
        expect(p.level).toMatch(/chaos|critical|ordered/);
      });
    });

    it('should focus on specific pattern', () => {
      const pattern = observatory.focusPattern('self-organization');
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe('self-organization');
      expect(pattern?.emergentProperties).toBeDefined();
    });

    it('should return null for unknown pattern', () => {
      const pattern = observatory.focusPattern('unknown-pattern');
      expect(pattern).toBeNull();
    });

    it('should have valid patterns', () => {
      const patterns = observatory.identifyPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should get patterns by scale', () => {
      const mesoPatterns = observatory.getPatternsByScale('meso');
      expect(mesoPatterns.every(p => p.scale === 'meso')).toBe(true);
    });

    it('should get patterns by stability range', () => {
      const stablePatterns = observatory.getPatternsByStability(0.7, 1.0);
      expect(stablePatterns.every(p => p.stability >= 0.7)).toBe(true);
    });

    it('helper observeEmergence should work', () => {
      const result = observeEmergence('System', 'formation');
      expect(result).toContain('EMERGENCE OBSERVATORY');
      expect(result).toContain('System');
    });

    it('helper simulatePattern should work', () => {
      const result = simulatePattern('phase-transition', 5);
      expect(result).toContain('SIMULATION');
      expect(result).toContain('Pattern');
    });

    it('helper should return error for unknown pattern', () => {
      const result = simulatePattern('unknown', 3);
      expect(result).toContain('not found');
    });
  });

  describe('Boundary Ethnographer', () => {
    let ethnographer: BoundaryEthnographer;

    beforeEach(() => {
      ethnographer = new BoundaryEthnographer({
        subject: 'Bootstrap-v15',
        focus: 'full_transition',
        sensitivity: 'deep',
        trackRituals: true,
        mapRelations: true
      });
    });

    it('should conduct observation', () => {
      const report = ethnographer.conductObservation();
      expect(report).toHaveProperty('subject');
      expect(report).toHaveProperty('observations');
      expect(report).toHaveProperty('spatialMap');
      expect(report.subject).toBe('Bootstrap-v15');
    });

    it('should focus on specific threshold', () => {
      const focused = ethnographer.focusThreshold('rite-of-passage');
      expect(focused).toContain('RITE OF PASSAGE');
      expect(focused).toContain('ZONE:');
    });

    it('should return error for unknown threshold', () => {
      const focused = ethnographer.focusThreshold('unknown-threshold');
      expect(focused).toContain('not found');
    });

    it('should cross threshold', () => {
      const crossing = ethnographer.crossThreshold('rite-of-passage');
      expect(crossing).toContain('CROSSING');
      expect(crossing).toContain('STAGE');
      expect(crossing).toContain('Separation');
    });

    it('should map interstitial spaces', () => {
      const map = ethnographer.mapInterstitialSpaces();
      expect(map).toContain('INTERSTITIAL');
      expect(map).toContain('SPACES');
    });

    it('should support different focus modes', () => {
      const entryFocus = new BoundaryEthnographer({
        subject: 'Test',
        focus: 'entry',
        sensitivity: 'deep',
        trackRituals: true,
        mapRelations: true
      });
      const report = entryFocus.conductObservation();
      expect(report.observations[0].phase).toBe('entry');
    });

    it('should support different sensitivity levels', () => {
      const surface = new BoundaryEthnographer({
        subject: 'Test',
        focus: 'liminality',
        sensitivity: 'surface',
        trackRituals: true,
        mapRelations: true
      });
      expect(surface.conductObservation()).toBeDefined();
    });

    it('helper exploreBoundary should work', () => {
      const result = exploreBoundary('Identity', 'rite-of-passage');
      expect(result).toContain('RITE OF PASSAGE');
    });

    it('helper crossBoundary should work', () => {
      const result = crossBoundary('Self', 'rite-of-passage');
      expect(result).toContain('CROSSING');
    });
  });

  describe('Cross-Tool Integration', () => {
    it('should chain paradox and emergence thinking', () => {
      const engine = new ParadoxEngine({
        subject: 'Evolution',
        paradoxes: [CLASSIC_PARADOXES[0]],
        embraceTension: true,
        seekSynthesis: false,
        format: 'text'
      });
      const paradoxOutput = engine.explore();
      
      const observatory = new EmergenceObservatory({
        subject: paradoxOutput.explorations[0].paradoxName,
        focus: 'formation',
        scales: ['meso'],
        trackNovelty: true,
        trackFeedback: true
      });
      const report = observatory.generateReport();
      
      expect(report.subject).toBe(paradoxOutput.explorations[0].paradoxName);
    });

    it('should use boundary to frame emergence', () => {
      const ethnographer = new BoundaryEthnographer({
        subject: 'The Edge of Chaos',
        focus: 'liminality',
        sensitivity: 'deep',
        trackRituals: true,
        mapRelations: true
      });
      const map = ethnographer.mapInterstitialSpaces();
      
      expect(map).toContain('EDGE OF CHAOS');
      expect(map).toContain('INTERSTITIAL');
    });
  });

  describe('Predefined Data Catalogs', () => {
    it('should have 5 paradox archetypes', () => {
      expect(CLASSIC_PARADOXES).toHaveLength(5);
      expect(CLASSIC_PARADOXES.map(p => p.name)).toContain('Being vs Becoming');
      expect(CLASSIC_PARADOXES.map(p => p.name)).toContain('Structure vs Flow');
    });

    it('should have 6 emergence patterns', () => {
      expect(EMERGENCE_PATTERNS).toHaveLength(6);
      expect(EMERGENCE_PATTERNS.map(p => p.id)).toContain('self-organization');
      expect(EMERGENCE_PATTERNS.map(p => p.id)).toContain('phase-transition');
    });

    it('should have 5 threshold archetypes', () => {
      expect(THRESHOLD_ARCHETYPES).toHaveLength(5);
      expect(THRESHOLD_ARCHETYPES.map(t => t.id)).toContain('rite-of-passage');
      expect(THRESHOLD_ARCHETYPES.map(t => t.id)).toContain('edge-of-chaos');
    });

    it('emergence patterns should have valid scales', () => {
      EMERGENCE_PATTERNS.forEach(p => {
        expect(['micro', 'meso', 'macro']).toContain(p.scale);
      });
    });

    it('thresholds should have duration classifications', () => {
      THRESHOLD_ARCHETYPES.forEach(t => {
        expect(['brief', 'extended', 'perpetual']).toContain(t.duration);
      });
    });

    it('paradoxes should have gift and shadow', () => {
      CLASSIC_PARADOXES.forEach(p => {
        expect(p.gift).toBeTruthy();
        expect(p.shadow).toBeTruthy();
      });
    });
  });
});
