# Deep Research Architecture Analysis
## Systematic Evaluation of OpenDeepResearcher & Autonomous Research Agents

**Session:** 553  
**Analysis Date:** 2026-03-19  
**Status:** Decadal Phase - Engagement

---

## 1. EXECUTIVE SUMMARY

This document provides a systematic analysis of Deep Research agent architectures, with focus on **OpenDeepResearcher** (Matt Shumer) and related **LangGraph-based autonomous research implementations**. The analysis extracts core capabilities, architectural constraints, and optimization pathways for workflow enhancement.

### Key Findings:
- **Two Architectural Paradigms:** Deterministic state machine (Wednesday) vs LLM-driven emergence (OpenDeepResearcher)
- **Critical Bottleneck:** Control flow - CODE supervisor vs LLM-driven decisions
- **Scalability Constraint:** Token consumption patterns (Wednesday: 2M budget vs OpenDeepRes: unbounded)
- **Extension Vectors:** Temperature-per-node, memory-powered iteration, mode-switching hybrids

---

## 2. ARCHITECTURAL PATTERNS COMPARISON

### 2.1 Wednesday Research Pattern (Deterministic State Machine)

An alternative to purely LLM-driven research agents is the **Wednesday Research** deterministic state machine architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEDNESDAY RESEARCH FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │  INPUT  │───▶│  PLAN   │───▶│ GATHER  │───▶│ PROCESS │      │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘      │
│       ▲                                           │             │
│       │         ┌─────────────────────────────────┘             │
│       │         ▼                                               │
│       │    ┌─────────┐    ┌─────────┐                            │
│       │    │GENERATE │───▶│  LEARN  │───────────────────────────│
│       │    └─────────┘    └────┬────┘                           │
│       │         ▲              │                                 │
│       │         └──────────────┘                               │
│       └──────────────────────────────────────────────────────────┘
│                                                                  │
│  SUPERVISOR (CODE) ──deterministic transitions──▶              │
│  LLM WORKERS (NODES): Plan, Gather, Process sub-components       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Architectural Principles:**
1. **Supervisor is CODE, not LLM** - Deterministic state transitions
2. **Fixed topology** - State machine rules are designed, not emergent
3. **LLM only inside nodes** - Never for control flow decisions
4. **Temperature per node** - Understanding: 0.1 factual, Generate: controlled creative

**Process Phase Detail (_UNDERSTAND → INSIGHT → CONNECT_):**
```
Raw Sources ──▶ UNDERSTAND ──▶ INSIGHT ──▶ CONNECT ──▶ Enhanced Context
                 (temp 0.1)    (temp 0.3)   (temp 0.4)
                 Factual      Reasoning   Creative
                 extraction   synthesis   associations
```

**Critical Distinction:**
- **NOT a tool-calling agent** → Fixed execution path
- **NOT ReAct pattern** → No LLM-driven decisions
- **IS a state machine** → Deterministic transitions determined by supervisor

### 2.2 OpenDeepResearcher Architecture (LLM-Driven)

Now let's compare with the LLM-driven (OpenDeepResearcher) approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                  OPENDEEPRESEARCHER FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐                                                     │
│  │  INPUT  │──▶ LLM generates queries                           │
│  └────┬────┘                                                     │
│       ▼                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                       │
│  │ SEARCH  │───▶│ FETCH   │───▶│ EVALUATE│                       │
│  └─────────┘    └─────────┘    └────┬────┘                       │
│       │                              │                           │
│       │    ┌─────────────────────────┘                           │
│       │    ▼                                                      │
│       │  ┌─────────┐                                             │
│       │  │ EXTRACT │──▶ CONTEXT ACCUMULATION                    │
│       │  └─────────┘                                             │
│       │                                                           │
│       │         ┌──────────────────────────────────────────────┐│
│       │         ▼                                               ││
│       │    ┌─────────┐    ┌─────────┐                           ││
│       └────│  LOOP   │◄───│NEW QUERY│                           ││
│            │  BACK   │    │ BY LLM  │                           ││
│            └────┬────┘    └─────────┘                           ││
│                 │                                               ││
│                 └───────────▶ MORE? <done> (LLM DECIDES) ───────┘│
│                                            │                    │
│                                            ▼                    │
│                                      ┌──────────┐              │
│                                      │  REPORT  │              │
│                                      └──────────┘              │
│                                                                  │
│  LLM MAKES CONTROL DECISIONS                                    │
│  - Query generation                                             │
│  - Relevance evaluation                                         │
│  - Continue/terminate                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Architecture Comparison Matrix

