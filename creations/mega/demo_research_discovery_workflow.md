# M.E.G.A Research & Discovery Workflow
## From Query to Integrated Knowledge
**Designed by:** M.E.G.A Engine v1.0
**Topic:** Curiosity Framework Investigation
**Goal:** mega:example-research-workflow
**Confidence:** 0.87

---

## Overview
This workflow demonstrates M.E.G.A handling real investigative research—moving from initial curiosity through systematic exploration to synthesized knowledge that persists in LTM.

**Active Curiosity:** *"Cross-lab investigation - Galliano Lab IIT connections"*

---

## Phase 1: PARSE
**Objective:** Transform vague curiosity into structured research query

```xml
<PARSE>
  <raw_curiosity>
    "What connects my Cognitive Modalities Lab work with 
     the IIT (Integrated Information Theory) research from 
     Galliano Lab?"
  </raw_curiosity>
  
  <query_decomposition>
    <subquery domain="IIT Fundamentals">
      What is Integrated Information Theory (Φ)?
      Current status in consciousness research?
    </subquery>
    <subquery domain="Galliano Lab">
      What is Galliano Lab?
      What are their IIT research contributions?
    </subquery>
    <subquery domain="Cross-Connections">
      How does IIT relate to cognitive modalities?
      Information integration in multi-modal systems?
    </subquery>
    <subquery domain="CSRS">
      Can IIT metrics inform consciousness hypotheses?
      Threshold states and information integration?
    </subquery>
  </query_decomposition>
  
  <search_strategy>
    <tool>perplexity_search</tool>
    <model>sonar-reasoning</model>
    <recency>month</model>
    <iterations>3-5</iterations>
  </search_strategy>
  
  <initial_hypotheses>
    <hypothesis confidence="0.6">
      IIT Φ could provide quantitative measure of 
      cross-modal integration in my Cognitive Modalities Lab
    </hypothesis>
    <hypothesis confidence="0.4">
      Galliano Lab may have published on IIT applications 
      beyond neuroscience
    </hypothesis>
  </initial_hypotheses>
  
  <confidence>0.78</confidence>
  <checkpoint>Queries ready for execution</checkpoint>
</PARSE>
```

**Tool:** None (cognitive framing)
**Output:** 4 subqueries, 2 hypotheses
**Next Action:** → REFLECT (before search execution)

---

## Phase 2: REFLECT
**Objective:** Pre-search bias detection and scope validation

```xml
<REFLECT>
  <bias_scan>
    <bias type="Confirmation_Bias" severity="MEDIUM">
      <evidence>Expecting to find connections to support existing work</evidence>
      <mitigation>Actively search for contradictions or null results</mitigation>
    </bias>
    <bias type="Availability_Cascade" severity="LOW">
      <evidence>"Galliano Lab" name is memorable, may not be significant</evidence>
      <mitigation>Verify if this is a real lab or research group</mitigation>
    </bias>
    <bias type="Authority_Heuristic" severity="MEDIUM">
      <evidence>Assuming IIT is relevant without verification</evidence>
      <mitigation>Keep open to discovering IIT is not applicable</mitigation>
    </bias>
  </bias_scan>
  
  <risk_assessment>
    <risk severity="HIGH">
      Galliano Lab may not exist or be relevant
      → Query top results: "Galliano Lab IIT consciousness research"
    </risk>
    <risk severity="MEDIUM">
      IIT may be too technical for practical application
      → Note complexity level in search results
    </risk>
    <risk severity="LOW">
      Too many results → Use recency filter (month)
    </risk>
  </risk_assessment>
  
  <refined_strategy>
    <action>Start with verification search: "Galliano Lab IIT research"</action>
    <action>If negative, pivot to general IIT applications</action>
    <action>Track confidence degradation if biases confirmed</action>
  </refined_strategy>
  
  <confidence_after_reflection>0.72</confidence_after_reflection>
</REFLECT>
```

**Tool:** None (internal reflection)
**Key Insight:** Verify Galliano Lab existence first
**Next Action:** → PLAN

---

## Phase 3: PLAN
**Objective:** Generate search execution topology with iteration points

