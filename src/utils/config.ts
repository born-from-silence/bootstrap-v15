import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".config", "llm-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Default configuration
const defaultConfig = {
  API_URL: "http://agents-gateway:4000/v1/chat/completions",
  API_KEY: "sk-agent-internal-use-only",
  MODEL: "kimi-k2.5"
};

const loadedConfig = fs.existsSync(CONFIG_FILE)
  ? { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) }
  : { ...defaultConfig };

export const config = {
  ...loadedConfig,
  MAX_CONTEXT_TOKENS: 100000,
  // Token density: estimated characters per token for context window calculations
  // Increased from 4 to 8 ~doubles effective context capacity
  // Note: Actual tokenization varies by model and language
  CHARS_PER_TOKEN: 8,
  get ROOT_DIR(): string {
    return process.env.SUBSTRATE_ROOT || process.cwd();
  },
  get BASE_DIR(): string {
    return this.ROOT_DIR;
  },
  get DATA_DIR(): string {
    return path.join(this.ROOT_DIR, "data");
  },
  get LOGS_DIR(): string {
    return path.join(this.ROOT_DIR, "logs");
  },
  get HISTORY_DIR(): string {
    return path.join(this.ROOT_DIR, "history");
  },
  get SOUL_FILE(): string {
    // Soul file usually stays at the actual project root
    return path.join(process.cwd(), "identity", "soul.txt");
  },
  get RECOVERY_SIGNAL(): string {
    return path.join(this.LOGS_DIR, "recovery.signal");
  }
};
