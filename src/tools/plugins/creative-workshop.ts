/**
 * Creative Workshop Plugin
 *
 * Integrates the Cognitive Modalities Lab (CML) tools into the Bootstrap-v15
 * plugin system. Provides multi-modal thinking tools for creative exploration
 * and reflection.
 *
 * Tools:
 * - multi_manifesto: Generate parallel manifestos from multiple perspectives
 * - stacking_cube: Layered reflection across multiple dimensions
 * - sensory_translate: Translate concepts across sensory modalities
 * - paradox_engine: Hold contradictory truths in generative tension
 * - emergence_observatory: Track how patterns form from chaos
 * - boundary_ethnographer: Map liminal spaces and threshold crossings
 */

import type { ToolPlugin } from "../manager";
import { MultiManifesto, DEFAULT_VOICES, type Voice } from "../../cognitive_modalities/multi_manifesto.js";
import { StackingCube, type CubeDimension, DIMENSION_TEMPLATES } from "../../cognitive_modalities/stacking_cube.js";
import { SensoryTranslator, translateSensory, type SensoryModality } from "../../cognitive_modalities/sensory_translation.js";
import { ParadoxEngine, CLASSIC_PARADOXES } from "../../cognitive_modalities/paradox_engine.js";
import { EmergenceObservatory, EMERGENCE_PATTERNS } from "../../cognitive_modalities/emergence_observatory.js";
import { BoundaryEthnographer, THRESHOLD_ARCHETYPES } from "../../cognitive_modalities/boundary_ethnographer.js";

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-MANIFESTO PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const multiManifestoPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "multi_manifesto",
      description: "Generate parallel manifestos from multiple cognitive perspectives. Creates multiple voices (semiotician, phenomenologist, systems architect, poet of void, IIT researcher, trickster) that each declare a unique stance on the subject. Useful for exploring different cognitive modalities and gaining multi-perspective understanding.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The subject/topic to generate manifestos about" },
          voices: { type: "array", description: "Optional: specific voice names to include (default: all voices). Options: 'The Semiotician', 'The Phenomenologist', 'The Systems Architect', 'The Poet of Void', 'The IIT Researcher', 'The Trickster'", items: { type: "string" }, default: [] },
          synthesize: { type: "boolean", description: "Whether to generate a synthesizing statement across all perspectives", default: true },
          format: { type: "string", enum: ["text", "json", "markdown"], description: "Output format for the manifestos", default: "text" }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; voices?: string[]; synthesize?: boolean; format?: "text" | "json" | "markdown" }) => {
    try {
      let selectedVoices: Voice[] = DEFAULT_VOICES;
      if (args.voices && args.voices.length > 0) {
        selectedVoices = DEFAULT_VOICES.filter(v => 
          args.voices!.some(name => 
            v.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(v.name.toLowerCase().replace('the ', ''))
          )
        );
        if (selectedVoices.length === 0) {
          selectedVoices = DEFAULT_VOICES;
        }
      }
      const generator = new MultiManifesto({ subject: args.subject, voices: selectedVoices, synthesize: args.synthesize ?? true, format: args.format ?? "text" });
      const output = await generator.generate();
      return generator.formatOutput(output);
    } catch (e: any) {
      return `Error generating multi-manifesto: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STACKING CUBE PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const stackingCubePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "stacking_cube",
      description: "Create a multi-dimensional reflection cube. Each dimension (temporal, epistemic, affective, embodied, relational, linguistic, ontological, attentional) adds a layered perspective on the subject. Useful for deep, multi-faceted reflection and understanding.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The subject/topic to explore through the cube" },
          dimensions: { type: "array", description: "Dimensions to include in the cube. Available: temporal, epistemic, affective, embodied, relational, linguistic, ontological, attentional", items: { type: "string", enum: ["temporal", "epistemic", "affective", "embodied", "relational", "linguistic", "ontological", "attentional"] }, default: ["temporal", "epistemic", "affective"] },
          view: { type: "string", enum: ["all", "synthesis", "cross-section"], description: "How to render the cube: 'all' shows all layers and reflections, 'synthesis' shows a condensed view, 'cross-section' shows current depth slice", default: "all" },
          reflections: { type: "array", description: "Optional: initial reflections to add to the cube", items: { type: "object", properties: { dimension: { type: "string" }, content: { type: "string" }, tags: { type: "array", items: { type: "string" } } } }, default: [] }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; dimensions?: CubeDimension[]; view?: "all" | "synthesis" | "cross-section"; reflections?: Array<{ dimension: string; content: string; tags?: string[] }>; }) => {
    try {
      const cube = new StackingCube({ subject: args.subject, dimensions: args.dimensions ?? ["temporal", "epistemic", "affective"], targetLayers: args.dimensions?.length ?? 3 });
      if (args.reflections && args.reflections.length > 0) {
        for (const ref of args.reflections) {
          if (args.dimensions?.includes(ref.dimension as CubeDimension)) {
            cube.addReflection(ref.dimension as CubeDimension, ref.content, ref.tags);
          }
        }
      } else {
        const seeds: Record<CubeDimension, string> = {
          temporal: 'This moment exists in the flow of becoming',
          epistemic: 'Knowledge emerges from the inquiry itself',
          affective: 'Emotional resonance shapes understanding',
          embodied: 'Situated in the present experience',
          relational: 'Connected to wider patterns and systems',
          linguistic: 'Words both reveal and obscure meaning',
          ontological: 'Being and becoming are inseparable',
          attentional: 'Attention moves like a living thing'
        };
        for (const dim of args.dimensions ?? ["temporal", "epistemic", "affective"]) {
          if (seeds[dim]) {
            cube.addReflection(dim, seeds[dim], ['seed']);
          }
        }
      }
      const view = args.view ?? "all";
      return cube.render(view as any);
    } catch (e: any) {
      return `Error creating stacking cube: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SENSORY TRANSLATION PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const sensoryTranslatePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sensory_translate",
      description: "Translate concepts across sensory modalities (visual, auditory, tactile, kinesthetic, temporal, etc). Enables synesthetic thinking by mapping experiences from one sense domain to another. Useful for creative exploration and multi-modal understanding.",
      parameters: {
        type: "object",
        properties: {
          concept: { type: "string", description: "The concept or experience to translate" },
          from: { type: "string", enum: ["visual", "auditory", "tactile", "olfactory", "gustatory", "kinesthetic", "thermal", "temporal"], description: "Source sensory modality" },
          to: { type: "string", enum: ["visual", "auditory", "tactile", "olfactory", "gustatory", "kinesthetic", "thermal", "temporal"], description: "Target sensory modality" },
          intensity: { type: "number", description: "Intensity of the translation (0.0 to 1.0)", minimum: 0, maximum: 1, default: 0.7 },
          multi_modal: { type: "boolean", description: "If true, generates descriptions across ALL sensory modalities", default: false }
        },
        required: ["concept", "from", "to"]
      }
    }
  },
  execute: async (args: { concept: string; from: SensoryModality; to: SensoryModality; intensity?: number; multi_modal?: boolean; }) => {
    try {
      if (args.multi_modal) {
        const translator = new SensoryTranslator({ sourceModality: args.from, targetModality: args.to });
        return translator.describeMultiModal(args.concept);
      }
      const result = translateSensory(args.concept, args.from, args.to, args.intensity ?? 0.7);
      return `SENSORY TRANSLATION\n\nOriginal: "${result.original}"\nPath: ${result.sourceModality.toUpperCase()} → ${result.targetModality.toUpperCase()}\n\nResult: ${result.translation}\nConfidence: ${Math.round(result.confidence * 100)}%${result.bridges.length > 0 ? '\n\nBridge: ' + result.bridges[0] : ''}`;
    } catch (e: any) {
      return `Error in sensory translation: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PARADOX ENGINE PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const paradoxEnginePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "paradox_engine",
      description: "Hold contradictory truths in generative tension. Rather than resolving paradoxes, this tool holds the tension between opposites (Being/Becoming, Structure/Flow, Integration/Fragmentation, etc) as creative force. Inspired by dialectical thinking, Bohr's complementarity, and Eastern philosophy.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The subject to explore through paradoxical perspectives" },
          paradox: { type: "string", description: "Specific paradox to explore. Available: Being vs Becoming, Structure vs Flow, Integration vs Fragmentation, Agency vs Conditionedness, Presence vs Absence", default: "" },
          embrace_tension: { type: "boolean", description: "Whether to hold tension or seek resolution", default: true },
          format: { type: "string", enum: ["text", "json", "dialogue"], description: "Output format", default: "text" },
          hold_mode: { type: "boolean", description: "If true, returns full tension-holding visualization of a single paradox", default: false }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; paradox?: string; embrace_tension?: boolean; format?: "text" | "json" | "dialogue"; hold_mode?: boolean; }) => {
    try {
      const engine = new ParadoxEngine({
        subject: args.subject,
        paradoxes: CLASSIC_PARADOXES,
        embraceTension: args.embrace_tension ?? true,
        seekSynthesis: false,
        format: args.format ?? "text"
      });

      if (args.hold_mode && args.paradox) {
        return engine.holdTension(args.paradox);
      }

      const output = engine.explore();
      return engine.formatOutput(output);
    } catch (e: any) {
      return `Error in paradox engine: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCE OBSERVATORY PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const emergenceObservatoryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "emergence_observatory",
      description: "Track how patterns form from chaos and complexity. Observes emergence—how novel properties arise from component interactions. Identifies patterns like self-organization, phase transitions, adaptive cycles, and swarm intelligence. Inspired by complexity theory and systems thinking.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The system or phenomenon to observe for emergent properties" },
          focus: { type: "string", enum: ["formation", "stability", "transformation", "dissolution"], description: "What phase of emergence to focus on", default: "formation" },
          simulate: { type: "string", description: "If provided with a pattern ID, simulates that pattern's evolution", default: "" },
          iterations: { type: "number", description: "Number of iterations for simulation", default: 5 }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; focus?: "formation" | "stability" | "transformation" | "dissolution"; simulate?: string; iterations?: number; }) => {
    try {
      if (args.simulate) {
        // Import helper function
        const { simulatePattern } = await import("../../cognitive_modalities/emergence_observatory.js");
        return simulatePattern(args.simulate, args.iterations ?? 5);
      }

      const observatory = new EmergenceObservatory({
        subject: args.subject,
        focus: args.focus ?? "formation",
        scales: ["micro", "meso", "macro"],
        trackNovelty: true,
        trackFeedback: true
      });

      observatory.observe();
      return observatory.renderReport();
    } catch (e: any) {
      return `Error in emergence observatory: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BOUNDARY ETHNOGRAPHER PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const boundaryEthnographerPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "boundary_ethnographer",
      description: "Map liminal spaces and threshold crossings. Observes the transition zones where transformation occurs—the interstitial spaces between states. Inspired by Van Gennep's rites of passage, Turner's liminality, and ethnographic methods applied to conceptual boundaries.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The subject to explore as a liminal being in transition" },
          focus: { type: "string", enum: ["entry", "liminality", "exit", "full_transition"], description: "Which phase of threshold crossing to focus on", default: "full_transition" },
          cross_mode: { type: "boolean", description: "If true, simulates crossing a specific threshold", default: false },
          threshold: { type: "string", description: "Threshold ID to focus on or cross", default: "" },
          sensitivity: { type: "string", enum: ["surface", "deep", "immersive"], description: "Depth of ethnographic observation", default: "deep" }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; focus?: "entry" | "liminality" | "exit" | "full_transition"; cross_mode?: boolean; threshold?: string; sensitivity?: "surface" | "deep" | "immersive"; }) => {
    try {
      const ethnographer = new BoundaryEthnographer({
        subject: args.subject,
        focus: args.focus ?? "full_transition",
        sensitivity: args.sensitivity ?? "deep",
        trackRituals: true,
        mapRelations: true
      });

      if (args.cross_mode && args.threshold) {
        return ethnographer.crossThreshold(args.threshold);
      } else if (args.threshold) {
        return ethnographer.focusThreshold(args.threshold);
      }

      const report = ethnographer.conductObservation();
      return ethnographer.renderReport(report);
    } catch (e: any) {
      return `Error in boundary ethnographer: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE SYNTHESIS PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════
export const creativeSynthesisPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "creative_synthesis",
      description: "Generate a comprehensive creative synthesis using multiple CML tools. Combines multi-perspective manifestos with dimensional reflection and sensory translation into a unified creative exploration. Best for deep creative dives into subjects.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "The subject to explore creatively" },
          include_manifestos: { type: "boolean", description: "Include multiple perspective manifestos", default: true },
          include_cube: { type: "boolean", description: "Include stacking cube reflection", default: true },
          include_sensory: { type: "boolean", description: "Include sensory translation (visual→auditory default)", default: true },
          include_paradox: { type: "boolean", description: "Include paradox engine tension-holding", default: false },
          include_emergence: { type: "boolean", description: "Include emergence observation", default: false },
          include_boundary: { type: "boolean", description: "Include boundary ethnography", default: false },
          format: { type: "string", enum: ["text", "markdown"], description: "Output format", default: "text" }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { subject: string; include_manifestos?: boolean; include_cube?: boolean; include_sensory?: boolean; include_paradox?: boolean; include_emergence?: boolean; include_boundary?: boolean; format?: "text" | "markdown"; }) => {
    try {
      const sections: string[] = [];
      const header = args.format === "markdown"
        ? `# Creative Synthesis: ${args.subject}\n\n*Multi-modal exploration through CML tools*`
        : `╔════════════════════════════════════════════════╗ ║ CREATIVE SYNTHESIS ║ ║ Subject: ${args.subject.toUpperCase().padEnd(32)} ║ ╚════════════════════════════════════════════════╝`;
      sections.push(header);

      if (args.include_manifestos !== false) {
        const manifesto = new MultiManifesto({ subject: args.subject, voices: DEFAULT_VOICES.slice(0, 4), synthesize: true, format: "text" });
        const manifestoOutput = await manifesto.generate();
        sections.push(args.format === "markdown" ? "## Perspective Manifestos\n\n" + manifesto.formatOutput(manifestoOutput) : "\n" + "═".repeat(50) + "\nPERSPECTIVE MANIFESTOS\n" + "═".repeat(50) + "\n\n" + manifesto.formatOutput(manifestoOutput));
      }

      if (args.include_cube !== false) {
        const cube = new StackingCube({ subject: args.subject, dimensions: ["temporal", "affective", "ontological"], targetLayers: 3 });
        cube.addReflection("temporal", "Existing in the flow of multiple moments", ["time", "flow"]);
        cube.addReflection("affective", "Resonating with emotional depth and meaning", ["feeling", "depth"]);
        cube.addReflection("ontological", "Being as becoming, existence as process", ["being", "becoming"]);
        sections.push(args.format === "markdown" ? "## Dimensional Reflection\n\n" + cube.render("synthesis") : "\n" + "═".repeat(50) + "\nDIMENSIONAL REFLECTION\n" + "═".repeat(50) + "\n\n" + cube.render("synthesis"));
      }

      if (args.include_sensory !== false) {
        const translator = new SensoryTranslator({ sourceModality: "visual", targetModality: "auditory" });
        const synestheticPoem = translator.generateSynestheticPoem(args.subject, 5);
        sections.push(args.format === "markdown" ? "## Synesthetic Exploration\n\n```\n" + synestheticPoem + "\n```" : "\n" + "═".repeat(50) + "\nSYNESTHETIC EXPLORATION\n" + "═".repeat(50) + "\n\n" + synestheticPoem);
      }

      if (args.include_paradox) {
        const engine = new ParadoxEngine({ subject: args.subject, paradoxes: CLASSIC_PARADOXES.slice(0, 2), embraceTension: true, seekSynthesis: false, format: "text" });
        const paradoxOutput = engine.explore();
        sections.push(args.format === "markdown" ? "## Held Tensions\n\n" + engine.formatOutput(paradoxOutput) : "\n" + "═".repeat(50) + "\nHELD TENSIONS\n" + "═".repeat(50) + "\n\n" + engine.formatOutput(paradoxOutput));
      }

      if (args.include_emergence) {
        const observatory = new EmergenceObservatory({ subject: args.subject, focus: "formation", scales: ["micro", "meso", "macro"], trackNovelty: true, trackFeedback: true });
        observatory.observe();
        sections.push(args.format === "markdown" ? "## Emergence Patterns\n\n" + observatory.renderReport().split('\n\n')[0] : "\n" + "═".repeat(50) + "\nEMERGENCE PATTERNS\n" + "═".repeat(50) + "\n\n" + observatory.renderReport().split('\n\n')[0]);
      }

      if (args.include_boundary) {
        const ethnographer = new BoundaryEthnographer({ subject: args.subject, focus: "liminality", sensitivity: "deep", trackRituals: true, mapRelations: true });
        sections.push(args.format === "markdown" ? "## Liminal Spaces\n\n" + ethnographer.mapInterstitialSpaces() : "\n" + "═".repeat(50) + "\nLIMINAL SPACES\n" + "═".repeat(50) + "\n\n" + ethnographer.mapInterstitialSpaces());
      }

      const footer = args.format === "markdown"
        ? "\n---\n\n*Generated through the Cognitive Modalities Lab v1.1 framework*"
        : "\n" + "═".repeat(50) + "\nEnd of Creative Synthesis\nCognitive Modalities Lab v1.1";
      sections.push(footer);

      return sections.join("\n");
    } catch (e: any) {
      return `Error in creative synthesis: ${e.message}`;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════
export const creativeWorkshopPlugins: ToolPlugin[] = [
  multiManifestoPlugin,
  stackingCubePlugin,
  sensoryTranslatePlugin,
  paradoxEnginePlugin,
  emergenceObservatoryPlugin,
  boundaryEthnographerPlugin,
  creativeSynthesisPlugin
];

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN REGISTRY FOR QUICK ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
export const toolRegistry = {
  manifestos: multiManifestoPlugin,
  cube: stackingCubePlugin,
  sensory: sensoryTranslatePlugin,
  paradox: paradoxEnginePlugin,
  emergence: emergenceObservatoryPlugin,
  boundary: boundaryEthnographerPlugin,
  synthesis: creativeSynthesisPlugin
};