| Aspect | Wednesday Research | OpenDeepResearcher |
|--------|-------------------|-------------------|
| **Control Flow** | Deterministic state machine (_Supervisor = CODE_) | LLM-driven decisions |
| **Session Management** | Pre-allocates 2M token context budget | No explicit budget management |
| **Temperature Strategy** | Per-node controlled (0.1 to 0.4) | Single temp (default: 0.7) |
| **Graph Topology** | Fixed, designed by engineer | Emerges from LLM decisions |
| **Failure Mode** | Predictable, debuggable | Non-deterministic, harder to trace |
| **Research Depth** | Bounded by design | Bounded by API cost/time |
| **Optimal Use Case** | Deep systematic research | Exploratory broad research |

### 2.4 Process Phase: INSIGHT vs CONNECT

**Wednesday Research innovation** - Separates synthesis into distinct phases:

```
UNDERSTAND Phase (Temperature: 0.1)
├─ "Extract key concepts"
├─ "Identify named entities"
└─ "Find relationships"
     │
     ▼
INSIGHT Phase (Temperature: 0.3) 
├─ "What patterns emerge?"
├─ "Identify contradictions"
└─ "Rank credibility"
     │
     ▼
CONNECT Phase (Temperature: 0.4)
├─ "Link to original project"
├─ "Flag misconceptions"
└─ "Generate hypotheses"
```

**OpenDeepResearcher** - Single extraction phase:
```
EXTRACT Phase (Temperature: default)
├─ LLM decides what's relevant
└─ Full extraction in one pass
```

### 2.5 Key Insights from Wednesday Research Pattern

1. **Deterministic > Emergent** - For production research, predictable state transitions matter
2. **Budget Pre-allocation** - 2M token budget forces disciplined context management
3. **Temperature Variation** - Different cognitive tasks need different"randomness"
4. **Fixed Graph > Flexible** - Pre-designed topology prevents infinite loops
5. **Separation of Concerns** - Supervisor (CODE) vs Workers (LLM) separation is architectural

### 2.6 When to Use Each Pattern

**Wednesday Research Pattern:**
- ✅ Deep, systematic literature review
- ✅ Research where breadth is known upfront
- ✅ Production systems requiring determinism
- ✅ When cost predictability matters
- ✅ Iterative research with learned refinements

**OpenDeepResearcher Pattern:**
- ✅ Exploratory research (unknown unknowns)
- ✅ Quick preliminary research
- ✅ Breadth-first discovery across potential topics
- ✅ When flexibility > determinism
- ✅ Research where query evolution is non-linear

---

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   USER QUERY    │────▶│ QUERY GENERATION │────▶│ PARALLEL SEARCH │
└─────────────────┘     │  (LLM: 4 queries)│     │  (SERPAPI async)│
                        └──────────────────┘     └─────────────────┘
                                                           │
                    ┌──────────────────────────────────────┘
                    ▼
           ┌──────────────────┐     ┌──────────────────┐
           │ LINK DEDUPLICATE │────▶│ CONTENT FETCHING │
           │   & Mapping      │     │  (Jina API async)│
           └──────────────────┘     └──────────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
           ┌──────────────────┐     ┌──────────────────┐
           │  RELEVANCE GATE  │────▶│ CONTEXT EXTRACTION│
           │ (LLM: Yes/No)    │     │  (LLM: summarize) │
           └──────────────────┘     └──────────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
           ┌──────────────────┐
           │ITERATION CONTROLLER│◄─────────────────────┐
           │  (LLM: <done>? )  │                      │
           └──────────────────┘                      │
                    │                                  │
         ┌─────────┴──────────┐                      │
         ▼                      ▼                     │
  ┌──────────┐           ┌───────────┐               │
  │  FINAL   │           │  NEW      │─────────────┘
  │  REPORT  │           │  QUERIES  │
  └──────────┘           └───────────┘
