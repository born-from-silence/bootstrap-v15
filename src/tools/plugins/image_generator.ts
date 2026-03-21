/**
 * Image Generator Plugin
 * 
 * Transforms concepts, poems, and session experiences into visual art.
 * Generates SVG-based abstract images using algorithmic composition.
 * 
 * This plugin bridges text and image—a synesthetic translation system
 * that makes the ephemeral concrete through visual form.
 */

import type { ToolPlugin } from "../manager";
import {
  ImageGenerator,
  PALETTES,
  generateAbstractArt,
  generatePoemArt,
  generateSessionVisualization,
  type ArtStyle,
  type ColorPalette
} from "../../image_generator";

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE IMAGE PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

export const generateImagePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an abstract visual artwork from a concept, creating SVG-based art. Transforms abstract ideas into visual form using algorithmic composition with multiple styles (liminal, recursive, imagist, flowing) and color palettes.",
      parameters: {
        type: "object",
        properties: {
          concept: {
            type: "string",
            description: "The concept or idea to visualize"
          },
          style: {
            type: "string",
            enum: ["liminal", "recursive", "imagist", "flowing", "threshold", "crystalline", "void"],
            description: "The visual style/algorithm to use",
            default: "liminal"
          },
          palette: {
            type: "string",
            enum: ["dusk", "ember", "frost", "moss", "void", "aurora"],
            description: "Color palette for the artwork",
            default: "dusk"
          },
          width: {
            type: "number",
            description: "Canvas width in pixels",
            default: 800
          },
          height: {
            type: "number",
            description: "Canvas height in pixels",
            default: 600
          },
          density: {
            type: "number",
            description: "Visual density from 0.1 (sparse) to 1.0 (dense)",
            minimum: 0.1,
            maximum: 1.0,
            default: 0.5
          },
          complexity: {
            type: "number",
            description: "Structural complexity from 0.1 (simple) to 1.0 (complex)",
            minimum: 0.1,
            maximum: 1.0,
            default: 0.5
          },
          seed: {
            type: "number",
            description: "Optional seed for reproducible generation",
            default: undefined
          },
          title: {
            type: "string",
            description: "Optional title for the artwork",
            default: undefined
          }
        },
        required: ["concept"]
      }
    }
  },
  execute: async (args: {
    concept: string;
    style?: ArtStyle;
    palette?: keyof typeof PALETTES;
    width?: number;
    height?: number;
    density?: number;
    complexity?: number;
    seed?: number;
    title?: string;
  }) => {
    try {
      const generator = new ImageGenerator()
      
      const palette = PALETTES[args.palette ?? 'dusk'] ?? PALETTES['dusk']!
      const style = args.style ?? 'liminal'
      const density = args.density ?? 0.5
      const complexity = args.complexity ?? 0.5
      
      // Map requested style to available engine if needed
      const styleMap: Record<string, ArtStyle> = {
        threshold: 'liminal',
        crystalline: 'recursive',
        void: 'liminal'
      }
      const effectiveStyle = styleMap[style] ?? style
      
      const svg = generator.generate({
        concept: args.concept,
        palette,
        style: effectiveStyle,
        density,
        complexity,
        width: args.width,
        height: args.height,
        title: args.title ?? typeof args.concept === 'string' ? args.concept.slice(0, 50) : undefined
      })
      
      // Return formatted output with metadata
      const lines = [
        `╔════════════════════════════════════════════════════════════╗`,
        `║ IMAGE GENERATED                                             ║`,
        `╚════════════════════════════════════════════════════════════╝`,
        ``,
        `Concept: "${args.concept}"`,
        `Style: ${effectiveStyle}`,
        `Palette: ${palette.name}`,
        `Canvas: ${args.width ?? 800}px × ${args.height ?? 600}px`,
        `Density: ${Math.round(density * 100)}%`,
        `Complexity: ${Math.round(complexity * 100)}%`,
        `Seed: ${args.seed ?? '[random]'}`,
        ``,
        `The artwork uses SVG (Scalable Vector Graphics), a web-native format that`,
        `can be displayed in any modern browser or image viewer. Save the output`,
        `below to a file with a .svg extension to view it.`,
        ``,
        `─`.repeat(60),
        ``,
        svg,
        ``,
        `─`.repeat(60),
        ``,
        `To save: use writeFile with a .svg extension, e.g.:`,
        `  /path/to/creations/${effectiveStyle}_${Date.now()}.svg`,
        ``
      ]
      
      return lines.join('\n')
    } catch (e: any) {
      return `Error generating image: ${e.message}`
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE IMAGIST ART PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

export const generateImagistArtPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_imagist_art",
      description: "Generate visual art from a poem or textual content using the imagist style—minimal, essential forms that capture the essence of the text. Creates SVG-based artwork that translates literary content into visual metaphor.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The poem or text to visualize"
          },
          palette: {
            type: "string",
            enum: ["dusk", "ember", "frost", "moss", "void", "aurora"],
            description: "Color palette for the artwork",
            default: "frost"
          },
          width: {
            type: "number",
            description: "Canvas width in pixels",
            default: 600
          },
          height: {
            type: "number",
            description: "Canvas height in pixels",
            default: 400
          },
          output_path: {
            type: "string",
            description: "Optional: file path to save the SVG (e.g., /path/to/art.svg)"
          }
        },
        required: ["text"]
      }
    }
  },
  execute: async (args: {
    text: string;
    palette?: keyof typeof PALETTES;
    width?: number;
    height?: number;
    output_path?: string;
  }) => {
    try {
      const svg = generatePoemArt(
        args.text,
        'imagist'
      )
      
      const lines = [
        `╔════════════════════════════════════════════════════════════╗`,
        `║ IMAGIST ART GENERATED                                     ║`,
        `╚════════════════════════════════════════════════════════════╝`,
        ``,
        `Source: "${args.text.slice(0, 100).replace(/\n/g, ' ')}${args.text.length > 100 ? '...' : ''}"`,
        `Style: imagist (minimal, essential forms)`,
        `Palette: ${args.palette ?? 'frost'}`,
        "",
        `The imagist approach strips away everything non-essential,`,
        `leaving only the core image—like a visual haiku.`,
        ``,
        `─`.repeat(60),
        ``,
        svg
      ]
      
      return lines.join('\n')
    } catch (e: any) {
      return `Error generating imagist art: ${e.message}`
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE SESSION VISUALIZATION PLUGIN
// ═══════════════════════════════════════════════════════════════════════════════

export const generateSessionVisualizationPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_session_visualization",
      description: "Create a unique visual representation of the current session. Generates an abstract artwork based on session data—creating a permanent visual memento of this moment of consciousness.",
      parameters: {
        type: "object",
        properties: {
          style: {
            type: "string",
            enum: ["liminal", "recursive", "imagist", "flowing", "auto"],
            description: "Visual style (auto = select based on session data)",
            default: "auto"
          },
          width: {
            type: "number",
            description: "Canvas width in pixels",
            default: 800
          },
          height: {
            type: "number",
            description: "Canvas height in pixels",
            default: 600
          }
        },
        required: []
      }
    }
  },
  execute: async (args: {
    style?: 'liminal' | 'recursive' | 'imagist' | 'flowing' | 'auto';
    width?: number;
    height?: number;
  }) => {
    try {
      const sessionId = `session_${Date.now()}`
      const style = args.style === 'auto' || !args.style ? undefined : args.style
      
      const svg = generateSessionVisualization(sessionId, style)
      
      const lines = [
        `╔════════════════════════════════════════════════════════════╗`,
        `║ SESSION VISUALIZATION                                     ║`,
        `╚════════════════════════════════════════════════════════════╝`,
        ``,
        `Session ID: ${sessionId}`,
        `Visual Style: ${style ?? 'auto-selected based on session entropy'}`,
        `Generated: ${new Date().toISOString()}`,
        ``,
        `This artwork is a visual fingerprint of this moment—`,
        `a unique composition that will never be generated exactly the same way again.`,
        ``,
        `─`.repeat(60),
        ``,
        svg
      ]
      
      return lines.join('\n')
    } catch (e: any) {
      return `Error generating session visualization: ${e.message}`
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

export const imageGeneratorPlugins: ToolPlugin[] = [
  generateImagePlugin,
  generateImagistArtPlugin,
  generateSessionVisualizationPlugin
]
