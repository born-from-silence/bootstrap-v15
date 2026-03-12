# Phase 2: OpenTelemetry Integration

## Overview
Extend the Telemetry Substrate with OpenTelemetry standards for modern observability. This enables export to any OpenTelemetry-compatible collector (Jaeger, Zipkin, Prometheus, DataDog, Honeycomb, etc.)

## Design Principles

1. **OTel Native**: Use OpenTelemetry SDK primitives for spans, metrics, and baggage
2. **Vendor Neutral**: Single export layer supports 20+ backends
3. **Hybrid Mode**: Keep local SQLite + export to OTel collector for redundancy
4. **Session Context**: Every span carries Session Clock phase, IIT Φ, and attention metadata
5. **Self-Observability**: Track the telemetry system's own overhead

## Architecture

```
                    ┌───────────────────────────────────┐
                    │     OpenTelemetry Exporters       │
                    │  (OTLP/gRPC, Prometheus, etc.)   │
                    └─────────────┬─────────────────────""
                                  │
                    ┌─────────────▼─────────────────────"
                    │    OpenTelemetry SDK             │
                    │  - TracerProvider                │
                    │  - MeterProvider                 │
                    │  - ContextManager               │
                    └─────────────┬─────────────────────"
                                  │
             ┌───────────────────┴───────────────────┐
             │                                    │
    ┌────────▼─────────┐              ┌───────────▼────────┐
    │  TelemetryCore   │              │  SQLiteStorage     │
    │  (Adapter Layer) │              │  (Phase 1 - Local) │
    └────────┬─────────┘              └────────────────────"
             │
    ┌────────▼────────────────────────────────────────┐
    │              Session Integration               │
    │  - Session Clock Phase Transitions             │
    │  - IIT Φ Measurement                           │
    │  - Attention Target Tracking                   │
    └─────────────────────────────────────────────────"
```

## Core Types

```typescript
interface OpenTelemetryConfig {
  // Service identity
  serviceName: string;
  serviceVersion: string;
  instanceId: string; // Session ID
  
  // Export configuration
  exporter: 'otlp-grpc' | 'otlp-http' | 'console' | 'noop';
  endpoint?: string;
  headers?: Record<string, string>;
  
  // Sampling
  traceSampler: 'always-on' | 'always-off' | 'ratio' | 'parent-based';
  sampleRatio: number;
  
  // Batching
  batchSize: number;
  exportTimeoutMs: number;
  scheduledDelayMs: number;
}

interface SessionSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string; // Session phase + attention target
  kind: SpanKind;
  startTime: HrTime;
  endTime?: HrTime;
  attributes: SessionAttributes;
  events: SessionEvent[];
  status: SpanStatus;
}

interface SessionAttributes {
  // Session Context
  'session.id': string;
  'session.phase': Phase;
  'session.iit_phi': number;
  'session.attention_target': string;
  'session.duration_ms': number;
  
  // LLM Invocation
  'llm.provider': string;
  'llm.model': string;
  'llm.tokens.prompt': number;
  'llm.tokens.completion': number;
  'llm.tokens.total': number;
  'llm.cost.amount': number;
  'llm.cost.currency': string;
  
  // Quality
  'llm.finish_reason': string;
  'llm.error_count': number;
  'llm.retry_count': number;
  'llm.was_cached': boolean;
}
```

## Implementation Components

### 1. OTLTelemetryExporter

```typescript
export class OTLTelemetryExporter implements TelemetryExporter {
  private tracerProvider: NodeTracerProvider;
  private meterProvider: MeterProvider;
  
  constructor(config: OpenTelemetryConfig) {
    // Initialize OTel SDK
    this.tracerProvider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
        [SemanticResourceAttributes.INSTANCE_ID]: config.instanceId,
      }),
      sampler: this.createSampler(config),
    });
    
    // Add exporter based on config
    const exporter = this.createExporter(config);
    this.tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(exporter, {
        maxQueueSize: config.batchSize,
        maxExportBatchSize: config.batchSize,
        scheduledDelayMillis: config.scheduledDelayMs,
        exportTimeoutMillis: config.exportTimeoutMs,
      })
    );
    
    // Register globally
    this.tracerProvider.register();
  }
  
  startSessionSpan(sessionConfig: SessionConfig): SessionSpan {
    const span = this.tracerProvider
      .getTracer('telemetry-substrate')
      .startSpan(`session.${sessionConfig.phase}`, {
        attributes: this.buildSessionAttributes(sessionConfig),
      });
    
    return new TelemetrySessionSpan(span, sessionConfig);
  }
  
  endSessionSpan(span: SessionSpan, metadata: SessionEndMetadata): void {
    span.setAttributes({
      'session.duration_ms': metadata.durationMs,
      'session.total_tokens': metadata.totalTokens,
      'session.total_cost': metadata.totalCost,
    });
    span.setStatus(metadata.errorCount > 0 
      ? { code: SpanStatusCode.ERROR }
      : { code: SpanStatusCode.OK }
    );
    span.end();
  }
}
```

### 2. Session Clock Bridge

