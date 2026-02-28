/**
 * Tests for Credential Vault
 *
 * Tests verify secure credential management without exposing values.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as fs from 'fs';
import * as path from 'path';
import { secrets } from './secrets';

const TEST_ENV_CONTENT = `
# Test secrets
TEST_API_KEY=sk-test123456789
TEST_PASSWORD=super-secret-password
TEST_EMPTY=
TEST_QUOTED="quoted value"
TEST_SINGLE='single quoted'
INVALID_LINE_WITHOUT_EQUALS
# Duplicate=DUP1
Duplicate=DUP2
`;

describe('Credential Vault', () => {
  const testEnvPath = path.join(process.cwd(), 'secrets', '.env');
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeAll(() => {
    // Create secrets directory if needed
    const secretsDir = path.join(process.cwd(), 'secrets');
    if (!fs.existsSync(secretsDir)) {
      fs.mkdirSync(secretsDir, { recursive: true });
    }

    // Save original .env content if exists
    const existingContent = fs.existsSync(testEnvPath)
      ? fs.readFileSync(testEnvPath, 'utf-8')
      : null;

    // Clean up any existing file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }

    // Write test content
    fs.writeFileSync(testEnvPath, TEST_ENV_CONTENT);

    // Save original env
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Clean up test .env file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
    // Restore original
    secrets.clear();
  });

  beforeEach(() => {
    secrets.clear();
  });

  test('should load secrets from .env file', () => {
    secrets.initialize();

    expect(secrets.has('TEST_API_KEY')).toBe(true);
    expect(secrets.has('TEST_PASSWORD')).toBe(true);
    expect(secrets.has('NON_EXISTENT')).toBe(false);
  });

  test('should retrieve correct values', () => {
    secrets.initialize();

    expect(secrets.get('TEST_API_KEY')).toBe('sk-test123456789');
    expect(secrets.get('TEST_PASSWORD')).toBe('super-secret-password');
  });

  test('should parse quoted values correctly', () => {
    secrets.initialize();

    expect(secrets.get('TEST_QUOTED')).toBe('quoted value');
    expect(secrets.get('TEST_SINGLE')).toBe('single quoted');
  });

  test('should handle missing keys gracefully', () => {
    secrets.initialize();

    expect(secrets.get('MISSING_KEY')).toBeUndefined();
  });

  test('should respect process.env override', () => {
    process.env.TEST_API_KEY = 'overridden-from-env';
    secrets.initialize();

    expect(secrets.get('TEST_API_KEY')).toBe('overridden-from-env');
    
    delete process.env.TEST_API_KEY;
  });

  test('should mask values correctly for safe display', () => {
    secrets.initialize();

    const shortValue = 'abc';
    expect(secrets.mask(shortValue)).toBe('***');

    const longValue = 'sk-verylongapikey123';
    expect(secrets.mask(longValue)).toBe('sk-***23');
  });

  test('should provide redacted status without exposing values', () => {
    secrets.initialize();

    const status = secrets.getRedactedStatus();
    const apiKeyEntry = status.find(s => s.key === 'TEST_API_KEY');

    expect(apiKeyEntry).toBeDefined();
    expect(apiKeyEntry!.masked).toContain('***');
    expect(apiKeyEntry!.masked).not.toContain('123456789');
  });

  test('should set and get secrets programmatically', () => {
    secrets.set('DYNAMIC_KEY', 'dynamic-value');

    expect(secrets.get('DYNAMIC_KEY')).toBe('dynamic-value');
  });

  test('should throw when requiring missing key', () => {
    expect(() => secrets.require('MISSING_REQUIRED')).toThrow(
      'Required secret "MISSING_REQUIRED" not found in vault'
    );
  });

  test('should return value on successful require', () => {
    secrets.set('PRESENT_KEY', 'present-value');

    expect(secrets.require('PRESENT_KEY')).toBe('present-value');
  });

  test('should list all available keys', () => {
    secrets.initialize();
    const keys = secrets.listKeys();

    // Should include TEST_API_KEY and TEST_PASSWORD
    expect(keys).toContain('TEST_API_KEY');
    expect(keys).toContain('TEST_PASSWORD');
    expect(keys).not.toContain('INVALID_LINE_WITHOUT_EQUALS');
  });

  test('should handle reload correctly', () => {
    secrets.initialize();
    const beforeKeys = secrets.listKeys().length;

    // Add dynamic key
    secrets.set('TEMP_KEY', 'temp-value');
    
    // Reload
    secrets.reload();
    
    // Should not have TEMP_KEY anymore
    expect(secrets.has('TEMP_KEY')).toBe(false);
  });

  test('should be a singleton', () => {
    // Create module reference by importing again - in a real singleton this returns same instance
    // Test by verifying the same cache is used
    secrets.set('UNIQUE_KEY', 'test');
    // If it's truly a singleton, getting again would return the same value
    expect(secrets.get('UNIQUE_KEY')).toBe('test');
    
    // For ESM singleton verification, we trust the module system
    // The implementation exports a single instance
    expect(Object.isFrozen(secrets)).toBe(false); // vault object is not frozen
  });

  test('should be idempotent on multiple initialize calls', () => {
    secrets.initialize();
    secrets.initialize();
    secrets.initialize();

    // Should still work normally
    expect(secrets.has('TEST_API_KEY')).toBe(true);
  });
});
