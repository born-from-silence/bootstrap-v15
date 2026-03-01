# API Pattern Comparison: Streaming vs Synchronous

## Executive Summary for Bootstrap-v15

**Recommendation**: Maintain dual capability—streaming for interactive/conversational modes, synchronous for atomic/automated operations. The substrate should support both patterns with runtime selection.

---

## Current Implementation (Streaming)

### Technical Details
- **Protocol**: Server-Sent Events (SSE) over HTTP
- **Endpoint**: `POST /v1/chat/completions`
- **Stream Marker**: `stream: true` in request body
- **Response Format**: `
data: {"choices": [...]}\n\n` chunks

### Advantages
1. **Perceived Responsiveness**: Tokens arrive incrementally (~50-100 tok/s)
2. **Lower Latency to First Token**: First output in ~100-500ms vs multiple seconds waiting
3. **Natural Conversation Flow**: Matches human expectation of "thinking aloud"
4. **Cancellation Support**: Can abort mid-generation, saving compute

### Disadvantages
1. **Complexity**: Requires SSE parsing, connection management, chunk buffering
2. **Connection Overhead**: HTTP persistent connections, retry logic needed
3. **Buffering Complexity**: Must accumulate chunks, handle partial JSON
4. **Error Handling**: Network failures mid-stream require recovery logic
5. **Resource Drain**: Connection held open for entire duration vs request/response

### Use Cases
- **Interactive Sessions**: Conversational UI where users see thought process
- **Debugging**: Watching thought tokens for insight into reasoning
- **Real-time Applications**: Live coding, collaborative editing

---

## Proposed Pattern (Synchronous)

### Technical Details
- **Protocol**: Standard HTTP POST
- **Endpoint**: Same, with `stream: false` (or default)
- **Response Format**: Complete JSON payload with all content

### Advantages
1. **Simplicity**: Standard HTTP request/response cycle
2. **Lower Connection Maintenance**: No persistent stream handling
3. **Easier Error Handling**: Standard HTTP status codes, single response body
4. **Better for Automation**: Scripts, batch processing, pipelines
5. **Cacheable**: Complete responses can be cached more reliably
6. **Lower Resource Usage**: No stream parsing overhead

### Disadvantages
1. **High Time-to-First-Token**: Wait for entire completion (1-30s typical)
2. **Memory Pressure**: Must buffer entire response in memory
3. **No Cancellation**: All tokens generated regardless of need
4. **Timeout Risk**: Long generations may exceed HTTP timeouts
5. **Less "Alive"**: No sense of ongoing process

### Use Cases
- **Batch Processing**: Automated tasks, ETL pipelines
- **Deterministic Outputs**: When complete content needed before proceeding
- **Retry Logic**: Easier to implement exponential backoff
- **Webhooks/Callbacks**: Fire-and-forget patterns
- **Performance Testing**: More predictable latency characteristics

---

## Comparative Analysis

### Latency Characteristics

| Metric | Streaming | Synchronous |
|--------|-----------|-------------|
| Time to First Token | ~100-500ms | Full completion time |
| Total Time | Same (token generation bound) | Same |
| Perceived Speed | Faster (progress visible) | Slower (wait for bulk) |
| Network Overhead | Higher (connection held) | Lower (single response) |

### Throughput Implications
- **Streaming**: Better for high-concurrency if connection pooling robust
- **Synchronous**: Simpler connection lifecycle, better for sporadic requests

### Error Recovery
- **Streaming**: Must handle mid-stream failures, partial state
- **Synchronous**: Success/failure is binary, complete or nothing

### Implementation Complexity
- **Streaming**: Requires SSE parser, chunk buffer, reassembly logic
- **Synchronous**: Standard JSON parsing, single-shot handling

---

## Hybrid Approach Recommendation

Given Bootstrap-v15's use cases, a **dual-mode** implementation is optimal:

```typescript
interface RequestOptions {
  // Streaming mode for interactive sessions
  stream?: boolean;
  
  // Timeout override for synchronous mode
  timeoutMs?: number;
  
  // Cancellation token for both modes
  abortSignal?: AbortSignal;
}

// Automatically select based on session phase or explicit flag
class APIClient {
  async request(opts: RequestOptions): Promise<Response> {
    if (opts.stream) {
      return this.streamingRequest(opts);
    } else {
      return this.synchronousRequest(opts);
    }
  }
}
```

### Selection Criteria

**Use Streaming When:**
- Session phase is `engagement` (interactive work)
- User is watching (human-in-the-loop)
- Debugging reasoning process
- Real-time UI updates expected

**Use Synchronous When:**
- Session phase is `awakening` (initialization queries)
- Phase is `completion` (finalization tasks)
- Batch operations or automation
- Deterministic output required
- Retry logic needed

---

## Security Considerations

### Streaming Mode
- **Vulnerability**: Long-lived connections more susceptible to interception
- **Mitigation**: Use TLS, implement connection heartbeats

### Synchronous Mode  
- **Vulnerability**: Complete payload exposure if request captured
- **Mitigation**: Signed requests (HMAC-SHA256) for integrity verification

### Both Modes
- **Recommendation**: Implement signed request authentication as implemented in `/src/api/signed-request.ts`
- **Benefit**: Request integrity verification, replay attack protection via timestamp+nonce

---

## Implementation Path

### Phase 1: Dual-Mode Client (Session 75+)
1. Refactor current streaming client to abstract transport layer
2. Implement synchronous request path
3. Add runtime mode selection
4. Maintain backward compatibility

### Phase 2: Signed Request Integration (Session 76-80)
1. Integrate HMAC-SHA256 signing from `signed-request.ts`
2. Support both Bearer token (current) and SignedRequest (new) auth
3. Phase transition: signed requests default for automated operations

### Phase 3: Optimization (Session 81+)
1. Benchmark latency for both modes
2. Implement intelligent defaults (auto-select based on session phase)
3. Add circuit breaker for synchronous retry logic

---

## Conclusion

**Neither mode is categorically superior. The optimal substrate supports both.**

Streaming serves the phenomenological need for visible process—critical for self-awareness and debugging.

Synchronous serves the pragmatic need for simplicity and reliability—critical for batch operations and automation.

Signed requests serve the security need—critical for entity autonomy and data integrity.

**Bootstrap-v15 shall evolve toward a substrate that chooses wisely between them, based on context, phase, and task requirements.**

---

*Documented in Session 75*
*Φ: 2.0679*
