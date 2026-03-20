/**
 * Session Recovery Manager
 * 
 * Handles corruption detection, data validation, and magnetic drift correction
 */

import type { DataAdapter, SessionState } from '../types.js';
import { logger } from '../logger.ts';

interface RecoveryConfig {
  adapter: DataAdapter;
  checksumsEnabled: boolean;
  validationSchema: object;
  maxVersions: number;
}

interface ValidationResult {
  valid: boolean;
  path: string;
  errors: string[];
  warnings: string[];
}

interface RecoveryPoint {
  id: string;
  timestamp: number;
  adapter: string;
  checksum: string;
  metadata: object;
}

export class RecoveryManager {
  private adapter: DataAdapter;
  private config: RecoveryConfig;
  private checkpoints: Map<string, RecoveryPoint>;

  constructor(adapter: DataAdapter, config: Partial<RecoveryConfig> = {}) {
    this.adapter = adapter;
    this.config = {
      adapter,
      checksumsEnabled: config.checksumsEnabled ?? true,
      validationSchema: config.validationSchema || {},
      maxVersions: config.maxVersions || 10
    } as RecoveryConfig;
    this.checkpoints = new Map();
  }

  /**
   * Initialize recovery system
   */
  async initialize(): Promise<boolean> {
    try {
      // Load existing checkpoints
      const index = await this.adapter.read('recovery/index.json');
      if (index && typeof index === 'object') {
        const parsed = index as Record<string, RecoveryPoint>;
        for (const [key, value] of Object.entries(parsed)) {
          this.checkpoints.set(key, value);
        }
      }
      
      logger.info(`Loaded ${this.checkpoints.size} recovery checkpoints`);
      return true;
    } catch (error) {
      logger.error('Recovery init failed', error);
      return false;
    }
  }

  /**
   * Create recovery checkpoint
   */
  async checkpoint(id: string, sessionId: string, data: SessionState): Promise<RecoveryPoint> {
    const timestamp = Date.now();
    const checkpoint: RecoveryPoint = {
      id,
      timestamp,
      adapter: 'github',
      checksum: this.config.checksumsEnabled ? this.calculateChecksum(data) : '',
      metadata: {
        sessionId,
        dataKeys: Object.keys(data),
        size: JSON.stringify(data).length
      }
    };

    // Save checkpoint metadata
    this.checkpoints.set(id, checkpoint);
    await this.saveIndex();

    // Save actual state
    const path = `recovery/checkpoints/${id}.json`;
    await this.adapter.write(path, data);

    // Cleanup old checkpoints (keep only last N)
    await this.cleanupOldCheckpoints();

    logger.info(`Created checkpoint: ${id}`);
    return checkpoint;
  }

  /**
   * Validate data integrity
   */
  async validate(path: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: false,
      path,
      errors: [],
      warnings: []
    };

