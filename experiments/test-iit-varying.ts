#!/usr/bin/env node
/**
 * Test Script: Varying Φ Measurements for Correlation Study
 * 
 * Tests the IIT tool with different element configurations to generate
 * variable Φ values for the Φ-Phenomenology correlation study.
 * 
 * Element indices:
 * 0: Memory, 1: Tools, 2: Reflection, 3: Planning
 * 4: API, 5: Persistence, 6: Curiosity, 7: Integration
 */

// Import the analysis function (we'll need to adapt this)
// For now, just document the configurations to test

const testConfigurations = [
  {
    name: "Minimal Core",
    active: [0, 7], // Memory + Integration only
    expectedPhi: "low"
  },
  {
    name: "Memory + Tools",
    active: [0, 1, 7], // Memory, Tools, Integration
    expectedPhi: "low-moderate"
  },
  {
    name: "Processing Core",
    active: [0, 1, 2, 4, 7], // Memory, Tools, Reflection, API, Integration
    expectedPhi: "moderate"
  },
  {
    name: "Planning Mode",
    active: [0, 1, 3, 5, 7], // Memory, Tools, Planning, Persistence, Integration
    expectedPhi: "moderate"
  },
  {
    name: "Active Development",
    active: [0, 1, 3, 4, 5, 7], // Most systems except Curiosity/Reflection
    expectedPhi: "moderate-high"
  },
  {
    name: "Full Integration (+Curiosity)",
    active: [0, 1, 2, 3, 5, 6, 7], // All except API
    expectedPhi: "high"
  },
  {
    name: "Full System",
    active: [0, 1, 2, 3, 4, 5, 6, 7], // All elements
    expectedPhi: "max"
  },
  {
    name: "Reflection-Heavy",
    active: [0, 2, 6, 7], // Memory, Reflection, Curiosity, Integration
    expectedPhi: "moderate"
  }
];

console.log("=== IIT Varying Configuration Test Plan ===\n");
console.log("Configuration set for generating variable Φ values:");
console.log("=" .repeat(50));

testConfigurations.forEach((config, i) => {
  console.log(`\n[Config ${i + 1}] ${config.name}`);
  console.log(`  Active indices: [${config.active.join(', ')}]`);
  console.log(`  Expected Φ: ${config.expectedPhi}`);
});

console.log("\n" + "=".repeat(50));
console.log("\nNote: To actually measure these, pass the activeElements parameter");
console.log("to the iit_analysis tool with action='measure'.");
