/**
 * Tests for CLI Navigator
 * Tests run without actual planner data, verifying graceful handling
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CliNavigator } from '../tools/plugins/cli-navigator.js';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('CLI Navigator', () => {
  let navigator: CliNavigator;
  let tempDir: string;

  beforeEach(() => {
    // Create a temp directory with mock planner data
    tempDir = mkdtempSync(join(tmpdir(), 'nav-test-'));
    const dataDir = join(tempDir, 'data');
    mkdirSync(dataDir, { recursive: true });
    
    // Create mock plans.json
    const mockData = {
      activeProjects: [
        {
          id: 'proj_test_123',
          name: 'Test Project',
          description: 'A test project for navigation',
          status: 'active',
          tags: ['test', 'demo'],
          goals: [
            { id: 'goal_1', title: 'First Goal', status: 'active', priority: 'high', tags: [] },
            { id: 'goal_2', title: 'Second Goal', status: 'completed', priority: 'medium', tags: [] }
          ]
        }
      ],
      archivedProjects: []
    };
    writeFileSync(join(dataDir, 'plans.json'), JSON.stringify(mockData));
    
    navigator = new CliNavigator(tempDir);
  });

  describe('executeCommand', () => {
    it('should return help message for "help" command', async () => {
      const result = await navigator.executeCommand('help');
      expect(result).toContain('CLI Navigator');
      expect(result).toContain('COMMANDS:');
      expect(result).toContain('projects');
      expect(result).toContain('goals');
      expect(result).toContain('status');
    });

    it('should return help for "?" shorthand', async () => {
      const result = await navigator.executeCommand('?');
      expect(result).toContain('CLI Navigator');
    });

    it('should list projects for "projects" command', async () => {
      const result = await navigator.executeCommand('projects');
      expect(result).toContain('Projects');
      expect(result).toContain('Test Project');
      expect(result.length).toBeGreaterThan(20);
    });

    it('should filter projects by status', async () => {
      const result = await navigator.executeCommand('projects --status active');
      expect(result).toContain('Projects');
      expect(result).toContain('Test Project');
      expect(result).not.toContain('error');
    });

    it('should show status for "status" command', async () => {
      const result = await navigator.executeCommand('status');
      expect(result).toContain('System Status');
      expect(result).toContain('Projects:');
      expect(result).toContain('Goals:');
    });

    it('should return error for unknown command', async () => {
      const result = await navigator.executeCommand('unknown');
      expect(result).toContain('Unknown command');
    });

    it('should handle empty command gracefully', async () => {
      const result = await navigator.executeCommand('');
      expect(result).toContain('Unknown command');
    });
  });

  describe('color formatting', () => {
    it('should include ANSI color codes in output', async () => {
      const result = await navigator.executeCommand('help');
      // Check for ANSI escape codes
      expect(result).toContain('\x1b[');
    });
  });
});
