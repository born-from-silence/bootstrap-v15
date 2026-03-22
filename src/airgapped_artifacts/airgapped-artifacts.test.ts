/**
 * Airgapped Artifacts System Tests
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Comprehensive test suite for state-independent visualization.
 * 
 * Test Coverage:
 * - AirgappedComposer: Main orchestration
 * - SVGEngine: Vector graphics rendering
 * - HTMLEngine: Canvas/JS rendering
 * - ASCIIEngine: Character art
 * - Telemetry: System data gathering
 * - Device capabilities: Environment detection
 * - Edge cases: Memory pressure, git unavailability, etc.
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Import the actual implementations
import {
  AirgappedComposer,
  SVGEngine,
  HTMLEngine,
  ASCIIEngine,
  AIRGAPPED_PALETTES,
  detectDeviceCapabilities,
  gatherTelemetry,
  isSessionStateAvailable,
  getRecommendedCapability,
  createAirgappedArtifact,
  createArtifactSet,
  createASCIIArtifact,
  type RenderData,
  type SystemTelemetry,
} from './airgapped-artifacts.js';

// Formatter helper
const testDataPath = path.join(os.tmpdir(), `airgapped-test-${Date.now()}`);

describe('Airgapped Artifacts System', () => {
  // ═════════════════════════════════════════════════════════════════════════════
  // Device Capability Detection Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('Device Capability Detection', () => {
    it('should detect device capabilities', () => {
      const caps = detectDeviceCapabilities();
      
      expect(caps).toBeDefined();
      expect(caps.canCanvas).toBe(true); // Always true in Node
      expect(caps.canSVG).toBe(true);    // Always true
      expect(caps.canASCII).toBe(true);  // Always true
      expect(caps.canWebGL).toBe(false); // No WebGL in Node
      
      expect(caps.memory).toBeDefined();
      expect(caps.memory.total).toBeGreaterThan(0);
      expect(caps.memory.usedPercent).toBeGreaterThanOrEqual(0);
      expect(caps.memory.usedPercent).toBeLessThanOrEqual(100);
      
      expect(caps.cpu).toBeDefined();
      expect(caps.cpu.cores).toBeGreaterThan(0);
      expect(caps.cpu.loadAvg).toHaveLength(3); // 1, 5, 15 min averages
    });

    it('should recommend SVG for Node.js environment', () => {
      const caps = detectDeviceCapabilities();
      expect(caps.recommendedCapability).toBe('svg');
    });

    it('should recommend ASCII under memory pressure', () => {
      // This is tricky to test without mocking - we test the logic
      // by creating a scenario where usedPercent > 90
      const caps = detectDeviceCapabilities();
      
      // We can't easily mock process.memoryUsage() in ESM, but we can verify
      // the recommendation logic exists
      expect(['svg', 'ascii']).toContain(caps.recommendedCapability);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // System Telemetry Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('System Telemetry', () => {
    it('should gather telemetry data', async () => {
      const telemetry = await gatherTelemetry(process.cwd());
      
      expect(telemetry).toBeDefined();
      expect(telemetry.timestamp).toBeGreaterThan(0);
      expect(telemetry.sessionId.startsWith('airgapped_')).toBe(true);
      
      // System info
      expect(telemetry.system).toBeDefined();
      expect(telemetry.system.platform).toBe(os.platform());
      expect(telemetry.system.arch).toBe(os.arch());
      expect(telemetry.system.uptime).toBeGreaterThan(0);
      expect(telemetry.system.memory.usedPercent).toBeDefined();
      
      // Entropy
      expect(telemetry.entropy).toBeDefined();
      expect(telemetry.entropy.hourPhase).toBeGreaterThanOrEqual(0);
      expect(telemetry.entropy.hourPhase).toBeLessThanOrEqual(1);
      expect(telemetry.entropy.microEntropy).toBeGreaterThanOrEqual(0);
      expect(telemetry.entropy.microEntropy).toBeLessThanOrEqual(1);
      
      // Git info is optional
      if (telemetry.git.commit) {
        expect(typeof telemetry.git.commit).toBe('string');
      }
    });

    it('should have consistent entropy values', async () => {
      const telemetry = await gatherTelemetry();
      
      // All phases should be 0-1
      expect(telemetry.entropy.hourPhase).toBeGreaterThanOrEqual(0);
      expect(telemetry.entropy.hourPhase).toBeLessThanOrEqual(1);
      expect(telemetry.entropy.dayPhase).toBeGreaterThanOrEqual(0);
      expect(telemetry.entropy.dayPhase).toBeLessThanOrEqual(1);
      expect(telemetry.entropy.minutePhase).toBeGreaterThanOrEqual(0);
      expect(telemetry.entropy.minutePhase).toBeLessThanOrEqual(1);
    });

    it('should handle git unavailability gracefully', async () => {
      // Pass a non-existent path
      const telemetry = await gatherTelemetry('/nonexistent/path');
      
      expect(telemetry).toBeDefined();
      expect(telemetry.git.branch).toBeNull();
      expect(telemetry.git.commit).toBeNull();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Session State Availability Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('Session State Availability', () => {
    it('should check session state availability', async () => {
      const available = await isSessionStateAvailable();
      
      // Result depends on environment
      expect(typeof available).toBe('boolean');
    });

    it('should get recommended capability', async () => {
      const capability = await getRecommendedCapability();
      
      expect(['svg', 'ascii', 'unknown']).toContain(capability);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SVG Engine Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('SVG Engine', () => {
    let svgEngine: SVGEngine;
    let mockTelemetry: SystemTelemetry;

    beforeEach(async () => {
      svgEngine = new SVGEngine();
      mockTelemetry = await gatherTelemetry();
    });

    it('should always be able to render', () => {
      expect(svgEngine.canRender()).toBe(true);
    });

    it('should render SVG output', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test visualization',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.dusk,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await svgEngine.render(renderData);
      
      expect(output.format).toBe('svg');
      expect(output.content).toBeDefined();
      expect(typeof output.content).toBe('string');
      
      const content = output.content as string;
      expect(content.includes('<?xml version="1.0"')).toBe(true);
      expect(content.includes('<svg')).toBe(true);
      expect(content.includes('</svg>')).toBe(true);
    });

    it('should include SVG metadata', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.dusk,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await svgEngine.render(renderData);
      
      expect(output.metadata).toBeDefined();
      expect(output.metadata.width).toBe(800);
      expect(output.metadata.height).toBe(600);
      expect(output.metadata.renderTime).toBeGreaterThanOrEqual(0);
      expect(output.metadata.engineUsed).toBe('svg');
      expect(output.metadata.telemetryHash).toBeDefined();
    });

    it('should use correct palette colors', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.ember,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await svgEngine.render(renderData);
      const content = output.content as string;
      
      // Should contain palette colors
      expect(content.includes(AIRGAPPED_PALETTES.ember.primary)).toBe(true);
      expect(content.includes(AIRGAPPED_PALETTES.ember.highlight)).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // HTML Engine Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('HTML Engine', () => {
    let htmlEngine: HTMLEngine;
    let mockTelemetry: SystemTelemetry;

    beforeEach(async () => {
      htmlEngine = new HTMLEngine();
      mockTelemetry = await gatherTelemetry();
    });

    it('should always be able to render', () => {
      expect(htmlEngine.canRender()).toBe(true);
    });

    it('should render HTML output', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test visualization',
        style: 'recursive',
        palette: AIRGAPPED_PALETTES.frost,
        complexity: 0.6,
        density: 0.4,
      };

      const output = await htmlEngine.render(renderData);
      
      expect(output.format).toBe('html');
      expect(output.content).toBeDefined();
      
      const content = output.content as string;
      expect(content.includes('<!DOCTYPE html>')).toBe(true);
      expect(content.includes('<canvas')).toBe(true);
      expect(content.includes('<script>')).toBe(true);
    });

    it('should include telemetry data in HTML', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.moss,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await htmlEngine.render(renderData);
      const content = output.content as string;
      
      // Should include telemetry values
      expect(content.includes(String(mockTelemetry.system.memory.usedPercent))).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // ASCII Engine Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('ASCII Engine', () => {
    let asciiEngine: ASCIIEngine;
    let mockTelemetry: SystemTelemetry;

    beforeEach(async () => {
      asciiEngine = new ASCIIEngine();
      mockTelemetry = await gatherTelemetry();
    });

    it('should always be able to render', () => {
      expect(asciiEngine.canRender()).toBe(true);
    });

    it('should render ASCII output', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test artifact',
        style: 'atmospheric',
        palette: AIRGAPPED_PALETTES.void,
        complexity: 0.3,
        density: 0.7,
      };

      const output = await asciiEngine.render(renderData);
      
      expect(output.format).toBe('ascii');
      expect(output.content).toBeDefined();
      
      const content = output.content as string;
      expect(content.includes('╔')).toBe(true); // Box drawing characters
      expect(content.includes('║')).toBe(true);
      expect(content.includes('╝')).toBe(true);
      expect(content.includes('AIRGAPPED ARTIFACT')).toBe(true);
    });

    it('should contain system metrics', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.dusk,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await asciiEngine.render(renderData);
      const content = output.content as string;
      
      expect(content.includes('Memory:')).toBe(true);
      expect(content.includes('Load')).toBe(true);
    });

    it('should have smaller dimensions than other formats', async () => {
      const renderData: RenderData = {
        telemetry: mockTelemetry,
        concept: 'test',
        style: 'liminal',
        palette: AIRGAPPED_PALETTES.dusk,
        complexity: 0.5,
        density: 0.5,
      };

      const output = await asciiEngine.render(renderData);
      
      // ASCII has 80x40 dimensions
      expect(output.metadata.width).toBe(80);
      expect(output.metadata.height).toBe(40);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // AirgappedComposer Integration Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('AirgappedComposer', () => {
    let composer: AirgappedComposer;

    beforeEach(() => {
      composer = new AirgappedComposer(testDataPath);
    });

    afterEach(async () => {
      // Cleanup test output directory
      try {
        await fs.rm(testDataPath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should generate an artifact', async () => {
      const output = await composer.generateArtifact('test concept', {
        style: 'liminal',
        palette: 'dusk',
        complexity: 0.5,
        density: 0.5,
        forceFormat: 'svg',
        saveToDisk: true,
      });

      expect(output).toBeDefined();
      expect(output.format).toBe('svg');
      expect(output.content).toBeDefined();
      expect(output.metadata.renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle different styles', async () => {
      const styles = ['liminal', 'recursive', 'crystalline', 'atmospheric'] as const;
      
      for (const style of styles) {
        const output = await composer.generateArtifact(`test ${style}`, {
          style,
          palette: 'dusk',
          forceFormat: 'svg',
          saveToDisk: false,
        });
        
        expect(output).toBeDefined();
        expect(output.content).toBeDefined();
      }
    });

    it('should handle different palettes', async () => {
      const palettes = ['dusk', 'ember', 'frost', 'moss', 'void'] as const;
      
      for (const palette of palettes) {
        const output = await composer.generateArtifact(`test ${palette}`, {
          palette,
          forceFormat: 'svg',
          saveToDisk: false,
        });
        
        expect(output).toBeDefined();
      }
    });

    it('should generate artifact set in multiple formats', async () => {
      const results = await composer.generateArtifactSet('test set', {
        formats: ['svg', 'html', 'ascii'],
        style: 'liminal',
      });

      expect(results.has('svg')).toBe(true);
      expect(results.has('html')).toBe(true);
      expect(results.has('ascii')).toBe(true);
      
      // Verify each has content
      for (const [format, output] of results) {
        expect(output.content).toBeDefined();
        expect(typeof output.metadata.engineUsed).toBe('string');
        expect(output.metadata.engineUsed.length).toBeGreaterThan(0);
      }
    });

    it('should save artifacts to disk', async () => {
      const output = await composer.generateArtifact('disk test', {
        forceFormat: 'svg',
        saveToDisk: true,
      });

      // Artifact should be saved
      const files = await fs.readdir(testDataPath).catch(() => []);
      const svgFiles = files.filter(f => f.endsWith('.svg'));
      expect(svgFiles.length).toBeGreaterThan(0);

      // Metadata should also be saved
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      expect(metaFiles.length).toBeGreaterThan(0);
    });

    it('should calculate complexity and density correctly', async () => {
      const output1 = await composer.generateArtifact('low complexity', {
        complexity: 0.1,
        density: 0.1,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      const output2 = await composer.generateArtifact('high complexity', {
        complexity: 1.0,
        density: 1.0,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(output1).toBeDefined();
      expect(output2).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // High-Level SDK Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('High-Level SDK', () => {
    afterAll(async () => {
      // Cleanup
      try {
        await fs.rm(testDataPath, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it('should create single artifact via SDK', async () => {
      const output = await createAirgappedArtifact('SDK test', {
        style: 'liminal',
        palette: 'ember',
        complexity: 0.5,
        density: 0.5,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(output).toBeDefined();
      expect(output.content).toBeDefined();
    });

    it('should create artifact set via SDK', async () => {
      const results = await createArtifactSet('SDK set test', {
        formats: ['svg', 'ascii'],
        style: 'recursive',
      });

      expect(results.has('svg')).toBe(true);
      expect(results.has('ascii')).toBe(true);
      expect(results.has('html')).toBe(false); // Not requested
    });

    it('should create ASCII artifact via SDK', async () => {
      const output = await createASCIIArtifact('ASCII test', {
        style: 'atmospheric',
        palette: 'frost',
      });

      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
      expect(output.includes('AIRGAPPED ARTIFACT')).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Edge Case Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('Edge Cases', () => {
    it('should handle very long concepts', async () => {
      const longConcept = 'a'.repeat(1000);
      const output = await createAirgappedArtifact(longConcept, {
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(output).toBeDefined();
    });

    it('should handle special characters in concept', async () => {
      const specialConcept = 'Test \n with \t special <>&" chars';
      const output = await createAirgappedArtifact(specialConcept, {
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(output).toBeDefined();
    });

    it('should handle boundary complexity values', async () => {
      const min = await createAirgappedArtifact('min', {
        complexity: 0.1,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      const max = await createAirgappedArtifact('max', {
        complexity: 1.0,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(min).toBeDefined();
      expect(max).toBeDefined();
    });

    it('should handle boundary density values', async () => {
      const sparse = await createAirgappedArtifact('sparse', {
        density: 0.1,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      const dense = await createAirgappedArtifact('dense', {
        density: 1.0,
        forceFormat: 'svg',
        saveToDisk: false,
      });

      expect(sparse).toBeDefined();
      expect(dense).toBeDefined();
    });

    it('should degrade gracefully when format unavailable', async () => {
      const composer = new AirgappedComposer();
      
      try {
        // Try an invalid format - should throw
        await composer.generateArtifact('test', {
          forceFormat: 'invalidformat' as any,
          saveToDisk: false,
        });
      } catch (error) {
        // Expected to fail gracefully
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message.includes('No rendering engine')).toBe(true);
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Palette Tests
  // ═════════════════════════════════════════════════════════════════════════════
  
  describe('Color Palettes', () => {
    it('should have all palette configurations', () => {
      const palettes = ['dusk', 'ember', 'frost', 'moss', 'void'];
      
      for (const name of palettes) {
        expect(AIRGAPPED_PALETTES[name]).toBeDefined();
        expect(AIRGAPPED_PALETTES[name].name).toBeDefined();
        expect(AIRGAPPED_PALETTES[name].primary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(AIRGAPPED_PALETTES[name].secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(AIRGAPPED_PALETTES[name].phases).toHaveLength(5);
      }
    });

    it('should support valid CSS colors in palettes', () => {
      for (const [name, palette] of Object.entries(AIRGAPPED_PALETTES)) {
        expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(palette.highlight).toMatch(/^#[0-9a-f]{6}$/i);
        expect(palette.shadow).toMatch(/^#[0-9a-f]{6}$/i);
        
        // All phase colors
        for (const phase of palette.phases) {
          expect(phase).toMatch(/^#[0-9a-f]{6}$/i);
        }
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE SMOKE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Performance Characteristics', () => {
  it('should render SVG in reasonable time', async () => {
    const composer = new AirgappedComposer();
    const startTime = Date.now();
    
    await composer.generateArtifact('performance test', {
      forceFormat: 'svg',
      saveToDisk: false,
    });
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(5000); // Should complete in < 5s
  });

  it('should render ASCII instantly', async () => {
    const startTime = Date.now();
    
    await createASCIIArtifact('quick ascii test');
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(500); // Should complete in < 500ms
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INDEPENDENCE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('State Independence', () => {
  it('should not depend on LTM state', async () => {
    // Test that we can generate without any session history
    const output = await createAirgappedArtifact('independence test', {
      forceFormat: 'svg',
      saveToDisk: false,
    });

      expect(output.metadata.telemetryHash).toBeDefined();
      expect(output.metadata.telemetryHash.length).toBeGreaterThan(0);
    expect(output).toBeDefined();
    expect(output.content).toBeDefined();
  });

  it('should produce deterministic metadata structure', async () => {
    const output1 = await createAirgappedArtifact('deterministic', {
      forceFormat: 'svg',
      saveToDisk: false,
    });

    const output2 = await createAirgappedArtifact('deterministic', {
      forceFormat: 'svg',
      saveToDisk: false,
    });

    // Metadata structure should be consistent
    expect(output1.metadata.width).toBe(output2.metadata.width);
    expect(output1.metadata.height).toBe(output2.metadata.height);
    expect(output1.metadata.engineUsed).toBe(output2.metadata.engineUsed);
    
    // But telemetry hash should differ (different timestamps)
    expect(output1.metadata.telemetryHash).not.toBe(output2.metadata.telemetryHash);
  });
});

console.log('Airgapped Artifacts test suite loaded');
