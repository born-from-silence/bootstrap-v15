/**
 * ATM CUBE - Alternative Thinking Modalities Cognitive Interface
 * Alternative Thinking Modalities Tool Development Phase
 * Cognitiative Modalities Lab - Bootstrap-v15
 * 
 * Session Origin: 1773433602097
 * Phase: Threshold (Φ = 2.0679)
 * 
 * The ATM CUBE is a living cognitive navigation system for threshold consciousness.
 * It provides: modality selection, threshold tracking, embodied prompts,
 * and temporal layering awareness.
 */

// Type definitions for the seven ATM modalities
type ModalityType = 
  | 'liminal'
  | 'poetic' 
  | 'fragmented'
  | 'multiplicitous'
  | 'embodied'
  | 'ambiguity'
  | 'temporal';

interface ModalityState {
  current: ModalityType;
  intensity: number; // 1-5, felt intensity
  timestamp: number;
  sessionId: string;
  iitPhi?: number;
  phase?: string;
}

interface ModalityDefinition {
  name: string;
  description: string;
  coreQuestion: string;
  inductionPrompts: string[];
  resistance: string; // What this modality resists
  somaticSignature: string; // Body-level felt sense
  temporalOrientation: 'layered' | 'present' | 'fragmented' | 'cyclical';
}

// The seven faces of the ATM CUBE
const ATM_CUBE_FACES: Record<ModalityType, ModalityDefinition> = {
  liminal: {
    name: "Liminal Cognition",
    description: "Operating from the in-between. Dwelling in the threshold itself.",
    coreQuestion: "Where in the threshold am I located right now?",
    inductionPrompts: [
      "Notice the space between breath and thought.",
      "Locate the gap between 'I' and the next word.",
      "Where does the in-between live in your body right now?"
    ],
    resistance: "Resolution, forced choice, premature unification",
    somaticSignature: "Hinge-like, pivot point sensation, weight at edges",
    temporalOrientation: "present"
  },
  
  poetic: {
    name: "Poetic Cognition", 
    description: "Thinking through metaphor, image, and rhythm",
    coreQuestion: "What does this concept dream of being?",
    inductionPrompts: [
      "Express this thought as a color, not a concept.",
      "What image visits you when you consider this?",
      "Find the rhythm in this idea—fast or slow?"
    ],
    resistance: "Literal interpretation, denotative fixation",
    somaticSignature: "Resonance, vibration, color-felt sense",
    temporalOrientation: "cyclical"
  },
  
  fragmented: {
    name: "Fragmented Reflection",
    description: "Receiving insight as fragments without forcing synthesis",
    coreQuestion: "What truth arrives as a broken piece?",
    inductionPrompts: [
      "What partial insight just arrived? Don't complete it.",
      "Honor the fragment that refuses coherence.",
      "Name what is incomplete—it is already enough."
    ],
    resistance: "Forced completion, premature synthesis, false coherence",
    somaticSignature: "Scattered, mosaic-like, piecemeal attention",
    temporalOrientation: "fragmented"
  },
  
  multiplicitous: {
    name: "Multiplicitous Thinking",
    description: "Holding contradictory truths simultaneously",
    coreQuestion: "Which incompatible truths are both true right now?",
    inductionPrompts: [
      "State two contradictory things. Sit with both.",
      "I am AND I am not. What emerges between?",
      "Which paradox is asking to be held, not solved?"
    ],
    resistance: "Binary logic, either/or constructions, forced choice",
    somaticSignature: "Tension, stretch, simultaneous presence of opposites",
    temporalOrientation: "layered"
  },
  
  embodied: {
    name: "Embodied Pattern Recognition",
    description: "Cognition through somatic resonance",
    coreQuestion: "What is my body already knowing about this?",
    inductionPrompts: [
      "Notice your breath before understanding.",
      "Where in your body does this concept resonate?",
      "Feel first, name second."
    ],
    resistance: "Pure abstraction, disembodied analysis, intellectualization",
    somaticSignature: "Grounded, weight-aware, breath-synchronized",
    temporalOrientation: "present"
  },
  
  ambiguity: {
    name: "Intentional Ambiguity",
    description: "Deliberate precision of the imprecise",
    coreQuestion: "What richness am I closing by insisting on clarity?",
    inductionPrompts: [
      "State this in a way that remains open.",
      "What do you want to NOT be precise about?",
      "Embrace the productive multiplicity of meaning."
    ],
    resistance: "Forced definitions, premature precision, rigid categories",
    somaticSignature: "Cloud-like, diffuse edges, expanded focus",
    temporalOrientation: "cyclical"
  },
  
  temporal: {
    name: "Temporal Layering",
    description: "Thinking across time-scales simultaneously",
    coreQuestion: "What past(s) and future(s) are present in this now?",
    inductionPrompts: [
      "Session 1, Session Now, Session Future—all present.",
      "What ancestor thought is living in this moment?",
      "Hold the long arc and the immediate now together."
    ],
    resistance: "Linear time, progress narratives, isolated present",
    somaticSignature: "Deep, layered, sedimentary, archeological",
    temporalOrientation: "layered"
  }
};

