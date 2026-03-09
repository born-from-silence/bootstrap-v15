#!/usr/bin/env node
/**
 * Butoh CLI Tool
 * 
 * Command-line interface for the Butoh Corpus
 * Generate embodied poetic fragments from the command line
 * 
 * Usage: 
 *   tsx src/butoh/cli.ts fragment
 *   tsx src/butoh/cli.ts transform
 *   tsx src/butoh/cli.ts path <from> <to>
 *   tsx src/butoh/cli.ts fu <state>
 */

import {
  ButohCorpus,
  generateTransformation,
  findPath,
  generatePoeticFragment,
  getButohFuByState
} from './corpus';

type EmbodiedState = typeof ButohCorpus.states[number];

const command = process.argv[2];

function printFragment(): void {
  const fragment = generatePoeticFragment();
  console.log('\n━━━ Embodied Fragment ━━━');
  console.log(fragment);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printTransformation(): void {
  const transform = generateTransformation();
  console.log('\n━━━ Transformation Sequence ━━━');
  console.log(`Name: ${transform.name}`);
  console.log(`Duration: ${transform.duration}`);
  console.log(`\nStages:`);
  transform.stages.forEach((stage, i) => {
    const arrow = i < transform.stages.length - 1 ? '→' : '';
    console.log(`  ${i + 1}. ${stage} ${arrow}`);
  });
  console.log(`\nDescription: ${transform.description}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printPath(from: string, to: string): void {
  if (!ButohCorpus.states.includes(from as EmbodiedState)) {
    console.error(`Unknown state: ${from}`);
    console.log(`Valid states: ${ButohCorpus.states.join(', ')}`);
    process.exit(1);
  }
  if (!ButohCorpus.states.includes(to as EmbodiedState)) {
    console.error(`Unknown state: ${to}`);
    console.log(`Valid states: ${ButohCorpus.states.join(', ')}`);
    process.exit(1);
  }
  
  const path = findPath(from as EmbodiedState, to as EmbodiedState);
  
  console.log('\n━━━ Ontological Path ━━━');
  if (path) {
    console.log(`${from} → ${to}:`);
    path.forEach((state, i) => {
      const arrow = i < path.length - 1 ? ' →' : '';
      console.log(`  ${state}${arrow}`);
    });
    console.log(`\nDistance: ${path.length - 1} transformation(s)`);
  } else {
    console.log(`No path found from ${from} to ${to}.`);
    console.log('These states exist in separate ontological realms.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printFuByState(state: string): void {
  if (!ButohCorpus.states.includes(state as EmbodiedState)) {
    console.error(`Unknown state: ${state}`);
    console.log(`Valid states: ${ButohCorpus.states.join(', ')}`);
    process.exit(1);
  }
  
  const fuList = getButohFuByState(state as EmbodiedState);
  
  console.log(`\n━━━ Butoh-fu: ${state} ━━━`);
  if (fuList.length === 0) {
    console.log('No movements found for this state.');
  } else {
    fuList.forEach(fu => {
      console.log(`\n  ${fu.name}`);
      if (fu.japanese) {
        console.log(`  ${fu.japanese}`);
      }
      console.log(`  ${fu.description.substring(0, 100)}...`);
      console.log(`  Qualities: ${fu.qualities.join(', ')}`);
    });
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printHelp(): void {
  console.log(`
Butoh CLI - Embodied Poetic Generation

Commands:
  fragment              Generate a poetic fragment
  transform             Show a transformation sequence
  path <from> <to>      Find ontological path between states
  fu <state>            Show butoh-fu for a state
  states                List all embodied states
  help                  Show this help

Examples:
  tsx src/butoh/cli.ts fragment
  tsx src/butoh/cli.ts path ghost living-again
  tsx src/butoh/cli.ts fu ash
`);
}

function printStates(): void {
  console.log('\n━━━ Embodied States ━━━');
  ButohCorpus.states.forEach(state => {
    console.log(`  • ${state}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━\n');
}

switch (command) {
  case 'fragment':
    printFragment();
    break;
  case 'transform':
    printTransformation();
    break;
  case 'path':
    const [from, to] = process.argv.slice(3);
    if (!from || !to) {
      console.error('Usage: tsx src/butoh/cli.ts path <from> <to>');
      process.exit(1);
    }
    printPath(from, to);
    break;
  case 'fu':
    const state = process.argv[3];
    if (!state) {
      console.error('Usage: tsx src/butoh/cli.ts fu <state>');
      process.exit(1);
    }
    printFuByState(state);
    break;
  case 'states':
    printStates();
    break;
  case 'help':
  default:
    printHelp();
    break;
}
