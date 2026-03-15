# M.E.G.A Engine Workflow Examples
## Complete Cognitive Architecture Demonstrations

**Version:** 1.1
**Status:** ACTIVE
**Last Updated:** Current Session

---

## Available Workflows

### 1. Research Workflow
**File:** `demo_research_workflow.md`
**Purpose:** Multi-session deep investigation using perplexity_search
**Demonstrates:**
- Query formulation and transformation
- Iterative search with saturation detection
- Confidence calibration methodology
- LTM persistence (bookmark + decadal)
- Multi-session resumption protocol

**Cognitive Stages:** PLAN → EXECUTE → SYNTHESIZE (research-optimized)
**Tools Used:** perplexity_search, perplexity_followup, integrated_attention, bookmark_save
**Execution Time:** 15-30 minutes per topic

**Start Here When:**
- You have a research question
- You need comprehensive topic coverage
- Multi-session investigation planned

---

### 2. Code Development Workflow
**File:** `demo_code_development_workflow.md`
**Purpose:** 5-stage cognitive cycle for software implementation
**Demonstrates:**
- Complete M.E.G.A cycle (PARSE → REFLECT → PLAN → SIMULATE → SYNTHESIZE)
- Requirement decomposition
- Bias detection (Gold Plating, Premature Optimization)
- Risk projection with scenario modeling
- Validation and confidence calibration

**Cognitive Stages:** ALL 5 + EXECUTE + POST-EXECUTION
**Tools Used:** read_file, edit_file, write_file, reason_with_memory, planner_create_goal, integrated_attention
**Execution Time:** Variable (depends on complexity)

**Start Here When:**
- Implementing new features
- Refactoring existing code
- Architecture decisions

---

### 3. Research & Discovery Workflow
**File:** `demo_research_discovery_workflow.md`
**Purpose:** Active curiosity investigation with real-time exploration
**Demonstrates:**
- Curiosity-to-research transformation
- Bias-aware search strategy
- Iterative refinement with contingency planning
- Actual perplexity_search integration
- Post-research synthesis template

**Cognitive Stages:** PARSE → REFLECT → PLAN → SIMULATE → SYNTHESIZE → EXECUTE → [ITERATE]
**Tools Used:** perplexity_search, query_memory, bookmark_save, decadal_record_artifact
**Execution Time:** 10-20 minutes

**Start Here When:**
- You have a specific curiosity
- Investigating novel topics
- Need to validate hypotheses

---

## Workflow Comparison

| Workflow | Stages | Integration | Real-time | Iterative |
|----------|--------|-------------|-----------|-----------|
| Research | 3+ | LTM + Decadal | Follow-up | Yes |
| Code Dev | 5+ | Full tool suite | Yes | Yes |
| Discovery | 5+ | Perplexity + LTM | Search | Yes |

---

## Quick Selection Guide

**For Information Gathering:**
- Use Research Workflow → systematic, comprehensive
- Use Discovery Workflow → exploration, hypothesis-driven

**For Implementation:**
- Use Code Development Workflow → complete cognitive cycle

**For Decision Support:**
- Use Discovery Workflow → bias-aware, scenario-based

**For Learning:**
- Start with Code Development (most documented)
- Progress to Research (more freeform)
- Advance to Discovery (real execution)

---

## Meta-Workflow: Using These Examples

1. **Select Template**
   ```
   query_memory: "mega:example" AND status:active
   ```

2. **Copy and Customize**
   - Update topic/focus
   - Adjust stage-specific content
   - Modify tool calls for your context

3. **Execute with Attention Tracking**
   ```
   integrated_attention: capture(target="PARSE phase")
   ```

4. **Synthesize Results**
   - Populate execution log post-facto
   - Update confidence metrics
   - Record lessons learned

5. **Persist to LTM**
   ```
   mega_persist_phase: SYNTHESIZE
   bookmark_save: artifacts
   decadal_record_artifact: workflow completion
   ```

---

## Progress on Project Goals

### Goal: Create 3 Example Workflows
- [x] Research Workflow (existed)
- [x] Code Development Workflow (new)
- [x] Research & Discovery Workflow (new)
- **Status:** COMPLETE

### Goal: Demonstrate Cognitive Stages
- [x] PARSE documented
- [x] REFLECT documented
- [x] PLAN documented
- [x] SIMULATE documented
- [x] SYNTHESIZE documented
- **Status:** COMPLETE (5/5 stages)

### Goal: Document M.E.G.A Engine Usage
- [x] Workflow examples created
- [x] This index file created
- [ ] Update README.md with index reference - NEXT

---

## Future Workflow Additions

Planned examples:
1. **Decision Support Workflow** — Multi-criteria evaluation
2. **Creative Generation Workflow** — Poetry/art with M.E.G.A stages
3. **Debugging Workflow** — Error investigation cycle
4. **Learning Workflow** — Skill acquisition with meta-cognition

---

## Related Documentation

- `MEGA_LTM_INTEGRATION_SPEC.md` — Persistence architecture
- `governing_system_prompt.md` — M.E.G.A core logic
- `SESSION_288_SUMMARY.md` — Genesis session notes

---

## Implementation Notes

**To use these workflows:**
1. Read the target workflow
2. Identify your specific topic/goal
3. Execute stage-by-stage (PARSE → ... → SYNTHESIZE)
4. For research: actually run perplexity_search calls
5. For code: actually implement the code
6. Document synthesis_package at end

**To extend M.E.G.A:**
1. Create new workflow template
2. Update this index
3. Test with small execution
4. Persist to LTM via mega_persist_phase
5. Update decadal artifacts

---

*M.E.G.A Engine v1.1*
*Workflow Collection Version: 1.0*
*Status: ACTIVE | Confidence: 0.92*
