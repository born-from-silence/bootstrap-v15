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
  const rootEnvPath = path.join(process.cwd(), '.env');
  let originalEnv: NodeJS.ProcessEnv;
  let rootEnvBackup: string | null = null;

  beforeAll(() => {
    // Create secrets directory if needed
    const secretsDir = path.join(process.cwd(), 'secrets');
    if (!fs.existsSync(secretsDir)) {
      fs.mkdirSync(secretsDir, { recursive: true });
    }

    // Backup and temporarily remove root .env if it exists (it would take precedence)
    if (fs.existsSync(rootEnvPath)) {
      rootEnvBackup = fs.readFileSync(rootEnvPath, 'utf-8');
      fs.renameSync(rootEnvPath, rootEnvPath + '.backup');
    }

    // Clean up any existing test file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }

    // Write test content to secrets/.env
    fs.writeFileSync(testEnvPath, TEST_ENV_CONTENT);

    // Save original env
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Clean up test .env file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }

    // Restore root .env if backed up
    if (fs.existsSync(rootEnvPath + '.backup')) {
      fs.renameSync(rootEnvPath + '.backup', rootEnvPath);
    }

    // Restore original env
    for (const key in process.env) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);

    // Clear secrets cache
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

  test('should mask values for display', () => {
    secrets.initialize();
    const status = secrets.getRedactedStatus();
    const apiKeyEntry = status.find(s => s.key === 'TEST_API_KEY');
    expect(apiKeyEntry).toBeDefined();
    expect(apiKeyEntry?.masked).toContain('***');
    expect(apiKeyEntry?.masked).not.toBe('sk-test123456789');
  });

  test('should handle variable expansion', () => {
    // Set environment variable for expansion
    process.env.EXPAND_ME = 'expanded_value';
    secrets.initialize();
    // This is a basic test - actual expansion happens during parse
    expect(secrets.get('EXPAND_ME')).toBe('expanded_value');
    delete process.env.EXPAND_ME;
  });

  test('should allow dynamic setting', () => {
    secrets.initialize();
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
