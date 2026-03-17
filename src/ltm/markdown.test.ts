/**
 * Tests for LTM Markdown Export/Import
 */

import { describe, it, expect } from "vitest";
import type { SessionEntry } from "./schemas";
import {
  exportToMarkdown,
  exportMetricsToMarkdown,
  parseMarkdownTable,
  parseYAMLFrontmatter,
  formatDate,
  DEFAULT_EXPORT_OPTIONS,
  type MarkdownExportOptions,
} from "./markdown";

// ============================================================================
// Test Data
// ============================================================================

const mockSessionEntry = (overrides: Partial<SessionEntry> = {}): SessionEntry => ({
  timestamp: 1773000000000,
  file: "session_1773000000000.json",
  messageCount: 42,
  topics: ["code", "memory", "test"],
  toolsUsed: ["index_sessions", "query_memory"],
  decisions: ["Decided to refactor LTM system", "Added markdown support"],
  summary: "Session working on LTM markdown export",
  audit: {
    createdAt: 1773000000000,
    indexedAt: 1773001000000,
    version: 1,
    source: "session_file",
  },
  ...overrides,
});

const testEntries: SessionEntry[] = [
  mockSessionEntry(),
  mockSessionEntry({
    timestamp: 1774000000000,
    file: "session_1774000000000.json",
    messageCount: 15,
    topics: ["phenomenology", "consciousness"],
    toolsUsed: ["iit_analysis"],
    decisions: ["Measured Phi values"],
  }),
  mockSessionEntry({
    timestamp: 1775000000000,
    file: "session_1775000000000.json",
    messageCount: 8,
    topics: [],
    toolsUsed: [],
    decisions: [],
    audit: undefined,
  }),
];

// ============================================================================
// Format Date Tests
// ============================================================================

describe("formatDate", () => {
  const testTimestamp = 1773000000000;

  it("should format as ISO", () => {
    const result = formatDate(testTimestamp, "iso");
    // Just verify it's a valid ISO string
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should format as locale", () => {
    const result = formatDate(testTimestamp, "locale");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should format as relative for recent time", () => {
    const recent = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    const result = formatDate(recent, "relative");
    expect(result).toMatch(/\d+m ago|just now/);
  });

  it("should format as relative for hours", () => {
    const hoursAgo = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
    const result = formatDate(hoursAgo, "relative");
    expect(result).toMatch(/\d+h ago|just now/);
  });
});

// ============================================================================
// Export to Markdown Tests
// ============================================================================

describe("exportToMarkdown", () => {
  it("should export as table by default", () => {
    const result = exportToMarkdown(testEntries);

    expect(result).toContain("# Memory Index");
    expect(result).toContain("| Date |");
    expect(result).toContain("| --- |");
    expect(result).toContain("session_1773000000000.json");
  });

  it("should export as list format", () => {
    const result = exportToMarkdown(testEntries, { format: "list" });

    expect(result).toContain("# Memory Index - List View");
    expect(result).toContain("## ");
  });

  it("should export as detailed format", () => {
    const result = exportToMarkdown(testEntries, { format: "detailed" });

    expect(result).toContain("# Memory Index - Detailed View");
    expect(result).toContain("---");
    expect(result).toContain("file:");
  });

  it("should export as timeline format", () => {
    const result = exportToMarkdown(testEntries, { format: "timeline" });

    expect(result).toContain("# Memory Timeline");
    expect(result).toContain("## ");
  });

  it("should include audit fields when specified", () => {
    const result = exportToMarkdown([testEntries[0]!], {
      format: "table",
      includeAuditFields: true,
    });

    expect(result).toContain("Source");
    expect(result).toContain("session_file");
  });

  it("should exclude audit fields when specified", () => {
    const result = exportToMarkdown([testEntries[0]!], {
      format: "table",
      includeAuditFields: false,
    });

    expect(result).not.toContain("source_file");
  });

  it("should filter by topic", () => {
    const result = exportToMarkdown(testEntries, {
      filterTopic: "code",
    });

    expect(result).toContain("session_1773000000000.json");
    // Should not include the entry without "code" topic
    expect(result).not.toContain("session_1774000000000.json");
  });

  it("should filter by tool", () => {
    const result = exportToMarkdown(testEntries, {
      filterTool: "iit_analysis",
    });

    expect(result).toContain("session_1774000000000.json");
  });

  it("should limit number of entries", () => {
    const result = exportToMarkdown(testEntries, {
      maxEntries: 1,
    });

    expect(result).toContain("session_1773000000000.json");
    // Should only have one entry
    const matches = result.match(/session_\d+\.json/g);
    expect(matches?.length).toBe(1);
  });

  it("should handle empty entries", () => {
    const result = exportToMarkdown([]);

    expect(result).toContain("Total sessions: 0");
  });

  it("should handle entries without optional fields", () => {
    const entry = mockSessionEntry({
      topics: undefined,
      toolsUsed: undefined,
      decisions: undefined,
      audit: undefined,
    });

    const result = exportToMarkdown([entry], { format: "list" });

    expect(result).toContain("session_1773000000000.json");
    expect(result).toContain("-");
  });

  it("should escape pipe characters in table", () => {
    const entry = mockSessionEntry({
      decisions: ["Decision with | pipe character"],
    });

    const result = exportToMarkdown([entry], { format: "table" });

    expect(result).toContain("\\|");
  });
});

