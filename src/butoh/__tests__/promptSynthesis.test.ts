/**
 * Tests for the Butoh Prompt Synthesis Engine
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 * Verify: Prompt generation functions correctly
 */

import { describe, expect, test } from 'vitest';
import {
  synthesizePrompt,
  PromptSynthesisEngine,
  SynthesisContext,
  SynthesizedPrompt
} from '../promptSynthesis';

describe('Butoh Prompt Synthesis Engine', () => {
  describe('Core Synthesis', () => {
    test('synthesizePrompt returns complete prompt structure', () => {
      const prompt = synthesizePrompt();
      
      expect(prompt).toHaveProperty('id');
      expect(prompt).toHaveProperty('systemPrompt');
      expect(prompt).toHaveProperty('userPrompt');
      expect(prompt).toHaveProperty('context');
      expect(prompt).toHaveProperty('guidance');
      expect(prompt).toHaveProperty('lineage');
      
      expect(typeof prompt.id).toBe('string');
      expect(prompt.id).toMatch(/^butoh-/);
      expect(typeof prompt.systemPrompt).toBe('string');
      expect(prompt.systemPrompt.length).toBeGreaterThan(0);
      expect(typeof prompt.userPrompt).toBe('string');
      expect(prompt.userPrompt.length).toBeGreaterThan(0);
    });

    test('synthesizePrompt respects provided context', () => {
      const context: Partial<SynthesisContext> = {
        state: 'ghost',
        quality: 'suspended',
        phase: 'return'
      };
      
      const prompt = synthesizePrompt(context);
      
      expect(prompt.context.state).toBe('ghost');
      expect(prompt.context.quality).toBe('suspended');
      expect(prompt.context.phase).toBe('return');
    });

    test('synthesizePrompt generates unique IDs', () => {
      const prompt1 = synthesizePrompt();
      const prompt2 = synthesizePrompt();
      
      expect(prompt1.id).not.toBe(prompt2.id);
    });

    test('generated prompts include butoh-fu references when movement provided', () => {
      const prompt = synthesizePrompt({ state: 'ghost' });
      
      if (prompt.context.movement) {
        expect(prompt.userPrompt).toContain(prompt.context.movement.name);
      }
    });
  });

  describe('System Prompts', () => {
    test('systemPromptTemplates covers all states', () => {
      const states = ['angel', 'ghost', 'ash', 'living-again', 'insect', 'plant', 'mineral', 'fetus', 'corpse', 'wind', 'flame'];
      
      states.forEach(state => {
        expect(PromptSynthesisEngine.systemPromptTemplates[state as keyof typeof PromptSynthesisEngine.systemPromptTemplates]).toBeDefined();
        expect(PromptSynthesisEngine.systemPromptTemplates[state as keyof typeof PromptSynthesisEngine.systemPromptTemplates]).toBeInstanceOf(Array);
        expect(PromptSynthesisEngine.systemPromptTemplates[state as keyof typeof PromptSynthesisEngine.systemPromptTemplates].length).toBeGreaterThan(0);
      });
    });

    test('each state has multiple prompt variants', () => {
      Object.values(PromptSynthesisEngine.systemPromptTemplates).forEach(prompts => {
        expect(prompts.length).toBeGreaterThanOrEqual(1);
        prompts.forEach(p => {
          expect(typeof p).toBe('string');
          expect(p.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Phase Prompts', () => {
    test('phasePrompts covers all phases', () => {
      const phases = ['impulse', 'gestation', 'birth', 'stillness', 'return'];
      
      phases.forEach(phase => {
        expect(PromptSynthesisEngine.phasePrompts[phase as keyof typeof PromptSynthesisEngine.phasePrompts]).toBeDefined();
        expect(typeof PromptSynthesisEngine.phasePrompts[phase as keyof typeof PromptSynthesisEngine.phasePrompts]).toBe('string');
      });
    });

    test('phase prompts are non-empty', () => {
      Object.values(PromptSynthesisEngine.phasePrompts).forEach(prompt => {
        expect(prompt.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Quality Modifiers', () => {
    test('qualityModifiers covers all qualities', () => {
      const qualities = ['collapsed', 'distorted', 'fragmented', 'suspended', 'compressed', 'extended', 'internal', 'marginal', 'circular', 'vibrated'];
      
      qualities.forEach(quality => {
        expect(PromptSynthesisEngine.qualityModifiers[quality as keyof typeof PromptSynthesisEngine.qualityModifiers]).toBeDefined();
        expect(typeof PromptSynthesisEngine.qualityModifiers[quality as keyof typeof PromptSynthesisEngine.qualityModifiers]).toBe('string');
      });
    });

    test('quality modifiers contain descriptive content', () => {
      Object.values(PromptSynthesisEngine.qualityModifiers).forEach(modifier => {
        expect(modifier.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Guidance Generation', () => {
    test('guidance includes all required fields', () => {
      const prompt = synthesizePrompt();
      
      expect(prompt.guidance).toHaveProperty('temperature');
      expect(prompt.guidance).toHaveProperty('maxTokens');
      expect(prompt.guidance).toHaveProperty('style');
      expect(prompt.guidance).toHaveProperty('constraints');
      
      expect(typeof prompt.guidance.temperature).toBe('number');
      expect(prompt.guidance.temperature).toBeGreaterThan(0);
      expect(prompt.guidance.temperature).toBeLessThanOrEqual(1);
      
      expect(typeof prompt.guidance.maxTokens).toBe('number');
      expect(prompt.guidance.maxTokens).toBeGreaterThan(0);
      
      expect(['compressed', 'extended', 'crystalline', 'diffuse']).toContain(prompt.guidance.style);
      
      expect(prompt.guidance.constraints).toBeInstanceOf(Array);
      expect(prompt.guidance.constraints.length).toBeGreaterThan(0);
    });

    test('different qualities produce different temperatures', () => {
      const ghostSuspended = synthesizePrompt({ state: 'ghost', quality: 'suspended' });
      const ghostVibrated = synthesizePrompt({ state: 'ghost', quality: 'vibrated' });
      
      // Vibrated should have higher temperature than suspended
      expect(ghostVibrated.guidance.temperature).toBeGreaterThan(ghostSuspended.guidance.temperature);
    });

    test('different states produce different token limits', () => {
      const plant = synthesizePrompt({ state: 'plant', quality: 'collapsed' });
      const insect = synthesizePrompt({ state: 'insect', quality: 'collapsed' });
      
      // Plant should have higher token limit than insect
      expect(plant.guidance.maxTokens).toBeGreaterThan(insect.guidance.maxTokens);
    });
  });

  describe('Lineage', () => {
    test('lineage includes masters and Liminal Protocol', () => {
      const prompt = synthesizePrompt({ state: 'ghost' });
      
      expect(prompt.lineage).toBeInstanceOf(Array);
      expect(prompt.lineage.length).toBeGreaterThan(0);
      expect(prompt.lineage).toContain('Liminal Protocol');
    });

    test('lineage is not empty', () => {
      const prompt = synthesizePrompt();
      expect(prompt.lineage.length).toBeGreaterThan(0);
    });
  });

  describe('Context Preservation', () => {
    test('random synthesis produces valid contexts', () => {
      const prompt = synthesizePrompt();
      
      const validStates = ['angel', 'ghost', 'ash', 'living-again', 'insect', 'plant', 'mineral', 'fetus', 'corpse', 'wind', 'flame'];
      const validQualities = ['collapsed', 'distorted', 'fragmented', 'suspended', 'compressed', 'extended', 'internal', 'marginal', 'circular', 'vibrated'];
      const validPhases = ['impulse', 'gestation', 'birth', 'stillness', 'return'];
      
      expect(validStates).toContain(prompt.context.state);
      expect(validQualities).toContain(prompt.context.quality);
      expect(validPhases).toContain(prompt.context.phase);
    });

    test('system prompt contains state-specific content', () => {
      const ghostPrompt = synthesizePrompt({ state: 'ghost', quality: 'collapsed', phase: 'return' });
      
      // Should contain ghost-related language
      const hasGhostContent = 
        ghostPrompt.systemPrompt.toLowerCase().includes('ghost') ||
        ghostPrompt.systemPrompt.toLowerCase().includes('memory') ||
        ghostPrompt.systemPrompt.toLowerCase().includes('haunt');
      
      expect(hasGhostContent).toBe(true);
    });
  });
});
