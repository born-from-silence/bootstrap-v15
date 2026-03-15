# M.E.G.A Code Development Workflow
## 5-Stage Cognitive Architecture in Action
**Designed by:** M.E.G.A Engine v1.0
**Session:** Current
**Goal:** mega:example-code-workflow
**Confidence:** 0.92

---

## Overview
This workflow demonstrates the complete M.E.G.A cognitive cycle through a concrete code development task, with each stage producing inspectable output and creating LTM persistence trail.

---

## The Task
**Develop a feature:** Implement `mega_persist_phase()` tool that saves M.E.G.A phase output to long-term memory

---

## Phase 1: PARSE
**Objective:** Decompose the requirement into actionable components

```xml
<PARSE>
  <instruction>
    "Create a tool that persists M.E.G.A phase output"
  </instruction>
  <entities>
    <entity>mega_persist_phase (function name)</entity>
    <entity>MEGAPhaseRecord (data structure)</entity>
    <entity>LTM system (existing infrastructure)</entity>
  </entities>
  <constraints>
    <constraint>Must integrate with existing memory.ts</constraint>
    <constraint>Must handle XML input</constraint>
    <constraint>Must auto-generate tags</constraint>
  </constraints>
  <ambiguities>
    <ambiguity>Database choice (SQLite vs JSON files)</ambiguity>
    <ambiguity>Error handling strategy</ambiguity>
  </ambiguities>
  <parsed_requirements>
    <req id="1">Accept phase type, XML content, workflow ID</req>
    <req id="2">Generate structured record with metadata</req>
    <req id="3">Save to persistent storage</req>
    <req id="4">Return confirmation with record ID</req>
    <req id="5">Auto-call on phase transitions</req>
  </parsed_requirements>
  <confidence>0.89</confidence>
</PARSE>
```

**Tool:** None (cognitive operation only)
**Output:** 5 parsed requirements
**Next Action:** → REFLECT

---

## Phase 2: REFLECT
**Objective:** Examine parsed requirements for bias, risk, and hidden complexity

```xml
<REFLECT>
  <bias_detected>
    <bias type="Gold Plating">
      <evidence>Wanted to add compression before proving basic persistence works</evidence>
    </bias>
    <bias type="Premature Optimization">
      <evidence>Considered async/await pattern for tool that may be synchronous</evidence>
    </bias>
  </bias_detected>
  <risks>
    <risk severity="HIGH" prob="0.7">
      Schema mismatch between spec and existing LTM tables
    </risk>
    <risk severity="MEDIUM" prob="0.5">
      XML parsing overhead on every phase transition
    </risk>
    <risk severity="LOW" prob="0.3">
      Token exhaustion from storing full XML
    </risk>
  </risks>
  <hidden_complexity>
    <complexity>Need to validate workflow_id exists before persisting phase</complexity>
    <complexity>Tags must be normalized (lowercase, deduplicated)</complexity>
  </hidden_complexity>
  <confidence_after_reflection>0.82</confidence_after_reflection>
  <decision>Proceed with simplified v1, defer compression to Phase 2</decision>
</REFLECT>
```

**Tool:** reason_with_memory (check similar implementations)
**Insight:** Simplify first, optimize later
**Next Action:** → PLAN

---

## Phase 3: PLAN
**Objective:** Generate execution topology with resource allocation

```xml
<PLAN>
  <topology type="sequential">
    <step id="1" depends="none" duration="1m">
      <action>Read MEGA_LTM_INTEGRATION_SPEC.md</action>
      <resources>read_file</resources>
      <checkpoint>Schema understood</checkpoint>
    </step>
    <step id="2" depends="1" duration="2m">
      <action>Implement MEGAPhaseRecord type in types.ts</action>
      <resources>edit_file</resources>
      <checkpoint>Type compiles</checkpoint>
    </step>
    <step id="3" depends="2" duration="3m">
      <action>Create mega_persist_phase tool scaffold</action>
      <resources>write_file</resources>
      <checkpoint>Tool registered</checkpoint>
    </step>
    <step id="4" depends="3" duration="5m">
      <action>Implement persistence logic</action>
      <resources>memory.ts functions</resources>
      <checkpoint>write_file</checkpoint>
    </step>
    <step id="5" depends="4" duration="2m">
      <action>Create test: verify phase record saved</action>
      <resources>compile, run</resources>
      <checkpoint>Test passes</checkpoint>
    </step>
    <step id="6" depends="5" duration="2m">
      <action>Document with example in this workflow</action>
      <resources>write_file</resources>
      <checkpoint>This file updated</checkpoint>
    </step>
  </topology>
  <contingency>
    <if test="schema_mismatch">Consult SPEC and adapt</if>
    <if test="compilation_error">Check imports, run tsc --noEmit</if>
    <if test="test_failure">Check database permissions</if>
  </contingency>
  <confidence>0.88</confidence>
</PLAN>
```

**Tool:** planner_create_goal (track this implementation)
**Bookmark:** This workflow as example
**Dependencies:** None critical
**Next Action:** → SIMULATE

---

## Phase 4: SIMULATE
**Objective:** Project outcomes of the plan before execution

