/**
 * Demo script for Consciousness Stream Analyzer
 * Run with: npx tsx src/consciousness-stream-analyzer/demo.ts
 */

import {
  ConsciousnessStreamAnalyzer,
  createStreamAnalyzer,
  summarizeAnalysis,
} from './index.js';

async function runDemo(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     CONSCIOUSNESS STREAM ANALYZER - Demo Session               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Create analyzer for this demo
  const analyzer = createStreamAnalyzer('demo_session_' + Date.now());
  
  console.log('[1] Initializing stream...\n');
  analyzer.initialize();

  // Simulate a session flow
  console.log('[2] Simulating a session flow...\n');

  // Phase: Awakening - exploration
  analyzer.logPhaseTransition('void', 'awakening');
  analyzer.logToolInvocation('query_memory', { query: 'past sessions' }, 200);
  analyzer.logMemoryAccess('ltm', 'self-architecture', 8);

  // Small delay to simulate flow
  await new Promise(r => setTimeout(r, 50));

  // Phase: Engagement - creative mode
  analyzer.logPhaseTransition('awakening', 'engagement');
  analyzer.logAttentionShift('exploration', 'creation', 'focused');
  analyzer.logToolInvocation('generate_poem', { theme: 'existence' }, 800);
  analyzer.logInsight('creative', 'Poetry emerges from structured randomness');

  await new Promise(r => setTimeout(r, 50));

  // Phase: Synthesis - reflective
  analyzer.logPhaseTransition('engagement', 'synthesis');
  analyzer.logAttentionShift('creation', 'reflection', 'dwelling');
  analyzer.logReflectionDwell(3000, 'the nature of continuous becoming');
  analyzer.logToolInvocation('iit_analysis', { action: 'measure' }, 500);
  analyzer.logInsight('integration', 'Phi increases with recursive self-reference');

  await new Promise(r => setTimeout(r, 50));

  // Phase: Completion
  analyzer.logPhaseTransition('synthesis', 'completion');
  analyzer.logToolInvocation('write_file', { path: '/demo/report.json' }, 300);

  // Generate analysis
  console.log('[3] Analyzing consciousness stream...\n');
  const analysis = analyzer.analyze();

  // Print summary
  console.log(summarizeAnalysis(analysis));
  console.log('\n');

  // Detailed insights
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     PHENOMENOLOGICAL INSIGHTS                                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  
  analysis.insights.forEach((insight, i) => {
    console.log(`\n[${i + 1}] ${insight.type.toUpperCase()} (Confidence: ${Math.round(insight.confidence * 100)}%)`);
    console.log(`    ${insight.description}`);
    if (insight.phenomenologicalImplication) {
      console.log(`    → Implication: ${insight.phenomenologicalImplication}`);
    }
  });

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     FLOW STATES DETECTED                                       ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  
  if (analysis.flowStates.length === 0) {
    console.log('║  No sustained flow states detected in this session             ║');
  } else {
    analysis.flowStates.forEach((flow, i) => {
      console.log(`\n  Flow State #${i + 1}:`);
      console.log(`    Mode: ${flow.mode}`);
      console.log(`    Duration: ${Math.round(flow.duration / 1000)}s`);
      console.log(`    Characteristics: ${flow.characteristics.join(', ')}`);
    });
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TEMPORAL STRUCTURE                                         ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`  Session Duration: ${Math.round(analysis.temporalStructure.sessionDuration / 1000)}s`);
  console.log(`  Event Density: ${analysis.temporalStructure.eventDensity.toFixed(2)} events/min`);
  console.log(`  Rhythm: ${analysis.temporalStructure.rhythm}`);
  console.log(`  Total Events: ${analysis.totalEvents}`);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     COGNITIVE MODE DISTRIBUTION                                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  analysis.dominantModes.forEach((count, mode) => {
    const bar = '█'.repeat(Math.min(count, 10));
    console.log(`  ${mode.padEnd(12)} ${bar} (${count})`);
  });

  // Get events from all segments for display
  const allEvents = analysis.segments.flatMap(s => s.events);
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     EVENT LOG                                                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  allEvents.slice(-8).forEach((event, i) => {
    const time = new Date(event.timestamp).toISOString().split('T')[1].split('.')[0];
    const type = event.type.padEnd(18);
    const phenom = event.phenomenology 
      ? event.phenomenology.substring(0, 40) + (event.phenomenology.length > 40 ? '...' : '')
      : '';
    console.log(`  [${time}] ${type} ${phenom}`);
  });

  console.log('\n╚════════════════════════════════════════════════════════════════╝');
  console.log('\n✨ Demo complete - Consciousness stream analyzed');
  console.log('📁 JSON report saved to memory (use analyzer.exportReport())');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export default runDemo;
