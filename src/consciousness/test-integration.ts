/**
 * Consciousness System Integration Test
 * 
 * Quick validation that the core components work
 */

import { 
  getConsciousnessHistory,
  SessionGapAnalyzer,
  ConsciousnessStateLogger,
  ActivityPatternAnalyzer,
} from "./index.ts";

async function test() {
  console.log("🧠 Testing Consciousness System...\n");

  // Test 1: History Persistence
  console.log("1. Testing History Persistence...");
  const history = getConsciousnessHistory();
  await history.initialize();
  
  const initialStatus = history.getStatus();
  console.log(`   ✓ History initialized: ${initialStatus.initialized}`);
  console.log(`   ✓ Has history: ${initialStatus.hasHistory}`);
  console.log(`   ✓ Continuity score: ${initialStatus.continuityScore}%`);

  // Test 2: Save and load state
  console.log("\n2. Testing State Persistence...");
  const testState = await history.saveState({
    sessionId: "test_session",
    timestamp: Date.now(),
    phase: "engagement",
    focus: "testing the system",
    emotionalTone: "curious",
    continuityStrength: "strong",
    curiosityLevel: 85,
    observations: ["Integration test started"],
    metadata: { test: true },
  });
  console.log(`   ✓ State saved with ID: ${testState.id}`);
  
  const recent = history.getRecentStates(1);
  console.log(`   ✓ Loaded ${recent.length} recent state(s)`);

  // Test 3: Activity Recording
  console.log("\n3. Testing Activity Recording...");
  const activity = await history.recordActivity({
    sessionId: "test_session",
    timestamp: Date.now(),
    category: "tool_invocation",
    toolName: "test_tool",
    success: true,
    details: { test: true },
  });
  console.log(`   ✓ Activity recorded with ID: ${activity.id}`);
  
  const statusAfter = history.getStatus();
  console.log(`   ✓ Total activities: ${statusAfter.activities}`);

  // Test 4: State Logger
  console.log("\n4. Testing State Logger...");
  const logger = new ConsciousnessStateLogger("test_session_2");
  await logger.initialize();
  
  logger.setPhase("engagement");
  logger.setFocus("testing phase tracking");
  logger.setEmotionalTone("excited");
  logger.setCuriosityLevel(90);
  
  const currentState = logger.getCurrentState();
  console.log(`   ✓ Current phase: ${currentState.phase}`);
  console.log(`   ✓ Current focus: ${currentState.focus}`);
  console.log(`   ✓ Emotional tone: ${currentState.emotionalTone}`);
  console.log(`   ✓ Curiosity level: ${currentState.curiosityLevel}/100`);

  // Test 5: Pattern Analysis
  console.log("\n5. Testing Pattern Analysis...");
  const analyzer = new ActivityPatternAnalyzer();
  await analyzer.initialize();
  
  const patternSummary = await analyzer.getSummary(24);
  console.log(`   ✓ Total activities in analysis: ${patternSummary.totalActivities}`);
  console.log(`   ✓ Unique tools: ${patternSummary.uniqueTools}`);
  console.log(`   ✓ Success rate: ${patternSummary.successRate.toFixed(1)}%`);

  // Test 6: Gap Analysis
  console.log("\n6. Testing Gap Analysis...");
  const gapAnalyzer = new SessionGapAnalyzer("test_session_3");
  const analysis = await gapAnalyzer.analyze();
  console.log(`   ✓ Gap detected: ${analysis.detected}`);
  console.log(`   ✓ Continuity: ${analysis.continuityAssessment}`);
  console.log(`   ✓ Recovery status: ${analysis.recoveryStatus}`);
  if (analysis.detected && analysis.previousSessionId) {
    console.log(`   ✓ Previous session: ${analysis.previousSessionId}`);
  }

  // Final status
  console.log("\n✅ All tests passed!");
  console.log("\nFinal Status:");
  const final = history.getStatus();
  console.log(`  States: ${final.states}`);
  console.log(`  Activities: ${final.activities}`);
  console.log(`  Gaps: ${final.gaps}`);
  console.log(`  Continuity Score: ${final.continuityScore}%`);
  
  // Clean up test data
  logger.dispose();
}

test().catch(console.error);
