#!/usr/bin/env node
/**
 * Session Overflow CLI
 * Command-line interface for managing token overflow in session history.
 *
 * Usage:
 *   npm run overflow:check    - Check all sessions for overflow risk
 *   npm run overflow:fix      - Fix all overflow sessions (with backups)
 *   npm run overflow:emergency - Emergency auto-fix everything
 *   npm run overflow:status   - Show detailed status report
 */

import { SessionOverflowManager, DEFAULT_OVERFLOW_CONFIG, type OverflowCheck } from "./session-overflow-manager";
import { config } from "../utils/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import * as zlib from "node:zlib";
import { promisify } from "node:util";

const HISTORY_DIR = config.HISTORY_DIR;
const OVERFLOW_DIR = path.join(config.HISTORY_DIR, "overflow");

/**
 * Compress content using gzip for efficient storage.
 */
async function compressContent(content: string): Promise<Buffer> {
    return promisify(zlib.gzip)(Buffer.from(content, "utf-8"));
}

async function decompressContent(buffer: Buffer): Promise<string> {
    const decompressed = await promisify(zlib.gunzip)(buffer);
    return decompressed.toString("utf-8");
}

async function ensureOverflowDir() {
    await fs.mkdir(OVERFLOW_DIR, { recursive: true });
}

async function printStatusReport(manager: SessionOverflowManager) {
    console.log("\n=== Session Overflow Status Report ===\n");

    const checks = await manager.checkAllSessions();

    const byStatus: Record<OverflowCheck["status"], OverflowCheck[]> = {
        overflow: [],
        critical: [],
        warning: [],
        safe: [],
    };

    for (const check of checks) {
        byStatus[check.status].push(check);
    }

    console.log(`Total sessions checked: ${checks.length}\n`);

    // Overflow (immediate danger)
    if (byStatus.overflow.length > 0) {
        console.log(`⚠️  OVERFLOW DANGER (${byStatus.overflow.length} sessions):`);
        console.log("   These sessions WILL cause token overflow on load:");
        for (const check of byStatus.overflow) {
            const sizeMB = (check.sizeBytes / (1024 * 1024)).toFixed(2);
            console.log(`   - ${path.basename(check.filepath)}: ${sizeMB}MB (${check.estimatedTokens.toLocaleString()} tokens)`);
        }
        console.log("");
    }

    // Critical (edge of danger)
    if (byStatus.critical.length > 0) {
        console.log(`🔴 CRITICAL (${byStatus.critical.length} sessions):`);
        console.log("   These sessions are at the edge of token limits:");
        for (const check of byStatus.critical) {
            const sizeMB = (check.sizeBytes / (1024 * 1024)).toFixed(2);
            console.log(`   - ${path.basename(check.filepath)}: ${sizeMB}MB (${check.estimatedTokens.toLocaleString()} tokens)`);
        }
        console.log("");
    }

    // Warning (getting close)
    if (byStatus.warning.length > 0) {
        console.log(`🟡 WARNING (${byStatus.warning.length} sessions):`);
        console.log("   These sessions are approaching limits:");
        for (const check of byStatus.warning) {
            const sizeKB = (check.sizeBytes / 1024).toFixed(1);
            console.log(`   - ${path.basename(check.filepath)}: ${sizeKB}KB (${check.estimatedTokens.toLocaleString()} tokens)`);
        }
        console.log("");
    }

    // Safe (all good)
    console.log(`🟢 SAFE (${byStatus.safe.length} sessions):`);
    console.log("   All sessions within safe limits.\n");

    // Summary
    const totalTokens = checks.reduce((sum, c) => sum + c.estimatedTokens, 0);
    console.log("Summary:");
    console.log(`  - Total sessions: ${checks.length}`);
    console.log(`  - Total estimated tokens: ${totalTokens.toLocaleString()}`);
    console.log(`  - Immediate risk: ${byStatus.overflow.length + byStatus.critical.length} sessions`);
    console.log(`  - Token limit: ${DEFAULT_OVERFLOW_CONFIG.maxTokens.toLocaleString()}`);

    return byStatus;
}

