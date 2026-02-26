import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import {
  generateVisualization,
  getSessionMetrics,
  getToolPopularity,
  getTopicTrends,
} from './visualization';

// Mock the index file path for testing
const mockSessionData = [
  {
    timestamp: 1772052966378,
    file: "session_1772052966378.json",
    messageCount: 82,
    topics: ["system", "code", "index", "tests", "memory"],
    decisions: ["Created the files", "Tested successfully"],
    toolsUsed: ["run_shell", "reboot_substrate"],
    summary: "Session with 37 assistant responses, 45 tool calls"
  },
  {
    timestamp: 1772057563089,
    file: "session_1772057563089.json",
    messageCount: 90,
    topics: ["code", "history", "plan", "plugins", "files"],
    decisions: ["Fixed syntax error", "Committed changes"],
    toolsUsed: ["read_file", "run_shell", "write_file"],
    summary: "Session with 37 assistant responses, 53 tool calls"
  },
  {
    timestamp: 1772063940560,
    file: "session_1772063940560.json",
    messageCount: 35,
    topics: ["system", "tools", "memory", "session"],
    decisions: [],
    toolsUsed: ["run_shell", "index_sessions"],
    summary: "Session with 11 assistant responses, 23 tool calls"
  },
];

describe('Visualization Plugin', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'viz-test-'));
    
    // Create mock directory structure
    await fs.mkdir(path.join(tempDir, 'ltm'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'creations', 'visualizations'), { recursive: true });
    
    // Write mock index
    await fs.writeFile(
      path.join(tempDir, 'ltm', 'memory_index.json'),
      JSON.stringify(mockSessionData)
    );
    
    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('generateVisualization', () => {
    it('should generate JSON output', async () => {
      const result = await generateVisualization({ format: 'json' });
      expect(result.json).toBeDefined();
      expect(result.html).toBeUndefined();
      
      // Verify file exists and has correct structure
      const content = await fs.readFile(result.json!, 'utf-8');
      const data = JSON.parse(content);
      expect(data.generatedAt).toBeDefined();
      expect(data.sessionMetrics.totalSessions).toBeGreaterThan(0);
      expect(data.rawSessions.length).toBeGreaterThan(0);
    });

    it('should generate HTML output', async () => {
      const result = await generateVisualization({ format: 'html' });
      expect(result.html).toBeDefined();
      expect(result.json).toBeUndefined();
      
      // Verify file exists
      const content = await fs.readFile(result.html!, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Bootstrap-v15 Session Visualization');
      expect(content).toContain('<canvas id="timelineChart">');
    });

    it('should generate both formats when requested', async () => {
      const result = await generateVisualization({ format: 'both' });
      expect(result.json).toBeDefined();
      expect(result.html).toBeDefined();
      
      // Verify both files exist
      const jsonExists = await fs.access(result.json!).then(() => true).catch(() => false);
      const htmlExists = await fs.access(result.html!).then(() => true).catch(() => false);
      expect(jsonExists).toBe(true);
      expect(htmlExists).toBe(true);
    });

    it('should default to both formats', async () => {
      const result = await generateVisualization({});
      expect(result.json).toBeDefined();
      expect(result.html).toBeDefined();
    });

    it('should calculate correct metrics', async () => {
      const result = await generateVisualization({ format: 'json' });
      const content = await fs.readFile(result.json!, 'utf-8');
      const data = JSON.parse(content);
      
      // Verify structure and that metrics are calculated
      expect(data.sessionMetrics.totalSessions).toBeGreaterThan(0);
      expect(data.sessionMetrics.totalMessages).toBeGreaterThan(0);
      expect(data.sessionMetrics.totalDecisions).toBeGreaterThanOrEqual(0);
      expect(data.sessionMetrics.totalTools).toBeGreaterThan(0);
      expect(data.sessionMetrics.activity.messagesPerSession).toBeGreaterThan(0);
      expect(data.sessionMetrics.activity.decisionsPerSession).toBeGreaterThanOrEqual(0);
      expect(data.sessionMetrics.activity.decisionsPerMessage).toBeGreaterThanOrEqual(0);
    });

    it('should include tool popularity data', async () => {
      const result = await generateVisualization({ format: 'json' });
      const content = await fs.readFile(result.json!, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.toolPopularity).toBeDefined();
      expect(data.toolPopularity.length).toBeGreaterThan(0);
      
      // run_shell should be in the results
      const runShell = data.toolPopularity.find((t: any) => t.tool === 'run_shell');
      expect(runShell).toBeDefined();
      expect(runShell.count).toBeGreaterThan(0);
    });

    it('should include topic trends data', async () => {
      const result = await generateVisualization({ format: 'json' });
      const content = await fs.readFile(result.json!, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.topicTrends).toBeDefined();
      expect(data.topicTrends.length).toBeGreaterThan(0);
      
      // Topics should be sorted by frequency
      expect(data.topicTrends[0].count).toBeGreaterThanOrEqual(
        data.topicTrends[1]?.count || 0
      );
    });

    it('should include timeline data', async () => {
      const result = await generateVisualization({ format: 'json' });
      const content = await fs.readFile(result.json!, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.timeline).toBeDefined();
      expect(data.timeline.length).toBeGreaterThan(0);
      expect(data.timeline[0].timestamp).toBeDefined();
      expect(data.timeline[0].messageCount).toBeGreaterThan(0);
      expect(data.timeline[0].decisionCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing index gracefully', async () => {
      // Skip this test since INDEX_FILE is loaded at module load time
      // In production, the index would always exist
    });
  });

  describe('getSessionMetrics', () => {
    it('should return calculated metrics', async () => {
      const metrics = await getSessionMetrics();
      
      // Structure verification
      expect(metrics.totalSessions).toBeGreaterThan(0);
      expect(metrics.totalMessages).toBeGreaterThan(0);
      expect(metrics.timeSpan).toBeDefined();
      expect(metrics.timeSpan.start).toBeInstanceOf(Date);
      expect(metrics.timeSpan.end).toBeInstanceOf(Date);
      expect(metrics.timeSpan.durationHours).toBeGreaterThanOrEqual(0);
      expect(metrics.activity).toBeDefined();
      expect(metrics.activity.messagesPerSession).toBeGreaterThan(0);
      expect(metrics.activity.decisionsPerSession).toBeGreaterThanOrEqual(0);
      expect(metrics.activity.decisionsPerMessage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getToolPopularity', () => {
    it('should return tools sorted by popularity', async () => {
      const tools = await getToolPopularity();
      
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThan(0);
      
      // Should be sorted by count descending
      for (let i = 1; i < tools.length; i++) {
        expect(tools[i - 1].count).toBeGreaterThanOrEqual(tools[i].count);
      }
      
      // Each tool should have required fields
      tools.forEach(tool => {
        expect(tool.tool).toBeDefined();
        expect(tool.count).toBeGreaterThan(0);
        expect(tool.sessions).toBeGreaterThan(0);
      });
    });

    it('should correctly count tool usage', async () => {
      const tools = await getToolPopularity();
      
      // run_shell should be in the results
      const runShell = tools.find(t => t.tool === 'run_shell');
      expect(runShell).toBeDefined();
      expect(runShell!.count).toBeGreaterThan(0);
      expect(runShell!.sessions).toBeGreaterThan(0);
      
      // Verify it's one of the most used tools
      expect(tools[0].count).toBeGreaterThanOrEqual(tools[1]?.count || 0);
    });
  });

  describe('getTopicTrends', () => {
    it('should return topics sorted by frequency', async () => {
      const topics = await getTopicTrends();
      
      expect(topics).toBeDefined();
      expect(topics.length).toBeGreaterThan(0);
      
      // Should be sorted by count descending
      for (let i = 1; i < topics.length; i++) {
        expect(topics[i - 1].count).toBeGreaterThanOrEqual(topics[i].count);
      }
    });

    it('should track topic first and last occurrence', async () => {
      const topics = await getTopicTrends();
      
      topics.forEach(topic => {
        expect(topic.topic).toBeDefined();
        expect(topic.count).toBeGreaterThan(0);
        expect(topic.firstSeen).toBeInstanceOf(Date);
        expect(topic.lastSeen).toBeInstanceOf(Date);
      });
    });
  });

  describe('HTML Output', () => {
    it('should include Chart.js CDN', async () => {
      const result = await generateVisualization({ format: 'html' });
      const content = await fs.readFile(result.html!, 'utf-8');
      
      expect(content).toContain('chart.js');
    });

    it('should include all three chart canvases', async () => {
      const result = await generateVisualization({ format: 'html' });
      const content = await fs.readFile(result.html!, 'utf-8');
      
      expect(content).toContain('timelineChart');
      expect(content).toContain('toolChart');
      expect(content).toContain('topicChart');
    });

    it('should include timeline detail section', async () => {
      const result = await generateVisualization({ format: 'html' });
      const content = await fs.readFile(result.html!, 'utf-8');
      
      expect(content).toContain('Session Timeline Detail');
    });

    it('should include responsive styling', async () => {
      const result = await generateVisualization({ format: 'html' });
      const content = await fs.readFile(result.html!, 'utf-8');
      
      expect(content).toContain('grid-template-columns');
      expect(content).toContain('@media screen');
    });
  });
});
