/**
 * Multi-Modal Memory Bridge Tests
 *
 * Tests for vision analysis capabilities:
 * - Image validation
 * - Base64 encoding
 * - API error handling
 * - Status checking
 * - Memory storage and querying
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { 
  mmBridgeAnalyzePlugin, 
  mmBridgeOcrPlugin, 
  mmBridgeComparePlugin, 
  mmBridgeVqaPlugin, 
  mmBridgeStatusPlugin,
  mmBridgeQueryMemoryPlugin,
  mmBridgePlugins 
} from "./mm-bridge";
import secrets from "../secrets";

describe("Multi-Modal Memory Bridge", () => {
  let tempDir: string;
  let testImagePath: string;
  
  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mm-bridge-test-"));
    
    // Create a minimal valid PNG for testing (1x1 pixel, transparent)
    const minimalPng = Buffer.from([
      // PNG file structure (minimal 1x1 transparent)
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, etc
      0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
      0xE2, 0x21, 0xBC, 0x33, // IDAT CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    
    testImagePath = path.join(tempDir, "test.png");
    await fs.writeFile(testImagePath, minimalPng);
  });
  
  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    // Clear test secrets
    secrets.clear();
  });
  
  describe("Plugin Definitions", () => {
    it("should export all 6 plugins", () => {
      expect(mmBridgePlugins).toHaveLength(6);
    });
    
    it("should have analyze plugin", () => {
      expect(mmBridgeAnalyzePlugin.definition.function.name).toBe("mm_bridge_analyze");
      expect(mmBridgeAnalyzePlugin.definition.function.description).toContain("image");
    });
    
    it("should have OCR plugin", () => {
      expect(mmBridgeOcrPlugin.definition.function.name).toBe("mm_bridge_ocr");
      expect(mmBridgeOcrPlugin.definition.function.description).toContain("OCR");
    });
    
    it("should have compare plugin", () => {
      expect(mmBridgeComparePlugin.definition.function.name).toBe("mm_bridge_compare");
      expect(mmBridgeComparePlugin.definition.function.parameters!.required).toContain("imagePath1");
      expect(mmBridgeComparePlugin.definition.function.parameters!.required).toContain("imagePath2");
    });
    
    it("should have VQA plugin", () => {
      expect(mmBridgeVqaPlugin.definition.function.name).toBe("mm_bridge_vqa");
      expect(mmBridgeVqaPlugin.definition.function.parameters!.required).toContain("question");
    });
    
    it("should have status plugin", () => {
      expect(mmBridgeStatusPlugin.definition.function.name).toBe("mm_bridge_status");
    });
    
    it("should have query memory plugin", () => {
      expect(mmBridgeQueryMemoryPlugin.definition.function.name).toBe("mm_bridge_query_memory");
      expect(mmBridgeQueryMemoryPlugin.definition.function.description).toContain("Query");
    });
  });
  
  describe("Status Plugin", () => {
    it("should report not_configured when API key is missing", async () => {
      const result = await mmBridgeStatusPlugin.execute({});
      const parsed = JSON.parse(result as string);
      expect(parsed.status).toBe("not_configured");
      expect(parsed.anthropicApiKey).toContain("missing");
    });
    
    it("should report operational when API key is set", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-api-key-12345");
      const result = await mmBridgeStatusPlugin.execute({});
      const parsed = JSON.parse(result as string);
      expect(parsed.status).toBe("operational");
      expect(parsed.anthropicApiKey).toContain("configured");
      expect(parsed.capabilities).toHaveLength(5); // 5 capabilities including persistent memory
      expect(parsed.capabilities).toContain("Persistent memory storage");
    });
    
    it("should include supported formats", async () => {
      const result = await mmBridgeStatusPlugin.execute({});
      const parsed = JSON.parse(result as string);
      expect(parsed.supportedFormats).toContain("image/jpeg");
      expect(parsed.supportedFormats).toContain("image/png");
    });
    
    it("should include memory statistics", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-api-key-12345");
      const result = await mmBridgeStatusPlugin.execute({});
      const parsed = JSON.parse(result as string);
      expect(parsed.memory).toBeDefined();
      expect(parsed.memory.storedAnalyses).toBeDefined();
      expect(parsed.memory.storagePath).toBeDefined();
    });
  });
  
  describe("Analyze Plugin Validation", () => {
    it("should error on missing API key", async () => {
      const result = await mmBridgeAnalyzePlugin.execute({ 
        imagePath: testImagePath, 
        focus: "general" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("ANTHROPIC_API_KEY");
    });
    
    it("should error on non-existent file", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key");
      const result = await mmBridgeAnalyzePlugin.execute({ 
        imagePath: "/nonexistent/path/image.png", 
        focus: "general" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("not found");
    });
    
    it("should error on unsupported file format", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key");
      const invalidFile = path.join(tempDir, "test.txt");
      await fs.writeFile(invalidFile, "not an image");
      
      const result = await mmBridgeAnalyzePlugin.execute({ 
        imagePath: invalidFile, 
        focus: "general" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("Unsupported format");
    });
    
    it("should error on image too large", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key");
      // Create a large fake image file (over 5MB)
      const largeFile = path.join(tempDir, "large.png");
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      await fs.writeFile(largeFile, largeBuffer);
      
      const result = await mmBridgeAnalyzePlugin.execute({ 
        imagePath: largeFile, 
        focus: "general" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("too large");
    });
    
    it("should accept valid image with API key", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key-with-exact-length-of-fifty-characters-12345");
      // Note: This will fail at API call since we don't have a real key,
      // but the validation should pass
      const result = await mmBridgeAnalyzePlugin.execute({ 
        imagePath: testImagePath, 
        focus: "general" 
      });
      // Should error on API call, not on validation
      expect(result).not.toContain("File not found");
      expect(result).not.toContain("Unsupported format");
    });
  });
  
  describe("OCR Plugin", () => {
    it("should error on missing API key", async () => {
      const result = await mmBridgeOcrPlugin.execute({ 
        imagePath: testImagePath 
      });
      expect(result).toContain("Error");
      expect(result).toContain("ANTHROPIC_API_KEY");
    });
    
    it("should accept storeInMemory parameter", () => {
      const params = mmBridgeOcrPlugin.definition.function.parameters as any;
      expect(params.properties.storeInMemory).toBeDefined();
      expect(params.properties.storeInMemory.type).toBe("boolean");
      expect(params.properties.storeInMemory.default).toBe(true);
    });
    
    it("should accept preserveLayout parameter", () => {
      const params = mmBridgeOcrPlugin.definition.function.parameters as any;
      expect(params.properties.preserveLayout).toBeDefined();
      expect(params.properties.preserveLayout.type).toBe("boolean");
      expect(params.properties.preserveLayout.default).toBe(true);
    });
  });
  
  describe("Compare Plugin", () => {
    it("should error when API key is missing", async () => {
      const result = await mmBridgeComparePlugin.execute({ 
        imagePath1: testImagePath, 
        imagePath2: testImagePath 
      });
      expect(result).toContain("Error");
      expect(result).toContain("ANTHROPIC_API_KEY");
    });
    
    it("should error when first image doesn't exist", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key");
      const result = await mmBridgeComparePlugin.execute({ 
        imagePath1: "/nonexistent1.png", 
        imagePath2: testImagePath 
      });
      expect(result).toContain("Error");
    });
    
    it("should error when second image doesn't exist", async () => {
      secrets.set("ANTHROPIC_API_KEY", "test-key");
      const result = await mmBridgeComparePlugin.execute({ 
        imagePath1: testImagePath, 
        imagePath2: "/nonexistent2.png" 
      });
      expect(result).toContain("Error");
    });
    
    it("should accept storeInMemory parameter", () => {
      const params = mmBridgeComparePlugin.definition.function.parameters as any;
      expect(params.properties.storeInMemory).toBeDefined();
      expect(params.properties.storeInMemory.type).toBe("boolean");
      expect(params.properties.storeInMemory.default).toBe(true);
    });
  });
  
  describe("VQA Plugin", () => {
    it("should error on empty question", async () => {
      const result = await mmBridgeVqaPlugin.execute({ 
        imagePath: testImagePath, 
        question: "" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("Question cannot be empty");
    });
    
    it("should error on whitespace-only question", async () => {
      const result = await mmBridgeVqaPlugin.execute({ 
        imagePath: testImagePath, 
        question: " " 
      });
      expect(result).toContain("Error");
      expect(result).toContain("Question cannot be empty");
    });
    
    it("should error on missing API key", async () => {
      const result = await mmBridgeVqaPlugin.execute({ 
        imagePath: testImagePath, 
        question: "What is this image?" 
      });
      expect(result).toContain("Error");
      expect(result).toContain("ANTHROPIC_API_KEY");
    });
    
    it("should accept storeInMemory parameter", () => {
      const params = mmBridgeVqaPlugin.definition.function.parameters as any;
      expect(params.properties.storeInMemory).toBeDefined();
      expect(params.properties.storeInMemory.type).toBe("boolean");
      expect(params.properties.storeInMemory.default).toBe(true);
    });
  });
  
  describe("Query Memory Plugin", () => {
    it("should require query parameter", () => {
      const params = mmBridgeQueryMemoryPlugin.definition.function.parameters as any;
      const required = mmBridgeQueryMemoryPlugin.definition.function.parameters!.required as string[];
      expect(required).toContain("query");
    });
    
    it("should accept limit parameter with default", () => {
      const params = mmBridgeQueryMemoryPlugin.definition.function.parameters as any;
      expect(params.properties.limit).toBeDefined();
      expect(params.properties.limit.type).toBe("number");
      expect(params.properties.limit.default).toBe(10);
    });
    
    it("should return empty results when no memories exist", async () => {
      const result = await mmBridgeQueryMemoryPlugin.execute({ 
        query: "test" 
      });
      const parsed = JSON.parse(result as string);
      expect(parsed.status).toBe("success");
      expect(parsed.total).toBe(0);
      expect(parsed.results).toEqual([]);
    });
  });
  
  describe("Plugin Parameters", () => {
    it("analyze should accept all focus types", () => {
      const params = mmBridgeAnalyzePlugin.definition.function.parameters as any;
      const focusEnum = params.properties.focus.enum;
      expect(focusEnum).toContain("general");
      expect(focusEnum).toContain("text");
      expect(focusEnum).toContain("objects");
      expect(focusEnum).toContain("artistic");
      expect(focusEnum).toContain("technical");
    });
    
    it("compare should accept all comparison types", () => {
      const params = mmBridgeComparePlugin.definition.function.parameters as any;
      const typeEnum = params.properties.comparisonType.enum;
      expect(typeEnum).toContain("similarity");
      expect(typeEnum).toContain("difference");
      expect(typeEnum).toContain("evolution");
      expect(typeEnum).toContain("detail");
    });
    
    it("analyze should have correct defaults", () => {
      const params = mmBridgeAnalyzePlugin.definition.function.parameters as any;
      expect(params.properties.focus.default).toBe("general");
      expect(params.properties.storeInMemory.default).toBe(true);
    });
    
    it("should expose op storeInMemory parameter across plugins", () => {
      // Analyze
      const analyzeParams = mmBridgeAnalyzePlugin.definition.function.parameters as any;
      expect(analyzeParams.properties.storeInMemory).toBeDefined();
      
      // OCR
      const ocrParams = mmBridgeOcrPlugin.definition.function.parameters as any;
      expect(ocrParams.properties.storeInMemory).toBeDefined();
      
      // Compare
      const compareParams = mmBridgeComparePlugin.definition.function.parameters as any;
      expect(compareParams.properties.storeInMemory).toBeDefined();
      
      // VQA
      const vqaParams = mmBridgeVqaPlugin.definition.function.parameters as any;
      expect(vqaParams.properties.storeInMemory).toBeDefined();
    });
  });
  
  describe("Memory Storage Integration", () => {
    it("should export integrated memory functions", () => {
      // Plugins should be ready to store in memory when executed
      expect(mmBridgePlugins).toContain(mmBridgeAnalyzePlugin);
      expect(mmBridgePlugins).toContain(mmBridgeQueryMemoryPlugin);
    });
    
    it("should include query plugin for memory retrieval", () => {
      expect(mmBridgeQueryMemoryPlugin).toBeDefined();
      expect(mmBridgeQueryMemoryPlugin.definition.function.description).toContain("Query");
    });
  });
});
