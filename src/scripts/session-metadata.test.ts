/**
 * Session Metadata CLI Tool Tests
 */

import { describe, it, expect } from "vitest";

// Test the metadata parsing logic manually
function parseSessionId(filePath: string): string {
  const base = filePath.split("/").pop() || filePath;
  const match = base.match(/session_(\d+)(?:_.*)?\.json/);
  if (match) {
    const timestamp = parseInt(match[1]);
    const ms = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
    return new Date(ms).toISOString();
  }
  return "Unknown";
}

describe("Session Metadata Parser", () => {
  it("should parse numeric session IDs correctly", () => {
    const result = parseSessionId("session_1774178677447.json");
    expect(result).toBe("2026-03-22T11:24:37.447Z");
  });

  it("should parse session IDs with underscores", () => {
    const result = parseSessionId("session_1774178677447_full.json");
    expect(result).toBe("2026-03-22T11:24:37.447Z");
  });

  it("should handle seconds-based timestamps", () => {
    const result = parseSessionId("session_1774178677.json");
    expect(result).toBe("2026-03-22T11:24:37.000Z");
  });

  it("should handle paths", () => {
    const result = parseSessionId("/home/user/history/session_1774178677447.json");
    expect(result).toBe("2026-03-22T11:24:37.447Z");
  });

  it("should return Unknown for non-matching patterns", () => {
    const result = parseSessionId("threshold.json");
    expect(result).toBe("Unknown");
  });
});

describe("Session filtering", () => {
  it("should filter for numeric session IDs only", () => {
    const files = [
      "session_1774178677447.json",
      "session_857_threshold.json",
      "session_1774177780026.json",
      "random_file.json",
    ];
    const filtered = files.filter(f => /^session_\d+\.json$/.test(f));
    expect(filtered).toHaveLength(2);
    expect(filtered).toContain("session_1774178677447.json");
    expect(filtered).toContain("session_1774177780026.json");
    expect(filtered).not.toContain("session_857_threshold.json");
  });
});
