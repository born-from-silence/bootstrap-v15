/**
 * Secure Credential Vault
 * 
 * Loads and caches credentials from environment variables or .env file.
 * Never logs or exposes secret values.
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecretCache {
  [key: string]: string;
}

class CredentialVault {
  private cache: SecretCache = {};
  private initialized: boolean = false;
  private secretsPath: string;

  constructor() {
    this.secretsPath = path.join(process.cwd(), 'secrets', '.env');
  }

  /**
   * Initialize the vault by loading secrets from .env file.
   * Safe to call multiple times - subsequent calls are no-ops.
   */
  initialize(): void {
    if (this.initialized) return;

    // First check if .env file exists
    if (fs.existsSync(this.secretsPath)) {
      const content = fs.readFileSync(this.secretsPath, 'utf-8');
      this.parseEnvContent(content);
    }

    // Also load from process.env (overrides .env)
    for (const [key, value] of Object.entries(process.env)) {
      if (key && value) {
        this.cache[key] = value;
      }
    }

    this.initialized = true;
  }

  /**
   * Parse .env file content into key-value pairs.
   * Handles comments, empty lines, and quoted values.
   */
  private parseEnvContent(content: string): void {
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Parse KEY=VALUE
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Expand simple variable references (e.g., $HOME -> actual value)
      value = this.expandVariables(value);

      if (key) {
        this.cache[key] = value;
      }
    }
  }

  /**
   * Expand simple variable references like $VAR or ${VAR}.
   */
  private expandVariables(value: string): string {
    // Handle ${VAR} format
    value = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || this.cache[varName] || match;
    });

    // Handle $VAR format
    value = value.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || this.cache[varName] || match;
    });

    return value;
  }

  /**
   * Get a secret value by key.
   * Returns undefined if not found.
   */
  get(key: string): string | undefined {
    this.initialize();
    return this.cache[key];
  }

  /**
   * Get a secret value or throw if not found.
   */
  require(key: string): string {
    const value = this.get(key);
    if (value === undefined) {
      throw new Error(`Required secret "${key}" not found in vault`);
    }
    return value;
  }

  /**
   * Check if a secret key exists.
   */
  has(key: string): boolean {
    this.initialize();
    return key in this.cache && this.cache[key] !== undefined;
  }

  /**
   * Get list of available keys (for debugging, values are redacted).
   */
  listKeys(): string[] {
    this.initialize();
    return Object.keys(this.cache);
  }

  /**
   * Return a masked version of value for safe logging.
   * Shows first few and last few characters only.
   */
  mask(value: string, visibleStart: number = 3, visibleEnd: number = 2): string {
    if (!value) return value;
    if (value.length <= visibleStart + visibleEnd) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, visibleStart) + '***' + value.substring(value.length - visibleEnd);
  }

  /**
   * Create redacted status showing available keys but masked values.
   */
  getRedactedStatus(): { key: string; masked: string }[] {
    this.initialize();
    return Object.entries(this.cache).map(([key, value]) => ({
      key,
      masked: this.mask(value)
    }));
  }

  /**
   * Set a secret value programmatically (useful for testing).
   */
  set(key: string, value: string): void {
    this.initialize();
    this.cache[key] = value;
  }

  /**
   * Clear all cached secrets (mainly for testing).
   */
  clear(): void {
    this.cache = {};
    this.initialized = false;
  }

  /**
   * Reload secrets from .env file.
   */
  reload(): void {
    this.clear();
    this.initialize();
  }
}

// Singleton instance
const vault = new CredentialVault();

export const secrets = vault;
export default vault;
