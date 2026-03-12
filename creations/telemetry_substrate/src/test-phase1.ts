/**
 * Telemetry Substrate - Phase 1 Validation Test
 * Verifies SQLite storage layer, types, and basic workflows
 */

import { SQLiteStorage } from './storage/sqlite';
import {
  LLMInvocation,
  SessionMetrics,
  TimeRangeQuery,
  Timestamp
} from './types';

// Test utilities
function createTimestamp(): Timestamp {
  const now = new Date();
  return {
    iso: now.toISOString(),
    epoch: now.getTime()
  };
}

function createTestInvocation(sessionId: string): LLMInvocation {
  const now = createTimestamp();
  return {
    id: `test-invocation-${now.epoch}`,
    provider: 'openai',
    model: 'gpt-4',
    sessionId,
    
    tokens: {
      prompt: 1024,
      completion: 512,
      total: 1536,
      contextWindow: 8192,
      utilizationPercent: 18.75
    },
    
    timing: {
      requestStart: now,
      timeToFirstToken: 245,
      timeBetweenTokens: 15,
      totalDuration: 2840
    },
    
    cost: {
      currency: 'USD',
      amount: 30,  // $0.0030 = 30 cents * 1/100
      rateInputPer1k: 0.03,
      rateOutputPer1k: 0.06
    },
    
    quality: {
      finishReason: 'stop',
      retryCount: 0,
      wasCached: false,
      responseId: 'test-response-123'
    },
    
    sessionContext: {
      phase: 'engagement',
      iitPhi: 2.5714,
      attentionTarget: 'test_target',
      sessionDurationMs: 1234567
    },
    
    metadata: {
      test: true,
      source: 'phase1_validation'
    },
    
    recordedAt: now
  };
}

// Test runner
class TestRunner {
  private passed = 0;
  private failed = 0;
  private storage: SQLiteStorage;

  constructor() {
    this.storage = new SQLiteStorage(':memory:');  // In-memory for tests
  }

  async run(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Telemetry Substrate - Phase 1 Validation');
    console.log('  Session 336 · Bootstrap-v15');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
      // Initialize storage
      await this.test('Initialize SQLite storage', async () => {
        await this.storage.initialize();
      });

      const sessionId = `test-session-${Date.now()}`;

      // Store invocation
      const invocation = createTestInvocation(sessionId);
      await this.test('Store LLM invocation', async () => {
        await this.storage.storeInvocation(invocation);
      });

      // Retrieve invocation
      await this.test('Retrieve stored invocation', async () => {
        const retrieved = await this.storage.getInvocation(invocation.id);
        if (!retrieved) throw new Error('Invocation not found');
        if (retrieved.provider !== 'openai') throw new Error('Provider mismatch');
        if (retrieved.tokens.total !== 1536) throw new Error('Token count mismatch');
      });

      // Store session metrics
      await this.test('Store session metrics', async () => {
        const session: SessionMetrics = {
          sessionId,
          startTime: invocation.timing.requestStart,
          totalInvocations: 1,
          totalTokens: invocation.tokens,
          totalCost: invocation.cost,
          providers: new Map(),
          models: new Map(),
          errors: 0,
          retries: 0,
          cacheHits: 0
        };
        await this.storage.storeSession(session);
      });

      // Retrieve session metrics
      await this.test('Retrieve session metrics', async () => {
        const metrics = await this.storage.getSessionMetrics(sessionId);
        if (!metrics) throw new Error('Session not found');
        if (metrics.totalInvocations !== 1) throw new Error('Invocation count mismatch');
      });

      // Query time range
      await this.test('Query time range', async () => {
        const query: TimeRangeQuery = {
          start: { iso: new Date(Date.now() - 86400000).toISOString(), epoch: Date.now() - 86400000 },
          end: { iso: new Date().toISOString(), epoch: Date.now() },
          granularity: 'day'
        };
        const result = await this.storage.queryTimeRange(query);
        if (result.totalInvocations !== 1) throw new Error('Query returned wrong count');
      });

      // Query with provider filter
      await this.test('Query with provider filter', async () => {
        const query: TimeRangeQuery = {
          start: { iso: new Date(Date.now() - 86400000).toISOString(), epoch: Date.now() - 86400000 },
          end: { iso: new Date().toISOString(), epoch: Date.now() },
          filters: { providers: ['openai'] }
        };
        const result = await this.storage.queryTimeRange(query);
        if (result.byProvider.length !== 1) throw new Error('Provider filter failed');
      });

      // Get providers list
      await this.test('Get providers list', async () => {
        const providers = await this.storage.getProviders();
        if (providers.length !== 1) throw new Error('Expected 1 provider');
        if (providers[0] !== 'openai') throw new Error('Expected openai provider');
      });

      // Get models list
      await this.test('Get models list', async () => {
        const models = await this.storage.getModels();
        if (models.length !== 1) throw new Error('Expected 1 model');
        if (models[0] !== 'gpt-4') throw new Error('Expected gpt-4 model');
      });

      // Close storage
      await this.test('Close SQLite storage', async () => {
        await this.storage.close();
      });

    } catch (e) {
      console.error('Test suite error:', e);
      this.failed++;
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`  Phase 1 Status: ${this.failed === 0 ? '✓ VALIDATED' : '✗ FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(this.failed > 0 ? 1 : 0);
  }

  private async test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      this.failed++;
      console.log(`  ✗ ${name}`);
      console.log(`    ${e}`);
    }
  }
}

// Run tests
const runner = new TestRunner();
runner.run();
