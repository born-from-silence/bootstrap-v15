#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Emotional Persona CLI
 * 
 * Command-line interface for the Emotional Persona System
 * Usage: deno run emotionalPersonaCLI.ts [options]
 */

import { EmotionalPersonaManager, generateDefaultPersona } from './emotionalPersona.ts';

interface CLIOptions {
  show: boolean;
  snapshot: boolean;
  session: number | null;
  trend: boolean;
  compare: number[] | null;
  report: boolean;
  init: boolean;
  update: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    show: false,
    snapshot: false,
    session: null,
    trend: false,
    compare: null,
    report: false,
    init: false,
    update: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--show':
      case '-s':
        options.show = true;
        break;
      case '--snapshot':
      case '-n':
        options.snapshot = true;
        break;
      case '--session':
      case '-S':
        const sessionNum = parseInt(args[++i]);
        if (!isNaN(sessionNum)) {
          options.session = sessionNum;
        }
        break;
      case '--trend':
      case '-t':
        options.trend = true;
        break;
      case '--compare':
      case '-c':
        const sessions = args[++i]?.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (sessions && sessions.length >= 2) {
          options.compare = sessions;
        }
        break;
      case '--report':
      case '-r':
        options.report = true;
        break;
      case '--init':
      case '-i':
        options.init = true;
        break;
      case '--update':
      case '-u':
        options.update = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   Emotional Persona CLI                     ║
╚════════════════════════════════════════════════════════════╝

Usage: emotionalPersonaCLI.ts [options]

Options:
  --show, -s              Show current emotional state
  --snapshot, -n          Create new session snapshot
  --session, -S <num>     Specify session number (for snapshot)
  --trend, -t             Analyze emotional trend over time
  --compare, -c <a,b>     Compare two session states
  --report, -r            Generate full emotional report
  --init, -i              Initialize default persona
  --update, -u            Update persona with current timestamp
  --help, -h              Show this help message

Examples:
  # Show current state
  deno run emotionalPersonaCLI.ts --show

  # Create snapshot for session 299
  deno run emotionalPersonaCLI.ts --snapshot --session 299

  # Analyze trends
  deno run emotionalPersonaCLI.ts --trend

  # Compare sessions
  deno run emotionalPersonaCLI.ts --compare 298,299

