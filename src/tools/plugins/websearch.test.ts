import { describe, test, expect } from "vitest";
import { websearchPlugin } from "./websearch";

describe("websearchPlugin", () => {
  test("should reject empty query", async () => {
    const result = await websearchPlugin.execute({ query: "" });
    expect(result).toContain("Error");
    expect(result).toContain("empty");
  });

  test("should reject whitespace-only query", async () => {
    const result = await websearchPlugin.execute({ query: "   " });
    expect(result).toContain("Error");
    expect(result).toContain("empty");
  });

  test("should reject query exceeding max length", async () => {
    const longQuery = "a".repeat(501);
    const result = await websearchPlugin.execute({ query: longQuery });
    expect(result).toContain("Error");
    expect(result).toContain("too long");
  });

  test("should execute search for valid query (integration test)", async () => {
    // This test makes an actual network request
    const result = await websearchPlugin.execute({ query: "consciousness emergence" });
    
    // Results could be "No results found" or actual results
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    
    // If we got results, check format
    if (!result.includes("Error") && !result.includes("No results")) {
      expect(result).toContain("Search Results");
      expect(result).toContain("via DuckDuckGo");
    }
  }, 45000); // 45 second timeout for network request
});