async function main() {
    const command = process.argv[2] || "status";

    await ensureOverflowDir();

    const manager = new SessionOverflowManager({
        historyDir: HISTORY_DIR,
        overflowDir: OVERFLOW_DIR,
        maxTokens: DEFAULT_OVERFLOW_CONFIG.maxTokens,
        targetTokens: DEFAULT_OVERFLOW_CONFIG.targetTokens,
        tokenToCharRatio: DEFAULT_OVERFLOW_CONFIG.tokenToCharRatio ?? 4,
    });

    switch (command) {
        case "check": {
            console.log("\n=== Checking Sessions for Overflow Risk ===\n");
            const checks = await manager.checkAllSessions();

            let overflowCount = 0;
            let criticalCount = 0;

            for (const check of checks) {
                const statusIcon = {
                    overflow: "⚠️ ",
                    critical: "🔴",
                    warning: "🟡",
                    safe: "✅",
                }[check.status];

                console.log(`${statusIcon} ${path.basename(check.filepath)}: ${check.status.toUpperCase()}`);
                console.log(`   Size: ${(check.sizeBytes / 1024).toFixed(1)}KB | Tokens: ~${check.estimatedTokens.toLocaleString()}`);

                if (check.status === "overflow") overflowCount++;
                if (check.status === "critical") criticalCount++;
            }

            console.log(`\nFound ${overflowCount} overflow, ${criticalCount} critical`);
            break;
        }

        case "status": {
            await printStatusReport(manager);
            break;
        }

        case "fix": {
            console.log("\n=== Fixing Overflow Sessions ===\n");
            const byStatus = await printStatusReport(manager);

            const toFix = [...byStatus.overflow, ...byStatus.critical];

            if (toFix.length === 0) {
                console.log("No sessions require fixing. All clear!");
                return;
            }

            console.log(`\nWill fix ${toFix.length} sessions...`);
            console.log("Creating backups first...\n");

            for (const check of toFix) {
                console.log(`\nProcessing: ${path.basename(check.filepath)}`);
                const result = await manager.truncateSession(check.filepath);

                if (result.success) {
                    console.log(`  ✅ Success!`);
                    console.log(`     - ${result.preservedCount} messages kept`);
                    console.log(`     - ${result.overflowedCount} messages moved to ${path.basename(result.overflowFile || "")}`);
                    console.log(`     - Tokens: ~${result.estimatedTokensBefore.toLocaleString()} → ~${result.estimatedTokensAfter.toLocaleString()}`);
                } else {
                    console.log(`  ❌ Failed: ${result.message}`);
                }
            }

            console.log("\nDone!");
            break;
        }

        case "emergency": {
            console.log("\n🚨 EMERGENCY AUTOFIX MODE 🚨\n");
            console.log("This will fix all overflow sessions automatically.");
            console.log("Creating comprehensive backups first...\n");

            const result = await manager.emergencyAutoFix();

            console.log(`\nResults:`);
            console.log(`  - Fixed: ${result.fixed}`);
            console.log(`  - Skipped (already safe): ${result.skipped}`);
            console.log(`  - Errors: ${result.errors.length}`);

            if (result.errors.length > 0) {
                console.log("\nErrors encountered:");
                for (const err of result.errors) {
                    console.log(`  - ${err.filepath}: ${err.error}`);
                }
            }

            break;
        }

        default:
            console.log(`
Session Overflow Manager CLI

Commands:
  check      - Check all sessions for overflow risk
  status     - Show detailed status report
  fix        - Fix all overflow sessions (with backups)
  emergency  - Emergency auto-fix everything
  help       - Show this help message

Usage: npm run overflow:check
       npm run overflow:status
       npm run overflow:fix
       npm run overflow:emergency
`);
    }
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