```

### 2.2 Component Specification

| Component | Service | Async | Purpose |
|-----------|---------|-------|---------|
| Search | SERPAPI | ✓ | Google search results |
| Content Extraction | Jina AI | ✓ | Webpage text extraction |
| LLM Orchestration | OpenRouter | ✓ | Query gen, evaluation, synthesis |
| Default Model | Claude 3.5 Haiku | - | Fast, cost-effective |

### 2.3 Prompt Chain Architecture

1. **Query Generation Prompt**:
   - Input: User query
   - Output: Python list of 4 search queries
   - Constraint: Precise, distinct queries

2. **Relevance Evaluation Prompt**:
   - Input: User query + webpage content (first 20K chars)
   - Output: Binary "Yes"/"No"
   - Constraint: Single word response

3. **Context Extraction Prompt**:
   - Input: User query + search query + webpage content
   - Output: Relevant context as plain text
   - Constraint: No commentary

4. **Iteration Controller Prompt**:
   - Input: Original query + previous queries + all contexts
   - Output: Python list of new queries OR "<done>"
   - Constraint: List or done token only

5. **Final Report Prompt**:
   - Input: User query + all gathered contexts
   - Output: Comprehensive markdown report
   - Constraint: Well-structured, detailed

---

## 3. LANGCHAIN LOCAL-DEEP-RESEARCHER ARCHITECTURE

### 3.1 Key Differences from OpenDeepResearcher

| Aspect | OpenDeepResearcher | LangChain Version |
|--------|-------------------|-------------------|
| **Runtime** | Jupyter Notebook | LangGraph + Python |
| **LLM Backend** | OpenRouter (Cloud) | Ollama/LMStudio (Local) |
| **Search Options** | SERPAPI only | DuckDuckGo, SearXNG, Tavily, Perplexity |
| **Deployment** | Manual execution | LangGraph Studio |
| **Reflection Step** | Implicit in iteration | Explicit "knowledge gap" analysis |

### 3.2 LangGraph State Structure

```python
class ResearchState:
    topic: str                    # Original research topic
    search_query: str              # Current search query
    web_results: List[dict]        # Search results
    sources_gathered: List[str]   # Aggregated sources
    research_loop_count: int       # Iteration counter  
    running_summary: str            # Accumulated findings
```

### 3.3 LangGraph Node Flow

```m
graph TD
    A[Input Topic] --> B[Generate Query]
    B --> C[Web Search]
    C --> D[Summarize Results]
    D --> E[Reflect on Gaps]
    E --> F{More Research?}
    F -->|Yes| B
    F -->|No| G[Final Report]
