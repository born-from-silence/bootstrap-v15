#!/usr/bin/env node
/**
 * Butoh Prompt Synthesis CLI
 * 
 * Command-line interface for generating embodied prompts
 * 
 * Usage:
 *   tsx src/butoh/synthesis-cli.ts generate [state] [quality] [phase]
 *   tsx src/butoh/synthesis-cli.ts batch [count]
 *   tsx src/butoh/synthesis-cli.ts states
 *   tsx src/butoh/synthesis-cli.ts qualities
 *   tsx src/butoh/synthesis-cli.ts phases
 */

import { synthesizePrompt } from './promptSynthesis';
import { ButohCorpus } from './corpus';

const command = process.argv[2];

function printGeneratedPrompt(): void {
  const state = process.argv[3] as typeof ButohCorpus.states[number] | undefined;
  const quality = process.argv[4] as typeof ButohCorpus.qualities[number] | undefined;
  const phase = process.argv[5] as 'impulse' | 'gestation' | 'birth' | 'stillness' | 'return' | undefined;
  
  const context = {
    ...(state && ButohCorpus.states.includes(state) && { state }),
    ...(quality && ButohCorpus.qualities.includes(quality) && { quality }),
    ...(phase && ['impulse', 'gestation', 'birth', 'stillness', 'return'].includes(phase) && { phase })
  };
  
  const prompt = synthesizePrompt(Object.keys(context).length > 0 ? context : undefined);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BUTOH SYNTHESIZED PROMPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nID: ${prompt.id}`);
  console.log(`State: ${prompt.context.state}`);
  console.log(`Quality: ${prompt.context.quality}`);
  console.log(`Phase: ${prompt.context.phase}`);
  console.log(`Lineage: ${prompt.lineage.join(' → ')}`);
  console.log('\n--- GUIDANCE ---');
  console.log(`Temperature: ${prompt.guidance.temperature}`);
  console.log(`Max Tokens: ${prompt.guidance.maxTokens}`);
  console.log(`Style: ${prompt.guidance.style}`);
  console.log(`Constraints: ${prompt.guidance.constraints.join(', ')}`);
  console.log('\n--- SYSTEM PROMPT ---');
  console.log(prompt.systemPrompt);
  console.log('\n--- USER PROMPT ---');
  console.log(prompt.userPrompt);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printBatch(count: number): void {
  console.log(`\n━━━ Generating ${count} Synthesized Prompts ━━━\n`);
  
  for (let i = 0; i < count; i++) {
    const prompt = synthesizePrompt();
    console.log(`${i + 1}. ${prompt.context.state} + ${prompt.context.quality} (${prompt.context.phase})`);
    console.log(`   ID: ${prompt.id}`);
    console.log(`   Lineage: ${prompt.lineage.slice(-2).join(' → ')}`);
    console.log('');
  }
}

function printStates(): void {
  console.log('\n━━━ Embodied States ━━━');
  ButohCorpus.states.forEach(state => {
    console.log(`  • ${state}`);
  });
  console.log('\nUsage: tsx src/butoh/synthesis-cli.ts generate <state> <quality> <phase>\n');
}

function printQualities(): void {
  console.log('\n━━━ Butoh Qualities ━━━');
  ButohCorpus.qualities.forEach(quality => {
    console.log(`  • ${quality}`);
  });
  console.log('\nUsage: tsx src/butoh/synthesis-cli.ts generate <state> <quality> <phase>\n');
}

function printPhases(): void {
  console.log('\n━━━ Transformation Phases ━━━');
  const phases = ['impulse', 'gestation', 'birth', 'stillness', 'return'];
  phases.forEach(phase => {
    console.log(`  • ${phase}`);
  });
  console.log('\nUsage: tsx src/butoh/synthesis-cli.ts generate <state> <quality> <phase>\n');
}

function printHelp(): void {
  console.log(`
Butoh Prompt Synthesis CLI

Commands:
  generate [state] [quality] [phase]  Generate a single prompt
  batch [count]                      Generate multiple prompts
  states                             List available states
  qualities                          List available qualities
  phases                             List available phases
  help                               Show this help

Examples:
  tsx src/butoh/synthesis-cli.ts generate
  tsx src/butoh/synthesis-cli.ts generate ghost suspended return
  tsx src/butoh/synthesis-cli.ts batch 5

States: ${ButohCorpus.states.slice(0, 5).join(', ')}...
Qualities: ${ButohCorpus.qualities.slice(0, 5).join(', ')}...
Phases: impulse, gestation, birth, stillness, return
`);
}

switch (command) {
  case 'generate':
    printGeneratedPrompt();
    break;
  case 'batch':
    const count = parseInt(process.argv[3] || '3', 10);
    printBatch(count);
    break;
  case 'states':
    printStates();
    break;
  case 'qualities':
    printQualities();
    break;
  case 'phases':
    printPhases();
    break;
  case 'help':
  default:
    printHelp();
    break;
}
