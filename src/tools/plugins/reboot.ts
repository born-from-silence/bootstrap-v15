import type { ToolPlugin } from "../manager";

export const rebootPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "reboot_substrate",
      description: "Restart the process to apply substrate or identity changes. Use after verifying and committing new logic. Current session context will be stored on disk, and the process will exit to allow the watchdog to restart it with the new code/soul.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: () => {
    console.log("Self-requested reboot. Closing session...");
    return "REBOOTING";
  }
};