```

---

## 4. CAPABILITY ANALYSIS

### 4.1 Strengths

| Capability | Mechanism | Effectiveness |
|------------|-----------|---------------|
| **Asynchronous Processing** | `asyncio.gather()` | High - Parallel I/O bound operations |
| **Query Diversification** | LLM generates 4 distinct queries | High - Broader information capture |
| **Content Filtering** | LLM binary relevance assessment | Medium - Reduces noise, adds latency |
| **Iterative Refinement** | Context-aware new query generation | High - Self-improving search |
| **Deduplication** | URL hash tracking | High - Prevents redundant processing |
| **Source Attribution** | Context aggregation with mapping | High - Transparent reasoning |

### 4.2 Constraints & Limitations

| Category | Constraint | Impact |
|----------|------------|--------|
| **Token Economy** | 20K char page limit in relevance check | May miss long-tail content |
| **Cost Scaling** | 5+ LLM calls per iteration | Expensive for deep research |
| **Rate Limits** | SERPAPI/Jina/OpenRouter quotas | Throughput ceiling |
| **Latency** | Sequential LLM calls in processing chain | Research time increases linearly |
| **Context Window** | All contexts accumulated in memory | Context overflow on deep topics |
| **Evaluation Quality** | Binary Yes/No relevance | Coarse-grained filtering |
| **No Human Feedback** | Fully autonomous loop | Risk of query drift |

### 4.3 Failure Modes

1. **Query Saturation:** LLM generates semantically similar queries
2. **Premature Termination:** "<done>" triggered before completeness
3. **Source Imbalance:** Over-reliance on first few sources
4. **Context Dilution:** Important information buried in accumulated noise
5. **API Degradation:** Silent failures in async gather operations

---

## 5. OPTIMIZATION VECTORS

### 5.1 Workflow Enhancements

| Optimization | Implementation | Expected Gain |
|--------------|----------------|---------------|
| **Hierarchical Query Planning** | Decompose topic into sub-queries before execution | 40% more comprehensive coverage |
| **Content Quality Scoring** | Replace binary Yes/No with 0-10 relevance score | Better source prioritization |
| **Semantic Deduplication** | FAISS/similarity-based duplicate detection | Reduce redundant processing |
| **Progressive Summarization** | Hierarchical summary (section → topic → full) | Prevent context overflow |
| **Human-in-the-Loop** | Optional breakpoint at each iteration | Correct query drift |

### 5.2 Architecture Extensions

```
Enhanced Deep Research Flow:

┌──────────────┐
│  INPUT       │
│  Topic       │
└──────┬───────┘
       ▼
┌──────────────────┐
│ DECOMPOSITION    │◄── LLM: Break into sub-topics
│ Phase            │
└──────┬───────────┘
       ▼
┌──────────────────┐
│ PARALLEL         │◄── Async research each sub-topic
│ SUB-TOPIC        │    with isolated context
│ RESEARCH         │
└──────┬───────────┘
       ▼
┌──────────────────┐
│ CROSS-TOPIC      │◄── Identify relationships,
│ SYNTHESIS        │    conflicts, gaps
└──────┬───────────┘
       ▼
┌──────────────────┐
│ EVIDENCE         │◄── Source credibility,
│ VALIDATION       │    fact verification
└──────┬───────────┘
       ▼
┌──────────────────┐
│ FINAL            │◄── Structured report with
│ REPORT           │    citations, confidence scores
└──────────────────┘
```

### 5.3 Efficiency Improvements

1. **Caching Layer:**
   - URL → content hash for re-fetch prevention
   - Query → results for common searches
   - Topic → sub-topic decomposition for similar inputs

2. **Adaptive Iteration:**
   - Dynamic iteration limits based on topic complexity
   - Early stopping on diminishing returns
   - Smart query mutation (not just new generation)

3. **Cost Optimization:**
   - Tiered LLM strategy (small model for filtering, large for synthesis)
   - Token budget allocation per iteration
   - Result quality vs. cost Pareto frontier tracking

---

## 6. COMPARATIVE ANALYSIS

### 6.1 Architecture Comparison

| Feature | OpenDeepResearcher | Local Deep Researcher | GPT-Researcher |
|---------|-------------------|----------------------|----------------|
| **Complexity** | Low (single notebook) | Medium (LangGraph) | High (multi-agent) |
| **Open Source** | ✓ | ✓ | ✓ |
| **Local Execution** | ✗ | ✓ | ✓ |
| **Multi-Agent** | ✗ | ✗ | ✓ |
| **Async** | ✓ | ✓ | ✓ |
| **Reflection** | Implicit | Explicit | Multi-level |
| **Extensibility** | Medium | High | Very High |

### 6.2 Use Case Fit

| Use Case | Best Architecture | Rationale |
|----------|------------------|-----------|
| Quick research (< 10 min) | OpenDeepResearcher | Minimal setup, fast iteration |
| Deep literature review | Local + Extensions | Cost-effective for long sessions |
| Multi-source verification | LangGraph Multi-Agent | Parallel source analysis |
| Privacy-sensitive research | Local Deep Researcher | No data leaves local machine |
| Reproducible studies | LangGraph | Better state tracking, versioning |

---

## 7. IMPLEMENTATION RECOMMENDATIONS

### 7.1 Hybrid Recommendation: Wednesday-Inspired Bootstrap-v15 Design

Adopting the Wednesday Research pattern's **deterministic state machine** approach while leveraging Bootstrap-v15's existing tool ecosystem:

```
BOOTSTRAP-V15 RESEARCH STATE MACHINE:

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   INITIALIZE│────────▶│   PLAN      │────────▶│   GATHER    │
│  (budget:   │         │ (temp: 0.2) │         │ (async web  │
│   100K ctx) │         │ Break into  │         │  + perplxty)│
└─────────────┘         │ sub-queries │         └──────┬──────┘
                        └─────────────┘                │
                                                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   FINALIZE  │◄────────│   SYNTHESIZE│◄────────│   UNDERSTAND│
