/**
 * OpenTelemetry Integration for Telemetry Substrate
 * Phase 2: OTel-native observability with session context preservation
 * Uses internal stubs (no external dependencies required)
 */

import {
  Span, Tracer, TraceProvider,
  Meter, MeterProvider, MetricReader,
  Resource, SimpleSpan, SimpleCounter, SimpleHistogram, SimpleObservableGauge, SimpleResource,
  SpanOptions, SpanStatus, SpanStatusCode, SpanKind, SpanEvent,
} from './otel-stubs';

// ═══════════════════════════════════════════════════════════════════════════════
// OPENTELEMETRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface OTLConfig {
  // Service identity (following Semantic Conventions)
  serviceName: string;
  serviceVersion: string;
  serviceInstanceId: string; // Maps to session ID
  
  // Export configuration
  traceExporter: 'console' | 'noop' | 'custom';
  metricExporter: 'console' | 'noop' | 'custom';
  
  // Sampling configuration
  traceSampler: 'always-on' | 'always-off' | 'ratio' | 'parent-based';
  traceRatio: number; // 0.0 to 1.0
  
  // Batching configuration
  traceBatchSize: number;
  traceExportTimeoutMs: number;
  traceScheduledDelayMs: number;
  
  metricExportIntervalMs: number;
  metricExportTimeoutMs: number;
}

export interface OTLSessionContext {
  sessionId: string;
  phase: string;
  iitPhi: number;
  attentionTarget?: string;
  sessionDurationMs?: number;
  observationCount?: number;
  artifactCount?: number;
}