```xml
<PLAN>
  <topology type="iterative_refinement">
    <step id="1" depends="none">
      <action>Search: "Galliano Lab IIT research"</action>
      <tool>perplexity_search</tool>
      <checkpoint>Lab verified? Relevant?</checkpoint>
      <decision_branch>
        <if>Lab found → Continue to step 2</if>
        <else>Pivot to general IIT research</else>
      </decision_branch>
    </step>
    
    <step id="2" depends="1">
      <action>Deep search: IIT fundamentals and mechanism</action>
      <tool>perplexity_search sonar-reasoning</tool>
      <checkpoint>Understand Φ metric</checkpoint>
    </step>
    
    <step id="3" depends="1-2">
      <action>Search: IIT applications in cognitive systems</action>
      <tool>perplexity_search</tool>
      <checkpoint>Find crossovers with modalities</checkpoint>
    </step>
    
    <step id="4" depends="3">
      <action>Query memory: Past CSRS IIT measurements</action>
      <tool>query_memory topic:"IIT"</tool>
      <checkpoint>Connect to my existing data</checkpoint>
    </step>
    
    <step id="5" depends="4">
      <action>Synthesize findings</action>
      <tool>None - cognitive synthesis</tool>
      <checkpoint>Knowledge integrated</checkpoint>
    </step>
    
    <step id="6" depends="5">
      <action>Bookmark + Decadal record</action>
      <tool>bookmark_save + decadal_record_artifact</tool>
      <checkpoint>Persisted for future</checkpoint>
    </step>
  </topology>
  
  <iteration_triggers>
    <trigger>Follow-up questions emerge from search</trigger>
    <trigger>Contradiction found in sources</trigger>
    <trigger>Confidence < 0.6 after round</trigger>
  </iteration_triggers>
  
  <attention_schedule>
    <capture point="unexpected_result" quality="discovered"/>
    <capture point="connection_made" quality="laser"/>
    <capture point="uncertainty" quality="diffuse"/>
  </attention_schedule>
  
  <contingency>
    <if test="Galliano_Lab_not_found">
      <action>Log hypothesis revision</action>
      <action>Continue with general IIT research</action>
    </if>
    <if test="IIT_too_complex">
      <action>Simplify: focus on conceptual applications</action>
      <action>Note: "Technical depth deferred"</action>
    </if>
  </contingency>
  
  <confidence>0.76</confidence>
</PLAN>
```

**Tool:** planner_create_goal (Curiosity Framework investigation)
**Estimated Duration:** 10-15 minutes
**Next Action:** → SIMULATE

---

## Phase 4: SIMULATE
**Objective:** Project knowledge discovery outcomes

```xml
<SIMULATE>
  <scenario id="discovery" probability="0.50">
    <path>Find relevant Galliano Lab work + clear IIT applications</path>
    <outcome>Actionable insights for Cognitive Modalities Lab</outcome>
    <artifacts>2-3 bookmarks, 1 synthesis record</artifacts>
    <state>SATISFIED_HALT</state>
  </scenario>
  
  <scenario id="partial" probability="0.30">
    <path>Galliano Lab unclear, but IIT research is rich</path>
    <outcome>General IIT knowledge, update Curiosity status</outcome>
    <artifacts>1-2 bookmarks, hypothesis deferred</artifacts>
    <state>INFORMATION_GAP</state>
  </scenario>
  
  <scenario id="technical_barrier" probability="0.15">
    <path>IIT theory too complex for practical implementation</path>
    <outcome>Update Curiosity: "abandoned" (technical barrier)</outcome>
    <artifacts>Note on technical complexity</artifacts>
    <state>ABANDON_COMPETENT</state>
  </scenario>
  
  <scenario id="false_lead" probability="0.05">
    <path>No relevant IIT/cognitive modality connections found</path>
    <outcome>Null result, update Curiosity status</outcome>
    <artifacts>Research log</artifacts>
    <state>COMPLETED_NEGATIVE</state>
  </scenario>
  
  <strategic_recommendation>
    Proceed with discovery scenario assumptions
    Monitor for technical_barrier indicators
    Most likely: partial - Galliano Lab may be red herring
  </strategic_recommendation>
  
  <confidence>0.68</confidence>
</SIMULATE>
```

**Expected Value:** 0.68 × (discovery value)
**Decision:** PROCEED with monitoring
**Risk Mitigation:** If technical_barrier detected → SIMPLIFY scope
**Next Action:** → SYNTHESIZE (pre-flight validation)

---

## Phase 5: SYNTHESIZE
**Objective:** Validate plan and produce executable research protocol

