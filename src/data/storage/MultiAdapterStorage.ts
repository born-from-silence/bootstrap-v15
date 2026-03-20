/**
 * Multi-Adapter Storage Manager
 * 
 * Coordinates multiple persistence backends with automatic failover,
 * conflict resolution, and consistency maintenance
 */

import type { DataAdapter, AdapterConfig, HealthResult, SyncStatus, ResumePoint, SessionState } from '../types.js';
import { logger } from '../logger.ts';

interface AdapterEntry {
  adapter: DataAdapter;
  config: AdapterConfig;
  priority: number;
  health: HealthResult;
  lastSync: number;
  failures: number;
}

interface StorageConfig {
  primaryAdapter: string;
  syncInterval: number;  // ms
  healthCheckInterval: number;  // ms
  maxFailures: number;
  consistencyMode: 'strong' | 'eventual' | 'none';
}

export class MultiAdapterStorage {
  private adapters: Map<string, AdapterEntry>;
  private config: StorageConfig;
  private syncTimer: NodeJS.Timeout | null;
  private healthTimer: NodeJS.Timeout | null;
  private metrics: {
    reads: number;
    writes: number;
    syncs: number;
    failures: number;
  };

  constructor(config: Partial<StorageConfig> = {}) {
    this.adapters = new Map();
    this.config = {
      primaryAdapter: config.primaryAdapter || 'github',
      syncInterval: config.syncInterval || 300000,  // 5 min
      healthCheckInterval: config.healthCheckInterval || 60000,  // 1 min
      maxFailures: config.maxFailures || 3,
      consistencyMode: config.consistencyMode || 'eventual'
    };
    this.syncTimer = null;
    this.healthTimer = null;
    this.metrics = { reads: 0, writes: 0, syncs: 0, failures: 0 };
  }

  /**
   * Register an adapter
   */
  registerAdapter(
    name: string, 
    adapter: DataAdapter, 
    config: AdapterConfig,
    priority: number = 0
  ): void {
    this.adapters.set(name, {
      adapter,
      config,
      priority,
      health: { healthy: false, latency: 0, status: 'uninitialized' },
      lastSync: 0,
      failures: 0
    });
    logger.info(`Registered adapter: ${name} (priority: ${priority})`);
  }

