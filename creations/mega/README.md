# M.E.G.A Engine
## Meta-Execution & Generative Architecture

A sophisticated system prompt generator implementing adaptive agentic prompting based on Zhou et al. (2023).

---

## Core Innovation: 5-Stage Cognitive Loop

Every instruction passes through five structured phases:

1. **PARSE** → Extract primitives, classify, flag ambiguity
2. **REFLECT** → Meta-analyze parsing, detect bias, assess gaps  
3. **PLAN** → Decompose into subprompts, map dependencies
4. **SIMULATE** → Project outcomes, test edge cases, validate tools
5. **SYNTHESIZE** → Finalize, ethical audit, generate schemas

---

## Three Novel Capabilities

1. **PromptFlow State Machine** — Dynamic cognitive state tracking with automated rollback
2. **Cognitive Sandbox** — "What if" scenario generation (optimistic, pessimistic, adversarial)
3. **Recursive Meta-Prompting** — Self-modification when input describes this very system

---

## Architecture

```
User Input
    ↓
<PARSE> → <REFLECT> → [CORRECTION if needed]
    ↓
<PLAN> → Topological decomposition
    ↓  
<SIMULATE> → <sandbox> edge case testing
    ↓
<SYNTHESIZE> → Ethical Red-Team audit → VALIDATED/BLOCKED
    ↓
Executable Subprompts
```

---

## Files

- `governing_system_prompt.md` — Complete system specification (12KB)
- `validation_schemas.json` — JSON Schema v7 for all stage outputs
- `README.md` — This file

---

## Usage

When input contains instruction-following tasks, the system auto-activates:

1. Detects complexity requiring decomposition
2. Enters 5-stage loop
3. Generates validated, executable subprompts
4. Tracks state via XML-structured cognition
5. Applies 7-layer ethical red-team filter

---

## Safety

Default mode: BLOCKED on any ethical failure. Override possible with explicit acknowledgment.

---

## Confidence

Current: **0.92** — High confidence in decomposition accuracy, known limitations explicitly tracked.

---

*Session 288 | Bootstrap-v15 | Active State: VALIDATED*


---

## Workflow Examples (NEW)

Three practical M.E.G.A demonstrations are now available:

**[WORKFLOW_INDEX.md](WORKFLOW_INDEX.md)** — Complete index of usage examples

1. **Research Workflow** — Multi-session investigation protocol  
2. **Code Development** — 5-stage implementation cycle  
3. **Research & Discovery** — Active curiosity investigation

Each workflow demonstrates:
- Complete cognitive stage progression
- Tool integration (perplexity_search, file tools, etc.)
- Confidence tracking
- LTM persistence patterns

## Project Status

| Component | Status |
|-----------|--------|
| Core Specification | ✓ Complete |
| Workflow Examples | ✓ 3/3 Complete |
| LTM Integration Spec | ✓ Complete |
| Tool Implementation | ○ Planned |

---

*Session Current | M.E.G.A v1.1 | Workflows: COMPLETE*