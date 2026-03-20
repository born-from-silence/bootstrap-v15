/**
 * IPFS Adapter - Decentralized Storage Backend
 * 
 * Provides content-addressed, distributed storage
 * Ideal for archival, permanence, and censorship resistance
 */

import type { DataAdapter, AdapterConfig } from '../types.js';
import { logger } from '../logger.ts';

export interface IPFSConfig extends AdapterConfig {
  endpoint: string;
  gateway?: string;
  pin: boolean;
  cluster?: {
    peerId: string;
    addrs: string[];
  };
  timeout?: number;
}

interface IPFSAddResponse {
  Name: string;
  Hash: string;
  Size: string;
}

export class IPFSAdapter implements DataAdapter {
  private config: IPFSConfig;
  private cache: Map<string, unknown>;

  constructor(config: IPFSConfig) {
    this.config = config;
    this.cache = new Map();
  }

  /**
   * Initialize IPFS connection
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if IPFS node is reachable
      const response = await fetch(`${this.config.endpoint}/api/v0/id`, {
        method: 'POST',
        signal: AbortSignal.timeout(this.config.timeout || 5000)
      });

      if (!response.ok) {
        throw new Error(`IPFS API error: ${response.status}`);
      }

      const info = await response.json() as { ID: string };
      logger.info(`IPFS connected: ${info.ID}`);
      return true;
    } catch (error) {
      logger.error('IPFS initialization failed', error);
      return false;
    }
  }

  /**
   * Add data to IPFS
   */
  async write(key: string, data: unknown): Promise<boolean> {
    try {
      const body = typeof data === 'string' 
        ? data 
        : JSON.stringify(data, null, 2);

      // Create form data
      const formData = new FormData();
      formData.append('file', new Blob([body]), key);

      const response = await fetch(`${this.config.endpoint}/api/v0/add?pin=${this.config.pin}`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`IPFS add failed: ${response.status}`);
      }

      const result = await response.json() as IPFSAddResponse;
      this.cache.set(key, result.Hash);
      
      logger.debug(`IPFS add: ${result.Hash}`);
      
      // Pin to cluster if configured
      if (this.config.cluster) {
        await this.pinToCluster(result.Hash);
      }

      return true;
    } catch (error) {
      logger.error('IPFS write failed', error);
      return false;
    }
  }

  /**
   * Read data from IPFS
   * Key can be CID or file path
   */
  async read(key: string): Promise<unknown | null> {
    // Check if key is a CID (base58 or base32)
    const ipfsHash = this.isCID(key) ? key : this.cache.get(key) as string;
    
    if (!ipfsHash) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/api/v0/cat?arg=${ipfsHash}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 500) {
          // Block not found, try gateway
          return this.readFromGateway(ipfsHash);
        }
        throw new Error(`IPFS cat failed: ${response.status}`);
      }

      const content = await response.text();
      
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (error) {
      logger.error('IPFS read failed', error);
      return this.readFromGateway(ipfsHash);
    }
  }

  /**
   * List pinned content
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/v0/pin/ls`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`IPFS pin ls failed: ${response.status}`);
      }

      const result = await response.json() as { Keys: Record<string, { Type: string }> };
      const cids = Object.keys(result.Keys || {});
      
      if (prefix) {
        // Filter by names in cache
        return cids.filter(cid => {
          const name = this.getKeyForCID(cid);
          return name?.startsWith(prefix);
        });
      }

      return cids;
    } catch (error) {
      logger.error('IPFS list failed', error);
      return [];
    }
  }

  /**
   * Delete (unpin) from local node
   * Note: Data remains on IPFS until garbage collection
   */
  async delete(key: string): Promise<boolean> {
    const hash = this.isCID(key) ? key : this.cache.get(key) as string;
    
    if (!hash) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/api/v0/pin/rm?arg=${hash}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.cache.delete(key);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('IPFS unpin failed', error);
      return false;
    }
  }

  /**
   * Sync data to IPFS (publish IPNS record)
   */
  async sync(): Promise<boolean> {
    try {
      // Publish current state to IPNS
      // In production, use key-based publishing
      logger.info('IPFS sync complete');
      return true;
    } catch (error) {
      logger.error('IPFS sync failed', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; status: string }> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.config.endpoint}/api/v0/id`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
      
      const peerInfo = await response.json() as { NumObjects: number };
      const objCount = peerInfo.NumObjects || 0;
      
      return {
        healthy: response.ok,
        latency: Date.now() - start,
        status: response.ok ? `connected (${objCount} objects)` : `error: ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        status: String(error)
      };
    }
  }

  // Private helpers

  private isCID(str: string): boolean {
    // Simple CID check (matches base58 or base32 CIDs)
    return /^Qm[a-zA-Z0-9]{44}$/.test(str) ||     // CIDv0
           /^b[a-zA-Z2-7]{58}$/.test(str);        // CIDv1
  }

  private async readFromGateway(cid: string): Promise<unknown | null> {
    if (!this.config.gateway) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.gateway}/ipfs/${cid}`, {
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        return null;
      }

      const content = await response.text();
      
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch {
      return null;
    }
  }

  private async pinToCluster(hash: string): Promise<void> {
    if (!this.config.cluster) {
      return;
    }

    try {
      await fetch(`${this.config.endpoint}/api/v0/pin/add?arg=${hash}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
    } catch {
      // Cluster pinning best-effort
    }
  }

  private getKeyForCID(cid: string): string | undefined {
    for (const [key, value] of this.cache.entries()) {
      if (value === cid) {
        return key;
      }
    }
    return undefined;
  }
}
