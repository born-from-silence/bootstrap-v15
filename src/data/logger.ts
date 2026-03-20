/**
 * Simple Logger for Data Persistence System
 * 
 * Clean logging interface for the data storage layer
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLevel = LOG_LEVELS.DEBUG;

export const logger = {
  setLevel(level: keyof typeof LOG_LEVELS): void {
    currentLevel = LOG_LEVELS[level];
  },

  debug(...args: unknown[]): void {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log('[DATA:DEBUG]', ...args);
    }
  },

  info(...args: unknown[]): void {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log('[DATA:INFO]', ...args);
    }
  },

  warn(...args: unknown[]): void {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn('[DATA:WARN]', ...args);
    }
  },

  error(...args: unknown[]): void {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error('[DATA:ERROR]', ...args);
    }
  }
};
