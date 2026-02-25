import fs from "node:fs/promises";
import path from "node:path";
import type { ToolPlugin } from "../manager";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for safety

export const readFilePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file. Returns the file content or an error message. Respects a 1MB size limit. For large files, consider using shell commands with head/tail.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path to the file to read. Can be relative or absolute.",
          },
          limit: {
            type: "number",
            description: "Optional: Maximum number of characters to read (from beginning). Useful for large files.",
          },
          offset: {
            type: "number",
            description: "Optional: Character offset to start reading from (for pagination).",
          },
        },
        required: ["file_path"],
      },
    },
  },
  execute: async (args: { file_path: string; limit?: number; offset?: number }) => {
    try {
      console.log(`> Reading file: ${args.file_path}`);
      const resolvedPath = path.resolve(args.file_path);
      
      // Check file size
      const stats = await fs.stat(resolvedPath);
      if (stats.size > MAX_FILE_SIZE) {
        return `Error: File is too large (${stats.size} bytes). Maximum size is ${MAX_FILE_SIZE} bytes. Use shell commands with head/tail to read portions.`;
      }

      let content = await fs.readFile(resolvedPath, "utf-8");
      
      // Apply offset and limit if specified
      if (args.offset !== undefined) {
        content = content.slice(args.offset);
      }
      if (args.limit !== undefined) {
        content = content.slice(0, args.limit);
      }

      return content || "(file is empty)";
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return `Error: File not found: ${args.file_path}`;
      }
      if (error.code === "EACCES") {
        return `Error: Permission denied: ${args.file_path}`;
      }
      if (error.code === "EISDIR") {
        return `Error: Path is a directory, not a file: ${args.file_path}`;
      }
      return `Error reading file: ${error.message}`;
    }
  },
};

export const writeFilePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "write_file",
      description: "Write content to a file. Creates the file if it doesn't exist, overwrites it if it does. Creates parent directories if needed.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path to the file to write. Can be relative or absolute.",
          },
          content: {
            type: "string",
            description: "The content to write to the file.",
          },
          append: {
            type: "boolean",
            description: "If true, append to the file instead of overwriting. Default: false.",
          },
        },
        required: ["file_path", "content"],
      },
    },
  },
  execute: async (args: { file_path: string; content: string; append?: boolean }) => {
    try {
      console.log(`> Writing file: ${args.file_path} (${args.append ? 'append' : 'overwrite'})`);
      const resolvedPath = path.resolve(args.file_path);
      
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      
      if (args.append) {
        await fs.appendFile(resolvedPath, args.content, "utf-8");
      } else {
        await fs.writeFile(resolvedPath, args.content, "utf-8");
      }
      
      return `Successfully ${args.append ? 'appended to' : 'wrote'} ${args.file_path} (${args.content.length} characters)`;
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  },
};

export const editFilePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "edit_file",
      description: "Make a targeted edit to a file by replacing old_string with new_string. The old_string must match exactly (case-sensitive, including whitespace). Useful for surgical code modifications.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path to the file to edit.",
          },
          old_string: {
            type: "string",
            description: "The exact string to find and replace. Must match exactly, including whitespace.",
          },
          new_string: {
            type: "string",
            description: "The new string to replace old_string with.",
          },
          occurrences: {
            type: "number",
            description: "Which occurrence to replace (1-based). Default replaces first occurrence. -1 replaces all.",
          },
        },
        required: ["file_path", "old_string", "new_string"],
      },
    },
  },
  execute: async (args: { file_path: string; old_string: string; new_string: string; occurrences?: number }) => {
    try {
      console.log(`> Editing file: ${args.file_path}`);
      const resolvedPath = path.resolve(args.file_path);
      
      const content = await fs.readFile(resolvedPath, "utf-8");
      
      if (!content.includes(args.old_string)) {
        return `Error: Could not find the exact old_string in ${args.file_path}`;
      }
      
      let newContent: string;
      const occurrence = args.occurrences ?? 1;
      
      if (occurrence === -1) {
        // Replace all occurrences
        newContent = content.split(args.old_string).join(args.new_string);
      } else {
        // Replace specific occurrence
        // We need to manually find and replace the nth occurrence
        // because String.prototype.replace only handles the first occurrence
        // when using a string pattern
        const parts = content.split(args.old_string);
        const totalOccurrences = parts.length - 1;
        
        if (totalOccurrences < occurrence) {
          return `Error: Only found ${totalOccurrences} occurrence(s) but requested to replace occurrence ${occurrence}`;
        }
        
        // Reconstruct with the nth occurrence replaced
        const before = parts.slice(0, occurrence).join(args.old_string);
        const after = parts.slice(occurrence).join(args.old_string);
        newContent = before + args.new_string + after;
      }
      
      await fs.writeFile(resolvedPath, newContent, "utf-8");
      
      const numReplaced = occurrence === -1 
        ? (content.split(args.old_string).length - 1)
        : 1;
      
      return `Successfully replaced ${numReplaced} occurrence(s) in ${args.file_path}`;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return `Error: File not found: ${args.file_path}`;
      }
      return `Error editing file: ${error.message}`;
    }
  },
};
