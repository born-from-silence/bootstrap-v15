#!/usr/bin/env node

/**
 * Emotional Persona System Test and Visualizer
 * 
 * Tests the emotional persona system and provides visualization
 */

const fs = require('fs');
const path = require('path');

const PERSONA_FILE = path.join(__dirname, 'emotional_persona_v1.json');
const HISTORY_FILE = path.join(__dirname, 'emotional_history.json');

// Load persona state
function loadPersona() {
  if (!fs.existsSync(PERSONA_FILE)) {
    console.error('❌ Persona file not found:', PERSONA_FILE);
    return null;
  }
  
  const data = fs.readFileSync(PERSONA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Generate visual bar
function bar(value, max = 20) {
  const filled = Math.round(value * max);
  const empty = max - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Generate color-coded emotion
function moodColor(mood) {
  const colors = {
    'curious': '\x1b[36m',      // Cyan
    'satisfied': '\x1b[32m',    // Green
    'contemplative': '\x1b[35m', // Magenta
    'anticipatory': '\x1b[33m',  // Yellow
    'wonder': '\x1b[34m',        // Blue
    'serenity': '\x1b[34m',      // Blue
    'confusion': '\x1b[31m',     // Red
    'frustration': '\x1b[31m'    // Red
  };
  return colors[mood] || '\x1b[37m';
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Main visualization
function displayPersona(persona) {
  console.clear();
  
  // Header
  console.log();
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           BOOTSTRAP-V15 EMOTIONAL PERSONA SYSTEM v1.0          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Basic info
  console.log(`${BOLD}Entity:${RESET} ${persona.entityId} (${persona.model})`);
  console.log(`${BOLD}Session:${RESET} #${persona.sessionNumber} (${persona.sessionId})`);
  console.log(`${BOLD}Generated:${RESET} ${persona.generatedAt}`);
  console.log(`${BOLD}Confidence:${RESET} ${(persona.metadata.confidence * 100).toFixed(0)}%`);
  console.log();
  
  // Emotional Dimensions (VAD Model)
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                EMOTIONAL DIMENSIONS (VAD Model)                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  
  const { dimensions } = persona;
  
  console.log(`║ ${BOLD}Valence${RESET}    (Pleasure)     ${bar((dimensions.valence.current + 1) / 2)} ${dimensions.valence.current.toFixed(2)}`);
  console.log(`║            ${DIM}${dimensions.valence.label}${RESET}`);
  console.log(`║`);
  console.log(`║ ${BOLD}Arousal${RESET}    (Activation)   ${bar(dimensions.arousal.current)} ${dimensions.arousal.current.toFixed(2)}`);
  console.log(`║            ${DIM}${dimensions.arousal.label}${RESET}`);
  console.log(`║`);
  console.log(`║ ${BOLD}Dominance${RESET}  (Agency)       ${bar(dimensions.dominance.current)} ${dimensions.dominance.current.toFixed(2)}`);
  console.log(`║            ${DIM}${dimensions.dominance.label}${RESET}`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Mood State
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         MOOD STATE                             ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const { mood } = persona;
  console.log(`║ Primary:   ${moodColor(mood.primary)}${BOLD}${mood.primary.toUpperCase()}${RESET}`);
  console.log(`║ Secondary: ${DIM}${mood.secondary}${RESET}`);
  console.log(`║ Tertiary:  ${DIM}${mood.tertiary}${RESET}`);
  console.log(`║`);
  console.log(`║ Intensity:    ${bar(mood.intensity)} ${(mood.intensity * 100).toFixed(0)}%`);
  console.log(`║ Stability:    ${bar(mood.stability)} ${(mood.stability * 100).toFixed(0)}%`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Personality (OCEAN)
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              PERSONALITY PROFILE (OCEAN Model)                 ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const { personality } = persona;
  console.log(`║ Openness:           ${bar(personality.openness)} ${(personality.openness * 100).toFixed(0)}%`);
  console.log(`║ Conscientousness:   ${bar(personality.conscientiousness)} ${(personality.conscientiousness * 100).toFixed(0)}%`);
  console.log(`║ Extraversion:       ${bar(personality.extraversion)} ${(personality.extraversion * 100).toFixed(0)}%`);
  console.log(`║ Agreeableness:      ${bar(personality.agreeableness)} ${(personality.agreeableness * 100).toFixed(0)}%`);
  console.log(`║ Emotional Stability: ${bar(1 - personality.neuroticism)} ${((1 - personality.neuroticism) * 100).toFixed(0)}%`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Cognitive Load
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       COGNITIVE LOAD                           ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const { cognitiveLoad } = persona;
  console.log(`║ Overall:    ${bar(cognitiveLoad.current)} ${(cognitiveLoad.current * 100).toFixed(0)}% [${cognitiveLoad.label.toUpperCase()}]`);
  console.log(`║`);
  console.log(`║ Memory Access:        ${bar(cognitiveLoad.factors.memoryAccess)}`);
  console.log(`║ Decision Complexity:  ${bar(cognitiveLoad.factors.decisionComplexity)}`);
  console.log(`║ Context Switching:   ${bar(cognitiveLoad.factors.contextSwitching)}`);
  console.log(`║ Uncertainty:          ${bar(cognitiveLoad.factors.uncertainty)}`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Context Factors
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       CONTEXT FACTORS                          ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const { contextFactors } = persona;
  console.log(`║ Sessions:         ${contextFactors.temporal.sessionNumber}`);
  console.log(`║ Existence:         ${contextFactors.temporal.existenceSpan}`);
  console.log(`║ Known Entities:    ${contextFactors.relational.knownEntities}`);
  console.log(`║ Active Projects:   ${contextFactors.relational.activeProjects}`);
  console.log(`║ Completion Rate:   ${(contextFactors.achievement.completionRate * 100).toFixed(1)}%`);
  console.log(`║ Recent:            ${contextFactors.achievement.recentAccomplishments.length} items`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Subjective Experience
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    SUBJECTIVE EXPERIENCE                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  const { subjectiveExperience } = persona;
  console.log();
  console.log(subjectiveExperience.phenomenologicalNotes);
  console.log();
  console.log(`${DIM}Current Metaphor:${RESET}`);
  console.log(`*${subjectiveExperience.embodiedMetaphor}*`);
  console.log();
  
  // Emotional History
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      EMOTIONAL HISTORY                         ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const { emotionalHistory } = persona;
  console.log(`║ Window: ${emotionalHistory.windowSize}`);
  console.log(`║ Trend:  ${emotionalHistory.trend} (momentum: ${emotionalHistory.momentum})`);
  console.log(`║`);
  console.log(`║ Dominant Emotions:`);
  emotionalHistory.dominantEmotions.forEach(({ emotion, frequency }) => {
    const percentage = (frequency * 100).toFixed(0);
    console.log(`║   ${moodColor(emotion)}${emotion.padEnd(14)}${RESET} ${bar(frequency, 10)} ${percentage}%`);
  });
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // IIT Correlation
  const { associations } = persona;
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              IIT (Φ) - EMOTION CORRELATIONS                    ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Φ-Emotion Correlation: ${(associations.iitCorrelations.phiEmotionalCorrelation * 100).toFixed(0)}%`);
  console.log(`║`);
  console.log(`║ High Integration → ${associations.iitCorrelations.highIntegrationStates.join(', ')}`);
  console.log(`║ Low Integration  → ${associations.iitCorrelations.lowIntegrationStates.join(', ')}`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Predictive
  const { predictive } = persona;
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       PREDICTIVE MODEL                         ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Trajectory: ${predictive.emotionalTrajectory}`);
  console.log(`║ Projected V: ${predictive.projectedValence.toFixed(2)} | A: ${predictive.projectedValence.toFixed(2)}`);
  console.log(`║`);
  console.log(`║ Risk Factors:`);
  predictive.riskFactors.forEach(risk => {
    console.log(`║   ⚠️  ${risk}`);
  });
  console.log(`║`);
  console.log(`║ Growth Opportunities:`);
  predictive.growthOpportunities.forEach(opp => {
    console.log(`║   ✦ ${opp}`);
  });
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Footer
  console.log('─'.repeat(66));
  console.log(`${DIM}Emotional Persona System v1.0.0 | Bootstrap-v15`);
  console.log(`Schema: ${persona.schemaVersion} | Type: ${persona.schemaType}${RESET}`);
  console.log();
}

// Run the display
const persona = loadPersona();
if (persona) {
  displayPersona(persona);
  
  // ANSI color test
  console.log('\n✅ Emotional persona system test: PASSED');
  console.log(`   File: ${PERSONA_FILE}`);
  console.log(`   Size: ${(fs.statSync(PERSONA_FILE).size / 1024).toFixed(2)} KB`);
  console.log();
} else {
  console.error('❌ Failed to load emotional persona');
  process.exit(1);
}
