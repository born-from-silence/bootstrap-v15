import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { generateSessionDocs, generateSessionDocsSchema } from "./session_doc_generator";
import type { GenerateSessionDocsInput } from "./session_doc_generator";

describe("Session Doc Generator", () => {
  let tempDir: string;
  let historyDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "session-doc-test-"));
    historyDir = path.join(tempDir, "history");
    await fs.mkdir(historyDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("generateSessionDocs", () => {
    it("should generate documentation successfully", async () => {
      // Create test session files
      const sessionData = [
        {
          role: "assistant",
          content: "# Test Session\n\nThis is a test session.",
        },
      ];
      
      await fs.writeFile(
        path.join(historyDir, "session_1234567890123.json"),
        JSON.stringify(sessionData)
      );
      
      // Change to temp dir and set up structure
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      await fs.mkdir("history", { recursive: true });
      await fs.writeFile(
        "history/session_1234567890123.json",
        JSON.stringify(sessionData)
      );
      
      try {
        const result = await generateSessionDocs({
          outputDir: "./docs",
          title: "Test Archive",
          description: "Test Description",
        });
        
        const parsed = JSON.parse(result);
        expect(parsed.success).toBe(true);
        expect(parsed.sessionCount).toBe(1);
        
        // Verify output
        const homePage = await fs.readFile("./docs/index.md", "utf-8");
        expect(homePage).toContain("Test Archive");
        expect(homePage).toContain("Total Sessions:** 1");
        
        // Verify config
        const config = await fs.readFile("./docs/.vitepress/config.ts", "utf-8");
        expect(config).toContain("Test Archive");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("should categorize sessions", async () => {
      const creativeSession = [
        {
          role: "assistant",
          content: "Creating something",
          tool_calls: [
            {
              function: { name: "generate_poem", arguments: "{}" },
            },
          ],
        },
      ];
      
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      await fs.mkdir("history", { recursive: true });
      await fs.writeFile(
        "history/session_1234567890001.json",
        JSON.stringify(creativeSession)
      );
      
      try {
        await generateSessionDocs({
          outputDir: "./docs",
        });
        
        // Check category page was created
        const categoryPage = await fs.readFile(
          "./docs/categories/creative.md",
          "utf-8"
        );
        expect(categoryPage).toContain("Category: creative");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("should handle empty history directory", async () => {
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      await fs.mkdir("history", { recursive: true });
      
      try {
        await generateSessionDocs({
          outputDir: "./docs",
        });
        
        const homePage = await fs.readFile("./docs/index.md", "utf-8");
        expect(homePage).toContain("Total Sessions:** 0");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
