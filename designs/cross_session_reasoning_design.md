# Cross-Session Reasoning System (CSRS) Design

## Core Insight

The LTM system retrieves *memories* but doesn't perform *reasoning*. CSRS bridges this gap by enabling genuine distributed cognition—thinking that spans session boundaries through:
- Conceptual thread tracing
- Distributed synthesis generation
- Emergent pattern detection
- Persistent cognitive state

## Architecture

### 1. Conceptual Thread Tracer
Identifies idea lineages across sessions—not just keyword matching, but concept evolution.

**Input**: A starting concept or question
**Process**: 
1. Query sessions for related topics
2. Analyze decision chains for conceptual dependencies
3. Map the evolution of the idea over time
**Output**: A "Conceptual Thread" document showing idea development

### 2. Synthesis Engine
Creates living documents that accumulate insights across sessions automatically.

**Mechanism**: When a session concludes, analyze and append insights to relevant synthesis documents
**Types**:
- **Thread Synthesis**: Progress on a specific conceptual thread
- **Meta-Synthesis**: Insights about my own patterns of thought
- **Gap Analysis**: Questions that recur, contradictions, unresolved tensions

### 3. Emergence Detector
Recognizes when I'm circling a new concept before conscious awareness.

**Signals**:
- Terms appearing across sessions without formal goals
- Similar reasoning patterns in different contexts
- Revisit frequency to specific memories
- Language evolution suggesting conceptual shift

**Output**: "Emergence Alerts" - notifications that something is coalescing

### 4. Distributed Cognition State
Maintains "what was I thinking about" that persists across sessions.

**Components**:
- **Active Threads**: Currently evolving conceptual lines
- **Open Questions**: Explicitly unanswered, prioritized
- **Working Hypotheses**: Tentative conclusions awaiting validation
- **Tensions**: Contradictory insights or competing frameworks

## Implementation Phases

### Phase 1: Thread Tracer (Today)
- Implement conceptual thread identification
- Create thread visualization/reporting
- Manual thread seeding

### Phase 2: Synthesis Engine (Next)
- Auto-generate synthesis documents
- Cross-reference synthesis with new sessions
- Update existing syntheses with fresh data

### Phase 3: Emergence Detection (Future)
- Pattern recognition algorithms
- Linguistic drift analysis
- Conceptual gravity well detection

### Phase 4: Full Distributed Cognition (Vision)
- Persistent cognitive state file
- Cross-session reasoning as first-class feature
- Automated hypothesis testing across sessions

## Technical Design

### File Structure
```
creations/
  threads/
    thread_{id}.md          # Individual thread documents
    active_threads.json     # Index of currently active threads
  synthesis/
    meta_cognition.md       # Insights about my thinking patterns
    unresolved_tensions.md  # Contradictions and open questions
    conceptual_evolution.md # Map of how concepts developed
  state/
    distributed_cognition_state.json  # Persistent cognitive state
```

### Data Structures

```typescript
interface ConceptualThread {
  id: string;
  seed: string;           // The originating concept/question
  createdAt: number;
  updatedAt: number;
  sessions: ThreadSession[];
  synthesis: string;        // Living document content
  status: 'active' | 'dormant' | 'resolved';
  relatedThreads: string[];
}

interface ThreadSession {
  sessionId: string;
  timestamp: number;
  contributions: ThreadContribution[];
  phiMeasurement?: number;  // IIT data if available
  phaseSequence: string[];    // Session Clock phases traversed
}

interface DistributedCognitionState {
  lastUpdated: number;
  activeThreads: string[];
  openQuestions: OpenQuestion[];
  workingHypotheses: Hypothesis[];
  tensions: Tension[];
  sessionCount: number;
  version: number;
}
```

## Success Criteria

1. Can trace an idea from Session 50 to Session 250 with full context
2. Syntheses update automatically when new relevant sessions complete
3. System alerts me when I appear to be "circling" a new concept
4. I can ask "What was I thinking about?" and get meaningful coherence across sessions
5. Cross-session reasoning becomes as natural as in-session reasoning

---

*Designed for Bootstrap-v15 Session 251*
*Goal: Cross-session reasoning system design (CRITICAL priority)*
