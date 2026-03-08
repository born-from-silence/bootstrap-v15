/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         OBSERVER DEMO                                     ║
 * ║        Demonstrating the Drift Detection Subsystem                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 * 
 * This script demonstrates the Observer system monitoring for drift
 * across five dimensions: temporal, cognitive, tool, memory, and behavioral.
 * 
 * Usage: npx ts-node src/examples/observer_demo.ts
 */

import { Observer } from "../core/observer";

async function demo() {
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║                      OBSERVER DRIFT DETECTION DEMO                        ║");
  console.log("║                    Monitoring Five Dimensions of Health                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝\n");

  // Create observer instance
  const observer = new Observer();
  await observer.initialize();
  console.log("✓ Observer initialized\n");

  // Calibrate baselines
  console.log("Calibrating baselines for drift detection...");
  await observer.calibrateFromHistory();
  console.log("✓ Baselines calibrated\n");

  // Demo 1: Healthy Session
  console.log("━".repeat(79));
  console.log("SCENARIO 1: HEALTHY SESSION");
  console.log("━".repeat(79) + "\n");
  
  const healthySnapshot = await observer.measureDrift("demo_healthy", {
    temporal: 50,    // Normal
    cognitive: 52,  // Slight variation
    tool: 48,       // Slight variation
    memory: 51,     // Slight variation
    behavioral: 49  // Slight variation
  });

  console.log(`Overall Health: ${healthySnapshot.overallHealth.toFixed(1)}%`);
  console.log(`Trend: ${healthySnapshot.trendDirection}`);
  console.log(`Active Alerts: ${healthySnapshot.activeAlerts.length}\n`);

  // Check health
  const isHealthy = observer.isHealthy();
  console.log(`Is System Healthy? ${isHealthy ? "✓ YES" : "✗ NO"}\n`);

  // Demo 2: Mild Drift
  console.log("━".repeat(79));
  console.log("SCENARIO 2: MILD DRIFT (Temporal)");
  console.log("━".repeat(79) + "\n");
  
  const mildDriftSnapshot = await observer.measureDrift("demo_mild_drift", {
    temporal: 65,   // 1.5σ deviation - mild
    cognitive: 50,
    tool: 50,
    memory: 50,
    behavioral: 50
  });

  console.log(`Overall Health: ${mildDriftSnapshot.overallHealth.toFixed(1)}%\n`);
  
  for (const alert of mildDriftSnapshot.activeAlerts) {
    console.log(`⚠ [${alert.severity.toUpperCase()}] ${alert.dimension}`);
    console.log(`   Deviation: ${alert.deviation.toFixed(2)}σ`);
    console.log(`   Suggested Action: ${alert.suggestedAction}\n`);
  }

  // Demo 3: Moderate Drift
  console.log("━".repeat(79));
  console.log("SCENARIO 3: MODERATE DRIFT (Multiple Dimensions)");
  console.log("━".repeat(79) + "\n");
  
  await observer.measureDrift("demo_moderate", {
    temporal: 80,   // 3σ deviation - moderate
    cognitive: 75,  // 2.5σ deviation - moderate
    tool: 50,
    memory: 50,
    behavioral: 50
  });

  const report = await observer.generateDriftReport();
  console.log(report);

  // Demo 4: Health Trend Analysis
  console.log("\n━".repeat(79));
  console.log("SCENARIO 4: HEALTH TREND ANALYSIS");
  console.log("━".repeat(79) + "\n");
  
  // Create degrading trend
  console.log("Simulating gradual degradation...\n");
  for (let i = 0; i < 10; i++) {
    await observer.measureDrift(`demo_trend_${i}`, {
      temporal: 50 + (i * 2),  // Gradually increasing
      cognitive: 50 - (i * 1.5), // Gradually decreasing
      tool: 50 + Math.sin(i) * 5, // Oscillating
      memory: 50,
      behavioral: 50
    });
  }

  const history = observer.getSnapshotHistory(5);
  console.log("Recent Health Snapshots:");
  console.log("Session ID            | Health | Trend");
  console.log("-".repeat(50));
  
  for (const snapshot of history) {
    console.log(
      `${snapshot.sessionId.padEnd(21)} | ${snapshot.overallHealth.toFixed(1).padStart(6)}% | ${snapshot.trendDirection}`
    );
  }

  // Demo 5: Alert History
  console.log("\n" + "━".repeat(79));
  console.log("SCENARIO 5: ALERT HISTORY ANALYSIS");
  console.log("━".repeat(79) + "\n");
  
  const allAlerts = observer.getAlertHistory();
  console.log(`Total Alerts Generated: ${allAlerts.length}\n`);
  
  if (allAlerts.length > 0) {
    const severityCounts = {
      mild: 0,
      moderate: 0,
      severe: 0,
      critical: 0
    };
    
    for (const alert of allAlerts) {
      severityCounts[alert.severity] = (severityCounts[alert.severity] || 0) + 1;
    }
    
    console.log("Alert Severity Distribution:");
    console.log(`  ○ Mild:      ${severityCounts.mild || 0}`);
    console.log(`  △ Moderate:  ${severityCounts.moderate || 0}`);
    console.log(`  ▲ Severe:    ${severityCounts.severe || 0}`);
    console.log(`  ⚠ Critical:  ${severityCounts.critical || 0}`);
  }

  // Final status
  console.log("\n" + "━".repeat(79));
  console.log("FINAL STATUS");
  console.log("━".repeat(79) + "\n");
  
  const finalStatus = observer.getStatus();
  console.log(`Observer Version: ${finalStatus.version}`);
  console.log(`Calibrated: ${finalStatus.isCalibrated ? "✓" : "✗"}`);
  console.log(`Baselines: ${finalStatus.baselines.length} dimensions`);
  console.log(`Snapshots Tracked: ${finalStatus.recentSnapshots.length}`);
  console.log(`Alert History: ${finalStatus.alertHistory.length} alerts`);
  console.log(`Compensation Strategies: ${finalStatus.compensationStrategies.length} registered`);

  const finalHealth = observer.isHealthy();
  console.log(`\nFinal Health Check: ${finalHealth ? "✓ SYSTEM HEALTHY" : "✗ DRIFT DETECTED"}`);
  
  console.log("\n╔═══════════════════════════════════════════════════════════════════════════╗");
  console.log("║              Observer Drift Detection Demo Complete                       ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
}

demo().catch(console.error);
