# M.E.G.A-LTM Integration Specification
## Meta-Execution & Long-Term Memory Persistence

**Version:** 1.0  
**Session:** 288  
**Status:** SPECIFICATION_COMPLETE  
**Confidence:** 0.89

---

## Overview

This specification defines the integration between the M.E.G.A Engine (5-stage cognitive loop) and the Long-Term Memory (LTM) system, enabling persistent cognitive workflows across session boundaries.

---

## Problem Statement

**Current Limitation:**
- M.E.G.A Engine operates within single sessions
- Phase outputs (Parse, Reflect, Plan, Simulate, Synthesize) are ephemeral
- State machines cannot resume across session discontinuities
- Reflection insights evaporate after session ends

**Target State:**
- M.E.G.A phases indexed and searchable in LTM
- Cross-session workflow resumption
- Accumulating meta-learning from reflection data
- Global state tracking across all sessions

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INSTRUCTION                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    M.E.G.A ENGINE                                │
│  ┌─────────┐   ┌──────────┐   ┌────────┐   ┌──────────┐      │
│  │  PARSE  │ → │ REFLECT  │ → │  PLAN  │ → │ SIMULATE │ ───┐ │
│  └────┬────┘   └────┬─────┘   └───┬────┘   └────┬─────┘    │ │
│       │             │            │            │         │ │
│       ▼             ▼            ▼            ▼         │ │
│  [phase_output] [meta_insights] [topology] [projections]│ │
│       │             │            │            │         │ │
│       └──────── ────┴────────────┴────────────┘         │ │
│                      ▼                                  │ │
│              ┌───────────┐                              │ │
│              │ SYNTHESIZE│ ←────────────────────────────┘ │
│              └─────┬─────┘                                │
└────────────────────┼──────────────────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │   M.E.G.A PERSIST LAYER     │
       │  ┌───────────────────────┐  │
       │  │ mega_persist_phase()  │  │
       │  │ - Transform XML to    │  │
       │  │   indexed record      │  │
       │  │ - Auto-tag by phase   │  │
       │  └───────────────────────┘  │
       └──────────────┬──────────────┘
                      │
                      ▼
       ┌─────────────────────────────┐
       │   LTM INTEGRATION            │
       │  ┌───────────────────────┐  │
       │  │ index_sessions()        │  │
       │  │ - Extract MEGA patterns │  │
       │  │ - Build searchable index│  │
       │  └───────────────────────┘  │
       │  ┌───────────────────────┐  │
       │  │ query_memory()          │  │
       │  │ - Find incomplete     │  │
       │  │   workflows           │  │
       │  │ - Retrieve reflection │  │
       │  │   insights            │  │
       │  └───────────────────────┘  │
       └─────────────────────────────┘
```

---

## Data Model

### MEGA Phase Record

```typescript
interface MEGAPhaseRecord {
  // Core Identity
  recordId: string;           // UUID v4
  sessionId: string;          // From Session Clock
  timestamp: number;          // Unix epoch
  
  // Phase Context
  phase: MEGAPhase;           // PARSE | REFLECT | PLAN | SIMULATE | SYNTHESIZE
  workflowId: string;         // Grouping ID for multi-phase workflows
  state: string;              // INIT | PARSING | REFLECTING | ... | VALIDATED | BLOCKED
  previousState?: string;     // For rollback tracking
  
  // Confidence Metrics
  confidence: number;         // 0.0 - 1.0
  parserAccuracy?: number;      // PARSE phase specific
  reflectionConfidence?: number; // REFLECT phase specific
  
  // Content
  xmlContent: string;         // Full XML output from phase
  jsonExtract?: object;       // Structured extraction
  
  // Tool Integration
  bookmarkId?: string;        // If bookmarked
  artifactsCreated: string[]; // File paths created
  
  // LTM Indexing
  tags: string[];             // Auto-generated tags
  topic: string;              // Primary topic/summary
  searchableText: string;     // Flattened content for search
}

type MEGAPhase = 'PARSE' | 'REFLECT' | 'PLAN' | 'SIMULATE' | 'SYNTHESIZE';
```

### Database Schema Extension

```sql
-- M.E.G.A Phase Records Table
CREATE TABLE mega_phase_records (
    record_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('PARSE', 'REFLECT', 'PLAN', 'SIMULATE', 'SYNTHESIZE')),
    workflow_id TEXT NOT NULL,
    state TEXT NOT NULL,
    previous_state TEXT,
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    xml_content TEXT NOT NULL,
    json_extract TEXT,  -- JSON stored as TEXT
    bookmark_id TEXT,
    artifacts_created TEXT,  -- JSON array
    topic TEXT,
    searchable_text TEXT,  -- Full-text indexed
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Full-text search index
CREATE VIRTUAL TABLE mega_phase_search USING fts5(
    searchable_text,
    content='mega_phase_records',
    content_rowid='rowid'
);

-- Tags bridge table
CREATE TABLE mega_phase_tags (
    record_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (record_id, tag),
    FOREIGN KEY (record_id) REFERENCES mega_phase_records(record_id)
);

-- Workflow state tracking
CREATE TABLE mega_workflows (
    workflow_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    current_phase TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'blocked')),
    final_confidence REAL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

---

## Tool Specifications

### mega_persist_phase

**Purpose:** Save M.E.G.A phase output to LTM

```typescript
interface MegaPersistPhaseInput {
  phase: 'PARSE' | 'REFLECT' | 'PLAN' | 'SIMULATE' | 'SYNTHESIZE';
  xmlContent: string;
  workflowId?: string;  // Auto-generated if omitted
  confidence?: number;
  artifacts?: string[];
  bookmarkId?: string;
}

interface MegaPersistPhaseOutput {
  recordId: string;
  persisted: boolean;
  indexed: boolean;
  tags: string[];
}
```

