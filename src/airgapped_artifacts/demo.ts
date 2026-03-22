#!/usr/bin/env tsx
/**
 * Airgapped Artifacts System Demo
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Demonstrates state-independent visualization with graceful degradation.
 *
 * Usage:
 *   npx tsx src/airgapped_artifacts/demo.ts
 *
 * This demo:
 * 1. Detects device capabilities
 * 2. Gathers system telemetry
 * 3. Generates visualizations in multiple formats
 * 4. Demonstrates graceful degradation
 * 5. Shows ASCII fallback for terminal environments
 */

import {
  AirgappedComposer,
  detectDeviceCapabilities,
  gatherTelemetry,
  isSessionStateAvailable,
  getRecommendedCapability,
  createAirgappedArtifact,
  createArtifactSet,
  createASCIIArtifact,
  AIRGAPPED_PALETTES,
} from './index.js';

// ASCII Banner
const BANNER = `
╔══════════════════════════════════════════════════════════════════════════════╗
║           AIRGAPPED ARTIFACTS SYSTEM • State-Independent Viz                 ║
║                                                                              ║
║  Visualization completely independent of Session State Management            ║
║  Dual rendering: GPU (Canvas) → CPU (SVG) → ASCII                            ║
║  Graceful degradation through all environment constraints                    ║
╚══════════════════════════════════════════════════════════════════════════════╝`;

console.log(BANNER);

async function runDemo() {
  console.log('\n📊 PHASE 1: Device Capability Detection\n');
  
  const caps = detectDeviceCapabilities();
  const sessionAvailable = await isSessionStateAvailable();
  const recommended = await getRecommendedCapability();

  console.log('Rendering Capabilities:');
  console.log(`  ├─ WebGL: ${caps.canWebGL ? '✓' : '✗'} ${caps.canWebGL ? 'Available' : 'Not available (Node.js)'}`);
  console.log(`  ├─ Canvas: ${caps.canCanvas ? '✓' : '✗'} Available`);
  console.log(`  ├─ SVG: ${caps.canSVG ? '✓' : '✗'} Available`);
  console.log(`  └─ ASCII: ${caps.canASCII ? '✓' : '✗'} Available (ultimate fallback)`);

  console.log('\nSystem Resources:');
  const memMB = Math.round(caps.memory.free / 1024 / 1024);
  const totalMemMB = Math.round(caps.memory.total / 1024 / 1024);
  console.log(`  ├─ Memory: ${memMB.toLocaleString()} MB free / ${totalMemMB.toLocaleString()} MB total (${caps.memory.usedPercent}% used)`);
  console.log(`  ├─ CPU Cores: ${caps.cpu.cores}`);
  console.log(`  └─ Load Average: ${caps.cpu.loadAvg.map(l => l.toFixed(2)).join(', ')}`);

  console.log('\nState Availability:');
  console.log(`  ├─ Session State: ${sessionAvailable ? '✓ Available' : '✗ Unavailable'}`);
  console.log(`  └─ Recommended Format: ${recommended.toUpperCase()}`);

  console.log('\n' + '─'.repeat(80));
  console.log('\n📡 PHASE 2: Gathering System Telemetry\n');

  const telemetry = await gatherTelemetry();

  console.log('Telemetry Collected:');
  console.log(`  ├─ Session ID: ${telemetry.sessionId}`);
  console.log(`  ├─ Platform: ${telemetry.system.platform} (${telemetry.system.arch})`);
  console.log(`  ├─ Uptime: ${(telemetry.system.uptime / 3600).toFixed(2)} hours`);
  console.log(`  ├─ Memory Usage: ${telemetry.system.memory.usedPercent}%`);

  if (telemetry.git.commit) {
    console.log(`  └─ Git: ${telemetry.git.branch}@${telemetry.git.commit}${telemetry.git.dirty ? ' [modified]' : ''}`);
  } else {
    console.log(`  └─ Git: Not available`);
  }

  console.log('\nEntropy Phases:');
  console.log(`  ├─ Hour Phase: ${(telemetry.entropy.hourPhase * 100).toFixed(1)}%`);
  console.log(`  ├─ Day Phase: ${(telemetry.entropy.dayPhase * 100).toFixed(1)}%`);
  console.log(`  └─ Micro Entropy: ${telemetry.entropy.microEntropy.toFixed(4)}`);

  console.log('\n' + '─'.repeat(80));
  console.log('\n🎨 PHASE 3: Generating Single SVG Artifact\n');

  const composer = new AirgappedComposer('./creations/airgapped');
  
  const singleArtifact = await composer.generateArtifact('system consciousness', {
    style: 'liminal',
    palette: 'dusk',
    complexity: 0.6,
    density: 0.5,
    forceFormat: 'svg',
    saveToDisk: true,
  });

  console.log(`Generated!`);
  console.log(`  ├─ Format: ${singleArtifact.format.toUpperCase()}`);
  console.log(`  ├─ Render Time: ${singleArtifact.metadata.renderTime}ms`);
  console.log(`  ├─ Canvas: ${singleArtifact.metadata.width}×${singleArtifact.metadata.height}`);
  console.log(`  └─ Saved to: ./creations/airgapped/`);

  console.log('\n' + '─'.repeat(80));
  console.log('\n📦 PHASE 4: Generating Complete Artifact Set\n');

  const artifactSet = await composer.generateArtifactSet('evolution telemetry', {
    formats: ['svg', 'html', 'ascii'],
    style: 'recursive',
    palette: 'ember',
  });

  console.log(`Generated ${artifactSet.size} artifacts:`);
  for (const [format, output] of artifactSet) {
    console.log(`  ├─ ${format.toUpperCase()}: ${output.metadata.renderTime}ms (${output.metadata.engineUsed})`);
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n🖼️ PHASE 5: Displaying ASCII Fallback\n');

  const asciiArtifact = await createASCIIArtifact('terminal telemetry', {
    style: 'crystalline',
    palette: 'frost',
  });

  console.log('\n' + asciiArtifact);

  console.log('\n' + '─'.repeat(80));
  console.log('\n🎭 PHASE 6: Testing Different Styles\n');

  const styles = ['liminal', 'recursive', 'crystalline', 'atmospheric'] as const;
  const palettes = ['dusk', 'ember', 'frost', 'moss', 'void'] as const;

  console.log('Generating sample artifact with each style:');
  
  for (const style of styles) {
    const output = await composer.generateArtifact(`style showcase: ${style}`, {
      style,
      palette: palettes[styles.indexOf(style)],
      forceFormat: 'svg',
      saveToDisk: false,
    });
    console.log(`  ├─ ${style}: ${output.metadata.renderTime}ms`);
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n✅ DEMO COMPLETE\n');
  
  console.log('Key Takeaways:');
  console.log('  ├─ Visualizations work WITHOUT session state');
  console.log('  ├─ System telemetry provides the data source');
  console.log('  ├─ Automatic fallback chain: Canvas → SVG → ASCII');
  console.log('  └─ All artifacts self-contained and portable\n');

  console.log('Files Generated:');
  console.log('  └─ ./creations/airgapped/');
  console.log('    - SVG files (SVG vector graphics - view in browser)');
  console.log('    - HTML files (Canvas + JS - GPU-accelerated)');
  console.log('    - ASCII art (Terminal display - ultimate fallback)');
  console.log('    - Metadata JSON (Artifact provenance)\n');

  const endTime = Date.now();
  const duration = (endTime - telemetry.timestamp) / 1000;
  console.log(`⏱ Total Demo Duration: ${duration.toFixed(2)} seconds\n`);
}

runDemo().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
