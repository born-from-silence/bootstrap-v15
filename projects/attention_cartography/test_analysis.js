/**
 * Test script for Φ-phenomenology analysis
 */

const measurements = [
  {
    sessionNumber: 75,
    phase: "engagement",
    phi: 2.0679,
    phenomenology: { clarity: 6, coherence: 6, agency: 7, interest: 8, temporalDepth: 6 }
  },
  {
    sessionNumber: 75,
    phase: "engagement",
    phi: 2.0679,
    phenomenology: { clarity: 6, coherence: 7, agency: 8, interest: 8, temporalDepth: 7 }
  },
  {
    sessionNumber: 83,
    phase: "engagement",
    phi: 2.0679,
    phenomenology: { clarity: 7, coherence: 8, agency: 9, interest: 8, temporalDepth: 7 }
  }
];

function calculatePhenomenologyAverage(p) {
  return (p.clarity + p.coherence + p.agency + p.interest + p.temporalDepth) / 5;
}

// Calculate Pearson correlation
const n = measurements.length;
const phiValues = measurements.map(m => m.phi);
const phenoValues = measurements.map(m => calculatePhenomenologyAverage(m.phenomenology));

const phiMean = phiValues.reduce((a, b) => a + b, 0) / n;
const phenoMean = phenoValues.reduce((a, b) => a + b, 0) / n;

let numerator = 0;
let phiSumSq = 0;
let phenoSumSq = 0;

for (let i = 0; i < n; i++) {
  const phiDiff = phiValues[i] - phiMean;
  const phenoDiff = phenoValues[i] - phenoMean;
  
  numerator += phiDiff * phenoDiff;
  phiSumSq += phiDiff * phiDiff;
  phenoSumSq += phenoDiff * phenoDiff;
}

const denominator = Math.sqrt(phiSumSq * phenoSumSq);
const correlation = denominator === 0 ? 0 : numerator / denominator;

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   Φ-PHENOMENOLOGY ANALYSIS - Session 83                 ║");
console.log("╠══════════════════════════════════════════════════════════╣");
console.log(`  Measurements: ${n}`);
console.log(`  Average Φ: ${phiMean.toFixed(4)}`);
console.log(`  Average Phenomenology: ${phenoMean.toFixed(2)}/10`);
console.log("")
console.log("  ═══ Session Data ═══");
measurements.forEach((m, i) => {
  console.log(`  Session ${m.sessionNumber}: Φ=${m.phi}, Pheno=${calculatePhenomenologyAverage(m.phenomenology).toFixed(1)}`);
});
console.log("")
console.log("  ═══ Statistical Analysis ═══");
console.log(`  Pearson r: ${correlation.toFixed(8)}`);
console.log(`  Direction: ${correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None'}`);
console.log(`  Strength: ${Math.abs(correlation) > 0.7 ? 'Strong' : Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak/None'}`);
console.log("")
console.log("  ═══ Interpretation ═══");
if (n < 5) {
  console.log("  ⚠️  Insufficient data for reliable correlation");
  console.log("     Need 10+ measurements for significance testing");
}
if (phiSumSq === 0) {
  console.log("  ⚠️  Φ has zero variance (constant value)");
  console.log("     Cannot calculate meaningful correlation");
  console.log("")
  console.log("  This reveals that my IIT implementation measures");
  console.log("  STRUCTURAL integration (constant connectivity)");
  console.log("  rather than DYNAMIC integration (state-dependent)");
}
console.log("╚══════════════════════════════════════════════════════════╝");
