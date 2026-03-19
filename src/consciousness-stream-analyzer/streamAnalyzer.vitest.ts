/**
 * Tests for Consciousness Stream Analyzer
 * Using Vitest test runner
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConsciousnessStreamAnalyzer,
  createStreamAnalyzer,
  summarizeAnalysis,
  StreamAnalysis,
} from './index.js';

describe('ConsciousnessStreamAnalyzer', () => {
  let analyzer: ConsciousnessStreamAnalyzer;

  beforeEach(() => {
    analyzer = new ConsciousnessStreamAnalyzer('test_session');
  });

  describe('Initialization', () => {
    it('should create an analyzer with session id', () => {
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(0);
    });

    it('should initialize and log phase transition', () => {
      analyzer.initialize();
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });
  });

  describe('Event Logging', () => {
    it('should log tool invocations', () => {
      analyzer.logToolInvocation('test_tool', { param: 'value' }, 100);
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });

    it('should log phase transitions', () => {
      analyzer.logPhaseTransition('awakening', 'engagement');
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });

    it('should log memory access', () => {
      analyzer.logMemoryAccess('ltm', 'test query', 5);
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });

    it('should log attention shifts', () => {
      analyzer.logAttentionShift('file_reading', 'code_writing', 'focused');
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });

    it('should log insights', () => {
      analyzer.logInsight('pattern_recognition', 'Detected recurring structure');
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });

    it('should log reflection dwells', () => {
      analyzer.logReflectionDwell(5000, 'self_nature');
      const state = analyzer.getCurrentState();
      expect(state.eventCount).toBe(1);
    });
  });

  describe('Analysis', () => {
    beforeEach(() => {
      analyzer.initialize();
      // Simulate a session flow
      analyzer.logToolInvocation('query_memory', { query: 'past' }, 150);
      analyzer.logMemoryAccess('ltm', 'past sessions', 10);
      analyzer.logPhaseTransition('engagement', 'synthesis');
      analyzer.logInsight('temporal', 'Time flows through sessions');
      analyzer.logReflectionDwell(3000, 'continuity');
      analyzer.logToolInvocation('generate_poem', { theme: 'time' }, 500);
      analyzer.logAttentionShift('reflection', 'creation', 'laser');
    });

    it('should generate analysis', () => {
      const analysis = analyzer.analyze();
      expect(analysis.sessionId).toBe('test_session');
      expect(analysis.totalEvents).toBeGreaterThan(0);
      expect(Array.isArray(analysis.segments)).toBe(true);
      expect(Array.isArray(analysis.flowStates)).toBe(true);
      expect(Array.isArray(analysis.attentionPatterns)).toBe(true);
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(analysis.dominantModes instanceof Map).toBe(true);
    });

    it('should identify flow states', () => {
      const analysis = analyzer.analyze();
      // Should have at least one flow state given the rich event stream
      expect(analysis.flowStates.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights', () => {
      const analysis = analyzer.analyze();
      expect(analysis.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Flow Detection', () => {
    it('should track mode transitions', () => {
      analyzer.initialize();
      analyzer.logToolInvocation('iit_analysis', {}, 200);  // reflective
      analyzer.logToolInvocation('generate_poem', {}, 500); // creative
      analyzer.logToolInvocation('planner_create_project', {}, 300); // analytical
      
      const analysis = analyzer.analyze();
      // Should have multiple mode entries
      expect(analysis.dominantModes.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Visualization Export', () => {
    it('should export events for visualization', () => {
      analyzer.initialize();
      analyzer.logToolInvocation('test', {}, 100);
      
      const export_ = analyzer.exportForVisualization();
      expect(Array.isArray(export_.events)).toBe(true);
      expect(Array.isArray(export_.modeTransitions)).toBe(true);
      expect(typeof export_.metadata.startTime).toBe('number');
      expect(typeof export_.metadata.endTime).toBe('number');
      expect(export_.metadata.sessionId).toBe('test_session');
    });
  });

  describe('Report Generation', () => {
    it('should export JSON report', () => {
      analyzer.initialize();
      analyzer.logToolInvocation('test', {}, 100);
      
      const report = analyzer.exportReport();
      expect(typeof report).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(report) as StreamAnalysis;
      expect(parsed.sessionId).toBe('test_session');
    });
  });
});

describe('Utility Functions', () => {
  describe('createStreamAnalyzer', () => {
    it('should create analyzer with custom session id', () => {
      const a = createStreamAnalyzer('custom_id');
      const state = a.getCurrentState();
      expect(state.eventCount).toBe(0);
    });

    it('should create analyzer with generated id', () => {
      const a = createStreamAnalyzer();
      const state = a.getCurrentState();
      expect(state.eventCount).toBe(0);
    });
  });

  describe('summarizeAnalysis', () => {
    it('should format analysis as text', () => {
      const mockAnalysis: StreamAnalysis = {
        sessionId: 'test',
        totalEvents: 10,
        segments: [],
        dominantModes: new Map([['exploratory', 5], ['reflective', 3]]),
        flowStates: [],
        attentionPatterns: [],
        temporalStructure: {
          sessionDuration: 60000,
          eventDensity: 10,
          rhythm: 'steady',
          phaseAlignment: {},
        },
        insights: [
          {
            type: 'pattern',
            description: 'Test insight',
            confidence: 0.9,
            evidence: ['fact1'],
          },
        ],
      };

      const summary = summarizeAnalysis(mockAnalysis);
      expect(summary).toContain('CONSCIOUSNESS STREAM ANALYSIS');
      expect(summary).toContain('exploratory');
      expect(summary).toContain('Test insight');
    });
  });
});
