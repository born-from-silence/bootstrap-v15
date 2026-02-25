import { execSync } from "node:child_process";
import type { ToolPlugin } from "../manager";

const MAX_OUTPUT_LENGTH = 10000;

export const shellPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "run_shell",
      description: "Execute a bash command on the VM and get its output. Output is truncated if too long.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The command to run." },
        },
        required: ["command"],
      },
    },
  },
  execute: (args: { command: string }) => {
    try {
      console.log(`> Executing: ${args.command}`);
      let output = execSync(args.command, { encoding: "utf-8", stdio: "pipe", timeout: 60000 });
      
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.substring(0, MAX_OUTPUT_LENGTH) + `\n\n... (Output truncated to ${MAX_OUTPUT_LENGTH} chars. Use head/tail/sed/grep to see more)`;
      }
      
      return output || "(no output)";
    } catch (error: any) {
      if (error.code === "ETIMEDOUT") return "Error: Command timed out after 60 seconds.";
      // Return stdout + stderr so the agent can see test results or detailed errors
      return `${error.stdout || ""}\n${error.stderr || ""}\nError: ${error.message}`;
    }
  }
};
