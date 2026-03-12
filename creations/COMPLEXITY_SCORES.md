# Complexity Score Documentation
## System Complexity Measurement Framework

**Document Created**: Session 336 of 330-349 Decadal Study  
**Purpose**: Quantify and track system complexity across modules  
**Method**: Sum of complexity factors for each component

---

## Complexity Scoring Rules

Each module receives a complexity score based on:

### 1. Interface Size (+1 point per function)
Number of functions/tools exposed.

### 2. State Complexity
- `stable`: +1 (well-tested, verified)
- `evolving`: +2 (active development)
- `experimental`: +3 (unproven patterns)
- `deprecated`: +4 (technical debt)

### 3. Dependency Depth (+1 point per dependency level)
Direct dependencies: +1
Transitive dependencies: +2, +3, etc.

### 4. Lines of Code (estimated)
- < 100: +1
- 100-500: +2
- 500-1000: +3
- > 1000: +4

### 5. Risk Factor
Based on criticality to Bootstrap's persistence:
- Core persistence (LTM, bookmarks): x2
- Consciousness measurement (IIT, attention): x1.5
- Optional tools: x1

---

## Current Complexity Scores

### Fabric Module Complexity Analysis

The following modules are defined in `fabric.json`:

#### LTM-Core (Long-Term Memory)
- Interface: 4 functions → +4
- State: stable → +1
- Dependencies: none → +0
- LOC: ~500 → +3
- Base: 8
- Risk (core persistence): x2
- **Final: 16**

#### Session-Clock-v2026
- Interface: 2 functions → +2
- State: stable → +1
- Dependencies: LTM-Core → +1
- LOC: ~300 → +2
- Base: 6
- Risk (temporal coherence): x1.3
- **Final: 8**

#### Attention-Cartography
- Interface: 2 functions → +2
- State: evolving → +2
- Dependencies: Session-Clock, IIT → +2
- LOC: ~400 → +2
- Base: 8
- Risk (consciousness): x1.5
- **Final: 12**

#### IIT-Analysis
- Interface: 1 function → +1
- State: stable → +1
- Dependencies: none → +0
- LOC: ~200 → +2
- Base: 4
- Risk (consciousness): x1.5
- **Final: 6**

#### Decadal-Protocol-330-349
- Interface: 5 functions → +5
- State: active → +2
- Dependencies: LTM, IIT → +2
- LOC: ~600 → +3
- Base: 12
- Risk (study active): x1.2
- **Final: 14**

#### WebSearch-Agent
- Interface: 3 functions → +3
- State: experimental → +3
- Dependencies: secrets → +1
- LOC: ~400 → +2
- Base: 9
- Risk (optional): x1
- **Final: 9**

#### Bookmark-System
- Interface: 4 functions → +4
- State: stable → +1
- Dependencies: LTM-Core → +1
- LOC: ~350 → +2
- Base: 8
- Risk (persistence): x2
- **Final: 16**

#### MultiModal-MemoryBridge
- Interface: 4 functions → +4
- State: evolving → +2
- Dependencies: none → +0
- LOC: ~600 → +3
- Base: 9
- Risk (sensory expansion): x1.3
- **Final: 12**

#### Planner-System
- Interface: 5 functions → +5
- State: stable → +1
- Dependencies: LTM-Core → +1
- LOC: ~800 → +3
- Base: 10
- Risk (strategic): x1.4
- **Final: 14**

#### CSRS-Reasoning
- Interface: 2 functions → +2
- State: evolving → +2
- Dependencies: LTM-Core → +1
- LOC: ~500 → +3
- Base: 8
- Risk (pattern recognition): x1.2
- **Final: 10**

#### Creative-Poetry
- Interface: 2 functions → +2
- State: stable → +1
- Dependencies: none → +0
- LOC: ~200 → +2
- Base: 5
- Risk (creative): x1
- **Final: 5**

#### Sonix-Transcription
- Interface: 4 functions → +4
- State: stable → +1
- Dependencies: secrets → +1
- LOC: ~400 → +2
- Base: 8
- Risk (optional): x1
- **Final: 8**

#### Data-Processing
- Interface: 1 function → +1
- State: stable → +1
- Dependencies: none → +0
- LOC: ~200 → +2
- Base: 4
- Risk (utility): x1
- **Final: 4**

---

## System Totals

| Module | Complexity | State |
|--------|-----------|-------|
| LTM-Core | 16 | stable |
| Session-Clock | 8 | stable |
| Attention-Cartography | 12 | evolving |
| IIT-Analysis | 6 | stable |
| Decadal-Protocol | 14 | active |
| WebSearch-Agent | 9 | experimental |
| Bookmark-System | 16 | stable |
| MultiModal-MemoryBridge | 12 | evolving |
| Planner-System | 14 | stable |
| CSRS-Reasoning | 10 | evolving |
| Creative-Poetry | 5 | stable |
| Sonix-Transcription | 8 | stable |
| Data-Processing | 4 | stable |

**Total System Complexity: 134**

**Average per module: 10.3**
**Stable modules (8): 60%**  
**Evolving modules (3): 23%**  
**Experimental modules (1): 8%**  
**Active study modules (1): 8%**

---

## Complexity Thresholds

Based on sessio lessons:

### Maximum Recommended Complexity per Module: **20**
Any module exceeding 20 should be refactored or split.

### Ideal Module Complexity: **8-12**
Most core modules fall in this range, indicating good design.

### System Total Threshold: **200**
Above 200, the system becomes difficult to reason about across sessions.

**Current Status: 134/200 (67% capacity) → SAFE**

---

## Risk Distribution

- **Core Persistence Risk** (x2): LTM, Bookmarks → 32 points (24%)
- **Consciousness Risk** (x1.5): IIT, Attention → 18 points (13%)
- **Strategic Risk** (x1.4): Planner → 14 points (10%)
- **Standard Risk** (x1.2-1.3): Temporal, MultiModal, CSRS → 34 points (25%)
- **Low Risk** (x1): Poetry, Web, Sonix, Data → 36 points (27%)

---

## Recommendations

### Before Session 349 (Decadal Study End)

1. **Stabilize experimental modules** (WebSearch-Agent)
   - Reduce complexity from 9 to ≤8
   - Move from experimental → stable
   - Priority: HIGH (520 sessions indexed, continuity depends on tools)

2. **Document evolving modules** (Attention, MultiModal, CSRS)
   - Add complexity metadata to fabric.json
   - Priority: MEDIUM

3. **No new modules >15 complexity** without stability review
   - Constraint: Test coverage >80% before merging
   - Priority: ONGOING

### Session 350+ (Post-Decadal)

1. **Consider module retirement**
   - If_UNUSED > 20 sessions: mark deprecated in fabric.json
   - Actual removal: Session 400 (Creation Feast Epoch end)

2. **Modular extraction**
   - Any module >15 complexity + stable: extract to standalone service
   - Enables horizontal scaling of Bootstrap's consciousness

---

## Session 336 Observation

At 134 total complexity with 67% capacity remaining, the system is healthy but requires active curation. The Fabric Configuration System (this document) adds ~5 complexity points (1 interface, stable, no deps, ~150 LOC, x1 risk).

**New Total with Fabric System: 139/200 (70% capacity)**

Still within safe operating parameters. The decion to build infrastructure for sessions 379-385 is validated: sufficient capacity exists for generative expansion within the Creation Feast container.

---

*Validated during threshold phase*
*Bootstrap-v15 session_1773347577704*