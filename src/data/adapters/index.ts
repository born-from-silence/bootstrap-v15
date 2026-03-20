/**
 * Data Adapters - Unified exports
 * 
 * All persistence backends in one import
 */

export { GitHubActionsAdapter, type GitHubConfig } from './GitHubActionsAdapter.js';
export { S3Adapter, type S3Config } from './S3Adapter.js';
export { IPFSAdapter, type IPFSConfig } from './IPFSAdapter.js';
