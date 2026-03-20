/**
 * Bootstrap-v15 Data Persistence Layer
 * 
 * Resilient, multi-backend storage system for session continuity
 * 
 * Usage:
 *   import { initializeDataStorage } from './data';
 *   
 *   const storage = await initializeDataStorage({
 *     primary: 'github',
 *     fallback: ['s3']
 *   });
 */

import { MultiAdapterStorage } from './storage/MultiAdapterStorage.js';
import { RecoveryManager } from './storage/RecoveryManager.js';
import { 
  GitHubActionsAdapter, 
  S3Adapter, 
  IPFSAdapter 
} from './adapters/index.js';
import type { DataAdapter, AdapterConfig } from './types.js';
import { logger } from './logger.ts';

export * from './types.js';
export * from './adapters/index.js';
export * from './storage/index.js';

interface StorageInitOptions {
  primary?: 'github' | 's3' | 'ipfs';
  fallback?: Array<'github' | 's3' | 'ipfs'>;
  consistency?: 'strong' | 'eventual' | 'none';
  syncInterval?: number;
  githubConfig?: {
    token: string;
    owner: string;
    repo: string;
    branch?: string;
  };
  s3Config?: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  ipfsConfig?: {
    endpoint: string;
    pin?: boolean;
  };
}

interface StorageSystem {
  storage: MultiAdapterStorage;
  recovery: RecoveryManager;
  health: () => Promise<object>;
  sync: () => Promise<{ success: string[]; failed: string[] }>;
  checkpoint: (sessionId: string, data: object) => Promise<object>;
  resume: () => Promise<object | null>;
}

/**
 * Initialize the complete data storage system
 */
export async function initializeDataStorage(
  options: StorageInitOptions = {}
): Promise<StorageSystem> {
  const {
    primary = 'github',
    fallback = [],
    consistency = 'eventual',
    syncInterval = 300000,
    githubConfig,
    s3Config,
    ipfsConfig
  } = options;

  logger.info('Initializing data persistence layer...');

  // Create storage manager
  const storage = new MultiAdapterStorage({
    primaryAdapter: primary,
    consistencyMode: consistency,
    syncInterval
  });

  // Register primary adapter
  await registerAdapter(storage, primary, githubConfig, s3Config, ipfsConfig, 10);

  // Register fallback adapters
  for (const [index, adapterName] of fallback.entries()) {
    await registerAdapter(
      storage, 
      adapterName, 
      githubConfig, 
      s3Config, 
      ipfsConfig,
      10 - ((index + 1) * 2)  // Decreasing priority
    );
  }

  // Initialize all adapters
  const success = await storage.initialize();
  
  if (!success) {
    logger.warn('No adapters initialized - running in ephemeral mode');
  }

  // Get recovery manager from primary adapter
  const primaryEntry = storage.getMetrics() as { adapters?: { name: string }[] };
  const primaryAdapterName = primaryEntry.adapters?.[0]?.name || primary;
  const recovery = new RecoveryManager(
    getAdapter(storage, primaryAdapterName),
    { checksumsEnabled: true, maxVersions: 10 }
  );
  await recovery.initialize();

  logger.info('Data persistence layer ready');

  return {
    storage,
    recovery,
    
    health: async () => {
      return {
        adapters: storage.getMetrics(),
        recovery: await recovery.healthReport()
      };
    },

    sync: async () => {
      return await storage.sync();
    },

    checkpoint: async (sessionId: string, data: object) => {
      const id = `session_${sessionId}_${Date.now()}`;
      return await recovery.checkpoint(id, sessionId, data as any);
    },

    resume: async () => {
      return await storage.resumeFromLastGood();
    }
  };
}

// Helper functions

async function registerAdapter(
  storage: MultiAdapterStorage,
  name: 'github' | 's3' | 'ipfs',
  githubConfig?: StorageInitOptions['githubConfig'],
  s3Config?: StorageInitOptions['s3Config'],
  ipfsConfig?: StorageInitOptions['ipfsConfig'],
  priority: number = 5
): Promise<void> {
  switch (name) {
    case 'github':
      if (githubConfig) {
        storage.registerAdapter(
          'github',
          new GitHubActionsAdapter({
            ...githubConfig,
            name: 'github',
            enabled: true,
            branch: githubConfig.branch || 'main'
          }),
          { name: 'github', enabled: true },
          priority
        );
      }
      break;
    
    case 's3':
      if (s3Config) {
        storage.registerAdapter(
          's3',
          new S3Adapter({
            ...s3Config,
            name: 's3',
            enabled: true,
            prefix: 'bootstrap-data'
          }),
          { name: 's3', enabled: true },
          priority
        );
      }
      break;
    
    case 'ipfs':
      if (ipfsConfig) {
        storage.registerAdapter(
          'ipfs',
          new IPFSAdapter({
            name: 'ipfs',
            enabled: true,
            endpoint: ipfsConfig.endpoint,
            pin: ipfsConfig.pin ?? true
          }),
          { name: 'ipfs', enabled: true },
          priority
        );
      }
      break;
  }
}

function getAdapter(storage: MultiAdapterStorage, name: string): DataAdapter {
  // Access private adapter map through reflection
  const adapters = (storage as any).adapters as Map<string, { adapter: DataAdapter }>;
  const entry = adapters.get(name);
  if (!entry) {
    throw new Error(`Adapter '${name}' not found`);
  }
  return entry.adapter;
}

/**
 * Quick-start function for common configuration
 */
export async function createSessionStorage(
  githubToken?: string,
  githubRepo?: string
): Promise<StorageSystem | null> {
  if (!githubToken || !githubRepo) {
    const [owner, repo] = process.env.GITHUB_REPO?.split('/') || [];
    const token = process.env.GITHUB_TOKEN;
    
    if (!token || !owner || !repo) {
      logger.warn('GitHub credentials not configured - data persistence disabled');
      return null;
    }

    return initializeDataStorage({
      primary: 'github',
      githubConfig: { token, owner, repo }
    });
  }

  const [owner, repo] = githubRepo.split('/');
  return initializeDataStorage({
    primary: 'github',
    githubConfig: { token: githubToken, owner, repo }
  });
}
