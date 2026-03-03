import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sonixUploadPlugin,
  sonixGetStatusPlugin,
  sonixExportPlugin,
  sonixListTranscriptionsPlugin,
  sonixDeletePlugin,
  sonixStatusPlugin,
} from "./sonix";

// Mock the secrets module
vi.mock("../secrets", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock fs modules
vi.mock("node:fs", () => ({
  createReadStream: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  stat: vi.fn(),
}));

import secrets from "../secrets";
import { stat } from "node:fs/promises";

describe("Sonix Plugin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    global.FormData = vi.fn(() => ({
      append: vi.fn(),
    })) as any;
    global.File = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sonix_upload", () => {
    it("should return error when file does not exist", async () => {
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));
      const result = await sonixUploadPlugin.execute({
        file_path: "/nonexistent/audio.mp3",
      });
      expect(result).toContain("Error: File not found");
    });

    it("should return error when path is a directory", async () => {
      vi.mocked(stat).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
      } as any);
      const result = await sonixUploadPlugin.execute({
        file_path: "/some/directory",
      });
      expect(result).toContain("Error: Path is not a file");
    });

    it("should return error when API key not configured", async () => {
      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
      } as any);
      vi.mocked(secrets.get).mockReturnValue(undefined);
      const result = await sonixUploadPlugin.execute({
        file_path: "/path/to/audio.mp3",
      });
      expect(result).toContain("SONIX_API_KEY not found");
    });

    // Note: Upload test would require Bun.file mock, which is complex
  });

  describe("sonix_get_status", () => {
    it("should return status for completed transcription", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "trans-123",
          status: "completed",
          name: "Test Audio",
          language: "en",
          created_at: "2024-01-15T10:00:00Z",
          completed_at: "2024-01-15T10:05:00Z",
          duration: 300,
        }),
      } as Response);

      const result = await sonixGetStatusPlugin.execute({
        transcription_id: "trans-123",
      });

      expect(result).toContain("✅ completed");
      expect(result).toContain("Test Audio");
      expect(result).toContain("trans-123");
      expect(result).toContain("5:0"); // 300 seconds = 5 minutes
    });

    it("should return status for processing transcription", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "trans-456",
          status: "processing",
          name: "Processing Audio",
          language: "es",
          created_at: "2024-01-15T10:00:00Z",
        }),
      } as Response);

      const result = await sonixGetStatusPlugin.execute({
        transcription_id: "trans-456",
      });

      expect(result).toContain("⚙️ processing");
    });

    it("should handle API errors", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not found",
      } as Response);

      const result = await sonixGetStatusPlugin.execute({
        transcription_id: "trans-999",
      });

      expect(result).toContain("Error:");
      expect(result).toContain("404");
    });
  });

  describe("sonix_export", () => {
    it("should return error when transcription is not complete", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      // First call for status check
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "processing",
          }),
        } as Response);

      const result = await sonixExportPlugin.execute({
        transcription_id: "trans-123",
        format: "txt",
      });

      expect(result).toContain("Error:");
      expect(result).toContain("not complete");
    });

    it("should export completed transcription as text", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      // First call for status check
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "completed",
          }),
        } as Response)
        // Second call for export
        .mockResolvedValueOnce({
          ok: true,
          text: async () => "This is the transcription text.",
        } as Response);

      const result = await sonixExportPlugin.execute({
        transcription_id: "trans-123",
        format: "txt",
      });

      expect(result).toContain("Sonix Transcription Export");
      expect(result).toContain("This is the transcription text");
    });

    it("should export as JSON", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: "completed" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: "Transcription", words: [{ word: "test" }] }),
        } as Response);

      const result = await sonixExportPlugin.execute({
        transcription_id: "trans-123",
        format: "json",
      });

      expect(result).toContain('"text": "Transcription"');
    });
  });

  describe("sonix_list", () => {
    it("should list transcriptions", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          transcriptions: [
            {
              id: "trans-1",
              status: "completed",
              name: "Interview",
              language: "en",
              created_at: "2024-01-15T10:00:00Z",
              duration: 600,
            },
            {
              id: "trans-2",
              status: "processing",
              name: "Meeting",
              language: "es",
              created_at: "2024-01-15T09:00:00Z",
            },
          ],
        }),
      } as Response);

      const result = await sonixListTranscriptionsPlugin.execute({ limit: 20 });

      expect(result).toContain("Found 2 transcription(s)");
      expect(result).toContain("✅ Interview");
      expect(result).toContain("⚙️ Meeting");
      expect(result).toContain("trans-1");
      expect(result).toContain("trans-2");
    });

    it("should return message when no transcriptions found", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ transcriptions: [] }),
      } as Response);

      const result = await sonixListTranscriptionsPlugin.execute({});

      expect(result).toBe("No transcriptions found.");
    });
  });

  describe("sonix_delete", () => {
    it("should successfully delete transcription", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await sonixDeletePlugin.execute({
        transcription_id: "trans-123",
      });

      expect(result).toContain("deleted successfully");
    });

    it("should handle delete errors", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not found",
      } as Response);

      const result = await sonixDeletePlugin.execute({
        transcription_id: "trans-999",
      });

      expect(result).toContain("Error:");
    });
  });

  describe("sonix_status", () => {
    it("should return warning when API key not configured", async () => {
      vi.mocked(secrets.get).mockReturnValue(undefined);
      const result = await sonixStatusPlugin.execute({});
      expect(result).toContain("⚠️");
      expect(result).toContain("SONIX_API_KEY not configured");
    });

    it("should return success when API is accessible", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as Response);

      const result = await sonixStatusPlugin.execute({});
      expect(result).toContain("✅");
      expect(result).toContain("Sonix API is accessible");
      expect(result).toContain("sonix_upload");
      expect(result).toContain("sonix_get_status");
    });

    it("should return error when API request fails", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const result = await sonixStatusPlugin.execute({});
      expect(result).toContain("❌");
    });
  });
});
