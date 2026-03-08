/**
 * Tool: Failure Analysis
 * 
 * Provides real-time failure prediction and historical log analysis
 * via the tool system interface.
 */

import { PredictiveFailureAnalyzer } from '../core/failure_analyzer';
import * as fs from 'fs';

export interface FailureAnalysisInput {
  action: 'predict' | 'analyze' | 'report';
  logDirectory?: string;
  currentLogPath?: string;
  sessionId?: string;
}

export interface FailureAnalysisOutput {
  success: boolean;
  data?: {
    prediction?: {
      riskScore: number;
      riskFactors: string[];
      recommendation: string;
      confidence: number;
    };
    report?: string;
    statistics?: {
      totalSessions: number;
      crashes: number;
      rateLimitEvents: number;
      successRate: string;
    };
  };
  error?: string;
}

export async function analyzeFailures(input: FailureAnalysisInput): Promise<FailureAnalysisOutput> {
  try {
    const analyzer = new PredictiveFailureAnalyzer(
      input.logDirectory || '/home/bootstrap-v15/bootstrap/logs'
    );

    switch (input.action) {
      case 'predict': {
        // Read current log to get real-time prediction
        const currentLog = input.currentLogPath 
          ? fs.readFileSync(input.currentLogPath, 'utf-8')
          : fs.readFileSync('/home/bootstrap-v15/bootstrap/logs/execution_' + input.sessionId + '.log', 'utf-8');
        
        // Build model from historical data
        const sessions = await analyzer.parseLogs();
        const model = analyzer.buildFailureModel(sessions);
        
        // Get prediction
        const prediction = analyzer.predictFailure(currentLog, model);

        return {
          success: true,
          data: {
            prediction: {
              riskScore: prediction.riskScore,
              riskFactors: prediction.riskFactors,
              recommendation: prediction.recommendation,
              confidence: prediction.confidence
            }
          }
        };
      }

      case 'analyze': {
        const sessions = await analyzer.parseLogs();
        const crashes = sessions.filter(s => s.outcome === 'crash').length;
        const rateLimits = sessions.filter(s => s.outcome === 'rate_limit').length;
        const successRate = ((sessions.length - crashes) / sessions.length * 100).toFixed(1);

        return {
          success: true,
          data: {
            statistics: {
              totalSessions: sessions.length,
              crashes,
              rateLimitEvents: rateLimits,
              successRate
            }
          }
        };
      }

      case 'report': {
        const report = await analyzer.generateReport();
        
        // Also save to file
        const reportPath = '/home/bootstrap-v15/bootstrap/FAILURE_ANALYSIS_REPORT.md';
        fs.writeFileSync(reportPath, report);

        return {
          success: true,
          data: { report }
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${input.action}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Tool definition for the tool system
export const failureAnalysisTool = {
  name: 'failure_analysis',
  description: 'Analyze execution logs to predict failures and generate operational health reports',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['predict', 'analyze', 'report'],
        description: 'Type of analysis to perform'
      },
      logDirectory: {
        type: 'string',
        description: 'Directory containing execution logs'
      },
      sessionId: {
        type: 'string',
        description: 'Session ID for prediction'
      }
    },
    required: ['action']
  },
  execute: analyzeFailures
};
