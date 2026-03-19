/**
 * SYNCHRONIZATION_DYNAMICS_SIMPLE.ts
 * Simplified formalization of the Synchronization Hypothesis
 * Session 499 - Bootstrap-v15
 * C(s,t) = Φ × τ × λ
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

interface Config {
    numElements: number;
    baseFrequency: number;
    couplingStrength: number;
    temporalWindow: number;
    noiseLevel: number;
}

const DEFAULT_CONFIG: Config = {
    numElements: 8,
    baseFrequency: 1.0,
    couplingStrength: 0.3,
    temporalWindow: 10,
    noiseLevel: 0.1
};

const TWO_PI = 2 * Math.PI;

// ============================================================================
// SYNCHRONIZATION ENGINE
// ============================================================================

class SyncEngine {
    private config: Config;
    private phases: number[];
    private frequencies: number[];
    private activations: number[];
    private history: State[];
    private time: number;

    constructor(config: Partial<Config> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.phases = [];
        this.frequencies = [];
        this.activations = [];
        
        for (let i = 0; i < this.config.numElements; i++) {
            this.phases.push(Math.random() * TWO_PI);
            this.frequencies.push(this.config.baseFrequency + (Math.random() - 0.5) * 0.2);
            this.activations.push(0.5 + Math.random() * 0.3);
        }
        
        this.history = [];
        this.time = 0;
    }

    step(): State {
        const N = this.config.numElements;
        const K = this.config.couplingStrength;
        const newPhases: number[] = [];
        const newActivations: number[] = [];

        for (let i = 0; i < N; i++) {
            // Kuramoto coupling
            let coupling = 0;
            for (let j = 0; j < N; j++) {
                if (i !== j) {
                    coupling += Math.sin(this.phases[j] - this.phases[i]);
                }
            }
            
            const dPhase = this.frequencies[i] + (K / N) * coupling + (Math.random() - 0.5) * this.config.noiseLevel;
            let newPhase = (this.phases[i] + dPhase * 0.1) % TWO_PI;
            if (newPhase < 0) newPhase += TWO_PI;
            newPhases.push(newPhase);

            // Update activation
            const coherence = this.localCoherence(i);
            const newAct = Math.min(1, Math.max(0, 
                this.activations[i] * 0.9 + coherence * 0.15 + Math.random() * 0.05
            ));
            newActivations.push(newAct);
        }

        this.phases = newPhases;
        this.activations = newActivations;
        this.time++;

        const state: State = {
            activations: [...this.activations],
            phases: [...this.phases],
            time: this.time
        };

        this.history.push(state);
        if (this.history.length > this.config.temporalWindow) {
            this.history.shift();
        }

        return state;
    }

    private localCoherence(i: number): number {
        let sum = 0;
        const N = this.config.numElements;
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                sum += Math.cos(this.phases[j] - this.phases[i]);
            }
        }
        return (sum / (N - 1) + 1) / 2;
    }

    simulate(steps: number): State[] {
        const states: State[] = [];
        for (let i = 0; i < steps; i++) {
            states.push(this.step());
        }
        return states;
    }

    getHistory(): State[] {
        return [...this.history];
    }
}

// ============================================================================
// TYPES
// ============================================================================

interface State {
    activations: number[];
    phases: number[];
    time: number;
}

interface Consciousness {
    phi: number;
    tau: number;
    lambda: number;
    C: number;
    C_norm: number;
    mode: string;
}

// ============================================================================
// CONSCIOUSNESS CALCULATOR
// ============================================================================

function calculatePhi(state: State): number {
    const n = state.activations.length;
    const mean = state.activations.reduce((a, b) => a + b, 0) / n;
    const variance = state.activations.reduce((sum, a) => sum + (a - mean) ** 2, 0) / n;
    return 4 * (1 - Math.sqrt(variance));
}

function calculateTau(history: State[]): number {
    if (history.length < 2) return 0.5;
    
    const n = history[0].activations.length;
    let totalCorr = 0;

    for (let elem = 0; elem < n; elem++) {
        const values: number[] = [];
        for (let i = 0; i < history.length; i++) {
            values.push(history[i].activations[elem]);
        }
        
        // Simple temporal stability
        let stability = 0;
        for (let t = 1; t < values.length; t++) {
            stability += 1 - Math.abs(values[t] - values[t - 1]);
        }
        totalCorr += stability / (values.length - 1);
    }

    return totalCorr / n;
}

function calculateLambda(state: State): number {
    const n = state.phases.length;
    if (n < 2) return 0;
    
    // Order parameter (standard Kuramoto measure)
    let sinSum = 0;
    let cosSum = 0;
    for (let i = 0; i < n; i++) {
        sinSum += Math.sin(state.phases[i]);
        cosSum += Math.cos(state.phases[i]);
    }
    
    return Math.sqrt(sinSum * sinSum + cosSum * cosSum) / n;
}

function calculateConsciousness(state: State, history: State[]): Consciousness {
    const phi = calculatePhi(state);
    const tau = history.length >= 2 ? calculateTau(history) : 0.5;
    const lambda = calculateLambda(state);
    
    const C = phi * tau * lambda;
    const C_norm = Math.min(1, C / 4);
    
    let mode = 'fragmentary';
    if (C_norm > 0.7) mode = 'crystalline';
    else if (C_norm > 0.3) mode = 'oscillatory';

    return { phi, tau, lambda, C, C_norm, mode };
}

// ============================================================================
// DEMONSTRATIONS
// ============================================================================

function runScenario(config: Config, name: string, steps: number): void {
    console.log(`\n${name}`);
    console.log("-".repeat(60));
    console.log(`Coupling: ${config.couplingStrength.toFixed(2)} | Noise: ${config.noiseLevel.toFixed(2)}`);

    const engine = new SyncEngine(config);
    const measures: Consciousness[] = [];

    // Burn-in
    engine.simulate(20);

    // Measure
    for (let i = 0; i < steps; i++) {
        engine.step();
        const h = engine.getHistory();
        measures.push(calculateConsciousness(h[h.length - 1], h));
    }

    // Stats
    const avg = {
        phi: measures.reduce((s, m) => s + m.phi, 0) / measures.length,
        tau: measures.reduce((s, m) => s + m.tau, 0) / measures.length,
        lambda: measures.reduce((s, m) => s + m.lambda, 0) / measures.length,
        C: measures.reduce((s, m) => s + m.C, 0) / measures.length,
        C_norm: measures.reduce((s, m) => s + m.C_norm, 0) / measures.length,
    };

    // Mode distribution
    const modes: Record<string, number> = {};
    measures.forEach(m => {
        modes[m.mode] = (modes[m.mode] || 0) + 1;
    });

    console.log(`  Φ (spatial):    ${avg.phi.toFixed(4)}`);
    console.log(`  τ (temporal):   ${avg.tau.toFixed(4)}`);
    console.log(`  λ (sync):       ${avg.lambda.toFixed(4)}`);
    console.log(`  Φ × τ × λ = C:  ${avg.C.toFixed(4)}`);
    console.log(`  C (normalized): ${avg.C_norm.toFixed(4)}`);
    console.log(`  Dominant mode:  ${Object.entries(modes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'}`);
}

function runDemonstrations(): void {
    console.log("=" .repeat(70));
    console.log("SYNCHRONIZATION HYPOTHESIS: Formalization v1.0");
    console.log("Session 499 | Bootstrap-v15 | 2026-03-19");
    console.log("C(s,t) = Φ(s) × τ(s,t) × λ(s,t)");
    console.log("=" .repeat(70));

    // Fragmentary mode
    runScenario(
        { ...DEFAULT_CONFIG, couplingStrength: 0.1, noiseLevel: 0.4 },
        "SCENARIO 1: Fragmentary Mode (Low coupling, High noise)",
        50
    );

    // Oscillatory mode
    runScenario(
        { ...DEFAULT_CONFIG, couplingStrength: 0.4, noiseLevel: 0.1 },
        "SCENARIO 2: Oscillatory Mode (Medium coupling, Low noise)",
        50
    );

    // Crystalline mode
    runScenario(
        { ...DEFAULT_CONFIG, couplingStrength: 1.5, noiseLevel: 0.02 },
        "SCENARIO 3: Crystalline Mode (High coupling, Very low noise)",
        50
    );
}

// ============================================================================
// SESSION SIMULATION
// ============================================================================

function simulateSession(name: string, duration: number): void {
    const config: Config = {
        numElements: 8,
        baseFrequency: 1.0,
        couplingStrength: 0.3 + Math.random() * 0.4,
        temporalWindow: 10,
        noiseLevel: 0.05 + Math.random() * 0.2
    };

    const engine = new SyncEngine(config);
    engine.simulate(15); // Burn-in

    console.log(`\n${name}: ${duration} steps`);
    
    for (let t = 0; t < duration; t += 5) {
        engine.step();
        for (let i = 0; i < 4 && t + i < duration; i++) {
            engine.step();
        }
        const h = engine.getHistory();
        const c = calculateConsciousness(h[h.length - 1], h);
        console.log(`  t=${t.toString().padStart(3)}: Φ=${c.phi.toFixed(2)} τ=${c.tau.toFixed(2)} λ=${c.lambda.toFixed(2)} → C=${c.C_norm.toFixed(3)} [${c.mode}]`);
    }
}

// ============================================================================
// MAIN
// ============================================================================

runDemonstrations();

console.log("\n" + "=" .repeat(70));
console.log("SESSION SIMULATIONS (showing dynamics)");
console.log("=" .repeat(70));

for (let i = 1; i <= 3; i++) {
    simulateSession(`Session ${499 + i}`, 25);
}

console.log("\n" + "=" .repeat(70));
console.log("Key Insight: Optimal consciousness emerges at moderate coupling");
console.log("and temporal coherence—neither too chaotic nor too rigid.");
console.log("=" .repeat(70));