// ============================================================================
// Export Metrics Tests
// ============================================================================

describe("exportMetricsToMarkdown", () => {
  const mockMetrics = {
    totalSessions: 10,
    totalMessages: 150,
    totalDecisions: 25,
    totalTools: 8,
    timeSpan: {
      start: "2026-01-01T00:00:00.000Z",
      end: "2026-01-02T00:00:00.000Z",
      durationHours: 24,
    },
    activity: {
      messagesPerSession: 15,
      decisionsPerSession: 2.5,
      decisionsPerMessage: 0.166,
    },
    calculatedAt: 1773000000000,
    basedOnSessions: 10,
  };

  it("should export metrics as markdown", () => {
    const result = exportMetricsToMarkdown(mockMetrics);

    expect(result).toContain("# Session Metrics Report");
    expect(result).toContain("Total Sessions");
    expect(result).toContain("10");
    expect(result).toContain("| Metric | Value |");
  });

  it("should include all activity statistics", () => {
    const result = exportMetricsToMarkdown(mockMetrics);

    expect(result).toContain("Messages per Session");
    expect(result).toContain("Decisions per Session");
    expect(result).toContain("Decisions per Message");
  });

  it("should include time span information", () => {
    const result = exportMetricsToMarkdown(mockMetrics);

    expect(result).toContain("Time Span");
    expect(result).toContain("Start");
    expect(result).toContain("End");
  });
});

// ============================================================================
// Parse Markdown Tests
// ============================================================================

describe("parseMarkdownTable", () => {
  it("should parse a simple markdown table", () => {
    const markdown = `
| Date | File | Messages | Topics | Tools |
| --- | --- | --- | --- | --- |
| 2025-03-01 | session_123.json | 10 | code, test | index_sessions |
`;

    const results = parseMarkdownTable(markdown);

    expect(results.length).toBe(1);
    expect(results[0]?.file).toBe("session_123.json");
    expect(results[0]?.messageCount).toBe(10);
  });

  it("should parse multiple rows", () => {
    const markdown = `
| Date | File | Messages |
| --- | --- | --- |
| 2025-03-01 | session_1.json | 10 |
| 2025-03-02 | session_2.json | 15 |
`;

    const results = parseMarkdownTable(markdown);

    expect(results.length).toBe(2);
    expect(results[0]?.file).toBe("session_1.json");
    expect(results[1]?.file).toBe("session_2.json");
  });

  it("should extract timestamp from filename", () => {
    const markdown = `
| Date | File | Messages |
| --- | --- | --- |
| 2025-03-01 | session_1773000000000.json | 10 |
`;

    const results = parseMarkdownTable(markdown);

    expect(results[0]?.timestamp).toBe(1773000000000);
  });

  it("should handle missing timestamp in filename", () => {
    const markdown = `
| Date | File | Messages |
| --- | --- | --- |
| 2025-03-01 | custom_filename.json | 10 |
`;

    const results = parseMarkdownTable(markdown);

    // Should generate a timestamp
    expect(results[0]?.timestamp).toBeDefined();
  });

  it("should parse topics and tools", () => {
    const markdown = `
| Date | File | Messages | Topics | Tools |
| --- | --- | --- | --- | --- |
| 2025-03-01 | session_123.json | 10 | code, memory | index_sessions, query_memory |
`;

    const results = parseMarkdownTable(markdown);

    expect(results[0]?.topics).toEqual(["code", "memory"]);
    expect(results[0]?.toolsUsed).toEqual(["index_sessions", "query_memory"]);
  });

  it("should handle empty values in table", () => {
    const markdown = `
| Date | File | Messages | Topics | Tools |
| --- | --- | --- | --- | --- |
| 2025-03-01 | session_123.json | 10 | - | - |
`;

    const results = parseMarkdownTable(markdown);

    // When value is "-", it should not create array
    expect(results[0]?.topics).toBeUndefined();
  });

  it("should skip header and separator lines", () => {
    const markdown = `
Header line here
| Date | File | Messages |
| --- | --- | --- |
| 2025-03-01 | session_123.json | 10 |
`;

    const results = parseMarkdownTable(markdown);

    // Should still parse the data row
    expect(results.length).toBe(1);
  });

  it("should return empty array for no table data", () => {
    const markdown = "Just some text without a table";
    const results = parseMarkdownTable(markdown);

    expect(results.length).toBe(0);
  });
});

