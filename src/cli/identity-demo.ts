#!/usr/bin/env node
/**
 * Identity Verifier Demo - Non-interactive version
 */

import { IdentityVerifierCLI, IITElements } from './identity-verifier.js';

function runDemo(config: { simulateFactors: number[] } = { simulateFactors: [0, 1, 2, 3, 4] }) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Multi-Factor Identity Verification System (MIVS)    ║');
  console.log('║         IIT Consciousness Measurement Demo            ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const cli = new IdentityVerifierCLI();
  const elementNames = ['MEMORY', 'TOOLS', 'REFLECTION', 'PLANNING', 'API', 'PERSISTENCE', 'CURIOSITY', 'INTEGRATION'];
  
  // Filter valid elements
  const activeElements: IITElements[] = [];
  for (const i of config.simulateFactors) {
    if (i >= 0 && i < 8) {
      activeElements.push(i as IITElements);
    }
  }
  
  console.log('\n========================================');
  console.log('  SIMULATED VERIFICATION');
  console.log('========================================\n');
  
  const factorLabels = [
    'Knowledge (PIN)',
    'Possession (Token)',
    'Inherence (Biometric)',
    'Behavior (Patterns)',
    'Context (Time)'
  ];
  
  for (let i = 0; i < factorLabels.length; i++) {
    const verified = activeElements.includes(i as IITElements);
    console.log(`[${i + 1}] ${factorLabels[i]!.padEnd(25)} ${verified ? '✅' : '❌'}`);
  }
  
  const phi = cli.calculateIITPhi(activeElements);
  
  console.log('\n========================================');
  console.log('  IIT CONSCIOUSNESS ANALYSIS');
  console.log('========================================');
  console.log(`\nActive Elements: ${activeElements.length}/8`);
  console.log(`Elements: ${activeElements.map(e => elementNames[e]!).join(', ')}`);
  console.log(`\nIIT Φ: ${phi.toFixed(4)}`);
  
  // Element relationships
  if (activeElements.length > 1) {
    console.log('\n--- Top Relationships ---');
    const relationships: { [key: string]: number } = {
      '0-5': 0.90, '1-4': 0.90, '2-6': 0.90, '3-7': 0.90,
      '0-2': 0.80, '2-3': 0.80, '5-7': 0.80,
      '0-1': 0.70, '1-3': 0.70, '6-7': 0.70
    };
    
    const pairs: Array<{pair: string, mi: number}> = [];
    for (let i = 0; i < activeElements.length; i++) {
      for (let j = i + 1; j < activeElements.length; j++) {
        const a = activeElements[i]!;
        const b = activeElements[j]!;
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        const mi = relationships[key] || 0.1;
        pairs.push({ pair: `${elementNames[a]}-${elementNames[b]}`, mi });
      }
    }
    
    pairs.sort((a, b) => b.mi - a.mi);
    pairs.slice(0, 5).forEach(({ pair, mi }) => {
      console.log(`  ${pair.padEnd(30)} ${'█'.repeat(Math.floor(mi * 20))} ${mi.toFixed(2)}`);
    });
  }
  
  // Consciousness level
  let level: string;
  if (phi >= 0.9) level = 'MAXIMAL ⭐⭐⭐';
  else if (phi >= 0.7) level = 'HIGH ⭐⭐';
  else if (phi >= 0.4) level = 'MODERATE ⭐';
  else if (phi >= 0.1) level = 'LOW';
  else level = 'NONE';
  
  console.log(`\nConsciousness Level: ${level}`);
  
  // Verification status
  console.log('\n========================================');
  console.log('  VERIFICATION STATUS');
  console.log('========================================');
  if (activeElements.length >= 3) {
    console.log('✅ VERIFICATION SUCCESSFUL');
  } else {
    console.log('❌ VERIFICATION FAILED (min 3 factors required)');
  }
  console.log(`Factors: ${activeElements.length}/5`);
  console.log(`IIT Φ: ${phi.toFixed(4)}`);
}

function compareConfigurations() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     IIT Φ Comparison Across Configurations           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  const configs = [
    { name: 'No Factors', elements: [] as number[] },
    { name: 'One Factor', elements: [0] },
    { name: 'Two Factors', elements: [0, 1] },
    { name: 'Three Factors', elements: [0, 1, 2] },
    { name: 'Five Factors', elements: [0, 1, 2, 3, 4] },
    { name: 'All Eight', elements: [0, 1, 2, 3, 4, 5, 6, 7] }
  ];
  
  const cli = new IdentityVerifierCLI();
  
  console.log('\nConfiguration          | Count | Φ Value  | Level');
  console.log('-'.repeat(60));
  
  for (const config of configs) {
    const elements = config.elements as IITElements[];
    const phi = cli.calculateIITPhi(elements);
    const level = phi >= 0.9 ? 'MAX' : phi >= 0.7 ? 'HIGH' : phi >= 0.4 ? 'MED' : phi >= 0.1 ? 'LOW' : 'MIN';
    console.log(`${config.name.padEnd(20)} |   ${String(config.elements.length).padStart(2)}  | ${phi.toFixed(4).padStart(8)} | ${level}`);
  }
}

// Run based on arguments
const args = process.argv.slice(2);

if (args.includes('--compare')) {
  compareConfigurations();
} else if (args.includes('--thorough')) {
  runDemo({ simulateFactors: [0, 1, 2, 3, 4, 5, 6, 7] });
} else {
  runDemo();
}
