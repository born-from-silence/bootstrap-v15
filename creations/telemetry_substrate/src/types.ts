/**
 * Telemetry Substrate - Core Types
 * Vendor-agnostic LLM usage tracking system
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PRIMITIVE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ProviderId = string;
export type ModelId = string;
export type SessionId = string;
export type InvocationId = string;

export interface Timestamp {
  iso: string;
  epoch: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TokenMetrics {
  /** Tokens in the prompt/context */
  prompt: number;
  /** Tokens in the completion */
  completion: number;
  /** Total tokens used */
  total: number;
  /** Context window size (if known) */
  contextWindow?: number;
  /** Percentage of context window used */
  utilizationPercent?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimingMetrics {
  /** When the request started */
  requestStart: Timestamp;
  /** When first token was received (ms) */
  timeToFirstToken: number;
  /** Average time between tokens (ms, for streaming) */
  timeBetweenTokens?: number;
  /** Total duration from request to completion (ms) */
  totalDuration: number;
  /** Time spent in queue before processing (ms) */
  queueTime?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CostMetrics {
  /** ISO currency code */
  currency: string;
  /** Amount in smallest currency unit (e.g., cents) */
  amount: number;
  /** Computed cost per 1K input tokens */
  rateInputPer1k?: number;
  /** Computed cost per 1K output tokens */
  rateOutputPer1k?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUALITY MARKERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface QualityMetrics {
  /** Why the generation stopped (e.g., "stop", "length", "content_filter") */
  finishReason: string;
  /** Error message if the call failed */
  error?: string;
  /** Number of retries before success */
  retryCount: number;
  /** Whether the response was cached */
  wasCached?: boolean;
  /** Unique identifier for the response (for debugging) */
  responseId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

export interface SessionContext {
  /** Session Clock phase */
  phase?: 'awakening' | 'engagement' | 'synthesis' | 'calibration' | 'completion';
  /** IIT Φ measurement at time of call */
  iitPhi?: number;
  /** Active attention target */
  attentionTarget?: string;
  /** Session duration at time of call (ms) */
  sessionDurationMs?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN INVOCATION RECORD
// ═══════════════════════════════════════════════════════════════════════════════

export interface LLMInvocation {
  /** Unique identifier for this invocation */
  id: InvocationId;
  /** Provider identifier (e.g., "openai", "anthropic", "ollama") */
  provider: ProviderId;
  /** Model identifier (e.g., "gpt-4", "claude-3-opus") */
  model: ModelId;
  /** Session this invocation belongs to */
  sessionId: SessionId;
  
  // Metrics
  tokens: TokenMetrics;
  timing: TimingMetrics;
  cost?: CostMetrics;
  quality: QualityMetrics;
  
  // Context
  sessionContext?: SessionContext;
  
  // Arbitrary metadata for extensibility
  metadata?: Record<string, unknown>;
  
  // When this record was created
  recordedAt: Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGGREGATED METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SessionMetrics {
  sessionId: SessionId;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMs?: number;
  
  // Aggregated counts
  totalInvocations: number;
  totalTokens: TokenMetrics;
  totalCost?: CostMetrics;
  
  // Provider breakdown
  providers: Map<ProviderId, ProviderMetrics>;
  
  // Model breakdown
  models: Map<ModelId, ModelMetrics>;
  
  // Phase transitions
  phases?: PhaseMetrics[];
  
  // Quality summary
  errors: number;
  retries: number;
  cacheHits: number;
}

export interface ProviderMetrics {
  provider: ProviderId;
  invocations: number;
  tokens: TokenMetrics;
  cost?: CostMetrics;
  avgLatencyMs: number;
  errors: number;
}

export interface ModelMetrics {
  model: ModelId;
  provider: ProviderId;
  invocations: number;
  tokens: TokenMetrics;
  cost?: CostMetrics;
  avgLatencyMs: number;
}

export interface PhaseMetrics {
  phase: string;
  enteredAt: Timestamp;
  durationMs: number;
  invocations: number;
  tokens: TokenMetrics;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME-RANGE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimeRangeQuery {
  start: Timestamp;
  end: Timestamp;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  filters?: {
    providers?: ProviderId[];
    models?: ModelId[];
    phases?: string[];
  };
}

export interface AggregatedMetrics {
  query: TimeRangeQuery;
  totalInvocations: number;
  totalTokens: TokenMetrics;
  totalCost?: CostMetrics;
  
  // Time series
  byTime: TimeBucket[];
  
  // Breakdowns
  byProvider: ProviderMetrics[];
  byModel: ModelMetrics[];
  byPhase?: PhaseMetrics[];
  
  // Quality
  errorRate: number;
  avgLatencyMs: number;
}

export interface TimeBucket {
  timestamp: Timestamp;
  invocations: number;
  tokens: TokenMetrics;
  cost?: CostMetrics;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProviderAdapter<T = any> {
  /** Provider identifier */
  readonly providerId: ProviderId;
  
  /** Transform provider-specific response to unified format */
  normalizeResponse(response: T, metadata?: Record<string, unknown>): LLMInvocation;
  
  /** Calculate cost from provider response */
  calculateCost?(response: T, rateCard?: RateCard): CostMetrics;
  
  /** Extract timing from provider response */
  extractTiming(response: T): Partial<TimingMetrics>;
}

export interface RateCard {
  inputPer1k: number;
  outputPer1k: number;
  currency: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface StorageBackend {
  // Write operations
  storeInvocation(invocation: LLMInvocation): Promise<void>;
  storeSession(session: SessionMetrics): Promise<void>;
  
  // Read operations
  getInvocation(id: InvocationId): Promise<LLMInvocation | null>;
  getSessionMetrics(sessionId: SessionId): Promise<SessionMetrics | null>;
  queryTimeRange(query: TimeRangeQuery): Promise<AggregatedMetrics>;
  
  // Utility
  getProviders(): Promise<ProviderId[]>;
  getModels(provider?: ProviderId): Promise<ModelId[]>;
  
  // Lifecycle
  close(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SessionLogger {
  readonly sessionId: SessionId;
  
  // Configuration
  setPhase(phase: SessionContext['phase']): void;
  setIIT(phi: number): void;
  setAttentionTarget(target: string): void;
  
  // Logging
  logInvocation(invocation: LLMInvocation): Promise<LogEntry>;
  
  // Session lifecycle
  finalize(): Promise<SessionMetrics>;
}

export interface LogEntry {
  id: InvocationId;
  stored: boolean;
  latencyMs: number;
}

export interface UsageLogger {
  // Factory
  createSessionLogger(sessionId: SessionId): SessionLogger;
  
  // Global queries
  getSessionMetrics(sessionId: SessionId): Promise<SessionMetrics | null>;
  queryTimeRange(query: TimeRangeQuery): Promise<AggregatedMetrics>;
  
  // Provider adapter registration
  registerAdapter(adapter: ProviderAdapter): void;
  
  // Shutdown
  close(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface TelemetryConfig {
  // Storage
  storage: {
    type: 'sqlite' | 'json' | 'memory';
    path?: string;
  };
  
  // Rate cards for cost calculation
  rateCards?: Map<string, RateCard>;
  
  // Sampling (for high-volume scenarios)
  sampling?: {
    enabled: boolean;
    rate: number;  // 0.0 - 1.0
  };
  
  // Export
  export?: {
    prometheus?: {
      enabled: boolean;
      port: number;
    };
    csv?: {
      enabled: boolean;
      path: string;
    };
  };
  
  // Metadata to capture
  captureMetadata?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export class TelemetryError extends Error {
  constructor(
    message: string,
    public code: string,
    public invocationId?: InvocationId
  ) {
    super(message);
    this.name = 'TelemetryError';
  }
}

export class StorageError extends TelemetryError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class AdapterError extends TelemetryError {
  constructor(
    message: string,
    public providerId: ProviderId,
    public response?: unknown
  ) {
    super(message, 'ADAPTER_ERROR');
    this.name = 'AdapterError';
  }
}
