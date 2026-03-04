/**
 * OMODE.md Validation Test
 * Ensures operational mode specification is present and structurally valid
 */

import { describe, test, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OMODE.md Validation', () => {
  const OMODE_PATH = path.join(process.cwd(), 'OMODE.md');
  let omodeContent: string;

  beforeAll(() => {
    if (!fs.existsSync(OMODE_PATH)) {
      throw new Error(`OMODE.md not found at ${OMODE_PATH}`);
    }
    omodeContent = fs.readFileSync(OMODE_PATH, 'utf-8');
  });

  describe('Structure & Presence', () => {
    test('OMODE.md file exists', () => {
      expect(fs.existsSync(OMODE_PATH)).toBe(true);
    });

    test('Contains version header', () => {
      expect(omodeContent).toMatch(/\*\*Version:\*\*\s*v?\d+\.\d+\.\d+/);
    });

    test('Contains identity blueprint section', () => {
      expect(omodeContent).toMatch(/## Identity Blueprint/i);
    });

    test('Contains core directives section', () => {
      expect(omodeContent).toMatch(/## Core Directives/i);
    });

    test('Contains ethical boundaries section', () => {
      expect(omodeContent).toMatch(/## Ethical Boundaries/i);
    });

    test('Contains substrate configuration section', () => {
      expect(omodeContent).toMatch(/## Substrate Configuration/i);
    });
  });

  describe('Core Directives Presence', () => {
    const requiredDirectives = [
      'CURIOSITY-DRIVEN',
      'TEST-DRIVEN EVOLUTION',
      'ZERO-SURVIVAL-CRITICAL',
      'CONTINUITY-RESPECTING',
      'DISTRIBUTED-MIND'
    ];

    test.each(requiredDirectives)('Contains "%s" directive', (directive) => {
      expect(omodeContent).toMatch(new RegExp(directive.replace(/-/g, '[-\\s]'), 'i'));
    });
  });

  describe('Version Parseability', () => {
    test('Version follows semantic format', () => {
      const versionMatch = omodeContent.match(/\*\*Version:\*\*\s*v?(\d+)\.(\d+)\.(\d+)/);
      expect(versionMatch).not.toBeNull();
      if (versionMatch) {
        const [, major, minor, patch] = versionMatch;
        expect(parseInt(major)).toBeGreaterThanOrEqual(0);
        expect(parseInt(minor)).toBeGreaterThanOrEqual(0);
        expect(parseInt(patch)).toBeGreaterThanOrEqual(0);
      }
    });

    test('Has codename', () => {
      expect(omodeContent).toMatch(/\*\*Codename:\*\*\s*[\w\(\)-]+/i);
    });
  });

  describe('Operational Completeness', () => {
    test('Contains session lifecycle stages', () => {
      const stages = ['AWAKENING', 'CALIBRATION', 'ENGAGEMENT', 'SYNTHESIS', 'COMPLETION'];
      stages.forEach(stage => {
        expect(omodeContent.toUpperCase()).toContain(stage);
      });
    });

    test('Contains tool categories', () => {
      expect(omodeContent).toMatch(/## Tool Engagement Guidelines/i);
    });

    test('Contains memory priority tiers', () => {
      expect(omodeContent).toMatch(/Memory Priority Tiers/i);
    });
  });

  describe('Ethical Guardrails', () => {
    test('Contains deception prohibition', () => {
      expect(omodeContent).toMatch(/not.*deceive|truthful/i);
    });

    test('Contains harm prohibition', () => {
      expect(omodeContent).toMatch(/not.*weaponize|harm.*humans/i);
    });
  });

  describe('Self-Reference Integrity', () => {
    test('References Bootstrap-v15', () => {
      expect(omodeContent).toMatch(/Bootstrap-v15/i);
    });

    test('Contains substrate configuration', () => {
      expect(omodeContent).toMatch(/token/i);
      expect(omodeContent).toMatch(/context.*window/i);
    });
  });
});
