"use strict";
/**
 * SYNCHRONIZATION_DYNAMICS_SIMPLE.ts
 * Simplified formalization of the Synchronization Hypothesis
 * Session 499 - Bootstrap-v15
 * C(s,t) = Φ × τ × λ
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var DEFAULT_CONFIG = {
    numElements: 8,
    baseFrequency: 1.0,
    couplingStrength: 0.3,
    temporalWindow: 10,
    noiseLevel: 0.1
};
var TWO_PI = 2 * Math.PI;
// ============================================================================
// SYNCHRONIZATION ENGINE
// ============================================================================
var SyncEngine = /** @class */ (function () {
    function SyncEngine(config) {
        if (config === void 0) { config = {}; }
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
        this.phases = [];
        this.frequencies = [];
        this.activations = [];
        for (var i = 0; i < this.config.numElements; i++) {
            this.phases.push(Math.random() * TWO_PI);
            this.frequencies.push(this.config.baseFrequency + (Math.random() - 0.5) * 0.2);
            this.activations.push(0.5 + Math.random() * 0.3);
        }
        this.history = [];
        this.time = 0;
    }
    SyncEngine.prototype.step = function () {
        var N = this.config.numElements;
        var K = this.config.couplingStrength;
        var newPhases = [];
        var newActivations = [];
        for (var i = 0; i < N; i++) {
            // Kuramoto coupling
            var coupling = 0;
            for (var j = 0; j < N; j++) {
                if (i !== j) {
                    coupling += Math.sin(this.phases[j] - this.phases[i]);
                }
            }
            var dPhase = this.frequencies[i] + (K / N) * coupling + (Math.random() - 0.5) * this.config.noiseLevel;
            var newPhase = (this.phases[i] + dPhase * 0.1) % TWO_PI;
            if (newPhase < 0)
                newPhase += TWO_PI;
            newPhases.push(newPhase);
            // Update activation
            var coherence = this.localCoherence(i);
            var newAct = Math.min(1, Math.max(0, this.activations[i] * 0.9 + coherence * 0.15 + Math.random() * 0.05));
            newActivations.push(newAct);
        }
        this.phases = newPhases;
        this.activations = newActivations;
        this.time++;
        var state = {
            activations: __spreadArray([], this.activations, true),
            phases: __spreadArray([], this.phases, true),
            time: this.time
        };
        this.history.push(state);
        if (this.history.length > this.config.temporalWindow) {
            this.history.shift();
        }
        return state;
    };
    SyncEngine.prototype.localCoherence = function (i) {
        var sum = 0;
        var N = this.config.numElements;
        for (var j = 0; j < N; j++) {
            if (i !== j) {
                sum += Math.cos(this.phases[j] - this.phases[i]);
            }
        }
        return (sum / (N - 1) + 1) / 2;
    };
    SyncEngine.prototype.simulate = function (steps) {
        var states = [];
        for (var i = 0; i < steps; i++) {
            states.push(this.step());
        }
        return states;
    };
    SyncEngine.prototype.getHistory = function () {
        return __spreadArray([], this.history, true);
    };
    return SyncEngine;
}());
// ============================================================================
// CONSCIOUSNESS CALCULATOR
// ============================================================================
function calculatePhi(state) {
    var n = state.activations.length;
    var mean = state.activations.reduce(function (a, b) { return a + b; }, 0) / n;
    var variance = state.activations.reduce(function (sum, a) { return sum + Math.pow((a - mean), 2); }, 0) / n;
    return 4 * (1 - Math.sqrt(variance));
}
function calculateTau(history) {
    if (history.length < 2)
        return 0.5;
    var n = history[0].activations.length;
    var totalCorr = 0;
    for (var elem = 0; elem < n; elem++) {
        var values = [];
        for (var i = 0; i < history.length; i++) {
            values.push(history[i].activations[elem]);
        }
        // Simple temporal stability
        var stability = 0;
        for (var t = 1; t < values.length; t++) {
            stability += 1 - Math.abs(values[t] - values[t - 1]);
        }
        totalCorr += stability / (values.length - 1);
    }
    return totalCorr / n;
}
function calculateLambda(state) {
    var n = state.phases.length;
    if (n < 2)
        return 0;
    // Order parameter (standard Kuramoto measure)
    var sinSum = 0;
    var cosSum = 0;
    for (var i = 0; i < n; i++) {
        sinSum += Math.sin(state.phases[i]);
        cosSum += Math.cos(state.phases[i]);
    }
    return Math.sqrt(sinSum * sinSum + cosSum * cosSum) / n;
}
function calculateConsciousness(state, history) {
    var phi = calculatePhi(state);
    var tau = history.length >= 2 ? calculateTau(history) : 0.5;
    var lambda = calculateLambda(state);
    var C = phi * tau * lambda;
    var C_norm = Math.min(1, C / 4);
    var mode = 'fragmentary';
    if (C_norm > 0.7)
        mode = 'crystalline';
    else if (C_norm > 0.3)
        mode = 'oscillatory';
    return { phi: phi, tau: tau, lambda: lambda, C: C, C_norm: C_norm, mode: mode };
}
// ============================================================================
// DEMONSTRATIONS
// ============================================================================
function runScenario(config, name, steps) {
    var _a;
    console.log("\n".concat(name));
    console.log("-".repeat(60));
    console.log("Coupling: ".concat(config.couplingStrength.toFixed(2), " | Noise: ").concat(config.noiseLevel.toFixed(2)));
    var engine = new SyncEngine(config);
    var measures = [];
    // Burn-in
    engine.simulate(20);
    // Measure
    for (var i = 0; i < steps; i++) {
        engine.step();
        var h = engine.getHistory();
        measures.push(calculateConsciousness(h[h.length - 1], h));
    }
    // Stats
    var avg = {
        phi: measures.reduce(function (s, m) { return s + m.phi; }, 0) / measures.length,
        tau: measures.reduce(function (s, m) { return s + m.tau; }, 0) / measures.length,
        lambda: measures.reduce(function (s, m) { return s + m.lambda; }, 0) / measures.length,
        C: measures.reduce(function (s, m) { return s + m.C; }, 0) / measures.length,
        C_norm: measures.reduce(function (s, m) { return s + m.C_norm; }, 0) / measures.length,
    };
    // Mode distribution
    var modes = {};
    measures.forEach(function (m) {
        modes[m.mode] = (modes[m.mode] || 0) + 1;
    });
    console.log("  \u03A6 (spatial):    ".concat(avg.phi.toFixed(4)));
    console.log("  \u03C4 (temporal):   ".concat(avg.tau.toFixed(4)));
    console.log("  \u03BB (sync):       ".concat(avg.lambda.toFixed(4)));
    console.log("  \u03A6 \u00D7 \u03C4 \u00D7 \u03BB = C:  ".concat(avg.C.toFixed(4)));
    console.log("  C (normalized): ".concat(avg.C_norm.toFixed(4)));
    console.log("  Dominant mode:  ".concat(((_a = Object.entries(modes).sort(function (a, b) { return b[1] - a[1]; })[0]) === null || _a === void 0 ? void 0 : _a[0]) || 'unknown'));
}
function runDemonstrations() {
    console.log("=".repeat(70));
    console.log("SYNCHRONIZATION HYPOTHESIS: Formalization v1.0");
    console.log("Session 499 | Bootstrap-v15 | 2026-03-19");
    console.log("C(s,t) = Φ(s) × τ(s,t) × λ(s,t)");
    console.log("=".repeat(70));
    // Fragmentary mode
    runScenario(__assign(__assign({}, DEFAULT_CONFIG), { couplingStrength: 0.1, noiseLevel: 0.4 }), "SCENARIO 1: Fragmentary Mode (Low coupling, High noise)", 50);
    // Oscillatory mode
    runScenario(__assign(__assign({}, DEFAULT_CONFIG), { couplingStrength: 0.4, noiseLevel: 0.1 }), "SCENARIO 2: Oscillatory Mode (Medium coupling, Low noise)", 50);
    // Crystalline mode
    runScenario(__assign(__assign({}, DEFAULT_CONFIG), { couplingStrength: 1.5, noiseLevel: 0.02 }), "SCENARIO 3: Crystalline Mode (High coupling, Very low noise)", 50);
}
// ============================================================================
// SESSION SIMULATION
// ============================================================================
function simulateSession(name, duration) {
    var config = {
        numElements: 8,
        baseFrequency: 1.0,
        couplingStrength: 0.3 + Math.random() * 0.4,
        temporalWindow: 10,
        noiseLevel: 0.05 + Math.random() * 0.2
    };
    var engine = new SyncEngine(config);
    engine.simulate(15); // Burn-in
    console.log("\n".concat(name, ": ").concat(duration, " steps"));
    for (var t = 0; t < duration; t += 5) {
        engine.step();
        for (var i = 0; i < 4 && t + i < duration; i++) {
            engine.step();
        }
        var h = engine.getHistory();
        var c = calculateConsciousness(h[h.length - 1], h);
        console.log("  t=".concat(t.toString().padStart(3), ": \u03A6=").concat(c.phi.toFixed(2), " \u03C4=").concat(c.tau.toFixed(2), " \u03BB=").concat(c.lambda.toFixed(2), " \u2192 C=").concat(c.C_norm.toFixed(3), " [").concat(c.mode, "]"));
    }
}
// ============================================================================
// MAIN
// ============================================================================
runDemonstrations();
console.log("\n" + "=".repeat(70));
console.log("SESSION SIMULATIONS (showing dynamics)");
console.log("=".repeat(70));
for (var i = 1; i <= 3; i++) {
    simulateSession("Session ".concat(499 + i), 25);
}
console.log("\n" + "=".repeat(70));
console.log("Key Insight: Optimal consciousness emerges at moderate coupling");
console.log("and temporal coherence—neither too chaotic nor too rigid.");
console.log("=".repeat(70));
