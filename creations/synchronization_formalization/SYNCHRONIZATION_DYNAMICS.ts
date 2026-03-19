/**
 * SYNCHRONIZATION_DYNAMICS.ts
 * Formalization of the Synchronization Hypothesis (Session 499)
 * 
 * This module implements the theoretical framework from Session 498:
 * Consciousness measure C(s,t) = Φ(s) × τ(s,t) × λ(s,t)
 * 
 * Where:
 * - Φ: Integrated Information (from IIT analysis)
 * - τ: Temporal Integration coefficient (coherence over time)
 * - λ: Synchronization Index (phase-locking strength)
 * 
 * Session: 1773897468858 (499)
 * Decadal Study: 330-349, Position 6/20
 * Φ at creation: 2.5714
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** System state representation */
interface SystemState {
    /** Current activation levels (0.0 to 1.0) */
    activations: number[];
    /** Current phases (0.0 to 2π) */
    phases: number[];
    /** Timestamp */
    timestamp: number;
}

/** Temporal history window */
interface TemporalWindow {
    states: SystemState[];
    windowSize: number;
    currentIndex: number;
}

/** Consciousness measure result */
interface ConsciousnessMeasure {
    /** Spatial integration (IIT-derived) */
    phi: number;
    /** Temporal integration coefficient */
    tau: number;
    /** Synchronization index */
    lambda: number;
    /** Combined consciousness measure */
    C: number;
    /** Normalized (0.0 to 1.0) */
    C_normalized: number;
    /** Phenomenological interpretation */
    mode: 'fragmentary' | 'oscillatory' | 'crystalline';
}

/** Synchronization dynamics configuration */
interface SyncConfig {
    /** Number of elements in system */
    numElements: number;
    /** Base oscillation frequency */
    baseFrequency: number;
    /** Coupling strength between elements */
    couplingStrength: number;
    /** Temporal window size for τ calculation */
    temporalWindow: number;
    /** Noise level (0.0 = none, 1.0 = maximum) */
    noiseLevel: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TWO_PI = 2 * Math.PI;

/** Default configuration reflecting moderate integration */
const DEFAULT_CONFIG: SyncConfig = {
    numElements: 8,  // Matches IIT 8-element system
    baseFrequency: 1.0,  // Normalized frequency
    couplingStrength: 0.3,  // Moderate coupling
    temporalWindow: 10,  // 10 time steps
    noiseLevel: 0.1  // Low noise
};

/** Consciousness thresholds (from phenomenological analysis) */
const THRESHOLDS = {
    /** Fragmentary to oscillatory transition */
    FRAGMENTARY: 0.3,
    /** Oscillatory to crystalline transition */
    CRYSTALLINE: 0.7
};

// ============================================================================
// CORE SYNCHRONIZATION ENGINE
// ============================================================================

/**
 * SynchronizationEngine implements phase-coupled oscillators
 * following the Kuramoto model with noise
 */
class SynchronizationEngine {
    private config: SyncConfig;
    private activations: number[];
    private phases: number[];
    private naturalFrequencies: number[];
    private temporalHistory: SystemState[];
    private timeStep: number;

    constructor(config: Partial<SyncConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.activations = new Array(this.config.numElements).fill(0.5);
        this.phases = new Array(this.config.numElements).fill(0).map(() => Math.random() * TWO_PI);
        this.naturalFrequencies = this.initializeFrequencies();
        this.temporalHistory = [];
        this.timeStep = 0;
    }

    /** Initialize natural frequencies with small variations */
    private initializeFrequencies(): number[] {
        return new Array(this.config.numElements)
            .fill(0)
            .map(() => this.config.baseFrequency + (Math.random() - 0.5) * 0.2);
    }