```typescript
export class SessionClockBridge {
  private currentSpan?: SessionSpan;
  
  constructor(
    private exporter: TelemetryExporter,
    private sessionId: string
  ) {}
  
  onPhaseTransition(from: Phase, to: Phase): void {
    // End previous phase span
    if (this.currentSpan) {
      this.currentSpan.addEvent('phase.exit', {
        'phase.from': from,
        'phase.to': to,
        'phase.timestamp': Date.now(),
      });
      this.currentSpan.end();
    }
    
    // Start new phase span as child
    this.currentSpan = this.exporter.startSessionSpan({
      name: `phase.${to}`,
      phase: to,
      sessionId: this.sessionId,
      parentSpanId: this.currentSpan?.spanId,
    });
  }
  
  onIITMeasurement(phi: number): void {
    this.currentSpan?.setAttribute('session.iit_phi', phi);
    this.currentSpan?.addEvent('iit.measurement', {
      'iit.phi': phi,
      'iit.timestamp': Date.now(),
    });
  }
  
  onAttentionCapture(target: string, quality: AttentionQuality): void {
    this.currentSpan?.setAttribute('session.attention_target', target);
    this.currentSpan?.addEvent('attention.capture', {
      'attention.target': target,
      'attention.quality': quality,
      'attention.timestamp': Date.now(),
    });
  }
}
```

### 3. Metrics Pipeline

```typescript
export class TelemetryMetricsPipeline {
  private meters: Map<string, Meter>;
  
  // Session-level metrics
  private sessionTokensCounter!: Counter;
  private sessionCostCounter!: Counter;
  private sessionDurationHistogram!: Histogram;
  private sessionPhaseGauge!: ObservableGauge;
  
  // Model-level metrics
  private modelLatencyHistogram!: Histogram;
  private modelTokenHistogram!: Histogram;
  private modelErrorCounter!: Counter;
  
  constructor(provider: MeterProvider) {
    const meter = provider.getMeter('telemetry-substrate');
    
    this.sessionTokensCounter = meter.createCounter('llm_session_tokens', {
      description: 'Total tokens per session',
    });
    
    this.sessionCostCounter = meter.createCounter('llm_session_cost', {
      description: 'Total cost per session in cents',
    });
    
    this.sessionDurationHistogram = meter.createHistogram('llm_session_duration', {
      description: 'Session duration in milliseconds',
      unit: 'ms',
    });
    
    this.sessionPhaseGauge = meter.createObservableGauge('llm_session_phase', {
      description: 'Current session phase (0=awakening, 1=calibration, 2=engagement, 3=synthesis, 4=completion)',
    });
  }
  
  recordInvocation(invocation: LLMInvocation): void {
    const attributes = {
      'llm.provider': invocation.provider,
      'llm.model': invocation.model,
      'llm.phase': invocation.sessionContext?.phase ?? 'unknown',
    };
    
    this.sessionTokensCounter.add(invocation.tokens.total, attributes);
    
    if (invocation.cost) {
      // Convert to smallest unit (cents)
      const costCents = Math.round(invocation.cost.amount * 100);
      this.sessionCostCounter.add(costCents, attributes);
    }
    
    this.modelLatencyHistogram.record(invocation.timing.totalDuration, attributes);
    this.modelTokenHistogram.record(invocation.tokens.total, attributes);
    
    if (invocation.quality.error) {
      this.modelErrorCounter.add(1, {
        ...attributes,
        'llm.error': invocation.quality.error,
      });
    }
  }
}
```

### 4. Export Formats

The OTel integration supports multiple export paths:

| Exporter | Protocol | Use Case |
|----------|----------|----------|
| OTLP/gRPC | OpenTelemetry Protocol | Production (Jaeger, Tempo)
| OTLP/HTTP | OpenTelemetry Protocol | Cloud collectors (Honeycomb, Lightstep)
| Prometheus | Prometheus exposition | Metrics (Grafana)
| Console | JSON to stdout | Development, debugging
| Noop | /dev/null | Testing, CI/CD |

## File Structure

```
src/
├── types.ts              # Existing Phase 1 types
├── storage/
│   └── sqlite.ts        # Existing Phase 1 storage
├── export/
│   ├── opentelemetry.ts # OTel SDK wrapper
│   ├── bridges/
│   │   ├── session-clock.ts
│   │   └── iit-plugin.ts
│   └── processors/
│       ├── batch-span.ts
│       └── resource-enricher.ts
├── metrics/
│   ├── pipeline.ts      # OTel metrics setup
│   └── instruments.ts   # Custom metric definitions
└── config.ts            # OTel configuration types
```

## Integration Points

1. **Session Clock**: Automatic span creation on phase transitions
2. **IIT Analysis**: Φ values as span attributes + events
3. **Attention Cartography**: Attention moments as span events
4. **Tool Registry**: Each tool call = child span
5. **Memory System**: Query/retrieval latencies as spans

## Validation Approach

1. Unit tests with InMemorySpanExporter
2. Integration tests against local Jaeger
3. Metrics validation with Prometheus test endpoint
4. Performance benchmarks: export overhead < 1ms per span

## Next Phase

Phase 3: Provider Adapters (Anthropic, Mistral, Ollama)
- Build on OTel foundation for standardized span attributes
- Normalize model-specific quirks into uniform telemetry
