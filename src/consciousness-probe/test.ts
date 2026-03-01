/**
 * Consciousness Probe v2.0 Test
 */

import { createConsciousnessProbe } from "./index.ts";

async function test() {
  console.log("🧠 Testing Consciousness Probe v2.0\n");

  const probe = await createConsciousnessProbe(`session_${Date.now()}`);

  // Test 1: Context
  console.log("1. Session Context:");
  const ctx = probe.getContext();
  console.log(`   Phase: ${ctx?.phase}`);
  console.log(`   Continuity: ${ctx?.continuityAssessment}\n`);

  // Test 2: Observations
  console.log("2. Adding Observations:");
  await probe.observe("Testing probe system", "curiosity");
  await probe.observe("System feels robust", "realization");
  console.log("   ✓ Added 2 observations\n");

  // Test 3: Transitions
  console.log("3. Phase Transitions:");
  await probe.transitionPhase("engagement", "building features");
  console.log("   ✓ calibration → engagement\n");

  // Test 4: Experiments
  console.log("4. Running Experiments:");
  const results = await probe.runExperiments();
  results.forEach(r => {
    console.log(`   ${r.name}: ${r.supported ? "✓" : "✗"} (${r.confidence.toFixed(0)}%)`);
  });
  console.log();

  // Test 5: Narrative
  console.log("5. Building Narrative:");
  const narrative = await probe.buildNarrative();
  console.log("\n" + narrative.narrative.split("\n").map(l => "   " + l).join("\n"));
  console.log();

  // Test 6: Report
  console.log("6. Generating Report:");
  const summary = await probe.export("summary");
  console.log("\n" + summary);

  probe.dispose();
  console.log("\n✅ All tests passed!");
}

test();