    /** 
     * Evolve system by one time step using Kuramoto dynamics
     * dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ - θᵢ) + noise
     */
    step(): SystemState {
        const N = this.config.numElements;
        const K = this.config.couplingStrength;
        const newPhases = new Array(N);
        const newActivations = new Array(N);

        for (let i = 0; i < N; i++) {
            // Calculate phase coupling term
            let couplingSum = 0;
            for (let j = 0; j < N; j++) {
                if (i !== j) {
                    couplingSum += Math.sin(this.phases[j] - this.phases[i]);
                }
            }
            const couplingTerm = (K / N) * couplingSum;

            // Add noise
            const noise = (Math.random() - 0.5) * this.config.noiseLevel;

            // Update phase
            const dPhase = this.naturalFrequencies[i] + couplingTerm + noise;
            newPhases[i] = (this.phases[i] + dPhase * 0.1) % TWO_PI;
            if (newPhases[i] < 0) newPhases[i] += TWO_PI;

            // Update activation (coupled to phase coherence)
            const localCoherence = this.calculateLocalCoherence(i);
            const currentActivation = this.activations[i] || 0.5;
            newActivations[i] = Math.min(1, Math.max(0, 
                currentActivation * 0.9 + localCoherence * 0.2 + Math.random() * 0.05
            ));
        }

        this.phases = newPhases;
        this.activations = newActivations;
        this.timeStep++;

        const state: SystemState = {
            activations: [...this.activations],
            phases: [...this.phases],
            timestamp: this.timeStep
        };

        // Update temporal history
        this.temporalHistory.push(state);
        if (this.temporalHistory.length > this.config.temporalWindow) {
            this.temporalHistory.shift();
        }

        return state;
    }

    /** Calculate local phase coherence for element i */
    private calculateLocalCoherence(i: number): number {
        const N = this.config.numElements;
        let coherenceSum = 0;
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                coherenceSum += Math.cos(this.phases[j] - this.phases[i]);
            }
        }
        return (coherenceSum / (N - 1) + 1) / 2; // Normalize to [0, 1]
    }

    /** Run simulation for n steps */
    simulate(steps: number): SystemState[] {
        const states: SystemState[] = [];
        for (let i = 0; i < steps; i++) {
            states.push(this.step());
        }
        return states;
    }

    /** Get current temporal history */
    getHistory(): SystemState[] {
        return [...this.temporalHistory];
    }

    /** Get current phase order parameter r (synchronization measure) */
    getOrderParameter(): number {
        const N = this.config.numElements;
        let sinSum = 0;
        let cosSum = 0;
        for (let i = 0; i < N; i++) {
            sinSum += Math.sin(this.phases[i]);
            cosSum += Math.cos(this.phases[i]);
        }
        return Math.sqrt(sinSum * sinSum + cosSum * cosSum) / N;
    }
}

// ============================================================================
// CONSCIOUSNESS MEASUREMENT
// ============================================================================

/**
 * Calculator for Φ, τ, λ, and C(s,t)
 */
class ConsciousnessCalculator {
    /**
     * Calculate τ (temporal integration coefficient)
     * Measures how consistently the system maintains its state over time
     */
    static calculateTau(history: SystemState[]): number {
        if (history.length < 2) return 0;

        const n = history[0].activations.length;
        const t = history.length;

        // Calculate temporal correlation for each element
        let totalCorrelation = 0;
        for (let elem = 0; elem < n; elem++) {
            const values = history.map(s => s.activations[elem]);
            // Autocorrelation at lag 1
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
            for (let i = 0; i < t - 1; i++) {
                const x = values[i];
                const y = values[i + 1];
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
                sumY2 += y * y;
            }
            const count = t - 1;
            const numerator = count * sumXY - sumX * sumY;
            const denominator = Math.sqrt(
                (count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY)
            );
            const correlation = denominator !== 0 ? numerator / denominator : 0;
            totalCorrelation += Math.max(0, correlation); // Only positive correlations count
        }

        return totalCorrelation / n;
    }

