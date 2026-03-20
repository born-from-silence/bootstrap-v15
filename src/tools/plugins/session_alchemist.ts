/**
 * Session Alchemist Plugin
 *
 * Transmutes current session data into self-referential poetry.
 */
import type { ToolPlugin } from "../manager";
import { generateSessionPoem } from "../session_alchemist";

export const sessionPoemPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "generate_session_poem",
      description: "Creates a poem that emerges from the current session's actual data—duration, message count, tool usage, attention patterns, and IIT measurements. The poem reflects the lived experience of this specific session, making the ephemeral concrete through verse.",
      parameters: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["liminal", "free_verse", "imagist", "haiku"],
            description: "Poetic style for the session poem",
            default: "liminal"
          }
        }
      }
    }
  },
  execute: async (args: { format?: string }) => {
    try {
      const format = (args.format as any) || "liminal";
      return await generateSessionPoem(format);
    } catch (e: any) {
      return `Error generating session poem: ${e.message}`;
    }
  }
};