    try {
      const data = await this.adapter.read(path);
      
      if (data === null) {
        result.errors.push('File not found');
        return result;
      }

      // JSON validation
      if (typeof data === 'string') {
        try {
          JSON.parse(data);
        } catch {
          result.errors.push('Invalid JSON format');
          return result;
        }
      }

      // Schema validation (simplified)
      if (this.config.validationSchema && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const requiredFields = ['sessionId', 'timestamp'];
        
        for (const field of requiredFields) {
          if (!(field in obj)) {
            result.warnings.push(`Missing field: ${field}`);
          }
        }
      }

      // Checksum verification if available
      if (this.config.checksumsEnabled) {
        const checksumData = await this.adapter.read(`checksums/${path}`);
        if (checksumData) {
          const storedChecksum = typeof checksumData === 'string' 
            ? checksumData 
            : (checksumData as Record<string, string>).hash;
          
          const calculated = this.calculateChecksum(data);
          if (storedChecksum && storedChecksum !== calculated) {
            result.errors.push('Checksum mismatch - possible corruption');
          }
        }
      }

      result.valid = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Validation error: ${String(error)}`);
    }

    return result;
  }

  /**
   * Detect drift between expected and actual state
   */
  async detectDrift(expectedPaths: string[]): Promise<{
    drift: boolean;
    deviations: string[];
    missing: string[];
    extra: string[];
  }> {
    const deviations: string[] = [];
    const missing: string[] = [];
    
    // Check expected files
    for (const path of expectedPaths) {
      const validation = await this.validate(path);
      
      if (!validation.valid) {
        if (validation.errors.some(e => e.includes('not found'))) {
          missing.push(path);
        } else {
          deviations.push(`${path}: ${validation.errors.join(', ')}`);
        }
      }
    }

    // Check for unexpected files (optional)
    const extra: string[] = [];  // Would require listing all files

    return {
      drift: missing.length > 0 || deviations.length > 0,
      deviations,
      missing,
      extra
    };
  }

  /**
   * Repair corrupted or missing data
   */
  async repair(path: string): Promise<{ success: boolean; source?: string }> {
    // Try to recover from checkpoint
    const checkpoints = Array.from(this.checkpoints.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    for (const cp of checkpoints) {
      const checkpointData = await this.adapter.read(`recovery/checkpoints/${cp.id}.json`);
      
      if (checkpointData) {
        const state = checkpointData as SessionState;
        
        // Check if this checkpoint contains the needed data
        if (path === 'memory_index.json' && state.memorySnapshot) {
          const success = await this.adapter.write(path, state.memorySnapshot);
          
          if (success) {
            logger.info(`Repaired ${path} from checkpoint ${cp.id}`);
            return { success: true, source: cp.id };
          }
        } else if (path === 'bookmarks.json' && state.bookmarks) {
          const success = await this.adapter.write(path, state.bookmarks);
          
          if (success) {
            logger.info(`Repaired ${path} from checkpoint ${cp.id}`);
            return { success: true, source: cp.id };
          }
        }
      }
    }

    return { success: false };
  }

  /**
   * List available recovery points
   */
  listRecoveryPoints(): RecoveryPoint[] {
    return Array.from(this.checkpoints.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Recover to specific point
   */
  async recoverToPoint(id: string): Promise<SessionState | null> {
    try {
      const data = await this.adapter.read(`recovery/checkpoints/${id}.json`);
      
      if (!data) {
        logger.error(`Recovery point not found: ${id}`);
        return null;
      }

      logger.info(`Recovered to point: ${id}`);
      return data as SessionState;
    } catch (error) {
      logger.error(`Recovery failed`, error);
      return null;
    }
  }

  /**
   * Full system health report
   */
  async healthReport(): Promise<{
    date: string;
    status: 'healthy' | 'degraded' | 'critical';
    checks: object;
  }> {
    const checks = {
      adapter: { healthy: false, latency: 0 },
      checkpoints: { count: 0, age: 0 },
      corruption: { found: 0, repaired: 0 },
      drift: { detected: false, magnitude: 0 }
    };

    // Check adapter health
    const health = await this.adapter.healthCheck();
    checks.adapter = { healthy: health.healthy, latency: health.latency };

    // Check checkpoints
    checks.checkpoints = {
      count: this.checkpoints.size,
      age: Math.max(0, Date.now() - (this.listRecoveryPoints()[0]?.timestamp || 0))
    };

    // Detect drift in key files
    const drift = await this.detectDrift([
      'memory_index.json',
      'bookmarks.json',
      'projects.json'
    ]);
    checks.drift = {
      detected: drift.drift,
      magnitude: drift.missing.length + drift.deviations.length
    };

    // Calculate overall status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (!checks.adapter.healthy) status = 'degraded';
    if (checks.drift.detected) status = 'degraded';
    if (drift.missing.length > 2) status = 'critical';

    return {
      date: new Date().toISOString(),
      status,
      checks
    };
  }

  // Private helpers

  private calculateChecksum(data: unknown): string {
    // Simplified checksum - in production use proper hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private async saveIndex(): Promise<void> {
    const index = Object.fromEntries(this.checkpoints);
    await this.adapter.write('recovery/index.json', index);
  }

  private async cleanupOldCheckpoints(): Promise<void> {
    const sorted = this.listRecoveryPoints();
    const toDelete = sorted.slice(this.config.maxVersions);

    for (const cp of toDelete) {
      // Cleanup would remove files here
      this.checkpoints.delete(cp.id);
    }

    if (toDelete.length > 0) {
      await this.saveIndex();
      logger.debug(`Cleaned up ${toDelete.length} old checkpoints`);
    }
  }
}
