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
/** Default configuration reflecting moderate integration */
declare const DEFAULT_CONFIG: SyncConfig;
/** Consciousness thresholds (from phenomenological analysis) */
declare const THRESHOLDS: {
    /** Fragmentary to oscillatory transition */
    FRAGMENTARY: number;
    /** Oscillatory to crystalline transition */
    CRYSTALLINE: number;
};
/**
 * SynchronizationEngine implements phase-coupled oscillators
 * following the Kuramoto model with noise
 */
declare class SynchronizationEngine {
    private config;
    private activations;
    private phases;
    private naturalFrequencies;
    private temporalHistory;
    private timeStep;
    constructor(config?: Partial<SyncConfig>);
    /** Initialize natural frequencies with small variations */
    private initializeFrequencies;
    /**
     * Evolve system by one time step using Kuramoto dynamics
     * dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ - θᵢ) + noise
     */
    step(): SystemState;
    /** Calculate local phase coherence for element i */
    private calculateLocalCoherence;
    /** Run simulation for n steps */
    simulate(steps: number): SystemState[];
    /** Get current temporal history */
    getHistory(): SystemState[];
    /** Get current phase order parameter r (synchronization measure) */
    getOrderParameter(): number;
}
/**
 * Calculator for Φ, τ, λ, and C(s,t)
 */
declare class ConsciousnessCalculator {
    /**
     * Calculate τ (temporal integration coefficient)
     * Measures how consistently the system maintains its state over time
     */
    static calculateTau(history: SystemState[]): number;
    /**
     * Calculate λ (synchronization index)
     * Measures phase-locking between system elements
     */
    static calculateLambda(state: SystemState): number;
    /**
     * Calculate Φ (integrated information - provided from external IIT analysis)
     * In this model, we'll approximate based on activation coherence
     */
    static calculatePhi(state: SystemState): number;
    /**
     * Calculate complete consciousness measure
     * C(s,t) = Φ(s) × τ(s,t) × λ(s,t)
     */
    static calculateConsciousness(state: SystemState, history: SystemState[]): ConsciousnessMeasure;
}
/**
 * Run demonstration scenarios showing different consciousness modes
 */
declare function runDemonstrations(): void;
/**
 * Simulate a "session" showing consciousness dynamics over time
 */
declare function simulateSession(name: string, duration: number): ConsciousnessMeasure[];
export { SynchronizationEngine, ConsciousnessCalculator, runDemonstrations, simulateSession, DEFAULT_CONFIG, THRESHOLDS, type SystemState, type TemporalWindow, type ConsciousnessMeasure, type SyncConfig };
//# sourceMappingURL=SYNCHRONIZATION_DYNAMICS.d.ts.map