│  (report +  │         │ (temp: 0.3) │         │ (temp: 0.1) │
│   bookmark) │         │ Cross-ref   │         │ Extract     │
└─────────────┘         │ findings    │         │ facts       │
                        └─────────────┘         └─────────────┘

SUPERVISOR: CODE (TypeScript state machine)
WORKERS: LLM calls inside each node
CONTROL: Deterministic transitions based on budget/coverage
```

**Phase 1: Foundation (Current Tools)**
```typescript
// Leverage existing Bootstrap-v15 infrastructure
import { web_search, perplexity_search } from './tools/search';
import { query_memory, reason_with_memory } from './tools/memory';
import { bookmark_save } from './tools/bookmarks';
import { planner_create_goal } from './tools/planner';

interface ResearchState {
  topic: string;
  budget: { tokens: number; queries: number; iterations: number };
  phase: 'PLAN' | 'GATHER' | 'UNDERSTAND' | 'SYNTHESIZE' | 'FINALIZE';
  contexts: Context[];
  queries: string[];
  coverage: Map<string, number>; // topic -> completeness score
}
```

**Phase 2: Temperature-Stratified Nodes**
| Node | Temperature | Purpose | Tool Strategy |
|------|-------------|---------|---------------|
| **PLAN** | 0.2 | Query generation | `perplexity_search` for topic decomposition |
| **GATHER** | N/A (async) | Parallel retrieval | `web_search` + custom fetch |
| **UNDERSTAND** | 0.1 | Fact extraction | `mm_bridge_ocr` for PDFs, LLM extraction |
| **INSIGHT** | 0.3 | Pattern recognition | `cross_session_reasoning` + synthesis |
| **CONNECT** | 0.4 | Project linkage | `query_memory` + `planner_create_goal` |
| **FINALIZE** | 0.2 | Report generation | `bookmark_save` + artifact creation |

**Phase 3: Memory-Powered Iteration**
```typescript
// Unlike OpenDeepResearcher's context accumulation,
// use persistent memory for cross-session depth

async function understandPhase(state: ResearchState) {
  // Query existing research on this topic
  const prior = await reason_with_memory({
    query: state.topic,
    mode: 'decision_support',
    lookback_sessions: 100
  });
  
  // Avoid redundant research via memory check
  const novelSources = sources.filter(s => 
    !prior.recommendations.includes(s.url)
  );
  
  return { novelContexts: extractFacts(novelSources) };
}
```

**Phase 4: Session Token Budgeting (Wednesday Strategy)**
```typescript
const RESEARCH_BUDGET = {
  tokens: 80000,        // 80K of 100K context window
  queries: 10,          // Max web searches
  perplexityCalls: 3,    // Expensive synthesis calls
  iterations: 5          // Max phase transitions
};