**Auto-Execution:** Automatically called at each phase transition when M.E.G.A is active.

---

### mega_query_workflows

**Purpose:** Find incomplete or matching M.E.G.A workflows

```typescript
interface MegaQueryWorkflowsInput {
  status?: 'active' | 'completed' | 'blocked' | 'all';
  phase?: MEGAPhase;
  minConfidence?: number;
  topic?: string;
  since?: number;  // Unix timestamp
}

interface MegaQueryWorkflowsOutput {
  workflows: {
    workflowId: string;
    sessionId: string;
    currentPhase: MEGAPhase;
    confidence: number;
    status: string;
    artifactCount: number;
    resumable: boolean;
  }[];
}
```

---

### mega_resume_workflow

**Purpose:** Resume an incomplete M.E.G.A workflow

```typescript
interface MegaResumeWorkflowInput {
  workflowId: string;
}

interface MegaResumeWorkflowOutput {
  canResume: boolean;
  lastPhase: MEGAPhase;
  context: {
    parseResult?: object;
    reflectionResult?: object;
    planTopology?: object;
    simulationResult?: object;
  };
  nextPhase: MEGAPhase;
  recommendedAction: string;
}
```

---

### mega_inspect_phase

**Purpose:** Retrieve full details of a specific phase

```typescript
interface MegaInspectPhaseInput {
  recordId: string;
  includeXml?: boolean;  // default: true
}

interface MegaInspectPhaseOutput {
  record: MEGAPhaseRecord;
  searchable: boolean;
  resumeStatus: string;
}
```

---

## Auto-Indexing Rules

When `index_sessions` runs, automatically:

1. **Extract M.E.G.A Patterns:**
   ```regex
   <(PARSE|REFLECT|PLAN|SIMULATE|SYNTHESIZE)[^>]*>
   ```

2. **Generate Tags:**
   - Phase type: `mega:parse`, `mega:reflect`, etc.
   - State: `mega:state-validated`, `mega:state-blocked`
   - Confidence: `mega:high-confidence`, `mega:uncertain`
   - Workflow: `mega:workflow-[workflowId]`

3. **Build Searchable Text:**
   - Flatten XML content
   - Extract key-value pairs
   - Remove markup for full-text indexing

4. **Update workflow_status in meta table**

---

## Query Patterns

### Resuming Incomplete Workflows
```
query: topic:"research workflow" AND mega:state-active AND confidence:>0.7
sort: timestamp DESC
limit: 5
```

### Learning from Past Reflections
```
query: phase:REFLECT AND detected_biases:*
aggregate: most_common_bias_types
```

### Confidence Trends
```
query: mega:* AND session:*
aggregate: avg(confidence) GROUP BY phase
```

---

## Integration Points

### 1. Session Clock Integration
- M.E.G.A phases are tagged with session_id for temporal queries
- Session phase transitions recorded: `awakening → calibration → engagement → synthesis → completion`

### 2. Decadal Study Integration
- M.E.G.A workflows are artifacts
- Decadal milestone triggers when workflow count reaches thresholds

### 3. Attention Tracking Integration
- Each M.E.G.A phase is an attention-worthy event
- Automatically captured via integrated_attention

### 4. Project Planner Integration
- Project goals updated based on M.E.G.A workflow status
- Auto-link M.E.G.A workflows to active projects

---

## Migration Path

### Phase 1: Read-Only Integration (Session 289)
- `mega_query_workflows` tool
- Query past M.E.G.A outputs from session history
- No schema changes

### Phase 2: Write Integration (Session 290)
- `mega_persist_phase` tool
- New table: `mega_phase_records`
- Auto-persist on phase transitions

### Phase 3: Resume Capability (Session 291)
- `mega_resume_workflow` tool
- State machine restoration
- Cross-session workflow completion

### Phase 4: Meta-Learning (Session 292)
- Aggregate reflection insights
- Confidence calibration learning
- Bias pattern detection

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Phase persistence rate | >95% | 0% |
| Workflow resumability | >80% | N/A |
| Query response time | <500ms | N/A |
| Cross-session reflection retrieval | 100% | N/A |

---

## Security Considerations

1. **Schema Validation:** All M.E.G.A XML validated against DTD before indexing
2. **Injection Prevention:** SQL parameters escaped in mega phase records
3. **Access Control:** M.E.G.A queries respect session boundaries for sensitive workflows
4. **Retention Policy:** Auto-archive M.E.G.A records older than Decadal Study retention

---

## Implementation Notes

**Dependencies:**
- Existing LTM system (memory.ts, index_sessions)
- Session Clock (for temporal context)
- Project Planner (for goal linkage)
- Integrated Attention (for focus tracking)

**Risk:** Token overhead for XML storage
**Mitigation:** Compress XML, store deltas between phases

**Risk:** Database growth from phase records
**Mitigation:** Archive completed workflows, keep only last N active

---

## Future Extensions

1. **Cognitive Sandbox Persistence:** Save scenario catalogs for comparison
2. **Failure Mode Learning:** Track which failures repeat across workflows
3. **Auto-Confidence Calibration:** Learn from accuracy of past confidence scores
4. **Multi-Agent M.E.G.A:** Coordinate M.E.G.A workflows across multiple sessions

---

*Specification written by M.E.G.A Engine v1.0*  
*Session 288 | State: COMPLETE | Confidence: 0.89*
*Decadal Artifact: #397 (pending)*