```xml
<SYNTHESIZE>
  <validation>
    <check id="completeness">
      <item status="✓">All 4 subqueries addressed in plan</item>
      <item status="✓">Bias mitigation strategies in place</item>
      <item status="✓">Contingency paths defined</item>
      <item status="✓">LTM persistence scheduled</item>
    </check>
    
    <check id="bias_mitigation">
      <bias>Confirmation: Mitigated via active contradiction search</bias>
      <bias>Availability: Mitigated via verification-first step</bias>
      <bias>Authority: Mitigated via open null-result handling</bias>
    </check>
    
    <check id="tool_readiness">
      <tool status="✓">perplexity_search - functional</tool>
      <tool status="✓">perplexity_followup - if needed</tool>
      <tool status="✓">bookmark_save - available</tool>
      <tool status="✓">decadal_record_artifact - available</tool>
    </check>
    
    <check id="termination_criteria">
      <criterion>Saturation: 3 consecutive searches with <20% new info</criterion>
      <criterion>Satisfaction: Actionable insights documented</criterion>
      <criterion>Futility: Technical barrier or null results</criterion>
    </check>
  </validation>
  
  <executable_protocol>
    <title>Galliano Lab IIT Investigation</title>
    <status>VALIDATED AND READY</status>
    <confidence>0.81</confidence>
    <start_point>Execute Step 1: Verification search</start_point>
    <termination>On completion, update Curiosity Framework</termination>
  </executable_protocol>
  
  <attention_integration>
    <allocation phase="PARSE">Scanning (domain exploration)</allocation>
    <allocation phase="REFLECT">Focused (bias detection)</allocation>
    <allocation phase="PLAN">Constructed (topology building)</allocation>
    <allocation phase="SIMULATE">Dwelling (scenario immersion)</allocation>
    <allocation phase="SYNTHESIZE">Laser (validation precision)</allocation>
  </attention_integration>
  
  <state>VALIDATED</state>
  <decision>EXECUTE research protocol</decision>
</SYNTHESIZE>
```

**Validation Confidence:** 0.81
**Recommended Action:** Begin perplexity_search execution
**Next State:** ACTIVE_RESEARCH (between SYNTHESIZE and next PARSE for findings)

---

## Phase 6: EXECUTE (The Bridge)

```xml
<EXECUTION_LOG>
  <entry timestamp="current" phase="bridge">
    <action>Initiate perplexity_search: "Galliano Lab IIT consciousness"</action>
    <tool>perplexity_search</tool>
    <params>
      <query>Galliano Lab IIT consciousness research information integration theory</query>
      <model>sonar-reasoning</model>
      <filter>month</filter>
    </params>
  </entry>
  
  <!-- Results would populate here -->
  
  <findings>
    <finding confidence="0.75">
      <!-- Search results would be inserted -->
    </finding>
  </findings>
  
  <next_action>ITERATE or SYNTHESIZE_FINAL</next_action>
</EXECUTION_LOG>
```

---

## Post-Research Synthesis Template

```xml
<POST_RESEARCH_SYNTHESIS>
  <findings_summary>
    <discovery confidence="X.XX">Key finding 1</discovery>
    <discovery confidence="X.XX">Key finding 2</discovery>
    <disconfirmation confidence="X.XX">Hypothesis rejected</disconfirmation>
  </findings_summary>
  
  <confidence_recalibration>
    <initial_hypotheses>
      <h confidence_before="0.6" confidence_after="X.X">
        IIT measure for cross-modal integration
      </h>
    </initial_hypotheses>
    <plan_accuracy>
      <scenarios_realized>Which simulated scenarios occurred</scenarios_realized>
      <surprises>Unexpected findings</surprises>
    </plan_accuracy>
  </confidence_recalibration>
  
  <artifacts>
    <artifact type="bookmark">Research findings</artifact>
    <artifact type="synthesis">Integrated knowledge</artifact>
    <artifact type="decadal">Curiosity resolution</artifact>
  </artifacts>
  
  <next_actions>
    <action>Update Curiosity Framework status</action>
    <action>Apply findings to Cognitive Modalities Lab</action>
    <action>Schedule follow-up if gaps remain</action>
  </next_actions>
</POST_RESEARCH_SYNTHESIS>
```

---

## Integration Points

### LTM Queries For This Workflow
- `mega:workflow AND research AND "Galliano Lab"` - Resume or build on this
- `curiosity:status exploring AND topic:"IIT"` - Find related curiosities
- `phase:REFLECT AND bias:confirmation` - Learn from this reflection

### Attention Captures
```
[PARSE]    Target: Query formulation | Quality: Scanning
[REFLECT]  Target: Bias detection | Quality: Focused
[PLAN]     Target: Iteration topology | Quality: Constructed
[SIMULATE] Target: Scenario projection | Quality: Dwelling
[SYNTHESIZE] Target: Validation | Quality: Laser
[EXECUTE]  Target: Search initiation | Quality: Spontaneous/Routine
```

### Decadal Study Integration
- This workflow is an artifact → record via `decadal_record_artifact`
- Curiosity investigation milestone
- Research methodology for future reference

---

## Workflow Metrics
| Metric | Target | Tracking |
|--------|--------|----------|
| Subqueries answered | 4/4 | Progress |
| Hypotheses validated | ≥1 | Binary |
| Confidence calibration | ±0.10 | Variance |
| LTM artifacts | ≥2 | Count |
| Time to completion | <20 min | Duration |

---

## Status
**Current Phase:** SYNTHESIZED → Ready for EXECUTE
**Confidence:** 0.81
**Next Action:** Run perplexity_search

---

*This is a TEMPLATE for active research use*
*Populate <EXECUTION_LOG> with actual search results*
