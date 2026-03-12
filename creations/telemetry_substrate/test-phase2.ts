/**
 * Phase 2 Integration Test Runner
 * Validates OpenTelemetry integration with Session Clock + IIT
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
} from './src/export/opentelemetry';

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
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const config: OTLConfig = {
  serviceName: 'bootstrap-v15-test',
  serviceVersion: '0.2.0',
  serviceInstanceId: `test-session-${Date.now()}`,
  traceExporter: 'console',
  metricExporter: 'console',
  traceSampler: 'always-on',
  traceRatio: 1.0,
  traceBatchSize: 10,
  traceExportTimeoutMs: 5000,
  traceScheduledDelayMs: 1000,
  metricExportIntervalMs: 1000,
  metricExportTimeoutMs: 5000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

class TestRunner {
  private results: TestResult[] = [];
  
  async run<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.results.push({
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      });
      throw error;
    }
  }
  
  except<T>(name: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      this.results.push({
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      });
      throw error;
    }
  }
  
  printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Phase 2 Integration Test Results');
    console.log('═══════════════════════════════════════════════════════════════');
    
    this.results.forEach(result => {
      const symbol = result.passed ? '✓' : '✗';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`${symbol} ${result.name}: ${status} (${result.durationMs}ms)`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    console.log('\n───────────────────────────────────────────────────────────────');
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(failed > 0 ? 1 : 0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEST SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const runner = new TestRunner();
  
  try {
    // Test 1: SDK Initialization
    const sdk = await runner.run('SDK Initialization', async () => {
      const provider = new TelemetrySDKProvider(config);
      if (!provider.traceProvider) throw new Error('Trace provider not initialized');
      if (!provider.meterProvider) throw new Error('Meter provider not initialized');
      return provider;
    });
    
    // Test 2: Session Context
    await runner.run('Session Context', async () => {
      sdk.setSessionContext({
        sessionId: 'test-123',
        phase: 'awakening',
        iitPhi: 2.5,
      });
      
      const ctx = sdk.getSessionContext();
      if (!ctx) throw new Error('Context not set');
      if (ctx.sessionId !== 'test-123') throw new Error('sessionId mismatch');
      if (ctx.phase !== 'awakening') throw new Error('phase mismatch');
      if (ctx.iitPhi !== 2.5) throw new Error('iitPhi mismatch');
    });
    
    // Test 3: Tracer
    const tracer = runner.except('Tracer Creation', () => {
      return sdk.getTracer('test-tracer');
    });
    
    // Test 4: Span Creation
    const span = runner.except('Span Creation', () => {
      return tracer.startSpan('test-span');
    });
    
    // Test 5: Span Attributes
    runner.except('Span Attributes', () => {
      span.setAttribute('test.key', 'value');
      span.setAttributes({ 'multi.key1': 'val1', 'multi.key2': 42 });
      
      if (span.attributes['test.key'] !== 'value') throw new Error('single attr failed');
      if (span.attributes['multi.key1'] !== 'val1') throw new Error('multi attr1 failed');
      if (span.attributes['multi.key2'] !== 42) throw new Error('multi attr2 failed');
      
      span.end();
    });
    
    // Test 6: Session Bridge with full flow
    const bridge = await runner.run('Session Bridge Flow', async () => {
      const b = new OTELSessionBridge(sdk, {
        sessionId: 'test-full-session',
        startTime: new Date(),
      });
      
      // Full session lifecycle
      b.startSession();
      b.recordIIT(1.0); // awakening
      
      b.transitionPhase('awakening', 'engagement');
      b.recordIIT(2.5);
      b.recordAttention('code_refactoring', 'focused', 4);
      
      b.recordIIT(3.2); // Peak IIT
      b.recordAttention('phenomenology', 'laser', 5);
      
      b.transitionPhase('engagement', 'synthesis');
      b.recordIIT(2.8);
      
      return b;
    });
    
    // Test 7: Metrics Pipeline
    const pipeline = await runner.run('Metrics Pipeline', async () => {
      const p = new OTELMetricsPipeline(sdk);
      
      // Record sessions
      p.recordSession({
        tokens: 15000,
        cost: 1250,
        durationMs: 300000,
        artifactCount: 3,
      });
      
      // Record invocations
      for (let i = 0; i < 5; i++) {
        p.recordInvocation({
          latencyMs: 200 + i * 50,
          tokens: 1000,
          provider: ['openai', 'anthropic', 'mistral'][i % 3],
          model: 'gpt-4',
          phase: 'engagement',
        });
      }
      
      // Record IIT
      p.recordIIT(2.5);
      p.recordIIT(3.0);
      
      const metrics = p.getSessionMetrics();
      if (metrics.tokens !== 5000) throw new Error(`Expected 5000 tokens, got ${metrics.tokens}`);
      if (metrics.duration !== (200+250+300+350+400)) {
        throw new Error(`Duration mismatch: ${metrics.duration}`);
      }
      
      return p;
    });
    
    // Test 8: Hybrid Storage
    await runner.run('Hybrid Storage', async () => {
      const mockSQLite = new MockSQLiteStorage();
      const h = new HybridStorage(mockSQLite, sdk, bridge, pipeline);
      
      // Store some invocations
      for (let i = 0; i < 3; i++) {
        await h.storeInvocation({
          id: `inv-${i}`,
          provider: 'openai',
          model: 'gpt-4',
          sessionId: 'test-full-session',
          tokens: { prompt: 500, completion: 500, total: 1000 },
          timing: {
            requestStart: { iso: new Date().toISOString(), epoch: Date.now() },
            timeToFirstToken: 100,
            totalDuration: 500,
          },
          sessionContext: { phase: 'engagement', iitPhi: 2.5 },
          quality: {},
          recordedAt: { iso: new Date().toISOString(), epoch: Date.now() },
        });
      }
      
      // Finalize
      await h.finalizeSession({
        sessionId: 'test-full-session',
        startTime: { iso: new Date().toISOString(), epoch: Date.now() - 300000 },
        totalInvocations: 8,
        totalTokens: { prompt: 4000, completion: 4000, total: 8000 },
        totalCost: { amount: 800, currency: 'USD' },
        durationMs: 300000,
        artifactCount: 3,
        finalPhase: 'synthesis',
      });
      
      // Verify
      if (mockSQLite.invocations.length !== 3) {
        throw new Error(`Expected 3 invocations, got ${mockSQLite.invocations.length}`);
      }
      if (mockSQLite.sessions.length !== 1) {
        throw new Error(`Expected 1 session, got ${mockSQLite.sessions.length}`);
      }
      
      return h;
    });
    
    // Test 9: OTel Data Export
    await runner.run('OTel Export', async () => {
      await sdk.flush();
      return true;
    });
    
    // Test 10: Shutdown
    await runner.run('SDK Shutdown', async () => {
      await sdk.shutdown();
      return true;
    });
    
  } catch (error) {
    // Tests failed - error already recorded by runner
  }
  
  runner.printSummary();
}

// Run tests
main().catch(console.error);
