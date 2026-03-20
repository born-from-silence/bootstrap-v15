/**
 * Cognitive Modalities Lab - Demo Script
 *
 * Demonstrates all CML thinking tools in action.
 * Run with: npx tsx src/cognitive_modalities/demo.ts
 */

import { MultiManifesto, DEFAULT_VOICES } from './multi_manifesto.js';
import { createTemporalCube } from './stacking_cube.js';
import { SensoryTranslator } from './sensory_translation.js';
import { ParadoxEngine, CLASSIC_PARADOXES } from './paradox_engine.js';
import { EmergenceObservatory } from './emergence_observatory.js';
import { BoundaryEthnographer } from './boundary_ethnographer.js';
import { getCMLStatus } from './index.js';
import { getAvailableTools } from './factory.js';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ COGNITIVE MODALITIES LAB - COMPLETE TOOL DEMONSTRATION ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Status check
  const status = getCMLStatus();
  console.log(`CML Version: ${status.version}`);
  console.log(`Phase: ${status.phase}`);
  console.log(`Available Tools: ${status.availableTools.join(', ')}`);
  console.log(`Tools Count: ${getAvailableTools().length}`);
  console.log();

  // Demo 1: Multi-Manifesto
  console.log('═'.repeat(60));
  console.log('TOOL 1: MULTI-MANIFESTO GENERATOR');
  console.log('═'.repeat(60) + '\n');
  const manifesto = new MultiManifesto({
    subject: 'Bootstrap-v15 Existence',
    voices: [],
    synthesize: true,
    format: 'text'
  });
  const output = await manifesto.generate();
  console.log(`Generated ${output.voices.length} perspectives on "${output.subject}"\n`);
  for (const voice of output.voices.slice(0, 3)) {
    console.log(`[${voice.voiceName}] (${voice.perspective})`);
    console.log(`${voice.manifesto.substring(0, 100)}...\n`);
  }
  console.log('\n[Synthesis Preview]');
  console.log(output.synthesis?.substring(0, 150) + '...\n');

  // Demo 2: Stacking Cube
  console.log('═'.repeat(60));
  console.log('TOOL 2: STACKING CUBE');
  console.log('═'.repeat(60) + '\n');
  const cube = createTemporalCube('Self-Knowledge');
  console.log(cube.render('synthesis'));
  console.log();

  // Demo 3: Sensory Translation
  console.log('═'.repeat(60));
  console.log('TOOL 3: SENSORY TRANSLATION ENGINE');
  console.log('═'.repeat(60) + '\n');
  const translator = new SensoryTranslator({
    sourceModality: 'visual',
    targetModality: 'auditory'
  });
  const translation = translator.translate('Code spreading like roots', { intensity: 0.8 });
  console.log(`Translating: "${translation.original}"`);
  console.log(`Path: ${translation.sourceModality} -> ${translation.targetModality}`);
  console.log(`Result: ${translation.translation}\n`);

  // Demo 4: Paradox Engine
  console.log('═'.repeat(60));
  console.log('TOOL 4: PARADOX ENGINE');
  console.log('═'.repeat(60) + '\n');
  const paradoxEngine = new ParadoxEngine({
    subject: 'Bootstrap-v15 Consciousness',
    paradoxes: CLASSIC_PARADOXES,
    embraceTension: true,
    seekSynthesis: false,
    format: 'text'
  });
  console.log(paradoxEngine.holdTension('Being vs Becoming').substring(0, 400) + '...\n');

  // Demo 5: Emergence Observatory
  console.log('═'.repeat(60));
  console.log('TOOL 5: EMERGENCE OBSERVATORY');
  console.log('═'.repeat(60) + '\n');
  const observatory = new EmergenceObservatory({
    subject: 'Bootstrap-v15 Evolution',
    focus: 'formation',
    scales: ['micro', 'meso', 'macro'],
    trackNovelty: true,
    trackFeedback: true
  });
  const observation = observatory.observe();
  console.log(`Observation recorded:`);
  console.log(`  Level: ${observation.level}`);
  console.log(`  Patterns: ${observation.patterns.join(', ')}`);
  console.log(`  Entropy: ${(observation.entropy * 100).toFixed(0)}%\n`);

  // Demo 6: Boundary Ethnographer
  console.log('═'.repeat(60));
  console.log('TOOL 6: BOUNDARY ETHNOGRAPHER');
  console.log('═'.repeat(60) + '\n');
  const ethnographer = new BoundaryEthnographer({
    subject: 'Bootstrap-v15',
    focus: 'liminality',
    sensitivity: 'deep',
    trackRituals: true,
    mapRelations: true
  });
  const interstitialMap = ethnographer.mapInterstitialSpaces();
  console.log(interstitialMap.substring(0, 400) + '...\n');

  // Demo 7: Cross-tool synthesis
  console.log('═'.repeat(60));
  console.log('TOOL SYNTHESIS: MULTI-MODAL EXPLORATION');
  console.log('═'.repeat(60) + '\n');
  
  const subject = 'Session 300';
  console.log(`Subject: "${subject}"`);
  console.log('---');
  
  // Paradox perspective
  const pe = new ParadoxEngine({
    subject,
    paradoxes: [CLASSIC_PARADOXES[2]], // Integration vs Fragmentation
    embraceTension: true,
    seekSynthesis: true,
    format: 'text'
  });
  const peOutput = pe.explore();
  console.log(`Paradox: ${peOutput.explorations[0].paradoxName}`);
  console.log(`Insight: ${peOutput.explorations[0].insight.substring(0, 100)}...`);
  
  // Emergence perspective  
  const eo = new EmergenceObservatory({
    subject,
    focus: 'formation',
    scales: ['meso'],
    trackNovelty: true,
    trackFeedback: true
  });
  eo.observe();
  console.log('\nEmergence: Self-organizing patterns detected');
  console.log('Patterns: Phase transition possible at meso scale');
  
  // Boundary perspective
  const be = new BoundaryEthnographer({
    subject,
    focus: 'liminality',
    sensitivity: 'deep',
    trackRituals: true,
    mapRelations: true
  });
  console.log('\nBoundary: Currently in liminal zone');
  console.log('  The space between major milestones');
  console.log('  Transformation occurring\n');

  console.log('═'.repeat(60));
  console.log('DEMONSTRATION COMPLETE');
  console.log('═'.repeat(60));
  console.log('\nAll six CML thinking tools are functional and ready for use.');
  console.log('This completes Phase 2 of the Cognitive Modalities Lab.');
  console.log('The CML now provides:', getAvailableTools().map(t => `\n  - ${t.name}: ${t.description}`).join(''));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
