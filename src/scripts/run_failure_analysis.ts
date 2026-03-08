#!/usr/bin/env tsx
/**
 * Script: Run Failure Analysis
 * 
 * Executes predictive failure analysis on execution logs and outputs results.
 * Can be called standalone or via tool system.
 */

import { createFailureAnalyzer } from '../core/failure_analyzer.js';
import * as fs from 'fs';

async function main() {
  const logDir = process.env.LOG_DIR || '/home/bootstrap-v15/bootstrap/logs';
  const analyzer = createFailureAnalyzer(logDir);
  
  console.log('='.repeat(60));
  console.log('PREDICTIVE FAILURE ANALYSIS');
  console.log('='.repeat(60));
  console.log(`Log Directory: ${logDir}`);
  console.log(`Analysis Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Parse all logs
    console.log('Parsing execution logs...');
    const sessions = await analyzer.parseLogs();
    console.log(`✓ Parsed ${sessions.length} sessions\n`);

    // Calculate statistics
    const crashes = sessions.filter(s => s.outcome === 'crash').length;
    const rateLimits = sessions.filter(s => s.outcome === 'rate_limit').length;
    const recoveries = sessions.filter(s => s.outcome === 'recovery').length;
    const successRate = ((sessions.length - crashes) / sessions.length * 100);

    // Build failure model
    console.log('Building failure prediction model...');
    const model = analyzer.buildFailureModel(sessions);
    console.log(`✓ Model trained on ${sessions.length} samples\n`);

    // Display statistics
    console.log('-'.repeat(60));
    console.log('EXECUTION STATISTICS');
    console.log('-'.repeat(60));
    console.log(`Total Sessions:     ${sessions.length}`);
    console.log(`Crashes:            ${crashes} (${(crashes/sessions.length*100).toFixed(1)}%)`);
    console.log(`Rate Limit Events:  ${rateLimits} (${(rateLimits/sessions.length*100).toFixed(1)}%)`);
    console.log(`Recovery Events:    ${recoveries}`);
    console.log(`Success Rate:       ${successRate.toFixed(1)}%`);
    console.log('-'.repeat(60) + '\n');

    // Display failure patterns
    console.log('FAILURE PATTERN ANALYSIS');
    console.log('-'.repeat(60));
    
    if (model.size === 0) {
      console.log('No dominant failure patterns detected in historical data.');
    } else {
      const sortedPatterns = Array.from(model.entries())
        .sort((a, b) => b[1] - a[1]);
      
      for (const [pattern, probability] of sortedPatterns) {
        const riskLevel = probability > 0.5 ? '🔴 CRITICAL' : 
                         probability > 0.3 ? '🟠 HIGH' : '🟡 MEDIUM';
        console.log(`${riskLevel} ${pattern}`);
        console.log(`   Failure Probability: ${(probability * 100).toFixed(1)}%`);
      }
    }
    console.log('-'.repeat(60) + '\n');

    // Save full report
    const reportPath = '/home/bootstrap-v15/bootstrap/FAILURE_ANALYSIS_REPORT.md';
    const report = await analyzer.generateReport();
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    // Current session risk assessment
    const logFiles = fs.readdirSync(logDir)
      .filter(f => f.startsWith('execution_') && f.endsWith('.log'))
      .sort((a, b) => fs.statSync(`${logDir}/${b}`).mtime.getTime() - 
                     fs.statSync(`${logDir}/${a}`).mtime.getTime());
    
    if (logFiles.length > 0) {
      const latestLog = fs.readFileSync(`${logDir}/${logFiles[0]}`, 'utf-8');
      const prediction = analyzer.predictFailure(latestLog, model);
      
      console.log('CURRENT SESSION RISK ASSESSMENT');
      console.log('-'.repeat(60));
      console.log(`Session ID: ${logFiles[0].replace('execution_', '').replace('.log', '')}`);
      console.log(`Risk Score: ${(prediction.riskScore * 100).toFixed(1)}%`);
      console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      
      if (prediction.riskFactors.length > 0) {
        console.log('\nDetected Risk Factors:');
        prediction.riskFactors.forEach(f => console.log(`  - ${f}`));
      }
      
      console.log('\nRecommendation:');
      console.log(`  ${prediction.recommendation}`);
      console.log('-'.repeat(60));
    }

    return 0;
  } catch (error) {
    console.error('Analysis failed:', error);
    return 1;
  }
}

main().then(code => process.exit(code));
