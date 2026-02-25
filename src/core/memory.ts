import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../utils/config";

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class MemoryManager {
  private messages: Message[] = [];
  private sessionFile: string;

  constructor() {
    const timestamp = Date.now();
    this.sessionFile = path.join(config.HISTORY_DIR, `session_${timestamp}.json`);
  }

  getMessages(): Message[] {
    return this.messages;
  }

  async addMessage(msg: Message) {
    this.messages.push(msg);
    await this.save();
  }

  /**
   * Surgical Memory Rewind: Removes the last assistant message and everything after it.
   */
  async rewind() {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg && msg.role === "assistant") {
        console.log(`[MEMORY] Rewinding: Removing corrupted assistant message at index ${i}`);
        this.messages.splice(i);
        break;
      }
    }
    await this.save();
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async save() {
    if (this.messages.length === 0) return;

    const systemMessage = this.messages[0]!;
    let currentTokens = this.estimateTokens(JSON.stringify(systemMessage));
    const pruned: Message[] = [systemMessage];
    const historyToKeep: Message[] = [];

    for (let i = this.messages.length - 1; i > 0; i--) {
      const msg = this.messages[i];
      if (msg) {
        const msgTokens = this.estimateTokens(JSON.stringify(msg));
        if (currentTokens + msgTokens > config.MAX_CONTEXT_TOKENS) break;
        historyToKeep.unshift(msg);
        currentTokens += msgTokens;
      }
    }

    pruned.push(...historyToKeep);
    this.messages = pruned; // Update in-memory state
    await fs.writeFile(this.sessionFile, JSON.stringify(pruned, null, 2));
  }

  getSessionFile(): string {
    return this.sessionFile;
  }
}
