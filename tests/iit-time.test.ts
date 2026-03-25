/**
 * IIT-Time System Tests
 * 
 * Comprehensive tests for the IIT temporal measurement system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  IITMeasurement,
  IITTimeSeries,
  initializeIITTime,
  recordMeasurement,
  loadMeasurements,
  getSessionMeasurements,
  getMeasurementsInRange,
  detectAnomalies,
  analyzeTrends,
  discoverPatterns,
  generateSessionProfile,
  exportToCSV,
  generateAnalysisReport,
  TROPHIES_FILE as IIT_TROPHIES_FILE,
  MEASUREMENTS_FILE
} from '../src/iit-time/index';

const TEST_DIR = path.join(process.cwd(), 'iit-time-test');

describe('IIT-Time System', () => {
  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {}
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {}
  });

  describe('Initialization', () => {
    it('should initialize the IIT-Time system', async () => {
      await initializeIITTime();
      
      // Check files were created
      const stats = await fs.stat('./iit-time');
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create default measurement file structure', async () => {
      await initializeIITTime();
      
      const data = await fs.readFile(MEASUREMENTS_FILE, 'utf-8');
      const series: IITTimeSeries = JSON.parse(data);
      
      expect(series.measurements).toEqual([]);
      expect(series.metadata.totalMeasurements).toBe(0);
      expect(series.metadata.averagePhi).toBe(0);
    });
  });

  describe('Recording Measurements', () => {
    it('should record a basic measurement', async () => {
      await initializeIITTime();
      
      const measurement = await recordMeasurement({
        sessionId: 'test-session-1',
        bigPhi: 1.5,
        smallPhi: 0.8,
        activeElements: [0, 1, 2],
        phase: 'engagement',
        duration: 100,
        sessionDuration: 1000,
        messageCount: 10,
        toolCount: 5,
        memoryUsage: 100
      });
      
      expect(measurement.id).toBeDefined();
      expect(measurement.timestamp).toBeGreaterThan(0);
      expect(measurement.bigPhi).toBe(1.5);
      expect(measurement.activeElements).toEqual([0, 1, 2]);
    });

    it('should update metadata on recording', async () => {
      await initializeIITTime();
      
      await recordMeasurement({
        sessionId: 'test-session-1',
        bigPhi: 1.5,
        smallPhi: 0.8,
        activeElements: [0, 1, 2],
        phase: 'engagement',
        duration: 100,
        sessionDuration: 1000,
        messageCount: 10,
        toolCount: 5,
        memoryUsage: 100
      });
      
      const series = await loadMeasurements();
      expect(series.metadata.totalMeasurements).toBe(1);
      expect(series.metadata.phiRange.min).toBe(1.5);
      expect(series.metadata.phiRange.max).toBe(1.5);
      expect(series.metadata.averagePhi).toBe(1.5);
    });

    it('should calculate trend direction', async () => {
      await initializeIITTime();
      
      // Record increasing measurements
      for (let i = 0; i < 5; i++) {
        await recordMeasurement({
          sessionId: 'test-session-1',
          bigPhi: 1.0 + i * 0.1,
          smallPhi: 0.5,
          activeElements: [0],
          phase: 'engagement',
          duration: 100,
          sessionDuration: 1000,
          messageCount: 10,
          toolCount: 5,
          memoryUsage: 100
        });
      }
      
      const series = await loadMeasurements();
      expect(series.metadata.trendDirection).toBe('increasing');
    });
  });

  describe('Query Functions', () => {
    it('should retrieve session measurements', async () => {
      await initializeIITTime();
      
      // Record measurements for different sessions
      for (let i = 0; i < 3; i++) {
        await recordMeasurement({
          sessionId: 'session-a',
          bigPhi: 1.0 + i,
          smallPhi: 0.5,
          activeElements: [0],
          phase: 'engagement',
          duration: 100,
          sessionDuration: 1000,
          messageCount: 10,
          toolCount: 5,
          memoryUsage: 100
        });
      }
      
      await recordMeasurement({
        sessionId: 'session-b',
        bigPhi: 2.0,
        smallPhi: 0.5,
        activeElements: [0],
        phase: 'engagement',
        duration: 100,
        sessionDuration: 1000,
        messageCount: 10,
        toolCount: 5,
        memoryUsage: 100
      });
      
      const sessionA = await getSessionMeasurements('session-a');
      expect(sessionA.length).toBe(3);
      
      const sessionB = await getSessionMeasurements('session-b');
      expect(sessionB.length).toBe(1);
    });

    it('should filter by time range', async () => {
      await initializeIITTime();
      
      const now = Date.now();
      
      await recordMeasurement({
        sessionId: 'test',
        bigPhi: 1.0,
        smallPhi: 0.5,
        activeElements: [0],
        phase: 'engagement',
        duration: 100,
        sessionDuration: 1000,
        messageCount: 10,
        toolCount: 5,
        memoryUsage: 100
      });
      
      const results = await getMeasurementsInRange(now - 10000, now + 10000);
      expect(results.length).toBeGreaterThan(0);
      
      const emptyResults = await getMeasurementsInRange(now + 10000, now + 20000);
      expect(emptyResults.length).toBe(0);
    });
  });

  describe('Analysis Functions', () => {
    it('should detect spike anomalies', async () => {
      const measurements: IITMeasurement[] = [
        createTestMeasurement(1.0, 1),
        createTestMeasurement(1.1, 2),
        createTestMeasurement(3.5, 3), // Spike
        createTestMeasurement(1.0, 4),
        createTestMeasurement(1.1, 5)
      ];
      
      const anomalies = detectAnomalies(measurements);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('spike');
    });

    it('should detect drop anomalies', async () => {
      const measurements: IITMeasurement[] = [
        createTestMeasurement(2.0, 1),
        createTestMeasurement(2.1, 2),
        createTestMeasurement(3.0, 3),
        createTestMeasurement(0.1, 4), // Drop
        createTestMeasurement(2.0, 5)
      ];
      
      const anomalies = detectAnomalies(measurements);
      const dropAnomaly = anomalies.find(a => a.type === 'drop');
      expect(dropAnomaly).toBeDefined();
    });

    it('should calculate trends', async () => {
      const measurements: IITMeasurement[] = [
        createTestMeasurement(1.0, 1),
        createTestMeasurement(1.2, 2),
        createTestMeasurement(1.4, 3),
        createTestMeasurement(1.6, 4),
        createTestMeasurement(1.8, 5)
      ];
      
      const trends = analyzeTrends(measurements);
      expect(trends.shortTerm.slope).toBeGreaterThan(0);
    });

    it('should discover patterns', async () => {
      // Create a series with a known pattern
      const measurements: IITMeasurement[] = [];
      for (let i = 0; i < 20; i++) {
        measurements.push(createTestMeasurement(
          1.0 + i * 0.05, // Increasing trend
          i + 1
        ));
      }
      
      // Add some high phi measurements
      for (let i = 0; i < 5; i++) {
        measurements.push(createTestMeasurement(
          2.5 + i * 0.1,
          21 + i
        ));
      }
      
      const patterns = discoverPatterns(measurements);
      expect(patterns.length).toBeGreaterThan(0);
      
      const growthPattern = patterns.find(p => p.name.includes('Growth'));
      expect(growthPattern).toBeDefined();
    });

    it('should generate session profiles', async () => {
      const measurements: IITMeasurement[] = [
        createTestMeasurement(1.0, 1, 'session-1'),
        createTestMeasurement(1.2, 2, 'session-1'),
        createTestMeasurement(1.4, 3, 'session-1'),
        createTestMeasurement(2.5, 4, 'session-2'),
        createTestMeasurement(2.6, 5, 'session-2')
      ];
      
      const profile1 = generateSessionProfile('session-1', measurements.filter(m => m.sessionId === 'session-1'));
      expect(profile1.averagePhi).toBeCloseTo(1.2);
      expect(profile1.peakPhi).toBe(1.4);
      
      const profile2 = generateSessionProfile('session-2', measurements.filter(m => m.sessionId === 'session-2'));
      expect(profile2.averagePhi).toBeCloseTo(2.55);
    });
  });

  describe('Export Functions', () => {
    it('should generate CSV export', async () => {
      const series: IITTimeSeries = {
        measurements: [
          {
            id: 'test-1',
            timestamp: 1000000,
            sessionId: 'session-1',
            bigPhi: 1.5,
            smallPhi: 0.8,
            activeElements: [0, 1],
            phase: 'engagement',
            duration: 100,
            sessionDuration: 1000,
            messageCount: 10,
            toolCount: 5,
            memoryUsage: 100
          }
        ],
        metadata: {
          created: 1000000,
          lastUpdated: 1000000,
          totalMeasurements: 1,
          phiRange: { min: 1.5, max: 1.5 },
          averagePhi: 1.5,
          trendDirection: 'stable'
        }
      };
      
      const csv = exportToCSV(series);
      expect(csv).toContain('timestamp,sessionId,bigPhi');
      expect(csv).toContain('session-1');
      expect(csv).toContain('1.5');
    });

    it('should generate analysis report', async () => {
      const series: IITTimeSeries = {
        measurements: Array.from({ length: 10 }, (_, i) => ({
          id: `test-${i}`,
          timestamp: 1000000 + i * 1000,
          sessionId: 'test-session',
          bigPhi: 1.0 + i * 0.1,
          smallPhi: 0.5,
          activeElements: [0, 1, 2],
          phase: 'engagement',
          duration: 100,
          sessionDuration: 1000,
          messageCount: 10,
          toolCount: 5,
          memoryUsage: 100
        })),
        metadata: {
          created: 1000000,
          lastUpdated: 1000000,
          totalMeasurements: 10,
          phiRange: { min: 1.0, max: 1.9 },
          averagePhi: 1.45,
          trendDirection: 'increasing'
        }
      };
      
      const report = generateAnalysisReport(series);
      expect(report).toContain('IIT-Time Analysis Report');
      expect(report).toContain('Summary Statistics');
      expect(report).toContain('Trend Analysis');
    });
  });
});

// Helper function to create test measurements
function createTestMeasurement(
  bigPhi: number,
  index: number,
  sessionId: string = 'test-session'
): IITMeasurement {
  return {
    id: `test-${index}`,
    timestamp: 1000000 + index * 1000,
    sessionId,
    bigPhi,
    smallPhi: bigPhi * 0.5,
    activeElements: [0, 1, 2],
    phase: 'engagement',
    duration: 100,
    sessionDuration: 1000,
    messageCount: 10,
    toolCount: 5,
    memoryUsage: 100
  };
}
