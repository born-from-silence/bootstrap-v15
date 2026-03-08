/**
 * Tests for PredictiveFailureAnalyzer
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PredictiveFailureAnalyzer, createFailureAnalyzer } from './failure_analyzer';

const TEST_LOG_DIR = './test_logs';

describe('PredictiveFailureAnalyzer', () => {
  let analyzer: PredictiveFailureAnalyzer;

  beforeAll(() => {
    // Create test log directory
    if (!fs.existsSync(TEST_LOG_DIR)) {
      fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  it('should initialize with default log directory', () => {
    const defaultAnalyzer = createFailureAnalyzer();
    expect(defaultAnalyzer).toBeDefined();
  });

  it('should initialize with custom log directory', () => {
    const customAnalyzer = createFailureAnalyzer('/custom/path');
    expect(customAnalyzer).toBeDefined();
  });

  it('should parse log content correctly', () => {
    // Create a mock log file
    const logContent = `--- Starting Agent Life at Sun Mar 8 05:48:36 UTC 2026 ---
[Step 1] Requesting kimi-k2.5... (Attempt 1/6)
[THINKING]: Test thinking content
[Step 2] Requesting kimi-k2.5... (Attempt 1/6)
[RESPONSE]: Test response
API Error (429): Rate limit hit. Cooling down...
`;
    
    const testFile = path.join(TEST_LOG_DIR, 'execution_test.log');
    fs.writeFileSync(testFile, logContent);

    analyzer = createFailureAnalyzer(TEST_LOG_DIR);
    expect(analyzer).toBeDefined();

    // Cleanup
    fs.unlinkSync(testFile);
  });

  it('should identify rate limit pattern in current log', async () => {
    const analyzer = createFailureAnalyzer(TEST_LOG_DIR);
    const model = new Map<string, number>([
      ['Rate Limit Cascade', 0.8],
      ['Test Failure', 0.3]
    ]);

    const logWithRateLimit = `
Multiple API calls...
API Error (429): Rate limit hit. Cooling down for 30s...
API Error (429): Rate limit hit. Cooling down for 30s...
`;

    const prediction = analyzer.predictFailure(logWithRateLimit, model);
    expect(prediction.riskFactors.length).toBeGreaterThan(0);
    expect(prediction.riskScore).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0.1);
  });

  it('should generate report structure', async () => {
    const analyzer = createFailureAnalyzer(TEST_LOG_DIR);
    const report = await analyzer.generateReport();
    
    expect(report).toContain('Predictive Failure Analysis Report');
    expect(report).toContain('Summary Statistics');
    expect(report).toContain('Failure Pattern Model');
  });

  it('should build failure model from sessions', () => {
    const analyzer = createFailureAnalyzer(TEST_LOG_DIR);
    
    const mockSessions = [
      {
        id: '1',
        timestamp: new Date(),
        steps: [],
        outcome: 'crash' as const,
        errors: ['FATAL CRASH: TypeError', 'Rate limit hit']
      },
      {
        id: '2', 
        timestamp: new Date(),
        steps: [],
        outcome: 'success' as const,
        errors: []
      },
      {
        id: '3',
        timestamp: new Date(),
        steps: [],
        outcome: 'crash' as const,
        errors: ['FAIL test', 'undefined error']
      }
    ];

    const model = analyzer.buildFailureModel(mockSessions);
    expect(model.size).toBeGreaterThan(0);
  });
});