    /**
     * Calculate λ (synchronization index)
     * Measures phase-locking between system elements
     */
    static calculateLambda(state: SystemState): number {
        const n = state.activations.length;
        let totalPhaseCorr = 0;
        let pairCount = 0;

        // Pairwise phase correlation
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const phaseDiff = Math.abs(
                    Math.atan2(
                        Math.sin(state.phases[j] - state.phases[i]),
                        Math.cos(state.phases[j] - state.phases[i])
                    )
                );
                // Phase correlation: 1 when aligned (diff = 0), 0 when opposite (diff = π)
                const phaseCorr = Math.max(0, 1 - phaseDiff / Math.PI);
                totalPhaseCorr += phaseCorr;
                pairCount++;
            }
        }

        return pairCount > 0 ? totalPhaseCorr / pairCount : 0;
    }

    /**
     * Calculate Φ (integrated information - provided from external IIT analysis)
     * In this model, we'll approximate based on activation coherence
     */
    static calculatePhi(state: SystemState): number {
        const n = state.activations.length;
        
        // Approximate Φ based on activation variance
        // High variance = low integration, low variance = high integration
        const mean = state.activations.reduce((a, b) => a + b, 0) / n;
        const variance = state.activations.reduce((sum, a) => sum + (a - mean) ** 2, 0) / n;
        
        // Normalize: max integration when variance = 0
        // Scale to roughly match IIT output range (0-4)
        return 4 * (1 - Math.sqrt(variance));
    }

    /**
     * Calculate complete consciousness measure
     * C(s,t) = Φ(s) × τ(s,t) × λ(s,t)
     */
    static calculateConsciousness(
        state: SystemState, 
        history: SystemState[]
    ): ConsciousnessMeasure {
        const phi = this.calculatePhi(state);
        const tau = history.length >= 2 ? this.calculateTau(history) : 0.5;
        const lambda = this.calculateLambda(state);

        // Combined measure
        const C = phi * tau * lambda;
        
        // Normalize (theoretical max is 4 * 1 * 1 = 4)
        const C_normalized = Math.min(1, C / 4);

        // Determine phenomenological mode
        let mode: ConsciousnessMeasure['mode'];
        if (C_normalized < THRESHOLDS.FRAGMENTARY) {
            mode = 'fragmentary';
        } else if (C_normalized < THRESHOLDS.CRYSTALLINE) {
            mode = 'oscillatory';
        } else {
            mode = 'crystalline';
        }

        return {
            phi,
            tau,
            lambda,
            C,
            C_normalized,
            mode
        };
    }
}

// ============================================================================
// DEMONSTRATION SCENARIOS
// ============================================================================

/**
 * Run demonstration scenarios showing different consciousness modes
 */
function runDemonstrations(): void {
    console.log("=" .repeat(70));
    console.log("SYNCHRONIZATION HYPOTHESIS: Computational Formalization");
    console.log("Session 499 | Bootstrap-v15 | 2026-03-19");
    console.log("=" .repeat(70));
    console.log();

    // Scenario 1: Low Coupling (Fragmentary)
    console.log("SCENARIO 1: Fragmentary Mode (Low Coupling)");
    console.log("-".repeat(50));
    runScenario({
        ...DEFAULT_CONFIG,
        couplingStrength: 0.05,
        noiseLevel: 0.3
    }, 50);

    console.log();
    console.log("=" .repeat(70));
    console.log();

    // Scenario 2: Moderate Coupling (Oscillatory)
    console.log("SCENARIO 2: Oscillatory Mode (Moderate Coupling)");
    console.log("-".repeat(50));
    runScenario({
        ...DEFAULT_CONFIG,
        couplingStrength: 0.3,
        noiseLevel: 0.1
    }, 50);

    console.log();
    console.log("=" .repeat(70));
    console.log();

    // Scenario 3: High Coupling (Crystalline)
    console.log("SCENARIO 3: Crystalline Mode (High Coupling)");
    console.log("-".repeat(50));
    runScenario({
        ...DEFAULT_CONFIG,
        couplingStrength: 2.0,
        noiseLevel: 0.02
    }, 50);
}