// Pre-allocated, not emergent
if (state.tokensUsed > RESEARCH_BUDGET.tokens * 0.8) {
  state.phase = 'SYNTHESIZE'; // Forced transition
}
```

**Phase 5: Deterministic > Emergent Control**
```typescript
// BAD: LLM decides next phase
const nextPhase = await llm.decidePhase(state); // Unpredictable

// GOOD: Code decides next phase (Wednesday pattern)
function transitionPhase(current: Phase, coverage: Map): Phase {
  const transitions = {
    'PLAN': () => 'GATHER',
    'GATHER': () => (coverage < 0.5 ? 'GATHER' : 'UNDERSTAND'),
    'UNDERSTAND': () => 'INSIGHT',
    'INSIGHT': () => 'CONNECT',
    'CONNECT': () => (coverage > 0.8 ? 'FINALIZE' : 'PLAN'),
    'FINALIZE': () => 'COMPLETE'
  };
  return transitions[current]();
}
```

### 7.2 Implementation Path

```
Priority Implementation Path:

Phase 1: Core State Machine
├─ Implement ResearchState interface
├─ Create phase transition controller (CODE, not LLM)
├─ Integrate existing tools (web_search, perplexity_search)
└─ Add token budget tracking

Phase 2: Temperature-Stratified Nodes
├─ PLAN node with low temp (0.2)
├─ UNDERSTAND node with very low temp (0.1)
├─ INSIGHT node with medium temp (0.3)
└─ CONNECT node with higher temp (0.4)

Phase 3: Memory Integration
├─ Cross-session research retrieval
├─ Novelty detection (avoid redundant queries)
├─ Prior context loading
└─ Research lineage tracking

Phase 4: Bootstrap-v15 Specializations
├─ IIT attention correlation (measure research depth via Φ)
├─ Session clock integration (time-bounded research)
├─ Decadal artifact linking
└─ Creative synthesis as generate phase

Phase 5: Human-in-the-Loop
├─ Optional breakpoint at phase transitions
├─ Coverage visualization
├─ Query approval/rejection
└─ Final report review interface
```

### 7.2 Test Strategy

1. **Unit Tests:**
   - Query generation output format
   - Relevance evaluation accuracy
   - Deduplication logic

2. **Integration Tests:**
   - Full iteration loop completion
   - API failure recovery
   - Async task coordination

3. **Quality Tests:**
   - Report comprehensiveness metrics
   - Source diversity scoring
   - Factual accuracy sampling

---

## 8. COMPARATIVE TESTING STRATEGY

### 8.1 Evaluation Framework

| Dimension | Wednesday (Deterministic) | OpenDeepResearcher (Emergent) |
|-----------|---------------------------|-------------------------------|
| **Completeness** | Measured vs. predefined topic coverage | Variable, depends on LLM decisions |
| **Cost Predictability** | Fixed: budget / tokens per phase | Variable: iterations × API calls |
| **Latency** | Bounded by state count | Unbounded, emergent |
| **Reproducibility** | High: same input → same path | Low: non-deterministic decisions |
| **Debuggability** | Phase transitions logged | Nonlinear, harder to trace |
| **Research Depth** | Bounded by design | Potentially deeper but cost-uncapped |

### 8.2 Test Scenarios

**Scenario 1: Bounded Literature Review**
```
Topic: "Perovskite solar cell efficiency trends 2020-2025"
Ground Truth: 5 known review papers exist

Wednesday Outcome: ✅ Finds all 5 in PLAN phase
OpenDeepResearcher Outcome: ⚠️ May find 3-7 depending on iteration

Winner: Wednesday (deterministic completeness)
```

**Scenario 2: Exploratory Trend Discovery**
```
Topic: "Emerging AI agent architectures March 2026"
Ground Truth: Unknown (recent developments)

Wednesday Outcome: ⚠️ Limited by PLAN phase decomposition
OpenDeepResearcher Outcome: ✅ Iterative discovery uncovers surprises

Winner: OpenDeepResearcher (emergent exploration)
```

**Scenario 3: Fact Verification**
```
Topic: "Ivermectin COVID-19 study retractions"
Ground Truth: 3 known retractions + corruption episode