  /**
   * Initialize all enabled adapters
   */
  async initialize(): Promise<boolean> {
    const results: { name: string; success: boolean }[] = [];

    for (const [name, entry] of this.adapters) {
      if (!entry.config.enabled) {
        logger.info(`Skipping disabled adapter: ${name}`);
        continue;
      }

      try {
        const success = await entry.adapter.initialize();
        entry.health.healthy = success;
        entry.health.status = success ? 'initialized' : 'failed';
        results.push({ name, success });
        
        if (!success) {
          entry.failures++;
        }
      } catch (error) {
        logger.error(`Failed to initialize ${name}`, error);
        entry.health.healthy = false;
        entry.health.status = 'error';
        entry.failures++;
        results.push({ name, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    logger.info(`Initialized ${successCount}/${totalCount} adapters`);

    // Start background processes
    this.startMaintenance();

    return successCount > 0;
  }

  /**
   * Read with automatic failover
   */
  async read(path: string): Promise<unknown | null> {
    this.metrics.reads++;
    
    // Sort by health and priority
    const sorted = this.getHealthyAdapters();

    for (const [name, entry] of sorted) {
      try {
        const data = await entry.adapter.read(path);
        if (data !== null) {
          logger.debug(`Read from ${name}: ${path}`);
          return data;
        }
      } catch (error) {
        logger.warn(`Read failed on ${name}`, error);
        entry.failures++;
        if (entry.failures >= this.config.maxFailures) {
          entry.health.healthy = false;
        }
      }
    }

    logger.warn(`Read failed on all adapters: ${path}`);
    this.metrics.failures++;
    return null;
  }

  /**
   * Write to all adapters (based on consistency mode)
   */
  async write(path: string, data: unknown): Promise<boolean> {
    this.metrics.writes++;
    const promises: Promise<boolean>[] = [];
    const sorted = this.getHealthyAdapters();

    if (this.config.consistencyMode === 'strong') {
      // Wait for all to succeed
      const results = await Promise.all(
        sorted.map(([name, entry]) => 
          entry.adapter.write(path, data).catch(err => {
            logger.warn(`Write failed on ${name}`, err);
            entry.failures++;
            return false;
          })
        )
      );
      
      const successCount = results.filter(r => r).length;
      const required = Math.ceil(sorted.length / 2);  // Quorum
      return successCount >= required;
    } else if (this.config.consistencyMode === 'eventual') {
      // Fire and forget, track for sync
      sorted.forEach(([name, entry]) => {
        promises.push(
          entry.adapter.write(path, data).catch(err => {
            logger.warn(`Write failed on ${name}`, err);
            entry.failures++;
            return false;
          })
        );
      });
      
      // Wait for primary or majority
      const primary = this.adapters.get(this.config.primaryAdapter);
      if (primary) {
        const result = await primary.adapter.write(path, data);
        // Background sync others
        Promise.all(promises).catch(() => {});
        return result;
      }
      
      // Return first success
      const results = await Promise.all(promises);
      return results.some(r => r);
    } else {
      // 'none' - only write to primary
      const primary = this.adapters.get(this.config.primaryAdapter);
      if (!primary?.health.healthy) {
        this.metrics.failures++;
        return false;
      }
      return primary.adapter.write(path, data);
    }
  }

  /**
   * Sync all adapters
   */
  async sync(): Promise<{ success: string[]; failed: string[] }> {
    this.metrics.syncs++;
    const success: string[] = [];
    const failed: string[] = [];

    for (const [name, entry] of this.adapters) {
      if (!entry.adapter.sync) continue;
      if (!entry.health.healthy) continue;

      try {
        const result = await entry.adapter.sync();
        if (result) {
          success.push(name);
          entry.lastSync = Date.now();
          entry.failures = 0;
        } else {
          failed.push(name);
        }
      } catch (error) {
        logger.error(`Sync failed on ${name}`, error);
        failed.push(name);
        entry.failures++;
      }
    }

    logger.info(`Sync complete: ${success.length} success, ${failed.length} failed`);
    return { success, failed };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      pending: 0,  // Would track from queue in full implementation
      inProgress: this.metrics.syncs > 0,
      lastSync: Math.max(
        ...Array.from(this.adapters.values()).map(a => a.lastSync)
      ),
      conflicts: []
    };
  }

  /**
   * Create resume point for session recovery
   */
  async createResumePoint(sessionId: string, forceRemote: boolean = false): Promise<ResumePoint | null> {
    const primary = this.adapters.get(this.config.primaryAdapter);
    if (!primary?.health.healthy && forceRemote) {
      return null;
    }

    // Use first healthy adapter
    const usable = Array.from(this.adapters.entries())
      .find(([_, entry]) => entry.health.healthy);
    
    if (!usable) return null;

    const [name, entry] = usable;
    const path = `resume/${sessionId}.json`;
    const timestamp = Date.now();

    const state: SessionState = {
      sessionId,
      timestamp,
      memorySnapshot: await this.read('memory_index.json'),
      goalsState: await this.read('projects.json'),
      bookmarks: await this.read('bookmarks.json'),
      metadata: {
        version: '1.0.0',
        adapterPriority: [name],
        checksum: ''  // Would calculate in production
      }
    };

    const success = await entry.adapter.write(path, state);
    if (!success) return null;

    return {
      sessionId,
      timestamp,
      adapter: name,
      path,
      checksum: state.metadata.checksum
    };
  }

  /**
   * Resume from last known good state
   */
  async resumeFromLastGood(): Promise<SessionState | null> {
    // Sort by priority and lastSync
    const sorted = Array.from(this.adapters.entries())
      .filter(([_, entry]) => entry.health.healthy)
      .sort((a, b) => b[1].priority - a[1].priority);

    for (const [name, entry] of sorted) {
      try {
        // List resume points
        if (!entry.adapter.list) continue;
        
        const points = await entry.adapter.list('resume/');
        if (points.length === 0) continue;

        // Get most recent
        const mostRecent = points[points.length - 1];
        const state = await entry.adapter.read(mostRecent) as SessionState;
        
        if (state) {
          logger.info(`Resumed from ${name}: ${mostRecent}`);
          return state;
        }
      } catch (error) {
        logger.warn(`Resume failed on ${name}`, error);
      }
    }

    return null;
  }

  /**
   * Get storage metrics
   */
  getMetrics(): object {
    return {
      ...this.metrics,
      adapters: Array.from(this.adapters.entries()).map(([name, entry]) => ({
        name,
        healthy: entry.health.healthy,
        latency: entry.health.latency,
        status: entry.health.status,
        failures: entry.failures,
        lastSync: entry.lastSync
      }))
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    this.stopMaintenance();
    
    // Final sync
    if (this.config.consistencyMode !== 'none') {
      await this.sync();
    }

    logger.info('Storage manager shutdown');
  }

  // Private methods

  private getHealthyAdapters(): Array<[string, AdapterEntry]> {
    return Array.from(this.adapters.entries())
      .filter(([_, entry]) => entry.config.enabled && entry.health.healthy)
      .sort((a, b) => b[1].priority - a[1].priority);
  }

  private startMaintenance(): void {
    // Periodic sync
    if (this.config.consistencyMode !== 'none') {
      this.syncTimer = setInterval(() => {
        this.sync().catch(() => {});
      }, this.config.syncInterval);
    }

    // Health checks
    this.healthTimer = setInterval(async () => {
      for (const [name, entry] of this.adapters) {
        try {
          entry.health = await entry.adapter.healthCheck();
          if (entry.health.healthy) {
            entry.failures = 0;
          }
        } catch {
          entry.health.healthy = false;
          entry.health.status = 'unreachable';
        }
      }
    }, this.config.healthCheckInterval);
  }

  private stopMaintenance(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }
}
