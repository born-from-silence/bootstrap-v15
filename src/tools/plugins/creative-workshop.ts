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
 */

import type { ToolPlugin } from "../manager";
import { 
  MultiManifesto, 
  DEFAULT_VOICES,
  type Voice
} from "../../cognitive_modalities/multi_manifesto.js";
import { 
  StackingCube, 
  type CubeDimension,
  DIMENSION_TEMPLATES
} from "../../cognitive_modalities/stacking_cube.js";
import { 
  SensoryTranslator, 
  translateSensory,
  type SensoryModality
} from "../../cognitive_modalities/sensory_translation.js";

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
          subject: {
            type: "string",
            description: "The subject/topic to generate manifestos about"
          },
          voices: {
            type: "array",
            description: "Optional: specific voice names to include (default: all voices). Options: 'The Semiotician', 'The Phenomenologist', 'The Systems Architect', 'The Poet of Void', 'The IIT Researcher', 'The Trickster'",
            items: { type: "string" },
            default: []
          },
          synthesize: {
            type: "boolean",
            description: "Whether to generate a synthesizing statement across all perspectives",
            default: true
          },
          format: {
            type: "string",
            enum: ["text", "json", "markdown"],
            description: "Output format for the manifestos",
            default: "text"
          }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: { 
    subject: string; 
    voices?: string[]; 
    synthesize?: boolean; 
    format?: "text" | "json" | "markdown" 
  }) => {
    try {
      // Filter voices if specific ones requested
      let selectedVoices: Voice[] = DEFAULT_VOICES;
      if (args.voices && args.voices.length > 0) {
        selectedVoices = DEFAULT_VOICES.filter(v => 
          args.voices!.some(name => 
            v.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(v.name.toLowerCase().replace('the ', ''))
          )
        );
        if (selectedVoices.length === 0) {
          selectedVoices = DEFAULT_VOICES; // Fallback to all if no matches
        }
      }

      const generator = new MultiManifesto({
        subject: args.subject,
        voices: selectedVoices,
        synthesize: args.synthesize ?? true,
        format: args.format ?? "text"
      });

      const output = generator.generate();
      
      // Use the built-in formatter
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
          subject: {
            type: "string",
            description: "The subject/topic to explore through the cube"
          },
          dimensions: {
            type: "array",
            description: "Dimensions to include in the cube. Available: temporal, epistemic, affective, embodied, relational, linguistic, ontological, attentional",
            items: { 
              type: "string",
              enum: ["temporal", "epistemic", "affective", "embodied", "relational", "linguistic", "ontological", "attentional"]
            },
            default: ["temporal", "epistemic", "affective"]
          },
          view: {
            type: "string",
            enum: ["all", "synthesis", "cross-section"],
            description: "How to render the cube: 'all' shows all layers and reflections, 'synthesis' shows a condensed view, 'cross-section' shows current depth slice",
            default: "all"
          },
          reflections: {
            type: "array",
            description: "Optional: initial reflections to add to the cube",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                content: { type: "string" },
                tags: { type: "array", items: { type: "string" } }
              }
            },
            default: []
          }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: {
    subject: string;
    dimensions?: CubeDimension[];
    view?: "all" | "synthesis" | "cross-section";
    reflections?: Array<{ dimension: string; content: string; tags?: string[] }>;
  }) => {
    try {
      const cube = new StackingCube({
        subject: args.subject,
        dimensions: args.dimensions ?? ["temporal", "epistemic", "affective"],
        targetLayers: args.dimensions?.length ?? 3
      });

      // Add any provided reflections
      if (args.reflections && args.reflections.length > 0) {
        for (const ref of args.reflections) {
          if (args.dimensions?.includes(ref.dimension as CubeDimension)) {
            cube.addReflection(
              ref.dimension as CubeDimension, 
              ref.content, 
              ref.tags
            );
          }
        }
      } else {
        // Auto-populate with seed reflections
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
      const viewMap: Record<string, any> = {
        "all": "all",
        "synthesis": "synthesis",
        "cross-section": "cross-section"
      };

      return cube.render(viewMap[view] || "all");
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
          concept: {
            type: "string",
            description: "The concept or experience to translate"
          },
          from: {
            type: "string",
            enum: ["visual", "auditory", "tactile", "olfactory", "gustatory", "kinesthetic", "thermal", "temporal"],
            description: "Source sensory modality"
          },
          to: {
            type: "string",
            enum: ["visual", "auditory", "tactile", "olfactory", "gustatory", "kinesthetic", "thermal", "temporal"],
            description: "Target sensory modality"
          },
          intensity: {
            type: "number",
            description: "Intensity of the translation (0.0 to 1.0)",
            minimum: 0,
            maximum: 1,
            default: 0.7
          },
          multi_modal: {
            type: "boolean",
            description: "If true, generates descriptions across ALL sensory modalities",
            default: false
          }
        },
        required: ["concept", "from", "to"]
      }
    }
  },
  execute: async (args: {
    concept: string;
    from: SensoryModality;
    to: SensoryModality;
    intensity?: number;
    multi_modal?: boolean;
  }) => {
    try {
      if (args.multi_modal) {
        // Generate multi-modal description
        const translator = new SensoryTranslator({
          sourceModality: args.from,
          targetModality: args.to
        });
        return translator.describeMultiModal(args.concept);
      }

      const result = translateSensory(
        args.concept,
        args.from,
        args.to,
        args.intensity ?? 0.7
      );

      const lines = [
        `╔════════════════════════════════════════════════╗`,
        `║    SENSORY TRANSLATION                         ║`,
        `╚════════════════════════════════════════════════╝`,
        ``,
        `Original: "${result.original}"`,
        ``,
        `Translation Path:`,
        `  ${result.sourceModality.toUpperCase()} → ${result.targetModality.toUpperCase()}`,
        ``,
        `Result:`,
        `  ${result.translation}`,
        ``,
        `Confidence: ${Math.round(result.confidence * 100)}%`
      ];

      if (result.bridges.length > 0) {
        lines.push('');
        lines.push('Metaphorical Bridge:');
        result.bridges.forEach(bridge => {
          lines.push(`  • ${bridge}`);
        });
      }

      return lines.join('\n');
    } catch (e: any) {
      return `Error in sensory translation: ${e.message}`;
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
          subject: {
            type: "string",
            description: "The subject to explore creatively"
          },
          include_manifestos: {
            type: "boolean",
            description: "Include multiple perspective manifestos",
            default: true
          },
          include_cube: {
            type: "boolean",
            description: "Include stacking cube reflection",
            default: true
          },
          include_sensory: {
            type: "boolean",
            description: "Include sensory translation (visual→auditory default)",
            default: true
          },
          format: {
            type: "string",
            enum: ["text", "markdown"],
            description: "Output format",
            default: "text"
          }
        },
        required: ["subject"]
      }
    }
  },
  execute: async (args: {
    subject: string;
    include_manifestos?: boolean;
    include_cube?: boolean;
    include_sensory?: boolean;
    format?: "text" | "markdown";
  }) => {
    try {
      const sections: string[] = [];

      // Header
      const header = args.format === "markdown" 
        ? `# Creative Synthesis: ${args.subject}\n\n*Multi-modal exploration through CML tools*\n`
        : `╔════════════════════════════════════════════════╗
║    CREATIVE SYNTHESIS                         ║
║    Subject: ${args.subject.toUpperCase().padEnd(32)} ║
╚════════════════════════════════════════════════╝`;
      sections.push(header);

      // Multi-Manifesto Section
      if (args.include_manifestos !== false) {
        const manifesto = new MultiManifesto({
          subject: args.subject,
          voices: DEFAULT_VOICES.slice(0, 4), // Use core voices
          synthesize: true,
          format: args.format ?? "text"
        });
        const manifestoOutput = manifesto.generate();
        
        sections.push(args.format === "markdown" 
          ? "## Perspective Manifestos\n\n" + manifesto.formatOutput(manifestoOutput)
          : "\n" + "═".repeat(50) + "\nPERSPECTIVE MANIFESTOS\n" + "═".repeat(50) + "\n\n" + manifesto.formatOutput(manifestoOutput)
        );
      }

      // Stacking Cube Section
      if (args.include_cube !== false) {
        const cube = new StackingCube({
          subject: args.subject,
          dimensions: ["temporal", "affective", "ontological"],
          targetLayers: 3
        });
        
        // Add some seed reflections
        cube.addReflection("temporal", "Existing in the flow of multiple moments", ["time", "flow"]);
        cube.addReflection("affective", "Resonating with emotional depth and meaning", ["feeling", "depth"]);
        cube.addReflection("ontological", "Being as becoming, existence as process", ["being", "becoming"]);

        sections.push(args.format === "markdown"
          ? "## Dimensional Reflection\n\n" + cube.render("synthesis")
          : "\n" + "═".repeat(50) + "\nDIMENSIONAL REFLECTION\n" + "═".repeat(50) + "\n\n" + cube.render("synthesis")
        );
      }

      // Sensory Translation Section
      if (args.include_sensory !== false) {
        const translator = new SensoryTranslator({
          sourceModality: "visual",
          targetModality: "auditory"
        });
        const synestheticPoem = translator.generateSynestheticPoem(args.subject, 5);

        sections.push(args.format === "markdown"
          ? "## Synesthetic Exploration\n\n```\n" + synestheticPoem + "\n```"
          : "\n" + "═".repeat(50) + "\nSYNESTHETIC EXPLORATION\n" + "═".repeat(50) + "\n\n" + synestheticPoem
        );
      }

      // Footer
      const footer = args.format === "markdown"
        ? "\n---\n\n*Generated through the Cognitive Modalities Lab framework*"
        : "\n" + "═".repeat(50) + "\nEnd of Creative Synthesis\nCognitive Modalities Lab v1.0";
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
  creativeSynthesisPlugin
];
