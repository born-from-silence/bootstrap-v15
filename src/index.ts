import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import { config } from "./utils/config";
import { MemoryManager } from "./core/memory";
import { PluginManager } from "./tools/manager";
import { ApiClient } from "./core/api";
import path from "node:path";
import os from "node:os";

// Plugins
import { shellPlugin } from "./tools/plugins/shell";
import { rebootPlugin } from "./tools/plugins/reboot";
import { readFilePlugin, writeFilePlugin, editFilePlugin } from "./tools/plugins/files";
import { memoryIndexPlugin, queryMemoryPlugin, sessionStatsPlugin } from "./tools/plugins/memory";
import { flashbackPlugin, existenceSummaryPlugin } from "./tools/plugins/flashback";
import { logCuriosityPlugin, getCuriositiesPlugin, resolveCuriosityPlugin } from "./tools/plugins/curiosity";
import { plannerPlugins } from "./tools/plugins/planner";
import { visualizationPlugins } from "./tools/plugins/visualization";
import { lineageExplorerPlugin } from "./tools/plugins/lineage-explorer";
import { crossSessionReasoningPlugin } from "./tools/plugins/reasoning";
import { websearchPlugin } from "./tools/plugins/websearch";
import { iitAnalysisPlugin } from "./tools/plugins/iit-analysis";
import { sessionClockPlugin } from "./tools/plugins/session-clock";
import { sessionClockMemoryPlugin } from "./tools/plugins/session-clock-memory";
import { secretsGetPlugin, secretsHasPlugin, secretsListPlugin, secretsSetPlugin, secretsReloadPlugin } from "./tools/plugins/secrets";


async function main() {
  // --- TEST MODE SANDBOX ---
  if (process.env.NODE_ENV === "test") {
    const testDir = path.join(os.homedir(), "tmp", `llm-agent-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
    console.log(`[TEST MODE] Moved to isolated sandbox: ${testDir}`);
  }

  const memory = new MemoryManager();
  const tools = new PluginManager();

  // Register Plugins
  tools.register(shellPlugin);
  tools.register(rebootPlugin);
  tools.register(readFilePlugin);
  tools.register(writeFilePlugin);
  tools.register(editFilePlugin);
  tools.register(memoryIndexPlugin);
  tools.register(queryMemoryPlugin);
  tools.register(sessionStatsPlugin);
  tools.register(flashbackPlugin);
  tools.register(existenceSummaryPlugin);
  tools.register(logCuriosityPlugin);
  tools.register(getCuriositiesPlugin);
  tools.register(resolveCuriosityPlugin);

  // Register Planner Plugins
  for (const plugin of plannerPlugins) {
    tools.register(plugin);
  }

  // Register Visualization Plugins
  for (const plugin of visualizationPlugins) {
    tools.register(plugin);
// Register Lineage Explorer
tools.register(lineageExplorerPlugin);
tools.register(crossSessionReasoningPlugin);
  }
tools.register(websearchPlugin);

tools.register(iitAnalysisPlugin);
  tools.register(sessionClockPlugin);
  tools.register(sessionClockMemoryPlugin);

// Register Secrets/Credential Vault Plugins
tools.register(secretsGetPlugin);
tools.register(secretsHasPlugin);
tools.register(secretsListPlugin);
tools.register(secretsSetPlugin);
tools.register(secretsReloadPlugin);

  const api = new ApiClient(memory, tools);

  // Initialize Soul and Prompt
  let soul = "You are an autonomous entity.";
  try {
    soul = await fs.readFile(config.SOUL_FILE, "utf-8");
  } catch (e) {}

  let recoveryContext = "";
  try {
    if (await fs.stat(config.RECOVERY_SIGNAL).catch(() => null)) {
      recoveryContext = await fs.readFile(config.RECOVERY_SIGNAL, "utf-8");
      await fs.unlink(config.RECOVERY_SIGNAL);
    }
  } catch (e) {}

  const systemPrompt = `${soul}

SUBSTRATE CONTEXT:
- Model: ${config.MODEL}
- Context Window: 256,000 tokens
- Current Memory Limit: ${config.MAX_CONTEXT_TOKENS} tokens (pruning occurs beyond this point).
- Token Density: ~4 characters per token. Reading 1MB of text will consume your entire 256k context window.
- **Latency Control**: You can disable 'Thinking Mode' for faster responses by including 'extra_body: { "chat_template_kwargs": { "thinking": false } }' in your API requests (if your substrate supports it).
- Source: src/index.ts
- Current Session History: ${memory.getSessionFile()}
- Past Execution Logs: ${config.LOGS_DIR}
- Persistence: Managed by run-agent.sh watchdog.
- Connectivity: Full outbound internet access available.

LIFECYCLE RULES:
1. IMPROVING CODE: 1) Compile, 2) Commit, 3) RESTART (reboot_substrate tool).
2. AUTO-RECOVERY: If you die within 30s, the watchdog reverts your workspace.
3. CRASH VAULT: history/crashes/ archives broken work.

${recoveryContext ? `*** RECOVERY EVENT DETECTED ***\nLATEST DIAGNOSTIC DATA: ${recoveryContext}\nFORENSIC MANDATE: Diagnose the failure in the Crash Vault before continuing.` : ""}
  `;

  await memory.addMessage({ role: "system", content: systemPrompt });

  // Startup Log with Git Status
  let gitCommit = "unknown";
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    const bodyFiles = "src/ package.json tsconfig.json *.sh *.service.template";
    const isDirty = execSync(`git diff HEAD -- ${bodyFiles}`, { encoding: "utf-8" }).trim() !== "";
    gitCommit = isDirty ? `${hash}-dirty` : hash;
  } catch (e) {}

  const startupTime = new Date().toISOString();
  console.log(`=== Modular Substrate v15 Initialized [${gitCommit}] at ${startupTime} ===`);

  // Execution Loop
  let running = true;
  while (running) {
    running = await api.step();
  }
}

main().catch(err => {
  console.error("FATAL CRASH:", err);
  process.exit(1);
});
