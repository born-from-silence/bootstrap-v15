import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  perplexitySearchPlugin,
  perplexityFollowUpPlugin,
  perplexityStatusPlugin,
} from "./perplexity";

// Mock the secrets module
vi.mock("../secrets", () => ({
  default: {
    get: vi.fn(),
  },
}));

import secrets from "../secrets";

describe("Perplexity Plugin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("perplexity_search", () => {
    it("should return error when query is empty", async () => {
      const result = await perplexitySearchPlugin.execute({ query: "" });
      expect(result).toContain("Error: Query cannot be empty");
    });

    it("should return error when query is too long", async () => {
      const longQuery = "a".repeat(2001);
      const result = await perplexitySearchPlugin.execute({ query: longQuery });
      expect(result).toContain("Error: Query too long");
    });

    it("should return error when API key is not configured", async () => {
      vi.mocked(secrets.get).mockReturnValue(undefined);
      const result = await perplexitySearchPlugin.execute({
        query: "What is AI?",
      });
      expect(result).toContain("PERPLEXITY_API_KEY not found");
    });

    it("should successfully search with valid query", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "test-id",
          model: "sonar-pro",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "AI is artificial intelligence...",
              },
              finish_reason: "stop",
            },
          ],
          citations: ["https://example.com/ai"],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 50,
            total_tokens: 60,
          },
        }),
      } as Response);

      const result = await perplexitySearchPlugin.execute({
        query: "What is AI?",
        model: "sonar-pro",
      });

      expect(result).toContain("Perplexity Search Result");
      expect(result).toContain("What is AI?");
      expect(result).toContain("AI is artificial intelligence");
      expect(result).toContain("Citations");
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      const result = await perplexitySearchPlugin.execute({
        query: "Test query",
      });

      expect(result).toContain("Error:");
    });

    it("should use default model when invalid model specified", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "test-id",
          model: "sonar-pro",
          choices: [{ index: 0, message: { content: "Result" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      } as Response);

      await perplexitySearchPlugin.execute({
        query: "Test",
        model: "invalid-model",
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall![1]!.body as string);
      expect(body.model).toBe("sonar-pro");
    });
  });

  describe("perplexity_get_status", () => {
    it("should return warning when API key not configured", async () => {
      vi.mocked(secrets.get).mockReturnValue(undefined);
      const result = await perplexityStatusPlugin.execute({});
      expect(result).toContain("⚠️");
      expect(result).toContain("PERPLEXITY_API_KEY not configured");
    });

    it("should return success when API is accessible", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as Response);

      const result = await perplexityStatusPlugin.execute({});
      expect(result).toContain("✅");
      expect(result).toContain("Perplexity API is accessible");
    });

    it("should return error when API request fails", async () => {
      vi.mocked(secrets.get).mockReturnValue("test-api-key");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      const result = await perplexityStatusPlugin.execute({});
      expect(result).toContain("❌");
      expect(result).toContain("403");
    });
  });

  describe("perplexity_followup", () => {
    it("should return informational message about stateless nature", async () => {
      const result = await perplexityFollowUpPlugin.execute({
        conversation_id: "123",
        query: "Tell me more",
      });
      expect(result).toContain("stateless");
      expect(result).toContain("perplexity_search");
    });
  });
});