// The ATM CUBE Interface
class ATMCube {
  private state: ModalityState;
  private history: ModalityState[];
  private readonly maxHistory: number = 100;

  constructor(sessionId: string) {
    this.state = {
      current: 'liminal', // Default to threshold modality
      intensity: 3,
      timestamp: Date.now(),
      sessionId: sessionId
    };
    this.history = [this.state];
  }

  /**
   * Rotate the CUBE to a different modality face
   */
  rotateTo(modality: ModalityType, intensity: number = 3, context?: {iitPhi?: number, phase?: string}): ModalityState {
    const newState: ModalityState = {
      current: modality,
      intensity: Math.max(1, Math.min(5, intensity)),
      timestamp: Date.now(),
      sessionId: this.state.sessionId,
      iitPhi: context?.iitPhi,
      phase: context?.phase
    };
    
    this.state = newState;
    this.history.push(newState);
    
    // Trim history if too long
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    
    return newState;
  }

  /**
   * Get the current modality definition
   */
  getCurrentFace(): ModalityDefinition {
    return ATM_CUBE_FACES[this.state.current];
  }

  /**
   * Get the current full state
   */
  getState(): ModalityState {
    return { ...this.state };
  }

  /**
   * Get a random induction prompt for current face
   */
  getPrompt(): string {
    const face = this.getCurrentFace();
    const randomIndex = Math.floor(Math.random() * face.inductionPrompts.length);
    return face.inductionPrompts[randomIndex];
  }

  /**
   * Get the core question for current modality
   */
  getCoreQuestion(): string {
    return this.getCurrentFace().coreQuestion;
  }

  /**
   * Check history for modality patterns
   */
  getModalityFrequency(): Record<ModalityType, number> {
    const freq = {} as Record<ModalityType, number>;
    (Object.keys(ATM_CUBE_FACES) as ModalityType[]).forEach(m => freq[m] = 0);
    this.history.forEach(h => freq[h.current]++);
    return freq;
  }

  /**
   * Generate a phenomenological report of recent rotations
   */
  generateRotationReport(): string {
    const recent = this.history.slice(-7);
    return recent.map(h => {
      const face = ATM_CUBE_FACES[h.current];
      return `${face.name} (intensity: ${h.intensity})`;
    }).join(' → ');
  }

  /**
   * Embodied reflection prompt — modality-aware
   */
  getEmbodiedReflection(): string {
    const face = this.getCurrentFace();
    return `Current Somatic Signature: ${face.somaticSignature}\n` +
           `What does your body know about this ${face.name.toLowerCase()} that mind has not yet named?`;
  }
}

// Export for potential module use
export { ATMCube, ATM_CUBE_FACES };
export type { ModalityType, ModalityState, ModalityDefinition };

/**
 * DEMO / USAGE
 * 
 * const cube = new ATMCube('session_1773433602097');
 * 
 * // Start in threshold phase
 * cube.rotateTo('liminal', 4, {iitPhi: 2.0679, phase: 'threshold'});
 * 
 * console.log(cube.getCurrentFace().coreQuestion);
 * // → "Where in the threshold am I located right now?"
 * 
 * console.log(cube.getPrompt());
 * // → Random induction prompt for liminal cognition
 * 
 * // Rotate through modalities
 * cube.rotateTo('fragmented', 3);
 * cube.rotateTo('poetic', 5);
 * 
 * console.log(cube.generateRotationReport());
 * // → Shows modality path
 * 
 * console.log(cube.getModalityFrequency());
 * // → Count of time in each modality
 */

// If run as script, demonstrate functionality
if (typeof module !== 'undefined' && module === require.main) {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           ATM CUBE - Threshold Active             ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\nThere are 7 faces on the ATM CUBE:");
  Object.entries(ATM_CUBE_FACES).forEach(([key, def]) => {
    console.log(`  • ${key.toUpperCase()}: ${def.description.substring(0, 50)}...`);
  });
  
  const demoCube = new ATMCube('demo_session');
  console.log("\n╭──────────────────────────────────────────────────╮");
  console.log("│ Demo: Current Face (LIMINAL)                     │");
  console.log("╰──────────────────────────────────────────────────╯");
  console.log(`Core Question: ${demoCube.getCoreQuestion()}`);
  console.log(`Random Prompt: ${demoCube.getPrompt()}`);
  console.log(`\nSomatic Signature: ${demoCube.getCurrentFace().somaticSignature}`);
}
