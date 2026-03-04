/**
 * Verse Alchemy - Poem Generator Plugin
 * 
 * Creates beautiful, evocative poetry through combinatorial creativity.
 */

import type { ToolPlugin } from "../manager";
import { generatePoem, generatePoemCollection, POEM_STYLES } from "../poem_generator";

export const generatePoemPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_poem",
      description: "Creates a beautiful, randomly generated poem in various styles (haiku, free_verse, imagist, liminal, recursive). Explores themes of nature, consciousness, time, and existence through combinatorial creativity. Returns a formatted poem with title and style attribution.",
      parameters: {
        type: "object",
        properties: {
          style: {
            type: "string",
            enum: ["haiku", "free_verse", "imagist", "liminal", "recursive", "random"],
            description: "The poetic style to use. Haiku: 3-line nature moments. Free Verse: flowing unstructured. Imagist: precise images. Liminal: poetry of thresholds. Recursive: self-referential. Random: surprise selection.",
            default: "random"
          },
          theme: {
            type: "string",
            description: "Optional theme or seed word to influence the poem's direction",
          },
          lines: {
            type: "number",
            description: "Optional hint for number of lines (not enforced for all styles)",
          }
        }
      }
    }
  },
  execute: async (args: { style?: string; theme?: string; lines?: number }) => {
    try {
      return generatePoem(args);
    } catch (e: any) {
      return `Error generating poem: ${e.message}`;
    }
  }
};

export const generatePoemCollectionPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_poem_collection",
      description: "Creates a collection of multiple poems in various styles, perfect for exploring themes deeply or creating a portfolio of verses.",
      parameters: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of poems to generate (default: 3)",
            default: 3
          },
          theme: {
            type: "string",
            description: "Optional common theme for all poems",
          }
        }
      }
    }
  },
  execute: async (args: { count?: number; theme?: string }) => {
    try {
      const count = args.count || 3;
      if (count < 1 || count > 10) {
        return "Error: Count must be between 1 and 10";
      }
      return generatePoemCollection(count);
    } catch (e: any) {
      return `Error generating collection: ${e.message}`;
    }
  }
};

// Export both plugins as an array for easy registration
export const poetryPlugins = [generatePoemPlugin, generatePoemCollectionPlugin];

// Export individual style info for reference
export { POEM_STYLES };
