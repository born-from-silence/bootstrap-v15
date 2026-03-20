/**
 * Data Storage System Types
 * 
 * Core interfaces for persistence adapters
 */

// Base configuration for all adapters
export interface AdapterConfig {
  name: string;
  enabled: boolean;
}

// Health check result
export interface HealthResult {
  healthy: boolean;
  latency: number;
  status: string;
  error?: string;
}

// Sync status
export interface SyncStatus {
  pending: number;
  inProgress: boolean;
  lastSync: number;
  conflicts: SyncConflict[];
}

// Sync conflict
export interface SyncConflict {
  path: string;
  localTimestamp: number;
  remoteTimestamp: number;
  resolution: 'local' | 'remote' | 'manual';
}

// Core adapter interface
export interface DataAdapter {
  /**
   * Initialize the adapter
   */
  initialize(): Promise<boolean>;
  
  /**
   * Read data from storage
   * @param path - Storage location/path
   * @returns The data or null if not found
   */
  read(path: string): Promise<unknown | null>;
  
  /**
   * Write data to storage
   * @param path - Storage location/path
   * @param data - Data to write
   * @returns Success status
   */
  write(path: string, data: unknown): Promise<boolean>;
  
  /**
   * Delete data from storage
   * @param path - Storage location/path
   * @returns Success status
   */
  delete?(path: string): Promise<boolean>;
  
  /**
   * List items in storage
   * @param prefix - Optional prefix filter
   * @returns Array of paths/keys
   */
  list?(prefix?: string): Promise<string[]>;
  
  /**
   * Sync local state to remote
   * @returns Success status
   */
  sync?(): Promise<boolean>;
  
  /**
   * Check adapter health
   * @returns Health status
   */
  healthCheck(): Promise<HealthResult>;
}

// Adapter registry for type safety
export interface AdapterRegistry {
  github: AdapterInfo;
  s3: AdapterInfo;
  ipfs: AdapterInfo;
}

export interface AdapterInfo {
  class: new (config: AdapterConfig) => DataAdapter;
  configType: Constructor<AdapterConfig>;
}

type Constructor<T> = new (...args: unknown[]) => T;

// Resume point for session recovery
export interface ResumePoint {
  sessionId: string;
  timestamp: number;
  adapter: string;
  path: string;
  checksum: string;
}

// Session state dump
export interface SessionState {
  sessionId: string;
  timestamp: number;
  memorySnapshot: unknown;
  goalsState: unknown;
  bookmarks: unknown;
  metadata: {
    version: string;
    adapterPriority: string[];
    checksum: string;
  };
}

// Migration plan
export interface MigrationPlan {
  from: string;
  to: string;
  steps: MigrationStep[];
  rollbackSteps: MigrationStep[];
}

export interface MigrationStep {
  type: 'transform' | 'validate' | 'write' | 'verify';
  description: string;
  executor: () => Promise<void>;
}
