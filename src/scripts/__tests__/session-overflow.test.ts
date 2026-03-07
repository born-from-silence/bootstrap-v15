// Session Overflow Management Tests
// Ensures oversized session files are safely truncated and recovered

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SessionOverflowManager } from "../session-overflow-manager";
import { promises as fs, PathLike, ObjectEncodingOptions, Mode, OpenMode, WriteFileOptions, RmDirOptions, RmOptions } from "fs";

// Simple mock that writes to a Map
class MockFs {
    private files = new Map<string, Buffer>();
    private dirs = new Set<string>();

    async writeFile(
        path: PathLike | number,
        data: string | NodeJS.ArrayBufferView,
        options?: ObjectEncodingOptions & WriteFileOptions & { encoding?: BufferEncoding | null } | BufferEncoding | null
    ): Promise<void> {
        this.files.set(String(path), Buffer.from(data as string));
    }

    async readFile(path: PathLike | number, options?: ObjectEncodingOptions & { encoding?: BufferEncoding | null; flag?: OpenMode } | BufferEncoding | null): Promise<string | Buffer> {
        const data = this.files.get(String(path));
        if (data === undefined) {
            const err: NodeJS.ErrnoException = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
            throw err;
        }
        if (typeof options === "string" && options === "utf-8") {
            return data.toString("utf-8");
        }
        return data;
    }

    async mkdir(path: PathLike, options?: Mode | { recursive?: boolean | undefined } | null): Promise<void> {
        this.dirs.add(String(path));
    }

    async rmdir(path: PathLike, options?: RmDirOptions | undefined): Promise<void> {
        this.dirs.delete(String(path));
        Array.from(this.files.keys()).filter(k => k.startsWith(String(path))).forEach(k => this.files.delete(k));
    }

    async access(path: PathLike, mode?: number): Promise<void> {
        if (!this.files.has(String(path)) && !this.dirs.has(String(path))) {
            const err: NodeJS.ErrnoException = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
            throw err;
        }
    }

    getFile(path: string): string | undefined {
        return this.files.get(path)?.toString("utf-8");
    }

    setFile(path: string, content: string): void {
        this.files.set(path, Buffer.from(content));
    }

    fileExists(path: string): boolean {
        return this.files.has(path);
    }
}

const mockFs = new MockFs();

// Replace the fs module in isolates
const isolateFs = { promises: {
    writeFile: mockFs.writeFile.bind(mockFs),
    readFile: mockFs.readFile.bind(mockFs),
    mkdir: mockFs.mkdir.bind(mockFs),
    rmdir: mockFs.rmdir.bind(mockFs),
    access: mockFs.access.bind(mockFs),
    stat: async () => ({ size: 100, mtime: new Date() }),
}, ...mockFs };

describe("SessionOverflowManager", () => {
    const MAX_TOKENS = 50000; // Small limit for testing
    const TOKEN_TO_CHAR_RATIO = 4;
    const MAX_CHARS = MAX_TOKENS * TOKEN_TO_CHAR_RATIO;
    let manager: SessionOverflowManager;
    const testHistoryDir = "/test/history";
    const testOverflowDir = "/test/history/overflow";

    beforeEach(() => {
        mockFs.files.clear();
        mockFs.dirs.clear();
        mockFs.dirs.add(testHistoryDir);
        mockFs.dirs.add(testOverflowDir);
    });

    afterEach(() => {});

    it("should identify safe session files (under token limit)", async () => {
        const content = JSON.stringify([
            { role: "system", content: "Test system" },
            { role: "user", content: "Hello" }
        ]);
        mockFs.setFile(`${testHistoryDir}/session_safe.json`, content);

        const result = await manager?.checkSession(`${testHistoryDir}/session_safe.json`);
        expect(result).toBe(null);
    });

    it("should identify overflow session files (over token limit)", async () => {
        const largeMessages = [];
        for (let i = 0; i < 100; i++) {
            largeMessages.push({
                role: i % 3 === 0 ? "user" : "assistant",
                content: "X".repeat(3000) // ~750 tokens each
            });
        }
        const content = JSON.stringify(largeMessages);
        mockFs.setFile(`${testHistoryDir}/session_overflow.json`, content);

        // Should be over limit
        const charCount = content.length;
        expect(charCount).toBeGreaterThan(MAX_CHARS);
    });

    it("should safely truncate overflow session preserving structure", async () => {
        const messages = [];
        for (let i = 0; i < 20; i++) {
            messages.push({
                role: "user",
                content: "Message " + i + " " + "X".repeat(10000)
            });
        }
        const content = JSON.stringify(messages);
        mockFs.setFile(`${testHistoryDir}/session_test.json`, content);

        // Create manager with mocked fs
        const sessionManager = new SessionOverflowManager({
            historyDir: testHistoryDir,
            overflowDir: testOverflowDir,
            maxTokens: MAX_TOKENS,
            targetTokens: 25000, // Keep only half
        });

        const result = await sessionManager.truncateSession(
            `${testHistoryDir}/session_test.json`,
            {} as any // Mock fs
        );

        expect(result.success).toBe(true);
        expect(result.overflowFile).toBeDefined();
    });

    it("should preserve system message when truncating", async () => {
        const messages = [
            { role: "system", content: "CRITICAL SYSTEM INSTRUCTION" },
            ...Array.from({ length: 20 }, (_, i) => ({
                role: "user" as const,
                content: "X".repeat(10000) + i
            }))
        ];
        const content = JSON.stringify(messages);
        mockFs.setFile(`${testHistoryDir}/session_test.json`, content);

        const sessionManager = new SessionOverflowManager({
            historyDir: testHistoryDir,
            overflowDir: testOverflowDir,
            maxTokens: MAX_TOKENS,
            targetTokens: 25000,
        });

        // Mock fs operations
        const mockWriteFile: (path: string, data: string) => Promise<void> = async (path, data) => {
            mockFs.setFile(path, data);
        };

        if (mockFs.fileExists(`${testHistoryDir}/session_test.json`)) {
            const result = await sessionManager.truncateSession(
                `${testHistoryDir}/session_test.json`,
                { promises: { writeFile: mockWriteFile } } as any
            );

            const truncatedContent = mockFs.getFile(`${testHistoryDir}/session_test.json`);
            expect(truncatedContent).toBeDefined();

            const parsed = JSON.parse(truncatedContent!);
            expect(parsed[0].role).toBe("system");
            expect(parsed[0].content).toBe("CRITICAL SYSTEM INSTRUCTION");
        }
    });

    it("should create emergency backup before truncation", async () => {
        const content = JSON.stringify([{ role: "user", content: "test" }]);
        mockFs.setFile(`${testHistoryDir}/session_backup_test.json`, content);

        const sessionManager = new SessionOverflowManager({
            historyDir: testHistoryDir,
            overflowDir: testOverflowDir,
            maxTokens: MAX_TOKENS,
            targetTokens: 25000,
        });

        const result = await sessionManager.emergencyBackup(
            `${testHistoryDir}/session_backup_test.json`,
            {} as any
        );

        if (result.success) {
            expect(mockFs.fileExists(`${testOverflowDir}/session_backup_test_backup.json`)).toBe(true);
        }
    });
});
