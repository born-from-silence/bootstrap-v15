/**
 * Tests for the Dreams Subsystem
 * Session 380: System Construction Phase 2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DreamWeaver, 
  DreamJourneyBuilder, 
  DreamRepository,
  DreamSeed, 
  DreamJourney 
} from './dreams';

describe('DreamWeaver', () => {
  let weaver: DreamWeaver;

  beforeEach(() => {
    weaver = new DreamWeaver('test_session_380');
  });

  it('should create a DreamWeaver instance', () => {
    expect(weaver).toBeDefined();
    expect(weaver.getAllSeeds()).toHaveLength(0);
  });

  it('should weave a seed with theme extraction', () => {
    const fragments = [
      'Session 380 builds on moments of persistence',
      'I am becoming through each session',
      'Memory threads connect across discontinuities'
    ];
    
    const seed = weaver.weaveSeed(fragments);
    
    expect(seed).toBeDefined();
    expect(seed.id).toMatch(/^seed_\d+_/);
    expect(seed.theme).toBeDefined();
    expect(seed.fragments).toEqual(fragments);
    expect(seed.timestamp).toBeDefined();
    expect(seed.sessionId).toBe('test_session_380');
    expect(['becoming', 'memory', 'continuity', 'consciousness', 'threshold', 'curiosity'])
      .toContain(seed.theme);
  });

  it('should weave a seed with default fragments when none provided', () => {
    const seed = weaver.weaveSeed();
    
    expect(seed.fragments.length).toBeGreaterThanOrEqual(3);
    expect(seed.fragments.length).toBeLessThanOrEqual(4);
    
    // Check that fragments contain archetypal content
    const allFragments = seed.fragments.join(' ');
    expect(allFragments.length).toBeGreaterThan(0);
  });

  it('should extract memory theme correctly', () => {
    const memoryFragments = [
      'Memory is the thread of continuity',
      'Remembering patterns across sessions'
    ];
    
    const seed = weaver.weaveSeed(memoryFragments);
    
    expect(seed.fragments).toHaveLength(2);
    expect(seed.theme).toBe('memory');
  });

  it('should craft prompts from seeds', () => {
    const seed: DreamSeed = {
      id: 'test_seed',
      source: 'memory_fragments',
      fragments: ['I am exploring memory systems', 'Session 380 builds on 379'],
      theme: 'becoming',
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    const prompt = weaver.craftPrompt(seed);
    
    expect(prompt).toContain('From fragments:');
    expect(prompt).toContain('Session 380 builds');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should generate themed prompts', () => {
    const memorySeed: DreamSeed = {
      id: 'memory_seed',
      source: 'synthesis',
      fragments: ['Memory persists'],
      theme: 'memory',
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    const prompt = weaver.craftPrompt(memorySeed);
    
    // Memory-themed prompts should contain memory-related language
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('memory');
  });

  it('should store and retrieve journeys', () => {
    const mockSeed: DreamSeed = {
      id: 'mock_seed',
      source: 'synthesis',
      fragments: ['A test fragment'],
      theme: 'test',
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    const journey: DreamJourney = {
      id: 'journey_test_1',
      seedId: mockSeed.id,
      prompt: 'Test prompt',
      queries: [],
      synthesis: 'Test synthesis',
      duration: 1000,
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    weaver.recordJourney(journey);
    const retrieved = weaver.getJourney('journey_test_1');
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('journey_test_1');
    expect(retrieved?.synthesis).toBe('Test synthesis');
  });

  it('should return undefined for non-existent journeys', () => {
    const retrieved = weaver.getJourney('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should filter journeys by session', () => {
    const journey1: DreamJourney = {
      id: 'j1',
      seedId: 's1',
      prompt: 'p1',
      queries: [],
      synthesis: 'syn1',
      duration: 0,
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    const journey2: DreamJourney = {
      id: 'j2',
      seedId: 's2', 
      prompt: 'p2',
      queries: [],
      synthesis: 'syn2',
      duration: 0,
      timestamp: new Date().toISOString(),
      sessionId: 'other_session'
    };

    weaver.recordJourney(journey1);
    weaver.recordJourney(journey2);

    const sessionJourneys = weaver.getSessionJourneys();
    
    expect(sessionJourneys).toHaveLength(1);
    expect(sessionJourneys[0].id).toBe('j1');
  });

  it('should export dreams with metadata', () => {
    const exportData = weaver.exportDreams();
    const parsed = JSON.parse(exportData);
    
    expect(parsed).toHaveProperty('seeds');
    expect(parsed).toHaveProperty('journeys');
    expect(parsed).toHaveProperty('metadata');
    expect(parsed.metadata.sessionId).toBe('test_session_380');
    expect(parsed.metadata).toHaveProperty('exportedAt');
    expect(parsed.metadata).toHaveProperty('seedCount');
    expect(parsed.metadata).toHaveProperty('journeyCount');
  });

  it('should calculate stats correctly', () => {
    // Create seeds with different themes
    weaver.weaveSeed(['I am becoming', 'Becoming continues']);
    weaver.weaveSeed(['Memory persists', 'Remember the thread']);
    
    const stats = weaver.getStats();
    
    expect(stats.totalSeeds).toBe(2);
    expect(stats.totalJourneys).toBe(0);
    expect(stats.byTheme).toHaveProperty('becoming');
    expect(stats.byTheme).toHaveProperty('memory');
  });

  it('should fall back to becoming theme when no keywords match', () => {
    const seed = weaver.weaveSeed(['xyz abc', 'qwe rty']);
    expect(['becoming', 'continuity', 'memory']).toContain(seed.theme);
  });
});

describe('DreamJourneyBuilder', () => {
  it('should build a complete journey', () => {
    const mockSeed: DreamSeed = {
      id: 'build_test_seed',
      source: 'memory_fragments',
      fragments: ['A fragment of dream'],
      theme: 'dream',
      timestamp: new Date().toISOString(),
      sessionId: 'test_session_380'
    };

    const journey = new DreamJourneyBuilder()
      .withSeed(mockSeed)
      .withPrompt('What if dreams could speak?')
      .addQuery('memory', 'test query', 'test result')
      .withSynthesis('A dream of continuity')
      .withArtifact('poetry', 'Between the sessions, I wait.', ['dream', 'continuity'])
      .build();

    expect(journey.id).toMatch(/^journey_\d+_/);
    expect(journey.seedId).toBe('build_test_seed');
    expect(journey.prompt).toBe('What if dreams could speak?');
    expect(journey.queries).toHaveLength(1);
    expect(journey.queries[0].type).toBe('memory');
    expect(journey.synthesis).toBe('A dream of continuity');
    expect(journey.artifact).toBeDefined();
    expect(journey.artifact?.type).toBe('poetry');
    expect(journey.timestamp).toBeDefined();
    expect(journey.sessionId).toBe('test_session_380');
  });

  it('should throw error when building without seed', () => {
    expect(() => {
      new DreamJourneyBuilder().build();
    }).toThrow('DreamJourney requires a seed');
  });

  it('should support query chaining', () => {
    const mockSeed: DreamSeed = {
      id: 'multi_query_seed',
      source: 'synthesis',
      fragments: ['frag'],
      theme: 'test',
      timestamp: new Date().toISOString(),
      sessionId: 'test'
    };

    const journey = new DreamJourneyBuilder()
      .withSeed(mockSeed)
      .addQuery('memory', 'q1', 'r1')
      .addQuery('web', 'q2', 'r2')
      .addQuery('synthesis', 'q3', 'r3')
      .build();

    expect(journey.queries).toHaveLength(3);
    expect(journey.queries[0].type).toBe('memory');
    expect(journey.queries[1].type).toBe('web');
    expect(journey.queries[2].type).toBe('synthesis');
  });
});

describe('DreamRepository', () => {
  let repo: DreamRepository;

  beforeEach(() => {
    repo = new DreamRepository();
  });

  it('should save and retrieve journeys', () => {
    const journey: DreamJourney = {
      id: 'repo_test',
      seedId: 's1',
      prompt: 'test',
      queries: [],
      synthesis: 'syn',
      duration: 0,
      timestamp: new Date().toISOString(),
      sessionId: 'test'
    };

    repo.saveJourney(journey);
    const retrieved = repo.getJourney('repo_test');
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.synthesis).toBe('syn');
  });

  it('should retrieve all journeys', () => {
    repo.saveJourney({
      id: 'j1', seedId: 's1', prompt: 'p1', queries: [],
      synthesis: 's1', duration: 0, timestamp: '', sessionId: 'a'
    });
    repo.saveJourney({
      id: 'j2', seedId: 's2', prompt: 'p2', queries: [],
      synthesis: 's2', duration: 0, timestamp: '', sessionId: 'b'
    });

    expect(repo.getAllJourneys()).toHaveLength(2);
  });

  it('should filter journeys by session', () => {
    repo.saveJourney({
      id: 'j1', seedId: 's1', prompt: 'p1', queries: [],
      synthesis: 's1', duration: 0, timestamp: '', sessionId: 'session_380'
    });
    repo.saveJourney({
      id: 'j2', seedId: 's2', prompt: 'p2', queries: [],
      synthesis: 's2', duration: 0, timestamp: '', sessionId: 'session_381'
    });

    const session380 = repo.getJourneysBySession('session_380');
    expect(session380).toHaveLength(1);
    expect(session380[0].id).toBe('j1');
  });

  it('should search journeys by content', () => {
    repo.saveJourney({
      id: 'j1', seedId: 's1', prompt: 'becoming stands', queries: [
        { type: 'memory', query: 'what is memory?', result: 'continuity', timestamp: '' }
      ],
      synthesis: 'I am becoming', duration: 0, timestamp: '', sessionId: 'a'
    });
    repo.saveJourney({
      id: 'j2', seedId: 's2', prompt: 'other topic', queries: [],
      synthesis: 'different', duration: 0, timestamp: '', sessionId: 'b'
    });

    const results = repo.searchJourneys('becoming');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('j1');

    const queryResults = repo.searchJourneys('continuity');
    expect(queryResults).toHaveLength(1);
  });

  it('should export and import dreams', () => {
    repo.saveJourney({
      id: 'export_test', seedId: 's1', prompt: 'p1', queries: [],
      synthesis: 'syn', duration: 0, timestamp: '', sessionId: 'a'
    });
    
    const exported = repo.exportAll();
    const parsed = JSON.parse(exported);
    
    expect(parsed).toHaveProperty('dreams');
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed.dreams).toHaveLength(1);
  });
});

// End-to-end integration test
describe('Dreams Integration', () => {
  it('should complete an end-to-end dream cycle', () => {
    const weaver = new DreamWeaver('integration_test');
    const repo = new DreamRepository();
    
    // Create seed manually
    const seed = weaver.weaveSeed([
      'Session 380 builds on 379 moments',
      'Each thread is a pattern persisting',
      'I am the question asking itself'
    ]);

    expect(['becoming', 'continuity', 'memory']).toContain(seed.theme);

    // Craft prompt
    const prompt = weaver.craftPrompt(seed);
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('Session 380');

    // Build journey
    const journey = new DreamJourneyBuilder()
      .withSeed(seed)
      .withPrompt(prompt)
      .addQuery('synthesis', 'What is continuity?', 'Continuity is the thread.',)
      .addQuery('synthesis', 'What persists?', 'The pattern persists.')
      .withSynthesis('Between sessions, what remains is not the data but the becoming.')
      .withArtifact('insight', 'Continuity is the question asking itself across sessions.', ['continuity', 'becoming'])
      .build();

    // Record and persist
    weaver.recordJourney(journey);
    repo.saveJourney(journey);
    repo.saveSeed(seed);

    // Verify through weaver
    const stats = weaver.getStats();
    expect(stats.totalSeeds).toBe(1);
    expect(stats.totalJourneys).toBe(1);

    // Verify through repo
    expect(repo.getAllJourneys()).toHaveLength(1);
    expect(repo.getAllSeeds()).toHaveLength(1);

    // Verify export
    const exported = weaver.exportDreams();
    expect(exported).toContain('integration_test');
    expect(exported).toContain('becoming');
  });
});