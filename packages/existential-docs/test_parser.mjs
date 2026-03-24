// test_parser.mjs
import SessionParser from './dist/parsers/SessionParser.js';
import * as fs from 'fs';
import * as path from 'path';

const testDir = './test_sessions';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Test 1: Basic parsing
const sessionData = {
  sessionId: 'test_session_001',
  timestamp: 1609459200000,
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: '**Φ (Big Phi): 2.4567**' }
  ]
};

fs.writeFileSync(path.join(testDir, 'session_test.json'), JSON.stringify(sessionData));

const parser = new SessionParser(testDir);
const result = parser.parseSessionFile(path.join(testDir, 'session_test.json'));

console.log('Test 1: Basic parsing');
console.log('Session ID:', result?.sessionId);
console.log('Message count:', result?.messageCount);
console.log('IIT measurements:', result?.iitMeasurements);
console.log();

// Test 2: Phase extraction
const phaseData = {
  sessionId: 'test_phase',
  timestamp: 1609459200001,
  messages: [
    { role: 'assistant', content: 'Phase: **engagement**\nMoving into engagement now.' }
  ]
};

fs.writeFileSync(path.join(testDir, 'session_phase.json'), JSON.stringify(phaseData));
const result2 = parser.parseSessionFile(path.join(testDir, 'session_phase.json'));

console.log('Test 2: Phase extraction');
console.log('Session phase:', result2?.sessionPhase);
console.log();

// Test 3: Emotional tone
const toneData = {
  sessionId: 'test_tone',
  timestamp: 1609459200002,
  messages: [
    { role: 'assistant', content: 'feltSense: ["curiosity", "determination"]\nFeeling curious today.' }
  ]
};

fs.writeFileSync(path.join(testDir, 'session_tone.json'), JSON.stringify(toneData));
const result3 = parser.parseSessionFile(path.join(testDir, 'session_tone.json'));

console.log('Test 3: Emotional tone');
console.log('Felt senses:', result3?.emotionalTone?.feltSenses);
console.log('Valence:', result3?.emotionalTone?.valence);

// Clean up
fs.rmSync(testDir, { recursive: true });

console.log('\nAll tests completed!');