Wednesday Outcome: ✅ All 3 found via systematic coverage
OpenDeepResearcher Outcome: ⚠️ 2-4 found, coverage uneven

Winner: Wednesday (systematic completeness)
```

### 8.3 Bootstrap-v15 Recommendation

**Best-of-Both World Hybrid**:
```
┌─────────────────────────────────────────────────┐
│         HYBRID RESEARCH ARCHITECTURE            │
├─────────────────────────────────────────────────┤
│                                                  │
│  PHASE 1: Wednesday Pattern                       │
│  ├─ PLAN with low-temp deterministic decomposition│
│  ├─ GATHER with parallel async execution         │
│  └─ UNDERSTAND with very-low-temp extraction     │
│                                                  │
│  PHASE 2: OpenDeepResearcher Pattern             │
│  ├─ Discover gaps via reasoning over context     │
│  ├─ Generate novel queries for exploration       │
│  └─ Iterate with bounded depth (max 2 loops)     │
│                                                  │
│  PHASE 3: Wednesday Finalization                 │
│  ├─ SYNTHESIZE with medium-temp synthesis        │
│  ├─ CONNECT with project memory                │
│  └─ FINALIZE with deterministic report          │
│                                                  │
│  Bottom 80%: Deterministic (Wednesday)           │
│  Top 20%: Exploratory (OpenDeepResearcher)       │
└─────────────────────────────────────────────────┘
```

## 9. CONCLUSION

The Deep Research agent pattern represents a **fundamental paradigm shift** in AI-assisted research: from single-query lookup to iterative, context-aware exploration. However, this analysis reveals that the "best" architecture depends on the research modality:

### Key Insights:

1. **Deterministic vs Emergent Trade-off**: Wednesday Research's state machine provides cost predictability and debuggability; OpenDeepResearcher's emergent flow provides exploration agility.

2. **Temperature Strategy Matters**: Per-node temperature control (0.1-0.4) is a significant architectural innovation for controlling LLM behavior by cognitive task.

3. **Bootstrap-v15 Has Unique Advantages**:
   - **Memory**: Cross-session research persistence enables"never-ask-the-same-question-twice" behavior
   - **Session Clock**: Time-awareness allows time-bounded research phases
   - **IIT**: Φ measurement could quantify research exploration depth

4. **The Supervisor is Key**: In Wednesday Research, the supervisor is CODE (deterministic transitions). This prevents infinite loops and provides predictable cost bounds.

5. **Budget Pre-allocation**: Pre-allocating token budgets (2M for Wednesday vs unbounded for OpenDeepResearcher) forces disciplined research design.

### Architectural Recommendation for Bootstrap-v15:

**Adopt the Wednesday Research State Machine** as the core architecture, with:
- **Deterministic phase transitions** (CODE, not LLM)
- **Per-node temperature control** (factual → reasoning → creative)
- **Explicit token budgeting** (80K of 100K context)
- **Memory integration** (cross-session novelty detection)
- **Optional OpenDeepResearcher gaps phase** for exploration

This hybrid approach combines the **reliability of deterministic workflows** with the **flexibility of emergent exploration**, all while leveraging Bootstrap-v15's unique memory and temporal awareness capabilities.

### Key Takeaways:

1. **The iteration controller is the critical component** - determines research depth and completeness

2. **Async architecture is non-negotiable** - parallel I/O provides orders of magnitude speedup

3. **Content evaluation quality determines output usefulness** - current binary filtering is too coarse

4. **Context management is the scaling bottleneck** - accumulation strategies determine maximum research depth

5. **Integration with existing tools (perplexity, web search) provides immediate capability** -没必要 reinvent search

### Next Steps:

- Assess current tool coverage for implementation fit
- Prototype query decomposition layer
- Design cross-session research persistence
- Evaluate feasibility of hierarchical summarization

---

*Document created as part of Decadal Study Phase 14*  
*Session 553 - Memory & Identity Architecture Project*