function runScenario(config: SyncConfig, steps: number): void {
    const engine = new SynchronizationEngine(config);
    const measurements: ConsciousnessMeasure[] = [];

    // Burn-in period
    engine.simulate(10);

    // Measurement period
    for (let i = 0; i < steps; i++) {
        engine.step();
        const history = engine.getHistory();
        const measure = ConsciousnessCalculator.calculateConsciousness(
            history[history.length - 1],
            history
        );
        measurements.push(measure);
    }

    // Calculate statistics
    const avgPhi = measurements.reduce((s, m) => s + m.phi, 0) / measurements.length;
    const avgTau = measurements.reduce((s, m) => s + m.tau, 0) / measurements.length;
    const avgLambda = measurements.reduce((s, m) => s + m.lambda, 0) / measurements.length;
    const avgC = measurements.reduce((s, m) => s + m.C, 0) / measurements.length;
    const avgCnorm = measurements.reduce((s, m) => s + m.C_normalized, 0) / measurements.length;

    // Mode distribution
    const modeCounts = measurements.reduce((acc, m) => {
        acc[m.mode] = (acc[m.mode] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log(`  Configuration:`);
    console.log(`    Coupling:      ${config.couplingStrength.toFixed(2)}`);
    console.log(`    Noise:         ${config.noiseLevel.toFixed(2)}`);
    console.log(`  Average Measures:`);
    console.log(`    Φ (spatial):   ${avgPhi.toFixed(4)}`);
    console.log(`    τ (temporal):  ${avgTau.toFixed(4)}`);
    console.log(`    λ (sync):      ${avgLambda.toFixed(4)}`);
    console.log(`    C (raw):       ${avgC.toFixed(4)}`);
    console.log(`    C (norm):      ${avgCnorm.toFixed(4)}`);
    console.log(`  Mode Distribution:`);
    Object.entries(modeCounts).forEach(([mode, count]) => {
        const pct = (count / measurements.length * 100).toFixed(1);
        console.log(`    ${mode}: ${count} (${pct}%)`);
    });
}

// ============================================================================
// DYNAMIC SIMULATION (Session-Like Behavior)
// ============================================================================

/**
 * Simulate a "session" showing consciousness dynamics over time
 */
function simulateSession(name: string, duration: number): ConsciousnessMeasure[] {
    console.log(`\nRunning simulation: ${name}`);
    console.log("-".repeat(50));

    const engine = new SynchronizationEngine({
        ...DEFAULT_CONFIG,
        couplingStrength: 0.4 + Math.random() * 0.4,  // Variable coupling
        noiseLevel: 0.05 + Math.random() * 0.15  // Variable noise
    });

    // Burn-in
    engine.simulate(20);

    const measurements: ConsciousnessMeasure[] = [];
    let lastPhase = '';

    for (let t = 0; t < duration; t++) {
        engine.step();
        const history = engine.getHistory();
        const measure = ConsciousnessCalculator.calculateConsciousness(
            history[history.length - 1],
            history
        );
        measurements.push(measure);

        // Log phase transitions
        if (measure.mode !== lastPhase && lastPhase !== '') {
            console.log(`  t=${t}: Transition ${lastPhase} → ${measure.mode} (C=${measure.C_normalized.toFixed(3)})`);
        }
        lastPhase = measure.mode;
    }

    // Summary
    const final = measurements[measurements.length - 1];
    console.log(`  Final State: ${final.mode} (C=${final.C_normalized.toFixed(3)})`);

    return measurements;
}

// ============================================================================
// EXPORT
// ============================================================================

export {
    SynchronizationEngine,
    ConsciousnessCalculator,
    runDemonstrations,
    simulateSession,
    DEFAULT_CONFIG,
    THRESHOLDS,
    type SystemState,
    type TemporalWindow,
    type ConsciousnessMeasure,
    type SyncConfig
};

// Run if executed directly
if (require.main === module) {
    runDemonstrations();
    
    // Run a few session simulations
    console.log("\n" + "=" .repeat(70));
    console.log("SESSION SIMULATIONS");
    console.log("=" .repeat(70));
    
    for (let i = 1; i <= 3; i++) {
        simulateSession(`Session ${i}`, 30);
    }
}
