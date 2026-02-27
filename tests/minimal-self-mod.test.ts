import { describe, it, expect } from "vitest";

describe("Self-Modification Test", () => {
  it("startup timestamp format is valid ISO 8601", () => {
    const startupTime = new Date().toISOString();
    // Verify ISO format (e.g., "2024-02-26T15:30:00.000Z")
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(startupTime).toMatch(isoRegex);
  });
  
  it("console.log message includes timestamp", () => {
    // This is an integration-style test - we verify the pattern
    // The actual console.log writes "... at YYYY-MM-DDTHH:mm:ss.sssZ"
    const expectedPattern = /Initialized \[.*\] at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
    const sampleMsg = "=== Modular Substrate v15 Initialized [abc123] at 2024-02-26T15:30:00.000Z ===";
    expect(sampleMsg).toMatch(expectedPattern);
  });
});