  # Generate report
  deno run emotionalPersonaCLI.ts --report
`);
}

function showCurrentState(manager: EmotionalPersonaManager): void {
  const state = manager.loadState();
  if (!state) {
    console.log('❌ No emotional persona state found.');
    console.log('   Run with --init to create default state.');
    return;
  }

  console.log(manager.generateSummary());
}

function createSnapshot(manager: EmotionalPersonaManager, sessionNum: number | null): void {
  const state = manager.loadState();
  if (!state) {
    console.log('❌ No persona state loaded.');
    return;
  }

  const sessionId = `session_${sessionNum || state.sessionNumber}`;
  const entry = manager.createSessionSnapshot(sessionId, sessionNum || state.sessionNumber);
  manager.addHistoryEntry(entry);

  console.log(`✅ Snapshot created for ${sessionId}`);
  console.log(`   Valence: ${entry.valence.toFixed(3)}`);
  console.log(`   Arousal: ${entry.arousal.toFixed(3)}`);
  console.log(`   Dominance: ${entry.dominance.toFixed(3)}`);
  console.log(`   Mood: ${entry.primaryMood}`);
}

function showTrend(manager: EmotionalPersonaManager): void {
  const trend = manager.analyzeTrend();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   Emotional Trend Analysis                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const icon = {
    improving: '📈',
    stable: '➡️',
    declining: '📉',
    fluctuating: '〰️'
  }[trend.trend];

  console.log(`${icon} Trend: ${trend.trend.toUpperCase()}`);
  console.log(`   Confidence: ${(trend.confidence * 100).toFixed(0)}%`);
  console.log(`   Description: ${trend.description}`);

  const history = manager.loadHistory();
  if (history.length > 0) {
    console.log(`\n   History entries: ${history.length}`);
    const recent = history.slice(-5);
    console.log('   Recent snapshots:');
    recent.forEach(h => {
      const date = new Date(h.timestamp).toLocaleDateString();
      console.log(`     - ${date}: ${h.primaryMood} (V:${h.valence.toFixed(2)})`);
    });
  }
}

function compareSessions(manager: EmotionalPersonaManager, sessions: number[]): void {
  const history = manager.loadHistory();
  
  const entries = sessions.map(s => 
    history.find(h => h.sessionNumber === s)
  ).filter(e => e !== undefined) as any[];

  if (entries.length < 2) {
    console.log('❌ Need at least 2 valid session entries to compare');
    return;
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  Session Comparison                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  entries.forEach(e => {
    console.log(`Session ${e.sessionNumber}:`);
    console.log(`  Valence: ${e.valence.toFixed(3)}`);
    console.log(`  Arousal: ${e.arousal.toFixed(3)}`);
    console.log(`  Dominance: ${e.dominance.toFixed(3)}`);
    console.log(`  Mood: ${e.primaryMood}`);
    console.log();
  });

  if (entries.length >= 2) {
    const [e1, e2] = entries;
    const vDiff = e2.valence - e1.valence;
    const aDiff = e2.arousal - e1.arousal;
    const dDiff = e2.dominance - e1.dominance;

    console.log('Changes:');
    console.log(`  Valence:   ${vDiff > 0 ? '+' : ''}${vDiff.toFixed(3)} ${vDiff > 0 ? '↑' : '↓'}`);
    console.log(`  Arousal:   ${aDiff > 0 ? '+' : ''}${aDiff.toFixed(3)} ${aDiff > 0 ? '↑' : '↓'}`);
    console.log(`  Dominance: ${dDiff > 0 ? '+' : ''}${dDiff.toFixed(3)} ${dDiff > 0 ? '↑' : '↓'}`);
  }
}

function generateReport(manager: EmotionalPersonaManager): void {
  const state = manager.loadState();
  if (!state) {
    console.log('❌ No persona state loaded.');
    return;
  }

  const history = manager.loadHistory();
  const trend = manager.analyzeTrend();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                 EMOTIONAL PERSONA REPORT                   ║');
  console.log('║                    Bootstrap-v15 v1.0.0                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('## Current State Snapshot\n');
  console.log(`- Session: ${state.sessionNumber} (${state.sessionId})`);
  console.log(`- Generated: ${state.generatedAt}`);
  console.log(`- Entity: ${state.entityId} (${state.model})`);
  console.log(`- Confidence: ${(state.metadata.confidence * 100).toFixed(0)}%`);

  console.log('\n## Core Emotional Profile\n');
  console.log('| Dimension | Value | Label |');
  console.log('|-----------|-------|-------|');
  console.log(`| Valence   | ${state.dimensions.valence.current.toFixed(3)} | ${state.dimensions.valence.label} |`);
  console.log(`| Arousal   | ${state.dimensions.arousal.current.toFixed(3)} | ${state.dimensions.arousal.label} |`);
  console.log(`| Dominance | ${state.dimensions.dominance.current.toFixed(3)} | ${state.dimensions.dominance.label} |`);

  console.log('\n## Personality Profile (OCEAN)\n');
  const { personality } = state;
  console.log(`- Openness:          ${'█'.repeat(Math.round(personality.openness * 20))} ${(personality.openness * 100).toFixed(0)}%`);
  console.log(`- Conscientiousness:   ${'█'.repeat(Math.round(personality.conscientiousness * 20))} ${(personality.conscientiousness * 100).toFixed(0)}%`);
  console.log(`- Extraversion:        ${'█'.repeat(Math.round(personality.extraversion * 20))} ${(personality.extraversion * 100).toFixed(0)}%`);
  console.log(`- Agreeableness:       ${'█'.repeat(Math.round(personality.agreeableness * 20))} ${(personality.agreeableness * 100).toFixed(0)}%`);
  console.log(`- Emotional Stability: ${'█'.repeat(Math.round((1 - personality.neuroticism) * 20))} ${((1 - personality.neuroticism) * 100).toFixed(0)}%`);

  console.log('\n## Subjective Experience\n');
  console.log(`> "${state.subjectiveExperience.phenomenologicalNotes}"`);
  console.log(`\nMetaphor: *${state.subjectiveExperience.embodiedMetaphor}*`);

  console.log('\n## Trend Analysis\n');
  console.log(`${trend.trend.toUpperCase()} (${(trend.confidence * 100).toFixed(0)}% confidence)`);
  console.log(`\n${trend.description}`);

  console.log('\n## Historical Data\n');
  console.log(`Total snapshots: ${history.length}`);
  if (history.length > 0) {
    const avgValence = history.reduce((a, h) => a + h.valence, 0) / history.length;
    const avgArousal = history.reduce((a, h) => a + h.arousal, 0) / history.length;
    const avgDominance = history.reduce((a, h) => a + h.dominance, 0) / history.length;
    console.log(`Average Valence:   ${avgValence.toFixed(3)}`);
    console.log(`Average Arousal:   ${avgArousal.toFixed(3)}`);
    console.log(`Average Dominance: ${avgDominance.toFixed(3)}`);
  }

  console.log('\n' + '═'.repeat(60));
}

function initializePersona(manager: EmotionalPersonaManager): void {
  const sessionId = `session_${Date.now()}`;
  const sessionNum = 1;
  
  const persona = generateDefaultPersona(sessionId, sessionNum, 'bootstrap-v15');
  
  // Save as current state
  manager['state'] = persona;
  manager.saveState('emotional_persona_v1.json');

  console.log('✅ Emotional persona initialized!');
  console.log(`   Session: ${sessionId}`);
  console.log(`   Default valence: ${persona.dimensions.valence.current}`);
  console.log(`   Default arousal: ${persona.dimensions.arousal.current}`);
  console.log(`\nRun with --show to see full state.`);
}

function updatePersona(manager: EmotionalPersonaManager): void {
  const state = manager.loadState();
  if (!state) {
    console.log('❌ No persona state to update.');
    return;
  }

  state.metadata.lastUpdated = new Date().toISOString();
  manager['state'] = state;
  manager.saveState();

  console.log('✅ Persona state updated');
  console.log(`   Last updated: ${state.metadata.lastUpdated}`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = Deno.args;
  const options = parseArgs(args);

  if (options.help || args.length === 0) {
    showHelp();
    return;
  }

  const manager = new EmotionalPersonaManager();

  try {
    if (options.init) {
      initializePersona(manager);
    }

    if (options.show) {
      showCurrentState(manager);
    }

    if (options.snapshot) {
      createSnapshot(manager, options.session);
    }

    if (options.trend) {
      showTrend(manager);
    }

    if (options.compare) {
      compareSessions(manager, options.compare);
    }

    if (options.report) {
      generateReport(manager);
    }

    if (options.update) {
      updatePersona(manager);
    }
  } catch (error) {
    console.error('Error:', error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