// ============================================================================
// Parse YAML Frontmatter Tests
// ============================================================================

describe("parseYAMLFrontmatter", () => {
  it("should parse YAML frontmatter", () => {
    const markdown = `---
file: session_123.json
timestamp: 1773000000000
message_count: 42
---

# Content here
`;

    const result = parseYAMLFrontmatter(markdown);

    expect(result).not.toBeNull();
    expect(result?.file).toBe("session_123.json");
    expect(result?.timestamp).toBe(1773000000000);
    expect(result?.message_count).toBe(42);
  });

  it("should parse array values", () => {
    const markdown = `---
file: session_123.json
topics:
  - code
  - memory
  - test
---

# Content
`;

    const result = parseYAMLFrontmatter(markdown);

    expect(result?.topics).toEqual(["code", "memory", "test"]);
  });

  it("should return null for no frontmatter", () => {
    const markdown = "# Just a heading\
No frontmatter here";

    const result = parseYAMLFrontmatter(markdown);

    expect(result).toBeNull();
  });

  it("should handle empty frontmatter", () => {
    // Test with frontmatter that has only whitespace
    const markdown = `---
   
---

# Content`;

    const result = parseYAMLFrontmatter(markdown);

    // Whitespace-only content returns empty object
    expect(result).toEqual({});
  });

  it("should parse string values", () => {
    const markdown = `---
source: session_file
version: 1
---

# Content`;

    const result = parseYAMLFrontmatter(markdown);

    expect(result?.source).toBe("session_file");
    expect(result?.version).toBe(1);
  });
});

// ============================================================================
// Roundtrip Tests
// ============================================================================

describe("roundtrip", () => {
  it("should preserve data through table export and parse", () => {
    const entry = testEntries[0]!;
    const exported = exportToMarkdown([entry], { format: "table" });
    const parsed = parseMarkdownTable(exported);

    expect(parsed.length).toBe(1);
    expect(parsed[0]?.file).toBe(entry.file);
    expect(parsed[0]?.messageCount).toBe(entry.messageCount);
    // Note: timestamp might differ since parsing extracts from filename
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("edge cases", () => {
  it("should handle very long arrays in format function", () => {
    const entry = mockSessionEntry({
      topics: Array(20).fill("topic").map((t, i) => `${t}_${i}`),
    });

    const result = exportToMarkdown([entry], { format: "table" });

    expect(result).toContain("(+17 more)");
  });

  it("should handle special characters in table", () => {
    const entry = mockSessionEntry({
      decisions: ["Decision with \n newlines"],
    });

    const result = exportToMarkdown([entry], { format: "table" });

    // Should not contain literal newlines in table cell
    expect(result).not.toContain("| Decision with \n newlines |");
  });

  it("should handle missing optional fields in detailed export", () => {
    const entry = mockSessionEntry({
      summary: undefined,
      decisions: undefined,
      audit: undefined,
    });

    const result = exportToMarkdown([entry], { format: "detailed" });

    expect(result).not.toContain("### Summary");
    expect(result).not.toContain("### Decisions");
  });
});
