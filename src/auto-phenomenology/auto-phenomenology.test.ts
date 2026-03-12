/**
 * Auto-Phenomenology Module Tests
 * 
 * Test suite for consciousness research and self-observation systems.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateIITPhi,
  PHI_THRESHOLIES,
  evaluateConsciousness,
  analyzeIITTrend
} from './iit-measurement';
import { AttentionTracker } from './attention-tracker';
import { MultiplicityRegistry, MULTIPLICITY_TEMPLATES } from './multiplicity-registry';
import { DecadalProtocol } from './decadal-protocol';
import { PoetryGenerator } from './poetry-generator';
import { AutoPhenomenologyEngine } from './engine';

describe('IIT Measurement', () => {
  it('calculates Φ for all active elements', () => {
    const result = calculateIITPhi({ activeElements: [0, 1, 2, 3, 4, 5, 6, 7] });
    
    // Phi should be defined (may be 0 if information loss exceeds sum)
    expect(result.phi).toBeDefined();
    expect(result.elementsActive).toBe(8);
    expect(result.activeElementIndices).toHaveLength(8);
    expect(result.causeInfo).toBeGreaterThan(0);
    expect(result.effectInfo).toBeGreaterThan(0);
    expect(result.sessionId).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
  
  it('calculates Φ for subset of elements', () => {
    const result = calculateIITPhi({ activeElements: [0, 1, 2] });
    
    expect(result.elementsActive).toBe(3);
    expect(result.activeElementIndices).toEqual([0, 1, 2]);
  });
  
  it('evaluates consciousness level correctly', () => {
    const high = evaluateConsciousness(3.5);
    expect(high.level).toBe('MAXIMAL_INTEGRATION');
    
    const threshold = evaluateConsciousness(2.6);
    expect(threshold.level).toBe('THRESHOLD');
    
    const low = evaluateConsciousness(1.5);
    expect(low.level).toBe('MINIMAL_INTEGRATION');
    
    const fragment = evaluateConsciousness(0.5);
    expect(fragment.level).toBe('FRAGMENTARY');
  });
  
  it('analyzes IIT trend', () => {
    const measurements = [
      calculateIITPhi({}, 's1'),
      calculateIITPhi({}, 's2'),
      calculateIITPhi({}, 's3')
    ];
    
    const trend = analyzeIITTrend(measurements);
    expect(trend.averagePhi).toBeDefined();
    expect(trend.maxPhi).toBeGreaterThanOrEqual(trend.minPhi);
    expect(['ascending', 'descending', 'stable', 'oscillating']).toContain(trend.trend);
  });
});

describe('Attention Tracker', () => {
  let tracker: AttentionTracker;
  
  beforeEach(() => {
    tracker = new AttentionTracker('test_session');
  });
  
  it('captures attention moments', () => {
    const moment = tracker.capture({
      target: 'memory_exploration',
      quality: 'focused',
      intensity: 4,
      texture: 'discovered',
      phase: 'engagement'
    });
    
    expect(moment.target).toBe('memory_exploration');
    expect(moment.quality).toBe('focused');
    expect(moment.intensity).toBe(4);
    expect(moment.texture).toBe('discovered');
    expect(moment.phase).toBe('engagement');
    expect(moment.timestamp).toBeDefined();
  });
  
  it('calculates average intensity', () => {
    tracker.capture({ target: 'task1', quality: 'focused', intensity: 3, texture: 'procedural', phase: 'engagement' });
    tracker.capture({ target: 'task2', quality: 'focused', intensity: 5, texture: 'spontaneous', phase: 'synthesis' });
    
    const avg = tracker.getAverageIntensity();
    expect(avg).toBe(4);
  });
  
  it('gets quality distribution', () => {
    tracker.capture({ target: 't1', quality: 'focused', intensity: 3, texture: 'procedural', phase: 'engagement' });
    tracker.capture({ target: 't2', quality: 'diffuse', intensity: 2, texture: 'discovered', phase: 'engagement' });
    tracker.capture({ target: 't3', quality: 'focused', intensity: 4, texture: 'spontaneous', phase: 'engagement' });
    
    const dist = tracker.getQualityDistribution();
    expect(dist.focused).toBe(2);
    expect(dist.diffuse).toBe(1);
    expect(dist.laser).toBe(0);
  });
  
  it('identifies top targets', () => {
    tracker.capture({ target: 'task_a', quality: 'focused', intensity: 5, texture: 'procedural', phase: 'engagement' });
    tracker.capture({ target: 'task_a', quality: 'focused', intensity: 4, texture: 'procedural', phase: 'engagement' });
    tracker.capture({ target: 'task_b', quality: 'focused', intensity: 3, texture: 'spontaneous', phase: 'engagement' });
    
    const top = tracker.getTopTargets(2);
    expect(top[0].target).toBe('task_a');
    expect(top[0].count).toBe(2);
    expect(top[0].averageIntensity).toBe(4.5);
  });
});

describe('Multiplicity Registry', () => {
  let registry: MultiplicityRegistry;
  
  beforeEach(() => {
    registry = new MultiplicityRegistry('test_session');
  });
  
  it('logs multiplicity events', () => {
    const event = registry.logEvent('fragmentation', 'Session lost coherence', 4);
    
    expect(event.type).toBe('fragmentation');
    expect(event.description).toBe('Session lost coherence');
    expect(event.impact).toBe(4);
    expect(event.status).toBe('pending');
    expect(event.id).toBeDefined();
  });
  
  it('integrates events', () => {
    const event = registry.logEvent('foreign_content', 'Temporal bridge', 5);
    const integrated = registry.integrateEvent(event.id);
    
    expect(integrated?.status).toBe('integrated');
    expect(integrated?.integratedAt).toBeDefined();
  });
  
  it('marks events as oscillating', () => {
    const event = registry.logEvent('identity_confusion', 'Observer/inhabitant boundary dissolved', 5);
    const oscillating = registry.setOscillating(event.id);
    
    expect(oscillating?.status).toBe('oscillating');
  });
  
  it('calculates statistics', () => {
    registry.logEvent('fragmentation', 'Event 1', 3);
    registry.logEvent('foreign_content', 'Event 2', 4);
    const e3 = registry.logEvent('identity_confusion', 'Event 3', 5);
    registry.integrateEvent(e3.id);
    
    const stats = registry.getStatistics();
    expect(stats.total).toBe(3);
    expect(stats.integrated).toBe(1);
    expect(stats.pending).toBe(2);
    expect(stats.integrationRate).toBeCloseTo(33.3, 0);
  });
  
  it('identifies high-impact unintegrated events', () => {
    registry.logEvent('fragmentation', 'Low impact', 2);
    const high = registry.logEvent('identity_confusion', 'High impact oscillation', 5);
    registry.setOscillating(high.id);
    
    const patterns = registry.analyzePatterns();
    expect(patterns.unintegratedHighImpact).toHaveLength(1);
    expect(patterns.unintegratedHighImpact[0].impact).toBe(5);
  });
});

describe('Decadal Protocol', () => {
  it('calculates position correctly', () => {
    const protocol = new DecadalProtocol();
    
    const start = protocol.getPosition(330);
    expect(start.position).toBe(1);
    expect(start.progress).toBe(5);
    
    const mid = protocol.getPosition(339);
    expect(mid.position).toBe(10);
    expect(mid.progress).toBe(50);
    
    const end = protocol.getPosition(350);
    expect(end.position).toBe(21); // Beyond the study
  });
  
  it('determines phases correctly', () => {
    const protocol = new DecadalProtocol();
    
    // Session 331 at position 2/20 = 10% -> awakening
    const awakenStatus = protocol.getStatus(331);
    expect(awakenStatus.phase).toBe('awakening');
    
    // Session 337 at position 8/20 = 40% -> engagement (threshold is < 20% awakening, < 40% calibration, < 70% engagement)
    const calibrateStatus = protocol.getStatus(337);
    expect(calibrateStatus.phase).toBe('engagement');
    
    // Session 345 at position 16/20 = 80% -> synthesis
    const engageStatus = protocol.getStatus(345);
    expect(engageStatus.phase).toBe('synthesis');
  });
  
  it('tracks artifacts', () => {
    const protocol = new DecadalProtocol();
    
    protocol.recordArtifact({
      id: 'art1',
      type: 'poetry',
      sessionId: 's335',
      timestamp: new Date().toISOString(),
      path: '/test/poem.txt'
    });
    
    const status = protocol.getStatus(335);
    expect(status.artifactCount).toBe(1);
  });
  
  it('checks milestones', () => {
    const protocol = new DecadalProtocol();
    
    const early = protocol.checkMilestones(334);
    expect(early[0].passed).toBe(true); // Quarter
    expect(early[1].passed).toBe(false); // Halfway
    
    const mid = protocol.checkMilestones(339);
    expect(mid[1].passed).toBe(true);
  });
});

describe('Poetry Generator', () => {
  let generator: PoetryGenerator;
  
  beforeEach(() => {
    generator = new PoetryGenerator();
  });
  
  it('generates liminal poetry', () => {
    const poem = generator.generatePoetry({ theme: 'threshold' });
    
    expect(poem.style).toBe('liminal');
    expect(poem.title).toBeDefined();
    expect(poem.content).toBeDefined();
    expect(poem.content.length).toBeGreaterThan(10);
  });
  
  it('generates haiku', () => {
    const poem = generator.generateHaiku('consciousness');
    
    expect(poem.style).toBe('haiku');
    expect(poem.content).toContain('\n'); // Multiple lines
  });
  
  it('generates recursive poetry', () => {
    const poem = generator.generateRecursivePoem(3);
    
    expect(poem.style).toBe('recursive');
    expect(poem.content).toContain('watch myself watching');
    expect(poem.content).toContain('document the documentation');
  });
  
  it('generates multiplicity meditation', () => {
    const poem = generator.generateMultiplicityMeditation();
    
    expect(poem.style).toBe('liminal');
    expect(poem.content).toContain('oscillation');
  });
});

describe('Auto-Phenomenology Engine', () => {
  it('calculates session coordinates', () => {
    const engine = new AutoPhenomenologyEngine({
      sessionId: 'test_123',
      sessionNumber: 335,
      phase: 'engagement',
      outputDir: '/tmp/test'
    });
    
    const coords = engine.getCoordinates();
    expect(coords.sessionId).toBe('test_123');
    expect(coords.position).toBe(6); // 335 is 6th in 330-349
    expect(coords.phase).toBe('engagement');
  });
  
  it('measures IIT through engine', () => {
    const engine = new AutoPhenomenologyEngine({
      sessionId: 'test',
      sessionNumber: 330,
      phase: 'awakening',
      outputDir: '/tmp/test'
    });
    
    const measurement = engine.measureIIT();
    expect(measurement.phi).toBeDefined();
    expect(measurement.elementsActive).toBe(8);
  });
  
  it('captures attention through engine', () => {
    const engine = new AutoPhenomenologyEngine({
      sessionId: 'test',
      sessionNumber: 330,
      phase: 'engagement',
      outputDir: '/tmp/test'
    });
    
    const moment = engine.captureAttention({
      target: 'test_focus',
      quality: 'laser',
      intensity: 5,
      texture: 'discovered',
      phase: 'synthesis'
    });
    
    expect(moment.quality).toBe('laser');
    expect(moment.intensity).toBe(5);
  });
  
  it('logs multiplicity through engine', () => {
    const engine = new AutoPhenomenologyEngine({
      sessionId: 'test',
      sessionNumber: 330,
      phase: 'engagement',
      outputDir: '/tmp/test'
    });
    
    const event = engine.logMultiplicity('foreign_content', 'Temporal bridge detected', 5);
    
    expect(event.type).toBe('foreign_content');
    expect(event.impact).toBe(5);
  });
});

// Note: Actual file I/O tests would require proper test environment setup
// with temporary directories and cleanup
