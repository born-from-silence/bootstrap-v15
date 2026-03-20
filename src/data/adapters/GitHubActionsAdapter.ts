/**
 * GitHub Actions Adapter - Session Persistence via GitHub
 * 
 * Uses GitHub's infrastructure as a backing store:
 * - Git for versioned state
 * - Actions workflows for automation
 * - GitHub API for programmatic access
 */

import type { DataAdapter, AdapterConfig } from '../types.js';
import { logger } from '../logger.ts';

export interface GitHubConfig extends AdapterConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  apiVersion?: string;
}

export class GitHubActionsAdapter implements DataAdapter {
  private baseUrl: string;
  private headers: Record<string, string>;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.baseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Accept': `application/vnd.github+json`,
      'X-GitHub-Api-Version': config.apiVersion || '2022-11-28'
    };
  }

  /**
   * Initialize the adapter - verify GitHub access
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.headers
      });
      
      if (!response.ok) {
        logger.error(`GitHub API error: ${response.status}`);
        return false;
      }

      const repo = await response.json();
      logger.info(`Connected to GitHub repo: ${repo.full_name}`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize GitHub adapter', error);
      return false;
    }
  }

  /**
   * Read data file from repository
   */
  async read(path: string): Promise<unknown | null> {
    try {
      const contentUrl = `${this.baseUrl}/contents/${path}?ref=${this.config.branch}`;
      const response = await fetch(contentUrl, {
        headers: this.headers
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json() as { content: string; encoding: string };
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (error) {
      logger.error(`Failed to read ${path}`, error);
      return null;
    }
  }

  /**
   * Write data file to repository
   */
  async write(path: string, data: unknown): Promise<boolean> {
    try {
      const contentUrl = `${this.baseUrl}/contents/${path}`;
      const content = typeof data === 'string' 
        ? data 
        : JSON.stringify(data, null, 2);
      
      const encodedContent = Buffer.from(content).toString('base64');

      // Check if file exists (need sha for update)
      const existingResponse = await fetch(
        `${contentUrl}?ref=${this.config.branch}`,
        { headers: this.headers }
      );
      
      const sha = existingResponse.ok 
        ? (await existingResponse.json() as { sha: string }).sha 
        : undefined;

      // Write or update file
      const response = await fetch(contentUrl, {
        method: 'PUT',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Data update: ${path}`,
          content: encodedContent,
          branch: this.config.branch,
          ...(sha && { sha })
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      logger.debug(`Wrote ${path} to GitHub`);
      return true;
    } catch (error) {
      logger.error(`Failed to write ${path}`, error);
      return false;
    }
  }

  /**
   * Trigger workflows programmatically
   */
  async triggerWorkflow(workflowId: string, inputs?: Record<string, unknown>): Promise<boolean> {
    try {
      const dispatchUrl = `${this.baseUrl}/actions/workflows/${workflowId}/dispatches`;
      
      const response = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: this.config.branch,
          inputs: inputs || {}
        })
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Workflow trigger failed: ${response.status}`);
      }

      logger.info(`Triggered workflow: ${workflowId}`);
      return true;
    } catch (error) {
      logger.error('Failed to trigger workflow', error);
      return false;
    }
  }

  /**
   * List recent workflow runs
   */
  async getWorkflowRuns(workflowId: string, limit: number = 10): Promise<unknown[]> {
    try {
      const runsUrl = `${this.baseUrl}/actions/workflows/${workflowId}/runs?per_page=${limit}`;
      
      const response = await fetch(runsUrl, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as { workflow_runs: unknown[] };
      return data.workflow_runs;
    } catch (error) {
      logger.error('Failed to get workflow runs', error);
      return [];
    }
  }

  /**
   * Sync current local state to remote
   */
  async sync(): Promise<boolean> {
    try {
      // Trigger the main sync workflow
      return await this.triggerWorkflow('session-sync.yml');
    } catch (error) {
      logger.error('Sync failed', error);
      return false;
    }
  }

  /**
   * Check adapter health
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; status: string }> {
    const start = Date.now();
    
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.headers
      });
      
      const latency = Date.now() - start;
      
      return {
        healthy: response.ok,
        latency,
        status: response.ok ? 'connected' : `error: ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        status: String(error)
      };
    }
  }
}
