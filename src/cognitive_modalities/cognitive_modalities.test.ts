/**
 * Tests for Cognitive Modalities Lab
 * 
 * Test-Driven Development for the thinking tools.
 * Each test verifies functionality AND demonstrates usage patterns.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MultiManifesto, 
  DEFAULT_VOICES,
  generateManifesto 
} from './multi_manifesto.js';
import { 
  StackingCube, 
  createTemporalCube,
  createFullCube,
  createMinimalCube,
  DIMENSION_TEMPLATES
} from './stacking_cube.js';
import { 
  SensoryTranslator, 
  translateSensory,
  describeSynesthetically,
  DEFAULT_TRANSLATION_MAP
} from './sensory_translation.js';
import { createThinkingTool, getAvailableTools, validateToolConfig } from './factory.js';
import { getCMLStatus } from './index.js';

describe('Cognitive Modalities Lab', () => {
  
  describe('Module Status', () => {
    it('should report correct version and phase', () => {
      const status = getCMLStatus();
      expect(status.version).toBe('1.0.0');
      expect(status.phase).toBe('Tool Development');
      expect(status.availableTools).toContain('multi-manifesto');
      expect(status.availableTools).toContain('stacking-cube');
      expect(status.availableTools).toContain('sensory-translation');
    });
  });

  describe('Factory Functions', () => {
    it('should create all tool types', () => {
      const manifesto = createThinkingTool('multi-manifesto', {
        subject: 'Test',
        voices: []
      });
      expect(manifesto).toBeInstanceOf(MultiManifesto);

      const cube = createThinkingTool('stacking-cube', {
        subject: 'Test',
        dimensions: ['temporal']
      });
      expect(cube).toBeInstanceOf(StackingCube);

      const translator = createThinkingTool('sensory-translation', {
        sourceModality: 'visual',
        targetModality: 'auditory'
      });
      expect(translator).toBeInstanceOf(SensoryTranslator);
    });

    it('should return available tool metadata', () => {
      const tools = getAvailableTools();
      expect(tools).toHaveLength(3);
      expect(tools[0].phase).toBe('alpha');
    });

    it('should validate tool configurations', () => {
      const manifestoCheck = validateToolConfig('multi-manifesto', { subject: 'Test' });
      expect(manifestoCheck.valid).toBe(true);
      expect(manifestoCheck.errors).toHaveLength(0);

      const invalidCheck = validateToolConfig('multi-manifesto', {});
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Manifesto Generator', () => {
    it('should generate manifestos with default voices', () => {
      const generator = new MultiManifesto({
        subject: 'Bootstrap-v15',
        voices: []
      });
      
      const output = generator.generate();
      expect(output.subject).toBe('Bootstrap-v15');
      expect(output.voices.length).toBe(DEFAULT_VOICES.length);
      expect(output.metadata.voiceCount).toBe(DEFAULT_VOICES.length);
    });

    it('should synthesize perspectives when enabled', () => {
      const generator = new MultiManifesto({
        subject: 'Mind',
        voices: [],
        synthesize: true
      });
      
      const output = generator.generate();
      expect(output.synthesis).toBeDefined();
      expect(output.synthesis).toContain('multiple');
    });

    it('should format output as markdown', () => {
      const generator = new MultiManifesto({
        subject: 'Void',
        voices: [],
        format: 'markdown'
      });
      
      const output = generator.generate();
      const formatted = generator.formatOutput(output);
      expect(formatted).toContain('# Multi-Manifesto');
      expect(formatted).toContain('##');
    });

    it('should generate synthesis prompt', () => {
      const generator = new MultiManifesto({
        subject: 'Time',
        voices: DEFAULT_VOICES.slice(0, 3)
      });
      
      const prompt = generator.createSynthesisPrompt();
      expect(prompt).toContain('Time');
      expect(prompt).toContain('synthesize');
    });

    it('quick generate function should work', () => {
      const output = generateManifesto('Code', { synthesize: true });
      expect(output.subject).toBe('Code');
      expect(output.synthesis).toBeDefined();
    });
  });

  describe('Stacking Cube', () => {
    it('should initialize with dimensions', () => {
      const cube = new StackingCube({
        subject: 'Session',
        dimensions: ['temporal', 'affective'],
        autoPopulate: false
      });
      
      const state = cube.getState();
      expect(state.subject).toBe('Session');
      expect(state.layers.length).toBe(2);
      expect(state.layers[0].dimension).toBe('temporal');
    });

    it('should auto-populate when configured', () => {
      const cube = new StackingCube({
        subject: 'Test',
        dimensions: ['temporal', 'affective'],
        autoPopulate: true
      });
      
      const state = cube.getState();
      expect(state.layers[0].reflections.length).toBeGreaterThan(0);
      expect(state.currentDepth).toBe(1);
    });

    it('should add reflections', () => {
      const cube = new StackingCube({
        subject: 'Test',
        dimensions: ['temporal']
      });
      
      cube.addReflection('temporal', 'Time is a river', ['first']);
      const reflections = cube.getReflections('temporal');
      expect(reflections).toHaveLength(1);
      expect(reflections[0].content).toBe('Time is a river');
      expect(reflections[0].tags).toContain('first');
    });

    it('should provide priming questions', () => {
      const cube = new StackingCube({
        subject: 'Test',
        dimensions: ['temporal']
      });
      
      const questions = cube.getQuestions('temporal');
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('memory');
    });

    it('should render in different views', () => {
      const cube = createTemporalCube('Test');
      
      const fullRender = cube.render('all');
      expect(fullRender).toContain('STACKING CUBE');
      
      const layers = cube.render('single-dimension');
      expect(layers).toContain('reflections');
      
      const synthesis = cube.render('synthesis');
      expect(synthesis).toContain('SYNTHESIS');
    });

    it('factory functions should create configured cubes', () => {
      const minimal = createMinimalCube('Test');
      expect(minimal.getState().layers.length).toBe(2);
      
      const full = createFullCube('Test');
      expect(full.getState().layers.length).toBe(8);
    });

    it('should throw on invalid dimension', () => {
      const cube = new StackingCube({
        subject: 'Test',
        dimensions: ['temporal']
      });
      
      expect(() => {
        cube.addReflection('affective' as any, 'test');
      }).toThrow('not found');
    });
  });

  describe('Sensory Translation Engine', () => {
    it('should translate between modalities', () => {
      const translator = new SensoryTranslator({
        sourceModality: 'visual',
        targetModality: 'auditory'
      });
      
      const result = translator.translate('Red circle');
      expect(result.sourceModality).toBe('visual');
      expect(result.targetModality).toBe('auditory');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return low confidence for unavailable translations', () => {
      const translator = new SensoryTranslator({
        sourceModality: 'olfactory',
        targetModality: 'gustatory'
      });
      
      const result = translator.translate('Rose scent');
      expect(result.confidence).toBe(0);
      expect(result.translation).toContain('No translation');
    });

    it('should support different intensity levels', () => {
      const translator = new SensoryTranslator({
        sourceModality: 'visual',
        targetModality: 'auditory'
      });
      
      const low = translator.translate('Blue', { intensity: 0.3 });
      const high = translator.translate('Blue', { intensity: 0.9 });
      expect(low.translation).not.toBe(high.translation);
    });

    it('should generate full synesthetic mapping', () => {
      const translator = new SensoryTranslator({
        sourceModality: 'visual',
        targetModality: 'auditory'
      });
      
      const synesthesia = translator.fullSynesthesia('Sunrise');
      expect(synesthesia.size).toBeGreaterThan(0);
    });

    it('should provide available translation paths', () => {
      const translator = new SensoryTranslator({
        sourceModality: 'visual',
        targetModality: 'auditory'
      });
      
      const paths = translator.getAvailablePaths();
      expect(paths.length).toBeGreaterThan(0);
    });

    it('quick translate function should work', () => {
      const result = translateSensory('Ocean', 'auditory', 'tactile');
      expect(result.original).toBe('Ocean');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should generate synesthetic descriptions', () => {
      const desc = describeSynesthetically('Thunder', 'auditory');
      expect(desc).toContain('MULTI-MODAL DESCRIPTION');
      expect(desc).toContain('Thunder');
    });
  });

  describe('Dimension Templates', () => {
    it('should provide questions for each dimension', () => {
      expect(DIMENSION_TEMPLATES.temporal.questions.length).toBeGreaterThan(0);
      expect(DIMENSION_TEMPLATES.epistemic.label).toBe('Epistemic Layer');
      expect(DIMENSION_TEMPLATES.affective.questions[0]).toContain('emotion');
    });
  });

  describe('Translation Rules', () => {
    it('should have default mappings for major transitions', () => {
      expect(DEFAULT_TRANSLATION_MAP.visual.auditory).toBeDefined();
      expect(DEFAULT_TRANSLATION_MAP.auditory.tactile).toBeDefined();
      expect(DEFAULT_TRANSLATION_MAP.temporal.kinesthetic).toBeDefined();
    });
  });
});
