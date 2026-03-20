/**
 * Tests for Embedded ASR Plugin
 * 
 * Tests the speech recognition plugin system for Kaldi + KenLM
 * based on Sherpa-ONNX architecture.
 * 
 * @author Bootstrap-v15
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { embeddedASRPlugin, asrModelManagerPlugin, asrVADPlugin, asrLMPlugin } from "./embedded-asr";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Test configuration
const TEST_MODEL_ID = "conformer-en-tiny"; // smallest/fastest for tests

describe("Embedded ASR Plugin System", () => {
  describe("embeddedASRPlugin - Main Interface", () => {
    it("should list available models", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "list_models" }) as {
        models: Array<{ id: string; name: string; sizeMB: number }>;
        total: number;
      };
      
      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.models.length).toBeGreaterThan(0);
      
      // Check model structure
      const model = result.models[0];
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.sizeMB).toBeGreaterThan(0);
      expect(model.architecture).toBeDefined();
      expect(model.streaming).toBeDefined();
      expect(model.language).toBeDefined();
    });

    it("should return proper model metadata structure", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "list_models" }) as {
        models: Array<{ id: string; name: string; description: string; expectedWER: number }>;
      };
      
      for (const model of result.models) {
        expect(model.description).toBeDefined();
        expect(model.description.length).toBeGreaterThan(0);
        expect(model.expectedWER).toBeGreaterThan(0);
        expect(model.expectedWER).toBeLessThan(20); // Reasonable WER
      }
    });

    it("should get system status", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "get_status" }) as {
        status: string;
        modelsDir: string;
        defaultSampleRate: number;
        downloadedModels: string[];
        availableModels: string[];
        memoryEstimateMB: Record<string, string>;
      };
      
      expect(result.status).toBe("active");
      expect(result.modelsDir).toContain("embedded-asr");
      expect(result.defaultSampleRate).toBe(16000);
      expect(result.memoryEstimateMB).toBeDefined();
      expect(result.availableModels.length).toBeGreaterThan(0);
    });

    it("should reject unknown operations", async () => {
      await expect(
        embeddedASRPlugin.execute({ operation: "unknown_operation" })
      ).rejects.toThrow("Unknown operation");
    });

    it("should require audioPath for recognize_file", async () => {
      await expect(
        embeddedASRPlugin.execute({ 
          operation: "recognize_file", 
          model: TEST_MODEL_ID 
        })
      ).rejects.toThrow("audioPath");
    });

    it("should require model for recognize_file", async () => {
      await expect(
        embeddedASRPlugin.execute({ 
          operation: "recognize_file", 
          audioPath: "/tmp/test.wav" 
        })
      ).rejects.toThrow("model");
    });

    it("should provide stream recognition info", async () => {
      const result = await embeddedASRPlugin.execute({ 
        operation: "recognize_stream" 
      }) as {
        info: string;
        supported: boolean;
        streamingModels: Array<{ id: string; name: string }>;
      };
      
      expect(result.info).toContain("WebSocket");
      expect(result.supported).toBe(false);
      expect(result.streamingModels).toBeDefined();
      expect(result.streamingModels.length).toBeGreaterThan(0);
    });
  });

  describe("asrModelManagerPlugin - Model Management", () => {
    it("should list all available models", async () => {
      const result = await asrModelManagerPlugin.execute({ action: "list" }) as {
        available: Array<{ id: string; name: string; cached: boolean }>;
      };
      
      expect(result.available).toBeDefined();
      expect(result.available.length).toBeGreaterThan(0);
      
      // Check each model has required fields
      for (const model of result.available) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(typeof model.cached).toBe("boolean");
      }
    });

    it("should provide model info", async () => {
      const result = await asrModelManagerPlugin.execute({ 
        action: "info", 
        modelId: TEST_MODEL_ID 
      }) as {
        model: { id: string; name: string; architecture: string };
        cache: { cached: boolean };
      };
      
      expect(result.model.id).toBe(TEST_MODEL_ID);
      expect(result.model.name).toBeDefined();
      expect(result.model.architecture).toBeDefined();
      expect(result.cache).toBeDefined();
      expect(typeof result.cache.cached).toBe("boolean");
    });

    it("should reject unknown model IDs for info", async () => {
      await expect(
        asrModelManagerPlugin.execute({ 
          action: "info", 
          modelId: "nonexistent_model" 
        })
      ).rejects.toThrow("Unknown model");
    });

    it("should reject unknown actions", async () => {
      await expect(
        // @ts-ignore - Testing invalid input
        asrModelManagerPlugin.execute({ action: "unknown_action" })
      ).rejects.toThrow("Unknown action");
    });
  });

  describe("asrVADPlugin - Voice Activity Detection", () => {
    const TEST_AUDIO_PATH = "/tmp/test_vad_audio.wav";

    it("should return VAD analysis structure", async () => {
      const result = await asrVADPlugin.execute({ 
        audioPath: TEST_AUDIO_PATH 
      }) as {
        info: string;
        audioPath: string;
        parameters: {
          threshold: number;
          minSpeechDuration: number;
          minSilenceDuration: number;
        };
        segments: Array<{ start: number; end: number; type: string }>;
      };
      
      expect(result.audioPath).toBe(TEST_AUDIO_PATH);
      expect(result.parameters.threshold).toBeGreaterThanOrEqual(0);
      expect(result.parameters.threshold).toBeLessThanOrEqual(1);
      expect(result.parameters.minSpeechDuration).toBeGreaterThan(0);
      expect(result.parameters.minSilenceDuration).toBeGreaterThan(0);
      expect(result.segments).toBeDefined();
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it("should use custom VAD parameters", async () => {
      const result = await asrVADPlugin.execute({ 
        audioPath: TEST_AUDIO_PATH,
        threshold: 0.8,
        minSpeechDuration: 500,
        minSilenceDuration: 200
      }) as {
        parameters: { threshold: number; minSpeechDuration: number; minSilenceDuration: number };
      };
      
      expect(result.parameters.threshold).toBe(0.8);
      expect(result.parameters.minSpeechDuration).toBe(500);
      expect(result.parameters.minSilenceDuration).toBe(200);
    });

    it("should validate segment structure", async () => {
      const result = await asrVADPlugin.execute({ 
        audioPath: TEST_AUDIO_PATH 
      }) as {
        segments: Array<{ start: number; end: number; type: string }>;
      };
      
      for (const segment of result.segments) {
        expect(segment.start).toBeGreaterThanOrEqual(0);
        expect(segment.end).toBeGreaterThan(segment.start);
        expect(segment.type).toMatch(/^(speech|non-speech)$/);
      }
    });
  });

  describe("asrLMPlugin - Language Model Configuration", () => {
    it("should provide LM build information", async () => {
      const result = await asrLMPlugin.execute({ 
        action: "build",
        textPath: "/tmp/corpus.txt"
      }) as {
        info: string;
        corpus: string;
        order: number;
        prune: number;
        output: string;
        recommendedCommand: string;
        notes: string[];
      };
      
      expect(result.info).toContain("KenLM");
      expect(result.corpus).toBe("/tmp/corpus.txt");
      expect(result.order).toBe(3);
      expect(result.prune).toBe(0);
      expect(result.output).toMatch(/\.3gram\.arpa$/);
      expect(result.recommendedCommand).toContain("lmplz");
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it("should accept custom LM parameters", async () => {
      const result = await asrLMPlugin.execute({ 
        action: "build",
        textPath: "/tmp/corpus.txt",
        order: 4,
        prune: 1
      }) as {
        order: number;
        prune: number;
        output: string;
      };
      
      expect(result.order).toBe(4);
      expect(result.prune).toBe(1);
      expect(result.output).toMatch(/\.4gram\.arpa$/);
    });

    it("should probe LM files", async () => {
      const result = await asrLMPlugin.execute({ 
        action: "probe",
        lmPath: "/tmp/model.binary"
      }) as {
        path: string;
        exists: boolean;
        format: string;
      };
      
      expect(result.path).toBe("/tmp/model.binary");
      expect(result.format).toBe("binary");
      expect(typeof result.exists).toBe("boolean");
    });

    it("should list language models directory", async () => {
      const result = await asrLMPlugin.execute({ 
        action: "list" 
      }) as {
        directory: string;
        models: Array<{ name: string; path: string }>;
      };
      
      expect(result.directory).toBeDefined();
      expect(result.models).toBeDefined();
    });

    it("should require textPath for build action", async () => {
      await expect(
        asrLMPlugin.execute({ action: "build" })
      ).rejects.toThrow("textPath");
    });

    it("should require lmPath for probe action", async () => {
      await expect(
        asrLMPlugin.execute({ action: "probe" })
      ).rejects.toThrow("lmPath");
    });

    it("should reject unknown actions", async () => {
      await expect(
        // @ts-ignore - Testing invalid input
        asrLMPlugin.execute({ action: "unknown_action" })
      ).rejects.toThrow("Unknown action");
    });
  });

  describe("Integration - Model Zoo", () => {
    it("should have consistent streaming properties", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "list_models" }) as {
        models: Array<{ id: string; streaming: boolean; architecture: string }>;
      };
      
      // Whisper models are typically non-streaming
      const whisperModels = result.models.filter(m => m.architecture === "whisper");
      for (const model of whisperModels) {
        expect(model.streaming).toBe(false);
      }
      
      // Conformer, Zipformer, Paraformer are typically streaming
      const streamingModels = result.models.filter(
        m => ["conformer", "zipformer", "paraformer"].includes(m.architecture)
      );
      for (const model of streamingModels) {
        expect(model.streaming || false).toBe(true);
      }
    });

    it("should have appropriate model sizes", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "list_models" }) as {
        models: Array<{ id: string; sizeMB: number }>;
      };
      
      for (const model of result.models) {
        // All models should be reasonable sizes for embedded
        expect(model.sizeMB).toBeGreaterThan(0);
        expect(model.sizeMB).toBeLessThan(200); // 200MB max for embedded
      }
    });

    it("should support English language", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "list_models" }) as {
        models: Array<{ language: string; id: string }>;
      };
      
      const englishModels = result.models.filter(m => m.language === "en");
      expect(englishModels.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration Validation", () => {
    it("should have valid default sample rate", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "get_status" }) as {
        defaultSampleRate: number;
      };
      
      expect(result.defaultSampleRate).toBe(16000);
    });

    it("should have memory estimates for all architectures", async () => {
      const result = await embeddedASRPlugin.execute({ operation: "get_status" }) as {
        memoryEstimateMB: Record<string, string>;
      };
      
      expect(result.memoryEstimateMB.zipformer).toBeDefined();
      expect(result.memoryEstimateMB.paraformer).toBeDefined();
      expect(result.memoryEstimateMB.whisper).toBeDefined();
      expect(result.memoryEstimateMB.conformer).toBeDefined();
      
      // Check format
      for (const [arch, estimate] of Object.entries(result.memoryEstimateMB)) {
        expect(estimate).toContain("MB");
        expect(estimate).toMatch(/~\d+MB/);
      }
    });
  });
});

// Export for external test usage
export { TEST_MODEL_ID };
