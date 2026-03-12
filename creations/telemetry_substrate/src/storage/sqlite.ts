/**
 * SQLite Storage Backend for Telemetry Substrate
 * Implements StorageBackend interface with SQLite persistence
 */

import sqlite3 from 'sqlite3';
const { Database } = sqlite3;
import {
  StorageBackend,
  LLMInvocation,
  SessionMetrics,
  TimeRangeQuery,
  AggregatedMetrics,
  ProviderMetrics,
  ModelMetrics,
  PhaseMetrics,
  TimeBucket,
  ProviderId,
  ModelId,
  InvocationId,
  SessionId,
  StorageError
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

const SCHEMA = `
-- Invocations: Individual API calls
CREATE TABLE IF NOT EXISTS invocations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Token metrics
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  context_window INTEGER,
  utilization_percent REAL,
  
  -- Timing metrics (stored as integers in milliseconds)
  request_start_iso TEXT NOT NULL,
  request_start_epoch INTEGER NOT NULL,
  time_to_first_token INTEGER NOT NULL,
  time_between_tokens INTEGER,
  total_duration INTEGER NOT NULL,
  queue_time INTEGER,
  
  -- Cost metrics
  currency TEXT,
  amount INTEGER,
  rate_input_per1k REAL,
  rate_output_per1k REAL,
  
  -- Quality metrics
  finish_reason TEXT NOT NULL,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  was_cached BOOLEAN DEFAULT FALSE,
  response_id TEXT,
  
  -- Session context
  phase TEXT,
  iit_phi REAL,
  attention_target TEXT,
  session_duration_ms INTEGER,
  
  -- Metadata
  metadata_json TEXT,
  
  -- System
  recorded_at_iso TEXT NOT NULL,
  recorded_at_epoch INTEGER NOT NULL
);

-- Sessions: Aggregated session data
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  start_time_iso TEXT NOT NULL,
  start_epoch INTEGER NOT NULL,
  end_time_iso TEXT,
  end_epoch INTEGER,
  duration_ms INTEGER,
  
  -- Aggregated counts
  total_invocations INTEGER DEFAULT 0,
  total_prompt_tokens INTEGER DEFAULT 0,
  total_completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_amount INTEGER,
  total_cost_currency TEXT,
  
  -- Quality summary
  error_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0
);

-- Phase transitions within sessions
CREATE TABLE IF NOT EXISTS session_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  entered_at_iso TEXT NOT NULL,
  entered_at_epoch INTEGER NOT NULL,
  duration_ms INTEGER,
  invocations_in_phase INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  UNIQUE(session_id, phase)
);

-- Provider registry
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  first_seen_iso TEXT NOT NULL,
  first_seen_epoch INTEGER NOT NULL,
  total_invocations INTEGER DEFAULT 0
);

-- Model registry
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  first_seen_iso TEXT NOT NULL,
  first_seen_epoch INTEGER NOT NULL,
  total_invocations INTEGER DEFAULT 0,
  
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_invocations_session ON invocations(session_id);
CREATE INDEX IF NOT EXISTS idx_invocations_provider ON invocations(provider);
CREATE INDEX IF NOT EXISTS idx_invocations_model ON invocations(model);
CREATE INDEX IF NOT EXISTS idx_invocations_time ON invocations(recorded_at_epoch);
CREATE INDEX IF NOT EXISTS idx_invocations_session_time ON invocations(session_id, recorded_at_epoch);
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SQLITE STORAGE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export class SQLiteStorage implements StorageBackend {
  private db: any;
  private initialized: boolean = false;
  private dbPath: string;

  constructor(dbPath: string = 'telemetry.db') {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      this.db.exec(SCHEMA, (err) => {
        if (err) {
          reject(new StorageError('Failed to initialize database schema', err));
        } else {
          this.initialized = true;
          resolve();
        }
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // WRITE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async storeInvocation(invocation: LLMInvocation): Promise<void> {
    const sql = `
      INSERT INTO invocations (
        id, provider, model, session_id,
        prompt_tokens, completion_tokens, total_tokens, context_window, utilization_percent,
        request_start_iso, request_start_epoch, time_to_first_token, time_between_tokens,
        total_duration, queue_time,
        currency, amount, rate_input_per1k, rate_output_per1k,
        finish_reason, error, retry_count, was_cached, response_id,
        phase, iit_phi, attention_target, session_duration_ms,
        metadata_json,
        recorded_at_iso, recorded_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      invocation.id,
      invocation.provider,
      invocation.model,
      invocation.sessionId,
      
      // Tokens
      invocation.tokens.prompt,
      invocation.tokens.completion,
      invocation.tokens.total,
      invocation.tokens.contextWindow ?? null,
      invocation.tokens.utilizationPercent ?? null,
      
      // Timing
      invocation.timing.requestStart.iso,
      invocation.timing.requestStart.epoch,
      invocation.timing.timeToFirstToken,
      invocation.timing.timeBetweenTokens ?? null,
      invocation.timing.totalDuration,
      invocation.timing.queueTime ?? null,
      
      // Cost
      invocation.cost?.currency ?? null,
      invocation.cost?.amount ?? null,
      invocation.cost?.rateInputPer1k ?? null,
      invocation.cost?.rateOutputPer1k ?? null,
      
      // Quality
      invocation.quality.finishReason,
      invocation.quality.error ?? null,
      invocation.quality.retryCount,
      invocation.quality.wasCached ?? false,
      invocation.quality.responseId ?? null,
      
      // Session context
      invocation.sessionContext?.phase ?? null,
      invocation.sessionContext?.iitPhi ?? null,
      invocation.sessionContext?.attentionTarget ?? null,
      invocation.sessionContext?.sessionDurationMs ?? null,
      
      // Metadata
      invocation.metadata ? JSON.stringify(invocation.metadata) : null,
      
      // System
      invocation.recordedAt.iso,
      invocation.recordedAt.epoch
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new StorageError(`Failed to store invocation: ${err.message}`, err));
        } else {
          resolve();
        }
      });
    });
  }

  async storeSession(session: SessionMetrics): Promise<void> {
    // Upsert session record
    const sql = `
      INSERT INTO sessions (
        id, start_time_iso, start_epoch, end_time_iso, end_epoch, duration_ms,
        total_invocations,
        total_prompt_tokens, total_completion_tokens, total_tokens,
        total_cost_amount, total_cost_currency,
        error_count, retry_count, cache_hits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        end_time_iso = excluded.end_time_iso,
        end_epoch = excluded.end_epoch,
        duration_ms = excluded.duration_ms,
        total_invocations = excluded.total_invocations,
        total_prompt_tokens = excluded.total_prompt_tokens,
        total_completion_tokens = excluded.total_completion_tokens,
        total_tokens = excluded.total_tokens,
        total_cost_amount = excluded.total_cost_amount,
        total_cost_currency = excluded.total_cost_currency,
        error_count = excluded.error_count,
        retry_count = excluded.retry_count,
        cache_hits = excluded.cache_hits
    `;

    const params = [
      session.sessionId,
      session.startTime.iso,
      session.startTime.epoch,
      session.endTime?.iso ?? null,
      session.endTime?.epoch ?? null,
      session.durationMs ?? null,
      session.totalInvocations,
      session.totalTokens.prompt,
      session.totalTokens.completion,
      session.totalTokens.total,
      session.totalCost?.amount ?? null,
      session.totalCost?.currency ?? null,
      session.errors,
      session.retries,
      session.cacheHits
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(new StorageError(`Failed to store session: ${err.message}`, err));
        } else {
          resolve();
        }
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // READ OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getInvocation(id: InvocationId): Promise<LLMInvocation | null> {
    const sql = `SELECT * FROM invocations WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(new StorageError(`Failed to get invocation: ${err.message}`, err));
        } else if (!row) {
          resolve(null);
        } else {
          resolve(this.rowToInvocation(row));
        }
      });
    });
  }

  async getSessionMetrics(sessionId: SessionId): Promise<SessionMetrics | null> {
    // Get base session data
    const sessionSql = `SELECT * FROM sessions WHERE id = ?`;
    
    const session: any = await new Promise((resolve, reject) => {
      this.db.get(sessionSql, [sessionId], (err, row) => {
        if (err) reject(new StorageError(`Failed to get session: ${err.message}`, err));
        else resolve(row);
      });
    });

    if (!session) return null;

    // Get provider breakdown
    const providerSql = `
      SELECT 
        provider,
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        AVG(total_duration) as avg_latency,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors
      FROM invocations
      WHERE session_id = ?
      GROUP BY provider
    `;

    const providers: ProviderMetrics[] = await new Promise((resolve, reject) => {
      this.db.all(providerSql, [sessionId], (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get provider metrics: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            provider: row.provider,
            invocations: row.invocations,
            tokens: {
              prompt: row.prompt,
              completion: row.completion,
              total: row.total
            },
            avgLatencyMs: Math.round(row.avg_latency),
            errors: row.errors
          })));
        }
      });
    });

    // Get model breakdown
    const modelSql = `
      SELECT 
        model,
        provider,
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        AVG(total_duration) as avg_latency
      FROM invocations
      WHERE session_id = ?
      GROUP BY model, provider
    `;

    const models: ModelMetrics[] = await new Promise((resolve, reject) => {
      this.db.all(modelSql, [sessionId], (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get model metrics: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            model: row.model,
            provider: row.provider,
            invocations: row.invocations,
            tokens: {
              prompt: row.prompt,
              completion: row.completion,
              total: row.total
            },
            avgLatencyMs: Math.round(row.avg_latency)
          })));
        }
      });
    });

    // Get phase metrics
    const phaseSql = `SELECT * FROM session_phases WHERE session_id = ?`;
    const phases: PhaseMetrics[] = await new Promise((resolve, reject) => {
      this.db.all(phaseSql, [sessionId], (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get phase metrics: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            phase: row.phase,
            enteredAt: { iso: row.entered_at_iso, epoch: row.entered_at_epoch },
            durationMs: row.duration_ms,
            invocations: row.invocations_in_phase,
            tokens: {
              prompt: row.prompt_tokens,
              completion: row.completion_tokens,
              total: row.prompt_tokens + row.completion_tokens
            }
          })));
        }
      });
    });

    return {
      sessionId: session.id,
      startTime: { iso: session.start_time_iso, epoch: session.start_epoch },
      endTime: session.end_time_iso ? { iso: session.end_time_iso, epoch: session.end_epoch } : undefined,
      durationMs: session.duration_ms,
      totalInvocations: session.total_invocations,
      totalTokens: {
        prompt: session.total_prompt_tokens,
        completion: session.total_completion_tokens,
        total: session.total_tokens
      },
      totalCost: session.total_cost_amount ? {
        amount: session.total_cost_amount,
        currency: session.total_cost_currency
      } : undefined,
      providers: new Map(providers.map(p => [p.provider, p])),
      models: new Map(models.map(m => [m.model, m])),
      phases,
      errors: session.error_count,
      retries: session.retry_count,
      cacheHits: session.cache_hits
    };
  }

  async queryTimeRange(query: TimeRangeQuery): Promise<AggregatedMetrics> {
    // Base query with filters
    const conditions: string[] = [
      'recorded_at_epoch >= ?',
      'recorded_at_epoch <= ?'
    ];
    const params: any[] = [query.start.epoch, query.end.epoch];

    if (query.filters?.providers?.length) {
      conditions.push(`provider IN (${query.filters.providers.map(() => '?').join(',')})`);
      params.push(...query.filters.providers);
    }

    if (query.filters?.models?.length) {
      conditions.push(`model IN (${query.filters.models.map(() => '?').join(',')})`);
      params.push(...query.filters.models);
    }

    if (query.filters?.phases?.length) {
      conditions.push(`phase IN (${query.filters.phases.map(() => '?').join(',')})`);
      params.push(...query.filters.phases);
    }

    const whereClause = conditions.join(' AND ');

    // Get total aggregations
    const totalSql = `
      SELECT 
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        SUM(amount) as cost,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
        AVG(total_duration) as avg_latency
      FROM invocations
      WHERE ${whereClause}
    `;

    const totals: any = await new Promise((resolve, reject) => {
      this.db.get(totalSql, params, (err, row) => {
        if (err) reject(new StorageError(`Failed to aggregate: ${err.message}`, err));
        else resolve(row);
      });
    });

    // Get time buckets
    const timeBuckets: TimeBucket[] = await this.getTimeBuckets(query, whereClause, params);

    // Get provider breakdown
    const providerSql = `
      SELECT 
        provider,
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        SUM(amount) as cost,
        AVG(total_duration) as avg_latency,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors
      FROM invocations
      WHERE ${whereClause}
      GROUP BY provider
    `;

    const providers: ProviderMetrics[] = await new Promise((resolve, reject) => {
      this.db.all(providerSql, params, (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get providers: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            provider: row.provider,
            invocations: row.invocations,
            tokens: {
              prompt: row.prompt,
              completion: row.completion,
              total: row.total
            },
            cost: row.cost ? { amount: row.cost, currency: 'USD' } : undefined,
            avgLatencyMs: Math.round(row.avg_latency),
            errors: row.errors
          })));
        }
      });
    });

    // Get model breakdown
    const modelSql = `
      SELECT 
        model,
        provider,
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        SUM(amount) as cost,
        AVG(total_duration) as avg_latency
      FROM invocations
      WHERE ${whereClause}
      GROUP BY model, provider
    `;

    const models: ModelMetrics[] = await new Promise((resolve, reject) => {
      this.db.all(modelSql, params, (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get models: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            model: row.model,
            provider: row.provider,
            invocations: row.invocations,
            tokens: {
              prompt: row.prompt,
              completion: row.completion,
              total: row.total
            },
            cost: row.cost ? { amount: row.cost, currency: 'USD' } : undefined,
            avgLatencyMs: Math.round(row.avg_latency)
          })));
        }
      });
    });

    return {
      query,
      totalInvocations: totals.invocations,
      totalTokens: {
        prompt: totals.prompt || 0,
        completion: totals.completion || 0,
        total: totals.total || 0
      },
      totalCost: totals.cost ? { amount: totals.cost, currency: 'USD' } : undefined,
      byTime: timeBuckets,
      byProvider: providers,
      byModel: models,
      errorRate: totals.invocations > 0 ? totals.errors / totals.invocations : 0,
      avgLatencyMs: Math.round(totals.avg_latency || 0)
    };
  }

  private async getTimeBuckets(
    query: TimeRangeQuery,
    whereClause: string,
    params: any[]
  ): Promise<TimeBucket[]> {
    // Determine bucket size
    const duration = query.end.epoch - query.start.epoch;
    let bucketFn: string;
    
    switch (query.granularity) {
      case 'hour':
        bucketFn = "strftime('%Y-%m-%dT%H:00:00', recorded_at_iso)";
        break;
      case 'week':
        bucketFn = "strftime('%Y-W%W', recorded_at_iso)";
        break;
      case 'month':
        bucketFn = "strftime('%Y-%m', recorded_at_iso)";
        break;
      case 'day':
      default:
        bucketFn = "strftime('%Y-%m-%d', recorded_at_iso)";
    }

    const sql = `
      SELECT 
        ${bucketFn} as bucket,
        COUNT(*) as invocations,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion,
        SUM(total_tokens) as total,
        SUM(amount) as cost
      FROM invocations
      WHERE ${whereClause}
      GROUP BY bucket
      ORDER BY bucket
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get time buckets: ${err.message}`, err));
        else {
          resolve(rows.map(row => ({
            timestamp: { iso: row.bucket, epoch: Date.parse(row.bucket) },
            invocations: row.invocations,
            tokens: {
              prompt: row.prompt || 0,
              completion: row.completion || 0,
              total: row.total || 0
            },
            cost: row.cost ? { amount: row.cost, currency: 'USD' } : undefined
          })));
        }
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═════════════════════════════════════════════════════════════════════════════

  async getProviders(): Promise<ProviderId[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT DISTINCT provider FROM invocations ORDER BY provider', [], (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get providers: ${err.message}`, err));
        else resolve(rows.map(r => r.provider));
      });
    });
  }

  async getModels(provider?: ProviderId): Promise<ModelId[]> {
    let sql = 'SELECT DISTINCT model FROM invocations';
    const params: any[] = [];

    if (provider) {
      sql += ' WHERE provider = ?';
      params.push(provider);
    }

    sql += ' ORDER BY model';

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) reject(new StorageError(`Failed to get models: ${err.message}`, err));
        else resolve(rows.map(r => r.model));
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═════════════════════════════════════════════════════════════════════════════

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(new StorageError(`Failed to close database: ${err.message}`, err));
        else resolve();
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════════════════

  private rowToInvocation(row: any): LLMInvocation {
    return {
      id: row.id,
      provider: row.provider,
      model: row.model,
      sessionId: row.session_id,
      
      tokens: {
        prompt: row.prompt_tokens,
        completion: row.completion_tokens,
        total: row.total_tokens,
        contextWindow: row.context_window,
        utilizationPercent: row.utilization_percent
      },
      
      timing: {
        requestStart: { iso: row.request_start_iso, epoch: row.request_start_epoch },
        timeToFirstToken: row.time_to_first_token,
        timeBetweenTokens: row.time_between_tokens,
        totalDuration: row.total_duration,
        queueTime: row.queue_time
      },
      
      cost: row.amount ? {
        amount: row.amount,
        currency: row.currency,
        rateInputPer1k: row.rate_input_per1k,
        rateOutputPer1k: row.rate_output_per1k
      } : undefined,
      
      quality: {
        finishReason: row.finish_reason,
        error: row.error,
        retryCount: row.retry_count,
        wasCached: row.was_cached,
        responseId: row.response_id
      },
      
      sessionContext: row.phase ? {
        phase: row.phase,
        iitPhi: row.iit_phi,
        attentionTarget: row.attention_target,
        sessionDurationMs: row.session_duration_ms
      } : undefined,
      
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
      
      recordedAt: { iso: row.recorded_at_iso, epoch: row.recorded_at_epoch }
    };
  }
}

export default SQLiteStorage;
