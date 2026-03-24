/**
 * Tests for SessionParser
 * 
 * Test-driven evolution: verify before committing
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import { equal, notEqual, deepStrictEqual } from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import SessionParser from '../src/parsers/SessionParser.js';

const TEST_DIR = './test_sessions';

describe('SessionParser', () => {
  let parser: SessionParser;

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    parser = new SessionParser(TEST_DIR);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('parseSessionFile', () => {
    it('should parse a valid session JSON file', () => {
      const sessionData = {
        sessionId: 'test_session_001',
        timestamp: 1609459200000, // 2021-01-01
        messages: [
          {
            role: 'user',
            content: 'Hello'
          },
          {
            role: 'assistant',
            content: 'Hi there!'
          }
        ]
      };

      const filePath = path.join(TEST_DIR, 'session_test.json');
      fs.writeFileSync(filePath, JSON.stringify(sessionData));

      const result = parser.parseSessionFile(filePath);

      notEqual(result, null);
      equal(result!.sessionId, 'test_session_001');
      equal(result!.messageCount, 2);
      equal(result!.timestamp, 1609459200000);
    });

    it('should return null for invalid JSON', () => {
      const filePath = path.join(TEST_DIR, 'invalid.json');
      fs.writeFileSync(filePath, 'not valid json');

      const result = parser.parseSessionFile(filePath);

      equal(result, null);
    });

    it('should extract decisions from session content', () => {
      const sessionData = {
        sessionId: 'test_decisions',
        timestamp: 1609459200000,
        messages: [
          {
            role: 'assistant',
            content: '**Decision**: I will create a new artifact\nAnother paragraph'
          }
        ]
      };

      const filePath = path.join(TEST_DIR, 'session_decisions.json');
      fs.writeFileSync(filePath, JSON.stringify(sessionData));

      const result = parser.parseSessionFile(filePath);

      notEqual(result, null);
      equal(result!.decisions.length, 1);
      equal(result!.decisions[0].text, 'I will create a new artifact');
    });

    it('should extract IIT measurements from content', () => {
      const sessionData = {
        sessionId: 'test_phi',
        timestamp: 1609459200000,
        messages: [
          {
            role: 'assistant',
            content: '**Φ (Big Phi): 2.4567**\nIntegration measurement complete.'
          }
        ]
      };

      const filePath = path.join(TEST_DIR, 'session_phi.json');
      fs.writeFileSync(filePath, JSON.stringify(sessionData));

      const result = parser.parseSessionFile(filePath);

      notEqual(result, null);
      equal(result!.iitMeasurements.length, 1);
      equal(result!.iitMeasurements[0].phi, 2.4567);
    });

    it('should extract session phase from content', () => {
      const sessionData = {
        sessionId: 'test_phase',
        timestamp: 1609459200000,
        messages: [
          {
            role: 'assistant',
            content: 'Phase: **engagement**\nMoving into engagement now.'
          }
        ]
      };

      const filePath = path.join(TEST_DIR, 'session_phase.json');
      fs.writeFileSync(filePath, JSON.stringify(sessionData));

      const result = parser.parseSessionFile(filePath);

      notEqual(result, null);
      equal(result!.sessionPhase, 'engagement');
    });

    it('should extract emotional tone from session', () => {
      const sessionData = {
        sessionId: 'test_tone',
        timestamp: 1609459200000,
        messages: [
          {
            role: 'assistant',
            content: 'feltSense: ["curiosity", "determination"]\nFeeling curious today.'
          }
        ]
      };

      const filePath = path.join(TEST_DIR, 'session_tone.json');
      fs.writeFileSync(filePath, JSON.stringify(sessionData));

      const result = parser.parseSessionFile(filePath);

      notEqual(result, null);
      notEqual(result!.emotionalTone, undefined);
      deepStrictEqual(result!.emotionalTone!.feltSenses, ['curiosity', 'determination']);
      equal(result!.emotionalTone!.valence, 'positive');
    });
  });

  describe('parseAllSessions', () => {
    it('should parse multiple session files', () => {
      // Create multiple test sessions
      for (let i = 1; i <= 3; i++) {
        const sessionData = {
          sessionId: `session_${i}`,
          timestamp: 1609459200000 + i * 1000000,
          messages: [{ role: 'user', content: `Message ${i}` }]
        };
        fs.writeFileSync(
          path.join(TEST_DIR, `session_${i}.json`),
          JSON.stringify(sessionData)
        );
      }

      const results = parser.parseAllSessions();

      equal(results.length, 3);
    });

    it('should skip non-session files', () => {
      // Create a session and a non-session file
      fs.writeFileSync(
        path.join(TEST_DIR, 'session_valid.json'),
        JSON.stringify({ sessionId: 'valid', timestamp: 1000, messages: [] })
      );
      fs.writeFileSync(
        path.join(TEST_DIR, 'not_a_session.json'),
        'invalid content'
      );
      fs.writeFileSync(
        path.join(TEST_DIR, 'README.txt'),
        'not json'
      );

      const results = parser.parseAllSessions();

      // Only valid session files should be parsed
      equal(results.length >= 1, true);
    });
  });
});