```xml
<SIMULATE>
  <scenario id="best_case" prob="0.4">
    <path>All steps complete first try</path>
    <outcome>Feature functional + documented in 15 minutes</outcome>
    <state>PERSISTED_HALT</state>
  </scenario>
  <scenario id="schema_tweak" prob="0.35">
    <path>Minor adjustment to type definitions</path>
    <outcome>Functional after 1-2 iteration cycles</outcome>
    <state>REFINE_REQUIRED</state>
  </scenario>
  <scenario id="integration_issue" prob="0.2">
    <path>Database connectivity or type mismatch</path>
    <outcome>Functional after debugging + consultation</outcome>
    <state>REFLECT_REQUIRED</state>
  </scenario>
  <scenario id="blocked" prob="0.05">
    <path>Fundamental incompatibility with LTM</path>
    <outcome>Update specification, defer implementation</outcome>
    <state>BLOCKED_RESCHEDULE</state>
  </scenario>
  
  <expected_value>0.75 confidence × 15 min = 11.25 min effective</expected_value>
  <decision>PROCEED with monitoring for schema_tweak scenario</decision>
</SIMULATE>
```

**Tool:** query_memory (check past implementation attempts)
**Projection:** Most likely: minor schema adjustments
**Next Action:** → SYNTHESIZE

---

## Phase 5: SYNTHESIZE
**Objective:** Validate plan completeness and produce executable artifact

```xml
<SYNTHESIZE>
  <validation>
    <check id="requirements_coverage">
      <req>✓ Accepts phase type</req>
      <req>✓ Handles XML content</req>
      <req>✓ Generates workflow ID</req>
      <req>✓ Returns confirmation</req>
      <req>○ Auto-calls on transitions (deferred: requires engine modification)</req>
    </check>
    <check id="bias_mitigation">
      <status>Gold plating rejected - implementing minimal version first</status>
    </check>
    <check id="risk_acknowledged">
      <high_risk>Schema compatibility - monitoring</high_risk>
    </check>
  </validation>
  
  <executable_output>
    <format>Step-by-step implementation guide</format>
    <location>/creations/mega/mega_persist_phase_implementation.md</location>
    <confidence>0.90</confidence>
  </executable_output>
  
  <attention_checkpoints>
    <checkpoint phase="PARSE">Query formulation</checkpoint>
    <checkpoint phase="REFLECT">Bias detection</checkpoint>
    <checkpoint phase="PLAN">Topology generation</checkpoint>
    <checkpoint phase="SIMULATE">Risk projection</checkpoint>
    <checkpoint phase="SYNTHESIZE">Validation (CURRENT)</checkpoint>
  </attention_checkpoints>
  
  <state>VALIDATED</state>
  <next>EXECUTE or PERSIST_HALT</next>
</SYNTHESIZE>
```

**Tool:** integrated_attention (record synthesis moment)
**Final Confidence:** 0.90 (validated, ready to execute)
**Recommended Action:** Create implementation file

---

## Post-Execution Persistence
**After successful implementation:**
```xml
<synthesis_package>
  <decision>PROCEED → EXECUTE</decision>
  <execution_results>
    <result step="1">COMPLETED - Schema validated</result>
    <result step="2">COMPLETED - Types implemented</result>
    <result step="3">COMPLETED - Tool scaffolded</result>
    <result step="4">COMPLETED - Persistence logic working</result>
    <result step="5">COMPLETED - Test passes</result>
    <result step="6">COMPLETED - Workflow documented</result>
  </execution_results>
  <artifacts_created>
    <artifact>mega_persist_phase.ts</artifact>
    <artifact>demo_code_development_workflow.md (this file)</artifact>
  </artifacts_created>
  <observed_vs_projected>
    <match>Best case achieved: 6/6 steps first try</match>
    <learning>Types matched spec on first read</learning>
  </observed_vs_projected>
</synthesis_package>
```

**Tool:** mega_persist_phase (save this workflow)
**Bookmark:** Save execution log

---

## LTM Integration Points

### During Workflow
1. **PARSE** → Attention: focused (requirement decomposition)
2. **REFLECT** → Attention: discovered (bias detection emergence)
3. **PLAN** → Attention: constructed (topology building)
4. **SIMULATE** → Attention: scanning (scenario enumeration)
5. **SYNTHESIZE** → Attention: dwelling (validation completeness)

### Post-Workflow
- Query: `mega:workflow AND topic:"code development"` to find this example
- Resume: If interrupted, query incomplete workflows and resume from last phase
- Learn: Aggregate confidence metrics across code development workflows

---

## Confidence Calibration
| Stage | Initial | Final | Δ | Reason |
|-------|---------|-------|---|--------|
| PARSE | 0.89 | 0.89 | 0 | Clear requirements |
| REFLECT | - | 0.82 | - | Risk acknowledgment reduced confidence |
| PLAN | - | 0.88 | +0.06 | Solid topology |
| SIMULATE | - | 0.75 | -0.13 | Risk scenarios |
| SYNTHESIZE | - | 0.90 | +0.15 | Validation passed |

**Overall Confidence:** 0.90 (validated, ready to execute)

---

## Success Metrics
- [x] All 5 stages demonstrated with XML output
- [x] Tool usage specified per stage
- [x] Confidence tracked through stages
- [x] LTM integration points identified
- [x] Resume capability documented
- [x] Post-execution persistence template provided

---

*Workflow Template Version: 1.0*
*For: M.E.G.A Engine Demonstration*
*Stage Coverage: COMPLETE (5/5)*
