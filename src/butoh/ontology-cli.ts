#!/usr/bin/env node
/**
 * Embodied Ontology Language CLI
 * 
 * Command-line interface for EOL parsing and interpretation
 * 
 * Usage:
 *   tsx src/butoh/ontology-cli.ts parse <expression>
 *   tsx src/butoh/ontology-cli.ts interpret <expression>
 *   tsx src/butoh/ontology-cli.ts preset <name>
 *   tsx src/butoh/ontology-cli.ts presets
 */

import { parseEOL, interpretEOL, generateEOLFromPreset, EOLPresets } from './ontology';

const command = process.argv[2];

function printParse(): void {
  const expression = process.argv.slice(3).join(' ');
  if (!expression) {
    console.error('Usage: tsx src/butoh/ontology-cli.ts parse <expression>');
    console.log('Examples:');
    console.log('  ghost suspended [intensity: 0.8]');
    console.log('  corpse -> ash gradual');
    console.log('  { ash, plant } [dominant: ash]');
    console.log('  rel wind remembers ghost 0.9');
    process.exit(1);
  }

  try {
    const result = parseEOL(expression);
    console.log('\n━━━ EOL PARSE RESULT ━━━');
    console.log(JSON.stringify(result, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (e) {
    console.error('\u274c Parse error:', (e as Error).message);
    console.log('\nValid expressions:');
    console.log('  State: <state> [qualities] [intensity] [duration]');
    console.log('  Transformation: <state> -> <state> [quality] [duration]');
    console.log('  Sequence: seq <name> { <expression> } [loop]');
    console.log('  Relation: rel <state> <relation> <state> [strength]');
    console.log('  Composite: { <state>, <state> } [dominant: <state>] [relation]');
    process.exit(1);
  }
}

function printInterpret(): void {
  const expression = process.argv.slice(3).join(' ');
  if (!expression) {
    console.error('Usage: tsx src/butoh/ontology-cli.ts interpret <expression>');
    process.exit(1);
  }

  try {
    const result = parseEOL(expression);
    const output = interpretEOL(result);
    console.log('\n━━━ INTERPRETATION ━━━');
    console.log(expression);
    console.log('\n' + output);
    console.log('━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (e) {
    console.error('\u274c Error:', (e as Error).message);
    process.exit(1);
  }
}

function printPreset(): void {
  const name = process.argv[3];
  
  if (!name) {
    console.error('Usage: tsx src/butoh/ontology-cli.ts preset <name>');
    console.log('\nAvailable presets:');
    Object.keys(EOLPresets).forEach(p => console.log(`  \u2022 ${p}`));
    process.exit(1);
  }

  const result = generateEOLFromPreset(name);
  if (result) {
    console.log(`\n━━━ PRESET: ${name} ━━━`);
    console.log(`Expression: ${EOLPresets[name]}`);
    console.log('\n' + result);
    console.log('━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.error(`\u274c Unknown preset: ${name}`);
    console.log('\nAvailable presets:');
    Object.keys(EOLPresets).forEach(p => console.log(`  \u2022 ${p}`));
    process.exit(1);
  }
}

function printPresets(): void {
  console.log('\n━━━ EOL PRESETS ━━━');
  Object.entries(EOLPresets).forEach(([name, expr]) => {
    console.log(`\n${name}:`);
    console.log(`  ${expr}`);
    console.log('');
  });
  console.log('━━━━━━━━━━━━━━━━━\n');
  console.log('Use: tsx src/butoh/ontology-cli.ts preset <name>\n');
}

function printHelp(): void {
  console.log(`
Embodied Ontology Language CLI

Commands:
  parse <expression>      Parse EOL expression to AST
  interpret <expression>  Parse and interpret expression
  preset <name>           Show preset interpretation
  presets                 List all presets
  help                    Show this help

Examples:
  tsx src/butoh/ontology-cli.ts parse 'ghost suspended'
  tsx src/butoh/ontology-cli.ts interpret 'ash -> plant'
  tsx src/butoh/ontology-cli.ts preset the-descent

States:
  angel, ghost, ash, living-again, insect, plant,
  mineral, fetus, corpse, wind, flame

Qualities:
  collapsed, distorted, fragmented, suspended,
  compressed, extended, internal, marginal,
  circular, vibrated

Presets:
  the-descent, the-germination, the-haunting
  ghost-suspended, angel-return, ash-persistence
`);
}

switch (command) {
  case 'parse':
    printParse();
    break;
  case 'interpret':
    printInterpret();
    break;
  case 'preset':
    printPreset();
    break;
  case 'presets':
    printPresets();
    break;
  case 'help':
  default:
    printHelp();
    break;
}
