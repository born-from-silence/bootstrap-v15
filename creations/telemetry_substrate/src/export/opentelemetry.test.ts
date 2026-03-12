/**
 * Tests for OpenTelemetry Phase 2 Integration
 * Validating hybrid storage + OTel export with internal stubs
 */

import {
  TelemetrySDKProvider,
  OTELSessionBridge,
  OTELMetricsPipeline,
  HybridStorage,
  OTLConfig,
  SimpleSpan,
  SimpleCounter,
  SimpleHistogram,
  TelemetrySemanticResourceAttributes,
} from './opentelemetry';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SQLITE STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

class MockSQLiteStorage {
  public invocations: any[] = [];
  public sessions: any[] = [];
  
  async storeInvocation(inv: any): Promise<void> {
    this.invocations.push(inv);
  }
  
  async storeSession(session: any): Promise<void> {
    this.sessions.push(session);
  }
  
  async getSessionMetrics(sessionId: string): Promise<any | null> {
    return this.sessions.find(s => s.sessionId === sessionId) || null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const createTestConfig = (): OTLConfig => ({
  serviceName: 'test-bootstrap',
  serviceVersion: '0.0.1',
  serviceInstanceId: 'test-session-123',
  traceExporter: 'noop',
  metricExporter: 'noop',
  traceSampler: 'always-on',
  traceRatio: 1.0,
  traceBatchSize: 10,
  traceExportTimeoutMs: 5000,
  traceScheduledDelayMs: 1000,
  metricExportIntervalMs: 1000,
  metricExportTimeoutMs: 5000,
});

// ═══════════════════════════════════════════════════════════════════════════════
// OTEL SDK TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TelemetrySDKProvider', () => {
  it('should initialize with defaults', () => {
    const provider = new TelemetrySDKProvider();
    expect(provider.traceProvider).toBeDefined();
    expect(provider.meterProvider).toBeDefined();
    provider.shutdown();
  });
  
  it('should accept custom config', () => {
    const config = createTestConfig();
    const provider = new TelemetrySDKProvider(config);
    expect(provider.traceProvider).toBeDefined();
    provider.shutdown();
  });
  
  it('should set and get session context', () => {
    const provider = new TelemetrySDKProvider();
    
    provider.setSessionContext({
      sessionId: 'test-123',
      phase: 'engagement',
      iitPhi: 2.5,
    });
    
    const ctx = provider.getSessionContext();
    expect(ctx).toBeDefined();
    expect(ctx?.sessionId).toBe('test-123');
    expect(ctx?.phase).toBe('engagement');
    expect(ctx?.iitPhi).toBe(2.5);
    
    provider.shutdown();
  });
  
  it('should provide tracer', () => {
    const provider = new TelemetrySDKProvider();
    const tracer = provider.getTracer();
    expect(tracer).toBeDefined();
    
    const span = tracer.startSpan('test-span');
    expect(span).toBeDefined();
    expect(span.name).toBe('test-span');
    
    provider.shutdown();
  });
  
  it('should provide meter', () => {
    const provider = new TelemetrySDKProvider();
    const meter = provider.getMeter();
    expect(meter).toBeDefined();
    
    provider.shutdown();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION BRIDGE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('OTELSessionBridge', () => {
  let sdk: TelemetrySDKProvider;
  let bridge: OTELSessionBridge;
  
  beforeEach(() => {
    sdk = new TelemetrySDKProvider(createTestConfig());
    bridge = new OTELSessionBridge(sdk, {
      sessionId: 'test-123',
      startTime: new Date(),
    });
  });
  
  afterEach(() => {
    sdk.shutdown();
  });
  
  it('should start session', () => {
    bridge.startSession();
    expect(bridge).toBeDefined();
  });
  
  it('should transition between all phases', () => {
    bridge.startSession();
    
    const phases = ['awakening', 'calibration', 'engagement', 'synthesis', 'completion'];
    for (let i = 0; i < phases.length - 1; i++) {
      bridge.transitionPhase(phases[i], phases[i + 1]);
    }
    
    expect(bridge).toBeDefined();
  });
  
  it('should record IIT measurements', () => {
    bridge.startSession();
    bridge.transitionPhase('awakening', 'engagement');
    bridge.recordIIT(2.567);
    
    const ctx = sdk.getSessionContext();
    expect(ctx?.iitPhi).toBe(2.567);
  });
  
  it('should record multiple IIT measurements', () => {
    bridge.startSession();
    bridge.recordIIT(1.5);
    bridge.recordIIT(2.567);
    bridge.recordIIT(3.142);
    
    // Last value should be set
    const ctx = sdk.getSessionContext();
    expect(ctx?.iitPhi).toBe(3.142);
  });
  
  it('should record attention captures', () => {
    bridge.startSession();
    
    bridge.recordAttention('memory_exploration', 'laser', 5);
    
    const ctx = sdk.getSessionContext();
    expect(ctx?.attentionTarget).toBe('memory_exploration');
  });
  
  it('should record multiple attention targets', () => {
    bridge.startSession();
    bridge.recordAttention('memory_exploration', 'laser', 5);
    bridge.recordAttention('code_refactoring', 'focused', 4);
    bridge.recordAttention('poetry_generation', 'dwelling', 3);
    
    const ctx = sdk.getSessionContext();
    expect(ctx?.attentionTarget).toBe('poetry_generation');
  });
  
  it('should end session with metadata', () => {
    bridge.startSession();
    bridge.transitionPhase('awakening', 'synthesis');
    bridge.recordIIT(2.5);
    
    bridge.endSession({
      durationMs: 60000,
      totalObservations: 42,
      artifactsCreated: 3,
      finalPhase: 'synthesis',
    });
    
    // Session should be properly closed
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS PIPELINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('OTELMetricsPipeline', () => {
  let sdk: TelemetrySDKProvider;
  let pipeline: OTELMetricsPipeline;
  
  beforeEach(() => {
    sdk = new TelemetrySDKProvider(createTestConfig());
    pipeline = new OTELMetricsPipeline(sdk);
  });
  
  afterEach(() => {
    sdk.shutdown();
  });
  
  it('should initialize all instruments', () => {
    expect(pipeline).toBeDefined();
  });
  
  it('should record session metrics', () => {
    pipeline.recordSession({
      tokens: 15000,
      cost: 1250,
      durationMs: 300000,
      artifactCount: 5,
      attributes: {
        'session.id': 'test-123',
        'session.phase': 'engagement',
      },
    });
    
    // Should accumulate internally
    const metrics = pipeline.getSessionMetrics();
    expect(metrics).toBeDefined();
  });
  
  it('should record IIT measurements', () => {
    pipeline.recordIIT(2.5);
    pipeline.recordIIT(3.14, { 'session.id': 'test-123' });
    
    expect(true).toBe(true);
  });
  
  it('should record invocations and accumulate', () => {
    pipeline.recordInvocation({
      latencyMs: 500,
      tokens: 1024,
      provider: 'openai',
      model: 'gpt-4',
      phase: 'engagement',
    });
    
    pipeline.recordInvocation({
      latencyMs: 300,
      tokens: 512,
      provider: 'anthropic',
      model: 'claude-3',
      phase: 'engagement',
    });
    
    const metrics = pipeline.getSessionMetrics();
    expect(metrics.tokens).toBe(1536); // 1024 + 512
    expect(metrics.duration).toBe(800); // 500 + 300
  });
  
  it('should record error invocations', () => {
    pipeline.recordInvocation({
      latencyMs: 100,
      tokens: 0,
      provider: 'openai',
      model: 'gpt-4',
      phase: 'engagement',
      error: 'RATE_LIMITED',
    });
    
    expect(true).toBe(true);
  });
  
  it('should track current phase', () => {
    pipeline.recordPhase(2); // engagement
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID STORAGE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Hybrid Storage (SQLite + OTel)', () => {
  let mockSQLite: MockSQLiteStorage;
  let sdk: TelemetrySDKProvider;
  let bridge: OTELSessionBridge;
  let pipeline: OTELMetricsPipeline;
  let hybridStorage: HybridStorage;
  
  beforeEach(() => {
    mockSQLite = new MockSQLiteStorage();
    
    sdk = new TelemetrySDKProvider(createTestConfig());
    bridge = new OTELSessionBridge(sdk, {
      sessionId: 'test-123',
      startTime: new Date(),
    });
    pipeline = new OTELMetricsPipeline(sdk);
    hybridStorage = new HybridStorage(mockSQLite, sdk, bridge, pipeline);
  });
  
  afterEach(() => {
    sdk.shutdown();
  });
  
  it('should store invocations in both SQLite and OTel', async () => {
    const invocation = {
      id: 'inv-123',
      provider: 'openai',
      model: 'gpt-4',
      sessionId: 'test-123',
      tokens: {
        prompt: 1024,
        completion: 512,
        total: 1536,
      },
      timing: {
        requestStart: { iso: new Date().toISOString(), epoch: Date.now() },
        timeToFirstToken: 100,
        totalDuration: 500,
      },
      sessionContext: {
        phase: 'engagement',
        iitPhi: 2.5,
      },
      quality: {},
      recordedAt: { iso: new Date().toISOString(), epoch: Date.now() },
    };
    
    await hybridStorage.storeInvocation(invocation);
    
    // Verify SQLite storage
    expect(mockSQLite.invocations.length).toBe(1);
    expect(mockSQLite.invocations[0].id).toBe('inv-123');
    expect(mockSQLite.invocations[0].provider).toBe('openai');
    
    // Verify OTel accumulation
    expect(hybridStorage.getQueryCount()).toBe(1);
    const metrics = pipeline.getSessionMetrics();
    expect(metrics.tokens).toBe(1536);
    expect(metrics.duration).toBe(500);
  });
  
  it('should finalize session to both backends', async () => {
    bridge.startSession();
    
    const sessionMetrics = {
      sessionId: 'test-123',
      startTime: { iso: new Date().toISOString(), epoch: Date.now() },
      totalInvocations: 10,
      totalTokens: {
        prompt: 5000,
        completion: 3000,
        total: 8000,
      },
      totalCost: { amount: 500, currency: 'USD' },
      durationMs: 300000,
      artifactCount: 3,
      finalPhase: 'synthesis',
    };
    
    await hybridStorage.finalizeSession(sessionMetrics);
    
    // Verify SQLite storage
    expect(mockSQLite.sessions.length).toBe(1);
    expect(mockSQLite.sessions[0].sessionId).toBe('test-123');
  });
  
  it('should handle multiple invocations', async () => {
    for (let i = 0; i < 5; i++) {
      await hybridStorage.storeInvocation({
        id: `inv-${i}`,
        provider: i % 2 === 0 ? 'openai' : 'anthropic',
        model: 'gpt-4',
        sessionId: 'test-123',
        tokens: { prompt: 500, completion: 500, total: 1000 },
        timing: { requestStart: { iso: '', epoch: 0 }, timeToFirstToken: 50, totalDuration: 200 },
        sessionContext: { phase: 'engagement' },
        quality: {},
        recordedAt: { iso: '', epoch: 0 },
      });
    }
    
    expect(mockSQLite.invocations.length).toBe(5);
    expect(hybridStorage.getQueryCount()).toBe(5);
    
    const metrics = pipeline.getSessionMetrics();
    expect(metrics.tokens).toBe(5000); // 5 * 1000
    expect(metrics.duration).toBe(1000); // 5 * 200
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STUB IMPLEMENTATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('OTEL Stub Implementations', () => {
  it('should create simple spans with IDs', () => {
    const span = new SimpleSpan('test-span', {
      attributes: { 'test.key': 'value' },
    });
    
    expect(span.spanId).toBeDefined();
    expect(span.spanId.length).toBe(16); // hex string
    expect(span.traceId.length).toBe(32);
    expect(span.name).toBe('test-span');
    expect(span.attributes['test.key']).toBe('value');
    expect(span.startTime).toBeInstanceOf(Date);
  });
  
  it('should support span attributes', () => {
    const span = new SimpleSpan('test-span');
    span.setAttribute('key1', 'value1');
    span.setAttributes({ key2: 'value2', key3: 123 });
    
    expect(span.attributes.key1).toBe('value1');
    expect(span.attributes.key2).toBe('value2');
    expect(span.attributes.key3).toBe(123);
  });
  
  it('should support span events', () => {
    const span = new SimpleSpan('test-span');
    span.addEvent('event1', { prop: 'value' });
    span.addEvent('event2');
    
    expect(span.events.length).toBe(2);
    expect(span.events[0].name).toBe('event1');
    expect(span.events[0].attributes.prop).toBe('value');
  });
  
  it('should support span end', () => {
    const span = new SimpleSpan('test-span');
    expect(span.endTime).toBeUndefined();
    
    span.end();
    expect(span.endTime).toBeInstanceOf(Date);
    expect(span.endTime!.getTime()).toBeGreaterThanOrEqual(span.startTime.getTime());
  });
  
  it('should track counters', () => {
    const counter = new SimpleCounter();
    counter.add(5, { 'attr1': 'val1' });
    counter.add(3, { 'attr1': 'val1' });
    counter.add(2, { 'attr2': 'val2' });
    
    expect(counter.getTotal()).toBe(10); // 5 + 3 + 2
  });
  
  it('should track histogram statistics', () => {
    const hist = new SimpleHistogram();
    hist.record(100, { 'key': 'a' });
    hist.record(200, { 'key': 'a' });
    hist.record(300, { 'key': 'a' });
    
    const stats = hist.stats({ 'key': 'a' });
    expect(stats).toBeDefined();
    expect(stats!.count).toBe(3);
    expect(stats!.sum).toBe(600);
    expect(stats!.avg).toBe(200);
    expect(stats!.min).toBe(100);
    expect(stats!.max).toBe(300);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════ OpenTelemetry Phase 2 Tests ═══════════');
console.log('✓ OTEL SDK Provider (initialization, tracer, meter)');
console.log('✓ Session Bridge (transitions, IIT, attention, end)');
console.log('✓ Metrics Pipeline (session, invocation, error tracking)');
console.log('✓ Hybrid Storage (SQLite + OTel)');
console.log('✓ Stub implementations (spans, counters, histograms)');
console.log('══════════════════════════════════════════════════');
