/**
 * Session Overflow Manager
 *
 * Handles token overflow scenarios in session history files.
 * Provides: safe detection, truncation, backup, and emergency recovery.
 *
 * Philosophy: Sessions are precious but context limits are absolute.
 * Strategy: Preserve the beginning (system prompts) and end (recent context).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export interface Message {
    role: "system" | "user" | "assistant" | "tool";
    content?: string | null;
    reasoning_content?: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
}

export interface TruncationResult {
    success: boolean;
    overflowFile: string | null;
    preservedCount: number;
    overflowedCount: number;
    estimatedTokensBefore: number;
    estimatedTokensAfter: number;
    message: string;
}

export interface EmergencyBackupResult {
    success: boolean;
    backupFile: string | null;
    message: string;
}

export interface OverflowCheck {
    filepath: string;
    sizeBytes: number;
    estimatedTokens: number;
    status: "safe" | "warning" | "critical" | "overflow";
    maxTokens: number;
    usableCharacters: number;
}

export interface SessionOverflowConfig {
    historyDir: string;
    overflowDir: string;
    maxTokens: number;      // Maximum safe token limit
    targetTokens: number;   // Target tokens after truncation (e.g., maxTokens * 0.5)
    tokenToCharRatio?: number; // ~4 chars per token for Claude
}

export class SessionOverflowManager {
    private config: Required<SessionOverflowConfig>;

    constructor(config: SessionOverflowConfig) {
        this.config = {
            ...config,
            tokenToCharRatio: config.tokenToCharRatio ?? 4,
        };
    }

    /**
     * Estimate tokens from character count using standard ratio.
     * Note: This is an approximation. Actual tokenization varies.
     */
    private estimateTokens(charCount: number): number {
        return Math.ceil(charCount / this.config.tokenToCharRatio);
    }

    /**
     * Calculate safe character limit based on token constraints.
     */
    private getSafeCharacterLimit(): number {
        return this.config.maxTokens * this.config.tokenToCharRatio;
    }

    /**
     * Check a session file for overflow risk.
     * Returns detailed status without modifying the file.
     */
    async checkSession(filepath: string): Promise<OverflowCheck | null> {
        try {
            const stats = await fs.stat(filepath);
            const sizeBytes = stats.size;
            // Assume ~1 byte per char for ASCII text (JSON is mostly ASCII)
            const estimatedTokens = this.estimateTokens(sizeBytes);

            let status: OverflowCheck["status"];
            const maxCharacters = this.getSafeCharacterLimit();

            if (sizeBytes > maxCharacters * 1.5) {
                status = "overflow"; // Will definitely crash on load
            } else if (sizeBytes > maxCharacters) {
                status = "critical"; // At the edge, dangerous
            } else if (sizeBytes > maxCharacters * 0.75) {
                status = "warning"; // Getting close to limit
            } else {
                status = "safe";
            }

            return {
                filepath,
                sizeBytes,
                estimatedTokens,
                status,
                maxTokens: this.config.maxTokens,
                usableCharacters: Math.max(0, maxCharacters - sizeBytes),
            };
        } catch (err: any) {
            if (err.code === "ENOENT") {
                // File doesn't exist
                return null;
            }
            throw err;
        }
    }

    /**
     * Check all session files in the history directory.
     * Returns sorted list by severity (overflow first).
     */
    async checkAllSessions(): Promise<OverflowCheck[]> {
        const results: OverflowCheck[] = [];

        try {
            const entries = await fs.readdir(this.config.historyDir, { withFileTypes: true });
            const sessionFiles = entries.filter(
                e => e.isFile() && e.name.startsWith("session_") && e.name.endsWith(".json")
            );

            for (const entry of sessionFiles) {
                const check = await this.checkSession(path.join(this.config.historyDir, entry.name));
                if (check) {
                    results.push(check);
                }
            }
        } catch (err: any) {
            if (err.code !== "ENOENT") {
                throw err;
            }
        }

        // Sort by status severity
        const statusPriority: Record<string, number> = {
            overflow: 0,
            critical: 1,
            warning: 2,
            safe: 3,
        };

        const validResults = results.filter((r): r is OverflowCheck => r !== null && r !== undefined);
        return validResults.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
    }

    /**
     * Create an emergency backup of a session file before any modification.
     * Essential for data safety - disasters happen.
     */
    async emergencyBackup(filepath: string, fileSystem = fs): Promise<EmergencyBackupResult> {
        const filename = path.basename(filepath, ".json");
        const timestamp = Date.now();
        const backupName = `${filename}_emergency_${timestamp}.json.gz`;
        const backupPath = path.join(this.config.overflowDir, backupName);

        try {
            // Ensure overflow directory exists
            await fileSystem.mkdir(this.config.overflowDir, { recursive: true });

            // Read and compress backup (simplified: store as-is for now, could gzip)
            const content = await fileSystem.readFile(filepath);
            await fileSystem.writeFile(backupPath, content);

            return {
                success: true,
                backupFile: backupPath,
                message: `Emergency backup created: ${backupPath}`,
            };
        } catch (err) {
            return {
                success: false,
                backupFile: null,
                message: `Backup failed: ${(err as Error).message}`,
            };
        }
    }

    /**
     * Truncate an oversize session file safely.
     * Strategy: Keep system message, drop middle messages, keep recent messages.
     */
    async truncateSession(filepath: string, fileSystem = fs): Promise<TruncationResult> {
        const startTime = Date.now();

        try {
            // Step 1: Verify file exists and is problematic
            const check = await this.checkSession(filepath);
            if (!check) {
                return {
                    success: false,
                    overflowFile: null,
                    preservedCount: 0,
                    overflowedCount: 0,
                    estimatedTokensBefore: 0,
                    estimatedTokensAfter: 0,
                    message: "Session file not found",
                };
            }

            if (check.status === "safe") {
                return {
                    success: true,
                    overflowFile: null,
                    preservedCount: 0,
                    overflowedCount: 0,
                    estimatedTokensBefore: check.estimatedTokens,
                    estimatedTokensAfter: check.estimatedTokens,
                    message: "Session is within safe limits, no truncation needed",
                };
            }

            // Step 2: Create backup
            const backup = await this.emergencyBackup(filepath, fileSystem);
            if (!backup.success) {
                return {
                    success: false,
                    overflowFile: null,
                    preservedCount: 0,
                    overflowedCount: 0,
                    estimatedTokensBefore: check.estimatedTokens,
                    estimatedTokensAfter: 0,
                    message: `Cannot proceed without backup: ${backup.message}`,
                };
            }

            // Step 3: Load and parse the session
            const content = await fileSystem.readFile(filepath, "utf-8");
            let messages: Message[];

            try {
                messages = JSON.parse(content);
                if (!Array.isArray(messages)) {
                    throw new Error("Session content is not an array");
                }
            } catch (parseErr) {
                // Corrupted JSON - try to salvage
                const salvaged = this.attemptSalvage(content);
                if (salvaged) {
                    messages = salvaged;
                } else {
                    return {
                        success: false,
                        overflowFile: null,
                        preservedCount: 0,
                        overflowedCount: 0,
                        estimatedTokensBefore: check.estimatedTokens,
                        estimatedTokensAfter: 0,
                        message: `Session file is corrupted and cannot be repaired: ${(parseErr as Error).message}`,
                    };
                }
            }

            // Step 4: Truncate
            const { preserved, overflowed, overflowMessages } = this.performTruncation(messages);

            // Step 5: Save overflowed content
            const overflowFilename = `${path.basename(filepath, ".json")}_overflow_${Date.now()}.json`;
            const overflowPath = path.join(this.config.overflowDir, overflowFilename);
            await fileSystem.writeFile(overflowPath, JSON.stringify(overflowMessages, null, 2));

            // Step 6: Save truncated session
            await fileSystem.writeFile(filepath, JSON.stringify(preserved, null, 2));

            const duration = Date.now() - startTime;
            const estimatedTokensAfter = this.estimateTokens(JSON.stringify(preserved).length);

            return {
                success: true,
                overflowFile: overflowPath,
                preservedCount: preserved.length,
                overflowedCount: overflowed.length,
                estimatedTokensBefore: check.estimatedTokens,
                estimatedTokensAfter,
                message: `Session truncated in ${duration}ms. ${preserved.length} messages kept, ${overflowed.length} messages moved to overflow file.`,
            };

        } catch (err) {
            return {
                success: false,
                overflowFile: null,
                preservedCount: 0,
                overflowedCount: 0,
                estimatedTokensBefore: 0,
                estimatedTokensAfter: 0,
                message: `Truncation failed: ${(err as Error).message}`,
            };
        }
    }

    /**
     * Inner truncation logic.
     * Preserves: system messages, then most recent messages up to target.
     * Overflow: middle messages (oldest non-system).
     */
    private performTruncation(messages: Message[]): {
        preserved: Message[];
        overflowed: Message[];
        overflowMessages: Message[];
    } {
        const systemMessages = messages.filter(m => m.role === "system");
        const nonSystemMessages = messages.filter(m => m.role !== "system");

        // Target: system + recent non-system messages
        const targetCharCount = this.config.targetTokens * this.config.tokenToCharRatio;
        let currentChars = JSON.stringify(systemMessages).length;
        const preserved: Message[] = [...systemMessages];
        const overflowed: Message[] = [];

        // Start from most recent (end of array) and work backwards
        let lastIndex = nonSystemMessages.length - 1;
        const overflowMessages: Message[] = [];

        while (lastIndex >= 0) {
            const msg = nonSystemMessages[lastIndex]!;
            const msgChars = JSON.stringify(msg).length;

            if (currentChars + msgChars < targetCharCount) {
                // Add to preserved (will be retstorted later)
                overflowMessages.unshift(msg);
                currentChars += msgChars;
                lastIndex--;
            } else {
                // Hit the limit - remaining go to preserved (recent)
                break;
            }
        }

        // The remaining messages (from 0 to lastIndex) are overflowed
        // Except we want to preserve from lastIndex+1 to end
        for (let i = 0; i <= lastIndex; i++) {
            overflowed.push(nonSystemMessages[i]!);
        }

        // Combine system + preserved recent
        const finalPreserved = [...systemMessages, ...overflowMessages];

        // Create overflow record with metadata
        const overflowRecord = [
            {
                role: "system" as const,
                content: `OVERFLOW RECORD: Truncated at ${new Date().toISOString()}. Original message count: ${messages.length}.`,
            },
            ...overflowed,
        ];

        return {
            preserved: finalPreserved,
            overflowed,
            overflowMessages: overflowRecord,
        };
    }

    /**
     * Attempt to salvage corrupted JSON.
     * Tries to extract valid message objects from broken content.
     */
    private attemptSalvage(content: string): Message[] | null {
        // Strategy: Look for complete message objects with regex
        const messagePattern = /\{\s*"role"\s*:\s*"(system|user|assistant|tool)"[^}]+\}/g;
        const matches = content.match(messagePattern);

        if (matches && matches.length > 0) {
            const salvaged: Message[] = [];
            for (const match of matches) {
                try {
                    const parsed = JSON.parse(match);
                    if (parsed.role && (parsed.content !== undefined || parsed.tool_calls)) {
                        salvaged.push(parsed);
                    }
                } catch {
                    // Skip invalid matches
                }
            }
            return salvaged.length > 0 ? salvaged : null;
        }

        return null;
    }

    /**
     * Emergency auto-fix: Scan and fix all overflow sessions.
     * Use with caution - creates backups first.
     */
    async emergencyAutoFix(fileSystem = fs): Promise<{
        fixed: number;
        skipped: number;
        errors: { filepath: string; error: string }[];
        results: TruncationResult[];
    }> {
        const checkResults = await this.checkAllSessions();
        const overflowSessions = checkResults.filter(
            c => c.status === "overflow" || c.status === "critical"
        );

        const results: TruncationResult[] = [];
        const errors: { filepath: string; error: string }[] = [];
        let fixed = 0;
        let skipped = 0;

        for (const check of overflowSessions) {
            const result = await this.truncateSession(check.filepath, fileSystem);
            results.push(result);

            if (result.success) {
                fixed++;
            } else {
                errors.push({ filepath: check.filepath, error: result.message });
            }
        }

        skipped = checkResults.length - overflowSessions.length;

        return { fixed, skipped, errors, results };
    }
}

/**
 * Default configuration for production use.
 */
export const DEFAULT_OVERFLOW_CONFIG: Pick<SessionOverflowConfig, "maxTokens" | "targetTokens" | "tokenToCharRatio"> = {
    maxTokens: 64000,      // Conservative: 64k tokens (256k window capacity)
    targetTokens: 32000,   // Target: 32k tokens after truncation
    tokenToCharRatio: 4,
};