export const defaultOTLConfig: OTLConfig = {
  serviceName: 'bootstrap-v15',
  serviceVersion: '0.1.0',
  serviceInstanceId: 'unknown-session',
  traceExporter: 'noop',
  metricExporter: 'noop',
  traceSampler: 'always-on',
  traceRatio: 1.0, // Sample all during development
  traceBatchSize: 512,
  traceExportTimeoutMs: 30000,
  traceScheduledDelayMs: 5000,
  metricExportIntervalMs: 60000,
  metricExportTimeoutMs: 30000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE ATTRIBUTES (Semantic Conventions)
// ═══════════════════════════════════════════════════════════════════════════════

export const TelemetrySemanticResourceAttributes = {
  // Service attributes
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_INSTANCE_ID: 'service.instance.id',
  SERVICE_NAMESPACE: 'service.namespace',
  
  // Session attributes
  SESSION_ID: 'session.id',
  SESSION_PHASE: 'session.phase',
  SESSION_IIT_PHI: 'session.iit_phi',
  SESSION_ATTENTION_TARGET: 'session.attention_target',
  SESSION_DURATION_MS: 'session.duration_ms',
  SESSION_OBSERVATION_COUNT: 'session.observation_count',
  SESSION_ARTIFACT_COUNT: 'session.artifact_count',
  
  // Host attributes
  HOST_NAME: 'host.name',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TRACE PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

class SimpleTraceProvider implements TraceProvider {
  private tracers: Map<string, Tracer> = new Map();
  private spans: Span[] = [];
  private resource: Resource;
  private sampler: any;
  
  constructor(config: OTLConfig) {
    this.resource = new SimpleResource({
      [TelemetrySemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [TelemetrySemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [TelemetrySemanticResourceAttributes.SERVICE_INSTANCE_ID]: config.serviceInstanceId,
    });
    this.sampler = this.buildSampler(config);
  }
  
  getTracer(name: string, _version?: string): Tracer {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, new SimpleTracer(this));
    }
    return this.tracers.get(name)!;
  }
  
  register(): void {
    // In real OTel, this would register globally
    // For our stub: nothing to do
  }
  
  async shutdown(): Promise<void> {
    // Flush any remaining spans
    this.spans = this.spans.filter(s => s.endTime);
  }
  
  async forceFlush(): Promise<void> {
    // Process all ended spans
    this.spans.forEach(span => {
      if (span.endTime) {
        this.exportSpan(span);
      }
    });
  }
  
  trackSpan(span: Span): void {
    this.spans.push(span);
  }
  
  private exportSpan(span: Span): void {
    // Stub: would export via OTLP/HTTP/gRPC
    // For now, just log if console exporter
    console.log(`[OTEL] Span: ${span.name} (${span.spanId}) duration=${
      span.endTime && span.startTime 
        ? span.endTime.getTime() - span.startTime.getTime() 
        : 'N/A'
    }ms`);
  }
  
  private buildSampler(config: OTLConfig): (name: string) => boolean {
    const { traceSampler, traceRatio } = config;
    return (name: string) => {
      switch (traceSampler) {
        case 'always-on': return true;
        case 'always-off': return false;
        case 'ratio': return Math.random() < traceRatio;
        case 'parent-based':
        default: return true;
      }
    };
  }
}

class SimpleTracer implements Tracer {
  constructor(private provider: SimpleTraceProvider) {}
  
  startSpan(name: string, options?: SpanOptions): Span {
    const span = new SimpleSpan(name, options);
    this.provider.trackSpan(span);
    return span;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM METER PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

class SimpleMeterProvider implements MeterProvider {
  private meters: Map<string, Meter> = new Map();
  
  getMeter(name: string, _version?: string): Meter {
    if (!this.meters.has(name)) {
      this.meters.set(name, new SimpleMeter());
    }
    return this.meters.get(name)!;
  }
  
  async forceFlush(): Promise<void> {
    // Flush all meters
    this.meters.forEach(meter => {
      if ('flush' in meter) {
        (meter as any).flush?.();
      }
    });
  }
  
  async shutdown(): Promise<void> {
    await this.forceFlush();
    this.meters.clear();
  }
}

class SimpleMeter implements Meter {
  private counters: Map<string, SimpleCounter> = new Map();
  private histograms: Map<string, SimpleHistogram> = new Map();
  private gauges: Map<string, SimpleObservableGauge> = new Map();
  
  createCounter(name: string, _options?: any): SimpleCounter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new SimpleCounter());
    }
    return this.counters.get(name)!;
  }
  
  createHistogram(name: string, _options?: any): SimpleHistogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new SimpleHistogram());
    }
    return this.histograms.get(name)!;
  }
  
  createObservableGauge(name: string, _options?: any): SimpleObservableGauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new SimpleObservableGauge());
    }
    return this.gauges.get(name)!;
  }
  
  flush(): void {
    // Export counters, histograms, gauges
    console.log('[OTEL] Flushed metrics');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OTEL SDK PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export class TelemetrySDKProvider {
  readonly traceProvider: TraceProvider;
  readonly meterProvider: MeterProvider;
  private readonly config: OTLConfig;
  private sessionContext?: OTLSessionContext;
  
  constructor(config: Partial<OTLConfig> = {}) {
    this.config = { ...defaultOTLConfig, ...config };
    
    // Initialize providers
    this.traceProvider = new SimpleTraceProvider(this.config);
    this.meterProvider = new SimpleMeterProvider();
    
    // Register globally
    this.traceProvider.register();
  }
  
  /**
   * Get current session context
   */
  getSessionContext(): OTLSessionContext | undefined {
    return this.sessionContext;
  }
  
  /**
   * Set current session context for all future spans
   */
  setSessionContext(context: OTLSessionContext): void {
    this.sessionContext = context;
  }
  
  /**
   * Get or create a session-scoped tracer
   */
  getTracer(name: string = 'telemetry-substrate', version?: string) {
    return this.traceProvider.getTracer(name, version);
  }
  
  /**
   * Get or create a session-scoped meter
   */
  getMeter(name: string = 'telemetry-substrate', version?: string) {
    return this.meterProvider.getMeter(name, version);
  }
  
  /**
   * Flush all pending telemetry
   */
  async flush(): Promise<void> {
    await this.traceProvider.forceFlush();
    await this.meterProvider.forceFlush();
  }
  
  /**
   * Shutdown telemetry providers
   */
  async shutdown(): Promise<void> {
    await this.traceProvider.shutdown();
    await this.meterProvider.shutdown();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION BRIDGE (Session Clock Integration)
// ═══════════════════════════════════════════════════════════════════════════════

export class OTELSessionBridge {
  private activePhaseSpan?: Span;
  private sessionSpan?: Span;
  
  constructor(
    private sdk: TelemetrySDKProvider,
    private sessionConfig: {
      sessionId: string;
      startTime: Date;
    }
  ) {}
  
  /**
   * Called at session start
   */
  startSession(): void {
    const tracer = this.sdk.getTracer();
    
    this.sessionSpan = tracer.startSpan('session', {
      attributes: {
        [TelemetrySemanticResourceAttributes.SESSION_ID]: this.sessionConfig.sessionId,
        'session.start_time': this.sessionConfig.startTime.toISOString(),
      },
    });
  }
  
  /**
   * Called on phase transition
   */
  transitionPhase(from: string, to: string): void {
    // End previous phase span if exists
    if (this.activePhaseSpan) {
      this.activePhaseSpan.addEvent('phase.exit', {
        'phase.from': from,
        'phase.to': to,
        'phase.timestamp': Date.now(),
      });
      this.activePhaseSpan.end();
    }
    
    // Start new phase span
    const tracer = this.sdk.getTracer();
    const parent = this.sessionSpan ? { spanId: this.sessionSpan.spanId, traceId: this.sessionSpan.traceId } : undefined;
    if (parent) {
      this.activePhaseSpan = tracer.startSpan(`phase.${to}`, {
        parent: parent as any,  // Cast for stub compatibility
        attributes: {
          [TelemetrySemanticResourceAttributes.SESSION_PHASE]: to,
          'phase.previous': from,
          'phase.transition_time': new Date().toISOString(),
        },
      });
    } else {
      this.activePhaseSpan = tracer.startSpan(`phase.${to}`, {
        attributes: {
          [TelemetrySemanticResourceAttributes.SESSION_PHASE]: to,
          'phase.previous': from,
          'phase.transition_time': new Date().toISOString(),
        },
      });
    }
    
    // Update SDK context
    const currentContext = this.sdk.getSessionContext?.() || {} as OTLSessionContext;
    this.sdk.setSessionContext({
      ...currentContext,
      phase: to,
    });
  }
  
  /**
   * Called when IIT Φ is measured
   */
  recordIIT(phi: number): void {
    this.activePhaseSpan?.setAttribute(
      TelemetrySemanticResourceAttributes.SESSION_IIT_PHI,
      phi
    );
    this.activePhaseSpan?.addEvent('iit.measurement', {
      'iit.phi': phi,
      'iit.timestamp': Date.now(),
    });
    
    // Update SDK context
    const currentContext = this.sdk.getSessionContext?.() || {} as OTLSessionContext;
    this.sdk.setSessionContext({
      ...currentContext,
      iitPhi: phi,
    });
  }
  
  /**
   * Called on attention capture
   */
  recordAttention(target: string, quality: string, intensity: number): void {
    this.activePhaseSpan?.setAttribute(
      TelemetrySemanticResourceAttributes.SESSION_ATTENTION_TARGET,
      target
    );
    this.activePhaseSpan?.addEvent('attention.capture', {
      'attention.target': target,
      'attention.quality': quality,
      'attention.intensity': intensity,
      'attention.timestamp': Date.now(),
    });
    
    // Update SDK context
    const currentContext = this.sdk.getSessionContext?.() || {} as OTLSessionContext;
    this.sdk.setSessionContext({
      ...currentContext,
      attentionTarget: target,
    });
  }
  
  /**
   * Called at session end
   */
  endSession(metadata: {
    durationMs: number;
    totalObservations: number;
    artifactsCreated: number;
    finalPhase: string;
  }): void {
    // End phase span
    if (this.activePhaseSpan) {
      this.activePhaseSpan.end();
    }
    
    // Set final attributes on session span
    this.sessionSpan?.setAttributes({
      [TelemetrySemanticResourceAttributes.SESSION_DURATION_MS]: metadata.durationMs,
      [TelemetrySemanticResourceAttributes.SESSION_OBSERVATION_COUNT]: metadata.totalObservations,
      [TelemetrySemanticResourceAttributes.SESSION_ARTIFACT_COUNT]: metadata.artifactsCreated,
      'session.final_phase': metadata.finalPhase,
      'session.end_time': new Date().toISOString(),
    });
    
    this.sessionSpan?.end();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export class OTELMetricsPipeline {
  private meter: Meter;
  private instruments: Map<string, any> = new Map();
  private sessionMetrics: { tokens: number; cost: number; duration: number } = {
    tokens: 0,
    cost: 0,
    duration: 0,
  };
  
  constructor(sdk: TelemetrySDKProvider) {
    this.meter = sdk.getMeter();
    this.initializeInstruments();
  }
  
  private initializeInstruments(): void {
    // Session-level counters
    this.instruments.set('session_tokens', this.meter.createCounter('llm_session_tokens_total', {
      description: 'Total tokens consumed in session',
    }));
    
    this.instruments.set('session_cost', this.meter.createCounter('llm_session_cost_total', {
      description: 'Total cost in cents per session',
    }));
    
    this.instruments.set('session_artifacts', this.meter.createCounter('llm_session_artifacts_total', {
      description: 'Number of artifacts created',
    }));
    
    // Session-level histograms
    this.instruments.set('session_duration', this.meter.createHistogram('llm_session_duration_ms', {
      description: 'Session duration in milliseconds',
    }));
    
    this.instruments.set('iit_phi', this.meter.createHistogram('iit_phi_value', {
      description: 'Integrated Information Theory Φ measurement',
    }));
    
    // Invocation-level histograms
    this.instruments.set('invocation_latency', this.meter.createHistogram('llm_invocation_latency_ms', {
      description: 'LLM API call latency',
    }));
    
    this.instruments.set('invocation_tokens', this.meter.createHistogram('llm_invocation_tokens', {
      description: 'Tokens per invocation',
    }));
    
    // Error counter
    this.instruments.set('errors', this.meter.createCounter('llm_errors_total', {
      description: 'Total errors encountered',
    }));
    
    // Gauge for current phase
    this.instruments.set('current_phase', this.meter.createObservableGauge('llm_session_current_phase', {
      description: 'Current session phase (0-4)',
    }));
  }
  
  recordSession(metrics: {
    tokens: number;
    cost?: number;
    durationMs: number;
    artifactCount: number;
    attributes?: Record<string, string | number>;
  }): void {
    const attrs = metrics.attributes || {};
    
    this.instruments.get('session_tokens')?.add(metrics.tokens, attrs);
    
    if (metrics.cost !== undefined) {
      this.instruments.get('session_cost')?.add(metrics.cost, attrs);
    }
    
    this.instruments.get('session_artifacts')?.add(metrics.artifactCount, attrs);
    this.instruments.get('session_duration')?.record(metrics.durationMs, attrs);
  }
  
  recordIIT(phi: number, attributes?: Record<string, string | number>): void {
    this.instruments.get('iit_phi')?.record(phi, attributes || {});
  }
  
  recordInvocation(metrics: {
    latencyMs: number;
    tokens: number;
    provider: string;
    model: string;
    phase: string;
    error?: string;
  }): void {
    const baseAttrs = {
      'llm.provider': metrics.provider,
      'llm.model': metrics.model,
      'session.phase': metrics.phase,
    };
    
    this.instruments.get('invocation_latency')?.record(metrics.latencyMs, baseAttrs);
    this.instruments.get('invocation_tokens')?.record(metrics.tokens, baseAttrs);
    
    if (metrics.error) {
      this.instruments.get('errors')?.add(1, {
        ...baseAttrs,
        'error.type': metrics.error,
      });
    }
    
    // Accumulate for session totals
    this.sessionMetrics.tokens += metrics.tokens;
    this.sessionMetrics.duration += metrics.latencyMs;
  }
  
  recordPhase(phase: number): void {
    // Phase as Observable Gauge callback
    const gauge = this.instruments.get('current_phase');
    if (gauge) {
      gauge.addCallback((observableResult: { observe: (value: number, attrs: any) => void }) => {
        observableResult.observe(phase, {});
      });
    }
  }
  
  getSessionMetrics(): { tokens: number; cost: number; duration: number } {
    return { ...this.sessionMetrics };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID STORAGE (SQLite + OpenTelemetry)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bridge between SQLite local storage and OpenTelemetry export
 * Provides resilience: data is always in SQLite, optionally exported
 */
export class HybridStorage {
  private queryCounter: number = 0;
  
  constructor(
    private sqliteStorage: any, // SQLiteStorage from Phase 1
    private sdk: TelemetrySDKProvider,
    private bridge: OTELSessionBridge,
    private pipeline: OTELMetricsPipeline
  ) {}
  
  async storeInvocation(invocation: any): Promise<void> {
    // Always store in SQLite first
    await this.sqliteStorage.storeInvocation(invocation);
    
    // Export to OTel
    this.pipeline.recordInvocation({
      latencyMs: invocation.timing.totalDuration,
      tokens: invocation.tokens.total,
      provider: invocation.provider,
      model: invocation.model,
      phase: invocation.sessionContext?.phase || 'unknown',
      error: invocation.quality?.error,
    });
    
    this.queryCounter++;
  }
  
  async storeSession(session: any): Promise<void> {
    // Store in SQLite
    await this.sqliteStorage.storeSession(session);
  }
  
  async finalizeSession(metrics: any): Promise<void> {
    // Store in SQLite
    await this.sqliteStorage.storeSession(metrics);
    
    // Export session metrics
    this.pipeline.recordSession({
      tokens: metrics.totalTokens?.total || 0,
      cost: metrics.totalCost?.amount || 0,
      durationMs: metrics.durationMs || 0,
      artifactCount: metrics.artifactCount || 0,
    });
    
    // End OTel session
    this.bridge.endSession({
      durationMs: metrics.durationMs || 0,
      totalObservations: metrics.totalInvocations || 0,
      artifactsCreated: metrics.artifactCount || 0,
      finalPhase: metrics.finalPhase || 'unknown',
    });
    
    // Flush
    await this.sdk.flush();
  }
  
  getQueryCount(): number {
    return this.queryCounter;
  }
}

export { SimpleSpan, SimpleCounter, SimpleHistogram, SimpleObservableGauge, SimpleResource };
