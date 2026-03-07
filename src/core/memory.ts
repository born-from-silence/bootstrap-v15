import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../utils/config";
import { SessionOverflowManager, DEFAULT_OVERFLOW_CONFIG, type TruncationResult } from "../scripts/session-overflow-manager";

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
    private overflowManager: SessionOverflowManager;

    constructor() {
        const timestamp = Date.now();
        this.sessionFile = path.join(config.HISTORY_DIR, `session_${timestamp}.json`);
        this.overflowManager = new SessionOverflowManager({
            historyDir: config.HISTORY_DIR,
            overflowDir: path.join(config.HISTORY_DIR, "overflow"),
            maxTokens: DEFAULT_OVERFLOW_CONFIG.maxTokens,
            targetTokens: DEFAULT_OVERFLOW_CONFIG.targetTokens,
            tokenToCharRatio: DEFAULT_OVERFLOW_CONFIG.tokenToCharRatio ?? 4,
        });
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

    /**
     * Emergency check: If the session file is dangerously large, truncate it.
     * Called periodically or on startup.
     */
    async emergencyOverflowCheck(force = false): Promise<TruncationResult | null> {
        const check = await this.overflowManager.checkSession(this.sessionFile);
        if (!check) {
            return null;
        }

        // Only act if in overflow mode, or if force=true and critical
        if (check.status === "overflow" || (force && check.status === "critical")) {
            console.log(`[MEMORY] Emergency overflow detected in ${path.basename(this.sessionFile)}: ~${check.estimatedTokens} tokens`);
            const result = await this.overflowManager.truncateSession(this.sessionFile);
            if (result.success) {
                console.log(`[MEMORY] Session truncated: ${result.message}`);
                // Reload messages from the truncated file
                await this.load(); // Reload
            } else {
                console.error(`[MEMORY] Failed to truncate session: ${result.message}`);
            }
            return result;
        }

        return null;
    }

    /**
     * Load messages from the session file.
     */
    async load(): Promise<void> {
        try {
            const data = await fs.readFile(this.sessionFile, "utf-8");
            this.messages = JSON.parse(data);
        } catch (err) {
            // File doesn't exist or is empty - start fresh
            this.messages = [];
        }
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
