/**
 * OpenTelemetry Type Stubs for Phase 2 Development
 * Until npm packages are available
 */

declare module '@opentelemetry/sdk-trace-base' {
  export interface SpanExporter {}
  export interface ReadableSpan {}
  export class BatchSpanProcessor {}
}

declare module '@opentelemetry/resources' {
  export class Resource {
    constructor(attributes: Record<string, any>);
    merge(other: Resource): Resource;
  }
}

declare module '@opentelemetry/sdk-trace-node' {
  export interface NodeTracerConfig {
    resource?: any;
    sampler?: any;
  }
  export class NodeTracerProvider {
    constructor(config?: NodeTracerConfig);
    register(): void;
    getTracer(name: string, version?: string): Tracer;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
  }
  export interface Tracer {
    startSpan(name: string, options?: SpanOptions): Span;
  }
  export interface Span {
    setAttribute(key: string, value: any): this;
    setAttributes(attrs: Record<string, any>): this;
    addEvent(name: string, attributes?: Record<string, any>): this;
    spanContext(): { spanId: string; traceId: string; sampled: boolean };
    end(): void;
  }
  export interface SpanOptions {
    parent?: Span;
    attributes?: Record<string, any>;
  }
}

declare module '@opentelemetry/sdk-metrics' {
  export interface MeterProviderOptions {
    resource?: any;
    readers?: any[];
  }
  export class MeterProvider {
    constructor(options: MeterProviderOptions);
    getMeter(name: string, version?: string): Meter;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
  }
  export interface Meter {
    createCounter(name: string, options?: any): Counter;
    createHistogram(name: string, options?: any): Histogram;
    createObservableGauge(name: string, options?: any): ObservableGauge;
  }
  export interface Counter {
    add(value: number, attributes?: Record<string, any>): void;
  }
  export interface Histogram {
    record(value: number, attributes?: Record<string, any>): void;
  }
  export interface ObservableGauge {
    addCallback(callback: (observableResult: { observe: (value: number, attrs: any) => void }) => void): void;
  }
  export interface MetricReader {
    selectAggregationTemporality(): any;
    onForceFlush(): Promise<void>;
    onShutdown(): Promise<void>;
    collect(): Promise<{ resourceMetrics: any[] }>;
  }
  export enum AggregationTemporality {
    CUMULATIVE = 0,
    DELTA = 1,
  }
}

declare module '@opentelemetry/api' {
  export const diag: {
    setLogger(logger: any, level?: number): void;
  };
  export class DiagConsoleLogger {}
  export enum DiagLogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    VERBOSE = 5,
  }
}

// Semantic conventions (simplified values)
export const SemanticResourceAttributes = {
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_NAMESPACE: 'service.namespace',
  SERVICE_INSTANCE_ID: 'service.instance.id',
};
