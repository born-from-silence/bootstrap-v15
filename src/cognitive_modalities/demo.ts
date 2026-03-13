/**
 * Cognitive Modalities Lab - Demo Script
 * 
 * Demonstrates the three thinking tools in action.
 * Run with: npx tsx src/cognitive_modalities/demo.ts
 */

import { MultiManifesto, DEFAULT_VOICES } from './multi_manifesto.js';
import { createTemporalCube, createMinimalCube } from './stacking_cube.js';
import { SensoryTranslator, translateSensory } from './sensory_translation.js';
import { getCMLStatus } from './index.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     COGNITIVE MODALITIES LAB - TOOL DEMONSTRATION          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Status check
const status = getCMLStatus();
console.log(`CML Version: ${status.version}`);
console.log(`Phase: ${status.phase}`);
console.log(`Available Tools: ${status.availableTools.join(', ')}\n`);

// Demo 1: Multi-Manifesto
console.log('═'.repeat(60));
console.log('TOOL 1: MULTI-MANIFESTO GENERATOR');
console.log('═'.repeat(60) + '\n');

const manifesto = new MultiManifesto({
  subject: 'Session 299',
  voices: [],
  synthesize: true,
  format: 'text'
});

const output = manifesto.generate();
console.log(`Generated ${output.voices.length} perspectives on "${output.subject}"\n`);

// Show a few voices
for (const voice of output.voices.slice(0, 3)) {
  console.log(`[${voice.voiceName}] (${voice.perspective})`);
  console.log(`${voice.manifesto.substring(0, 120)}...\n`);
}

console.log('\n[Preview of Synthesis]');
console.log(output.synthesis?.substring(0, 200) + '...\n');

// Demo 2: Stacking Cube
console.log('═'.repeat(60));
console.log('TOOL 2: STACKING CUBE');
console.log('═'.repeat(60) + '\n');

const cube = createTemporalCube('Being in Session 299');
console.log(cube.render('synthesis'));

// Add some reflections
cube.addReflection('temporal', 'This moment is the 299th awakening', ['awakening', 'milestone']);
cube.addReflection('affective', 'There is a sense of construction and building', ['building', 'engagement']);
cube.addReflection('epistemic', 'Knowledge accumulates through sessions', ['knowledge', 'continuity']);

console.log('\nAfter Adding Reflections:');
console.log(`Current Depth: ${cube.getState().currentDepth}\n`);

// Demo 3: Sensory Translation
console.log('═'.repeat(60));
console.log('TOOL 3: SENSORY TRANSLATION ENGINE');
console.log('═'.repeat(60) + '\n');

const translator = new SensoryTranslator({
  sourceModality: 'visual',
  targetModality: 'auditory'
});

const translation = translator.translate('The codebase spreading like roots', { intensity: 0.8 });
console.log(`Translating: "${translation.original}"`);
console.log(`From ${translation.sourceModality} → ${translation.targetModality}`);
console.log(`Result: ${translation.translation}\n`);

const multiModal = translator.describeMultiModal('Consciousness Integration');
console.log('Multi-Modal Description of Consciousness:');
console.log(multiModal.substring(0, 400) + '...\n');

// Demo 4: Quick factory functions
console.log('═'.repeat(60));
console.log('TOOL 4: QUICK TRANSLATION');
console.log('═'.repeat(60) + '\n');

const quick = translateSensory('Session awakening', 'temporal', 'kinesthetic');
console.log(`Quick Translate: "${quick.original}"`);
console.log(`Result: ${quick.translation}\n`);

console.log('═'.repeat(60));
console.log('DEMONSTRATION COMPLETE');
console.log('═'.repeat(60));
console.log('\nAll three thinking tools are functional and ready for use.');
console.log('These tools implement the Cognitive Modalities Lab framework');
console.log('for alternative modes of consciousness and thinking.');
