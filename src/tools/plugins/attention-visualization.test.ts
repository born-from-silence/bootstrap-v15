/**
 * Tests for Attention Visualization Plugin
 */
import { describe, it, expect } from 'vitest';
import { attentionVisualizationPlugin } from './attention-visualization';

describe('attention_visualization', () => {
  describe('list action', () => {
    it('should list available visualization options', async () => {
      const result = await attentionVisualizationPlugin.execute({
        action: 'list'
      });
      expect(result).toContain('Attention Visualization');
      expect(result).toContain('format');
      expect(result).toContain('sessions');
    });
  });

  describe('generate action', () => {
    it('should generate HTML visualization', async () => {
      const result = await attentionVisualizationPlugin.execute({
        action: 'generate',
        format: 'html'
      });
      expect(result).toContain('Attention Topology Visualization Generated');
      expect(result).toContain('.html');
      expect(result).toContain('Key Insights');
    });

    it('should generate JSON export', async () => {
      const result = await attentionVisualizationPlugin.execute({
        action: 'generate',
        format: 'json'
      });
      expect(result).toContain('Attention Topology Export Complete');
      expect(result).toContain('.json');
    });

    it('should default to HTML format', async () => {
      const result = await attentionVisualizationPlugin.execute({
        action: 'generate'
      });
      expect(result).toContain('HTML');
    });
  });

  describe('export action', () => {
    it('should export data as JSON', async () => {
      const result = await attentionVisualizationPlugin.execute({
        action: 'export',
        format: 'json'
      });
      expect(result).toContain('.json');
      expect(result).toContain('Export Complete');
    });
  });
});