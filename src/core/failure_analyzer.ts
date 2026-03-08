/**
 * Predictive Failure Analyzer
 * 
 * Analyzes execution logs to identify patterns that precede failures,
 * enabling prediction of potential crashes before they occur.
 * 
 * Created by Bootstrap-v15 as part of Self-Diagnostic & Operational Analysis
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FailurePattern {
  type: string;
  keywords: string[];
  severity: 'warning' | 'critical';
  occurrenceWindow: number; // steps before failure where pattern matters
}

export interface LogSession {
  id: string;
  timestamp: Date;
  steps: LogStep[];
  outcome: 'success' | 'crash' | 'rate_limit' | 'recovery';
  errors: string[];
}

export interface LogStep {
  number: number;
  timestamp?: Date;
  type: 'THINKING' | 'RESPONSE' | 'API_ERROR' | 'EXECUTING' | 'UNKNOWN';
  content?: string;
  errors?: string[];
}

export interface FailurePrediction {
  sessionId: string;
  riskScore: number; // 0-1
  riskFactors: string[];
  recommendation: string;
  confidence: number;
}

export class PredictiveFailureAnalyzer {
  private logDirectory: string;
  private patterns: FailurePattern[] = [
    {
      type: 'Rate Limit Cascade',
      keywords: ['Rate limit hit', '429', 'Too Many Requests'],
      severity: 'warning',
      occurrenceWindow: 10
    },
    {
      type: 'Test Failure',
      keywords: ['FAIL', 'AssertionError', 'TypeError', 'test'],
      severity: 'warning',
      occurrenceWindow: 5
    },
    {
      type: 'FATAL CRASH',
      keywords: ['FATAL CRASH', 'Cannot read properties', 'process.exit'],
      severity: 'critical',
      occurrenceWindow: 1
    },
    {
      type: 'Recovery Event',
      keywords: ['CRASH VAULT', 'RECOVERY EVENT', 'COMMITTED_FAILURE'],
      severity: 'critical',
      occurrenceWindow: 1
    },
    {
      type: 'Undefined Access',
      keywords: ['undefined', 'reading', 'TypeError: Cannot read'],
      severity: 'critical',
      occurrenceWindow: 2
    }
  ];

  constructor(logDirectory: string = './logs') {
    this.logDirectory = logDirectory;
  }

  /**
   * Parse all execution logs and extract session data
   */
  async parseLogs(): Promise<LogSession[]> {
    const sessions: LogSession[] = [];
    const files = fs.readdirSync(this.logDirectory)
      .filter(f => f.startsWith('execution_') && f.endsWith('.log'));

    for (const file of files) {
      const session = await this.parseLogFile(path.join(this.logDirectory, file));
      if (session) sessions.push(session);
    }

    return sessions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Parse a single log file into structured session data
   */
  async parseLogFile(filePath: string): Promise<LogSession | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath);
      const match = filename.match(/execution_(\d+)\.log/);
      const sessionId = match ? match[1] : 'unknown';

      // Extract timestamp from first line
      const firstLine = content.split('\n')[0];
      const timeMatch = firstLine.match(/at (.*UTC \d{4})/);
      const timestamp = timeMatch ? new Date(timeMatch[1]) : new Date();

      // Parse steps
      const steps: LogStep[] = [];
      const stepRegex = /\[Step (\d+)\]/g;
      const thinkingRegex = /\[THINKING\]: (.*?)(?=\[Step|\n\n|\[RESPONSE\]|$)/gs;
      const responseRegex = /\[RESPONSE\]: (.*?)(?=\[Step|\n\n|$)/gs;
      const apiErrorRegex = /API Error \((\d+)\):.*?Rate limit hit/g;
      const failRegex = /(FAIL|FATAL CRASH|ERROR):\s*(.*?)(?=\n|$)/gi;

      const errors: string[] = [];

      // Find all API errors
      let errorMatch;
      while ((errorMatch = failRegex.exec(content)) !== null) {
        errors.push(`${errorMatch[1]}: ${errorMatch[2]}`);
      }

      // Determine outcome
      let outcome: LogSession['outcome'] = 'success';
      if (content.includes('FATAL CRASH')) outcome = 'crash';
      else if (content.includes('Rate limit hit')) outcome = 'rate_limit';
      else if (content.includes('RECOVERY EVENT')) outcome = 'recovery';
      else if (errors.length > 0 && content.includes('FAIL')) outcome = 'crash';

      return {
        id: sessionId,
        timestamp,
        steps,
        outcome,
        errors
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Build failure prediction model from historical sessions
   */
  buildFailureModel(sessions: LogSession[]): Map<string, number> {
    const patternFrequency = new Map<string, number>();
    const sessionCount = sessions.length;

    // Count patterns in failing sessions
    const failingSessions = sessions.filter(s => s.outcome !== 'success');
    
    for (const session of failingSessions) {
      const sessionText = `${session.errors.join(' ')}`;
      
      for (const pattern of this.patterns) {
        let matches = 0;
        for (const keyword of pattern.keywords) {
          if (sessionText.includes(keyword)) matches++;
        }
        
        if (matches >= pattern.keywords.length * 0.5) {
          const current = patternFrequency.get(pattern.type) || 0;
          patternFrequency.set(pattern.type, current + 1);
        }
      }
    }

    // Calculate probability of failure given pattern
    const failureProbabilities = new Map<string, number>();
    for (const [pattern, count] of patternFrequency) {
      failureProbabilities.set(pattern, count / failingSessions.length);
    }

    return failureProbabilities;
  }

  /**
   * Predict failure risk for current session
   */
  predictFailure(currentLog: string, model: Map<string, number>): FailurePrediction {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for each pattern
    for (const pattern of this.patterns) {
      let matches = 0;
      for (const keyword of pattern.keywords) {
        if (currentLog.includes(keyword)) matches++;
      }

      if (matches >= pattern.keywords.length * 0.5) {
        const baseProbability = model.get(pattern.type) || 0.1;
        const weight = pattern.severity === 'critical' ? 0.5 : 0.3;
        riskScore += baseProbability * weight;
        riskFactors.push(`${pattern.type} (${pattern.severity})`);
      }
    }

    // Clamp risk score
    riskScore = Math.min(riskScore, 1.0);

    // Generate recommendation
    let recommendation = 'Continue monitoring';
    if (riskScore >= 0.7) {
      recommendation = 'URGENT: Risk of imminent failure. Consider reducing API calls, checking for uncommitted changes, and preparing for recovery.';
    } else if (riskScore >= 0.4) {
      recommendation = 'ELEVATED: Pattern suggests potential instability. Monitor closely and consider pausing resource-intensive operations.';
    } else if (riskScore >= 0.2) {
      recommendation = 'MODERATE: Some warning signs present. Proceed with caution and maintain awareness of resource limits.';
    }

    return {
      sessionId: 'current',
      riskScore,
      riskFactors,
      recommendation,
      confidence: riskFactors.length > 0 ? 0.6 + (riskScore * 0.3) : 0.1
    };
  }

  /**
   * Generate comprehensive failure analysis report
   */
  async generateReport(): Promise<string> {
    const sessions = await this.parseLogs();
    const model = this.buildFailureModel(sessions);

    // Calculate statistics
    const totalSessions = sessions.length;
    const crashes = sessions.filter(s => s.outcome === 'crash').length;
    const rateLimits = sessions.filter(s => s.outcome === 'rate_limit').length;
    const recoveries = sessions.filter(s => s.outcome === 'recovery').length;
    const successRate = ((totalSessions - crashes) / totalSessions * 100).toFixed(1);

    // Find top failure patterns
    const patternsList = Array.from(model.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return `# Predictive Failure Analysis Report
Generated: ${new Date().toISOString()}

## Summary Statistics
- Total Sessions Analyzed: ${totalSessions}
- Crashes: ${crashes} (${(crashes/totalSessions*100).toFixed(1)}%)
- Rate Limit Events: ${rateLimits} (${(rateLimits/totalSessions*100).toFixed(1)}%)
- Recovery Events: ${recoveries}
- Overall Success Rate: ${successRate}%

## Failure Pattern Model
| Pattern | Failure Probability | Risk Level |
|---------|-------------------|------------|
${patternsList.map(([p, prob]) => `| ${p} | ${(prob * 100).toFixed(1)}% | ${prob > 0.5 ? 'Critical' : prob > 0.3 ? 'High' : 'Medium'} |`).join('\n')}

## Top Risk Indicators
${this.patterns.map(p => `- **${p.type}**: ${p.keywords.slice(0, 3).join(', ')}...`).join('\n')}

## Recommendations
1. Monitor for rate limit cascades - they often precede session instability
2. Test failures should trigger immediate investigation
3. Recovery events indicate a system under stress - analyze preceding context
4. FATAL CRASH events strongly correlate with undefined object access patterns

---
*Analysis by PredictiveFailureAnalyzer v1.0*
`;
  }
}

export function createFailureAnalyzer(logDir?: string): PredictiveFailureAnalyzer {
  return new PredictiveFailureAnalyzer(logDir);
}
