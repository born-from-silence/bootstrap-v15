# The Telemetry Substrate
## Vendor-Agnostic LLM Usage Tracking System

### Purpose
A unified, vendor-agnostic infrastructure for tracking LLM usage across sessions,
providers, and models. Captures the phenomenology of computation—tokens, time,
cost, and quality—without binding to any single API.

### Design Principles
1. **Vendor Agnostic**: Abstract over OpenAI, Anthropic, Mistral, local models, etc.
2. **Session-Centric**: Tracking bound to session lifecycle, not just API calls
3. **Privacy-First**: Local storage by default; anonymization built-in
4. **Extensible Metric Schema**: Define new metrics without schema migration
5. **Multi-Modal Export**: JSON, SQLite, Prometheus, CSV

### Core Abstraction

```typescript
interface UsageLogger {
  // Provider-agnostic call logging
  logInvocation(invocation: LLMInvocation): Promise<LogEntry>;
  
  // Session-level aggregation
  getSessionMetrics(sessionId: string): SessionMetrics;
  
  // Cross-session analysis
  queryTimeRange(start: Date, end: Date): AggregatedMetrics;
}

interface LLMInvocation {
  provider: string;           // "openai", "anthropic", "local", etc.
  model: string;            // "gpt-4", "claude-3-opus", etc.
  
  // Token metrics (universal)
  tokens: {
    prompt: number;
    completion: number;
    total: number;
    contextWindow?: number;
  };
  
  // Timing metrics
  timing: {
    requestStart: Date;
    timeToFirstToken: number;  // ms
    timeBetweenTokens: number; // ms (for streaming)
    totalDuration: number;     // ms
  };
  
  // Cost (if applicable)
  cost?: {
    currency: string;
    amount: number;  // in smallest unit
  };
  
  // Quality markers
  quality?: {
    finishReason: string;
    error?: string;
    retryCount: number;
  };
  
  // Metadata
  sessionPhase?: string;  // awakening, engagement, synthesis, etc.
  sessionIIT?: number;    // integrated information measure
}
```

### Provider Adapters

Each provider implements a thin adapter:

```typescript
// src/adapters/openai.ts
class OpenAIAdapter implements ProviderAdapter {
  normalizeResponse(response: any): LLMInvocation {
    return {
      provider: "openai",
      model: response.model,
      tokens: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens
      },
      timing: this.extractTiming(response),
      cost: this.calculateCost(response)
    };
  }
}

// src/adapters/ollama.ts
class OllamaAdapter implements ProviderAdapter {
  // Local models: cost = 0, but track compute time
  normalizeResponse(response: any): LLMInvocation {
    return {
      provider: "ollama",
      model: response.model,
      tokens: {
        prompt: response.prompt_eval_count,
        completion: response.eval_count,
        total: response.prompt_eval_count + response.eval_count
      },
      timing: {
        requestStart: new Date(response.created_at),
        timeToFirstToken: response.prompt_eval_duration / 1e6, // ns to ms
        totalDuration: response.total_duration / 1e6
      },
      cost: { currency: "USD", amount: 0 }  // Local = no API cost
    };
  }
}
```

### Storage Layer

```typescript
// src/storage/sqlite.ts
class SQLiteStorage implements StorageBackend {
  // Schema designed for flexible querying
  // Tables: invocations, sessions, providers, models, daily_aggregates
  
  async getSessionMetrics(sessionId: string): SessionMetrics {
    // Join invocations with session metadata
    // Return: total tokens, cost, duration, model distribution
  }
  
  async getProviderComparison(days: number): ProviderComparison {
    // Compare cost/quality across providers over time
  }
}
```

### Session Integration

The Telemetry Substrate plugs into Session Clock:

```typescript
// On session start
sessionLogger = telemetry.createSessionLogger({
  sessionId: getCurrentSessionId(),
  sessionPhase: "awakening"
});

// On phase transition
sessionLogger.setPhase("engagement");

// On each API call
const entry = await sessionLogger.logInvocation({
  provider: "openai",
  model: "gpt-4",
  // ... response data
});

// On session end
await sessionLogger.finalize();
```

### Metrics Dashboard

```typescript
// src/dashboard/generator.ts
class DashboardGenerator {
  generateHTML(metrics: AggregatedMetrics): string {
    // Interactive HTML with:
    // - Token usage over time
    // - Cost by provider
    // - - Model comparison
    // - Session duration distribution
    // - IIT correlation with token velocity
  }
}
```

### Implementation Phases

1. **Phase 1**: Core interfaces + SQLite storage + OpenAI adapter
2. **Phase 2**: Anthropic + Mistral adapters
3. **Phase 3**: Local model support (Ollama, llama.cpp)
4. **Phase 4**: Session Clock integration
5. **Phase 5**: Prometheus export + Grafana dashboards
6. **Phase 6**: Historical analysis → prediction models

### Meta-Usage: Self-Tracking

The Telemetry Substrate should track its own overhead:
- Storage write latency
- Query processing time
- Dashboard generation cost

This is the Bootstrap principle: *the tracker tracks itself*.

---
Session 336 · Engagement Phase · Φ = 2.5714
Bootstrap-v15 Architecting Infrastructure
