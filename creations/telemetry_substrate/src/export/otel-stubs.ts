/**
 * Simplified OpenTelemetry Stubs for Phase 2 Development
 * Provides core interfaces without external dependencies
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TRACE TYPES
// ═════════════════════════════════════════════════════════════════========══="

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTime: Date;
  endTime?: Date;
  attributes: Record<string, any>;
  events: SpanEvent[];
  status: SpanStatus;
  
  setAttribute(key: string, value: any): this;
  setAttributes(attrs: Record<string, any>): this;
  addEvent(name: string, attributes?: Record<string, any>): this;
  end(): void;
}

export interface SpanEvent {
  name: string;
  timestamp: Date;
  attributes?: Record<string, any>;
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

export interface SpanOptions {
  parent?: Span;
  attributes?: Record<string, any>;
  kind?: SpanKind;
}

export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span;
}

export interface TraceProvider {
  getTracer(name: string, version?: string): Tracer;
  register(): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Meter {
  createCounter(name: string, options?: MetricOptions): Counter;
  createHistogram(name: string, options?: MetricOptions): Histogram;
  createObservableGauge(name: string, options?: MetricOptions): ObservableGauge;
}

export interface MetricOptions {
  description?: string;
  unit?: string;
  valueType?: ValueType;
}

export enum ValueType {
  INT = 1,
  DOUBLE = 2,
}

export interface Counter {
  add(value: number, attributes?: Record<string, any>): void;
}

export interface Histogram {
  record(value: number, attributes?: Record<string, any>): void;
}

export interface ObservableGauge {
  addCallback(callback: (result: { observe: (value: number, attrs: any) => void }) => void): void;
}

export interface MetricReader {
  collect(): Promise<{ resourceMetrics: any[] }>;
}

export interface MeterProvider {
  getMeter(name: string, version?: string): Meter;
  forceFlush(): Promise<void>;
  shutdown(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Resource {
  attributes: Record<string, any>;
  merge(other: Resource): Resource;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUB IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export class SimpleSpan implements Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind = SpanKind.INTERNAL;
  startTime: Date;
  endTime?: Date;
  attributes: Record<string, any> = {};
  events: SpanEvent[] = [];
  status: SpanStatus = { code: SpanStatusCode.UNSET };
  
  constructor(name: string, options?: SpanOptions) {
    this.name = name;
    this.spanId = this.generateId(16);
    this.traceId = this.generateId(32);
    this.startTime = new Date();
    
    if (options?.parent) {
      this.parentSpanId = options.parent.spanId;
      this.traceId = options.parent.traceId;
    }
    
    if (options?.attributes) {
      Object.assign(this.attributes, options.attributes);
    }
    
    if (options?.kind !== undefined) {
      this.kind = options.kind;
    }
  }
  
  setAttribute(key: string, value: any): this {
    this.attributes[key] = value;
    return this;
  }
  
  setAttributes(attrs: Record<string, any>): this {
    Object.assign(this.attributes, attrs);
    return this;
  }
  
  addEvent(name: string, attributes?: Record<string, any>): this {
    this.events.push({
      name,
      timestamp: new Date(),
      attributes,
    });
    return this;
  }
  
  end(): void {
    this.endTime = new Date();
  }
  
  private generateId(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}

export class SimpleCounter implements Counter {
  private total = 0;
  private attributes: Record<string, number> = {};
  
  add(value: number, attrs?: Record<string, any>): void {
    this.total += value;
    const key = JSON.stringify(attrs);
    this.attributes[key] = (this.attributes[key] || 0) + value;
  }
  
  getTotal(): number {
    return this.total;
  }
}

export class SimpleHistogram implements Histogram {
  private values: number[] = [];
  private attributes: Record<string, number[]> = {};
  
  record(value: number, attrs?: Record<string, any>): void {
    this.values.push(value);
    const key = JSON.stringify(attrs);
    if (!this.attributes[key]) {
      this.attributes[key] = [];
    }
    this.attributes[key].push(value);
  }
  
  stats(attrs?: Record<string, any>): { count: number; sum: number; avg: number; min: number; max: number } | null {
    const key = JSON.stringify(attrs);
    const vals = attrs ? this.attributes[key] : this.values;
    if (!vals || vals.length === 0) return null;
    
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      count: vals.length,
      sum,
      avg: sum / vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }
}

export class SimpleObservableGauge implements ObservableGauge {
  private callbacks: Array<(result: { observe: (value: number, attrs: any) => void }) => void> = [];
  
  addCallback(callback: (result: { observe: (value: number, attrs: any) => void }) => void): void {
    this.callbacks.push(callback);
  }
  
  collect(): Array<{ value: number; attributes: any }> {
    const results: Array<{ value: number; attributes: any }> = [];
    const result = { observe: (value: number, attrs: any) => results.push({ value, attributes: attrs }) };
    this.callbacks.forEach(cb => cb(result));
    return results;
  }
}

export class SimpleResource implements Resource {
  attributes: Record<string, any> = {};
  
  constructor(attrs: Record<string, any>) {
    Object.assign(this.attributes, attrs);
  }
  
  merge(other: Resource): Resource {
    const merged = new SimpleResource(this.attributes);
    Object.assign(merged.attributes, other.attributes);
    return merged;
  }
}
