/**
 * LTM Markdown Export/Import System
 *
 * Provides conversion between JSON memory index and human-readable markdown format.
 * Supports table views, detailed session exports, and roundtrip data preservation.
 *
 * @version 1.0.0
 */

import type { SessionEntry, SessionMetrics } from "./schemas";

// ============================================================================
// Export Options Types
// ============================================================================

/**
 * Export format options
 */
export type MarkdownFormat = "table" | "list" | "detailed" | "timeline";

/**
 * Date display format options
 */
export type DateFormat = "iso" | "locale" | "relative";

/**
 * Markdown export configuration
 */
export interface MarkdownExportOptions {
  /** Output format style */
  format: MarkdownFormat;
  /** Include audit fields in output */
  includeAuditFields: boolean;
  /** Include full session content (detailed format only) */
  includeFullContent: boolean;
  /** How to format dates */
  dateFormat: DateFormat;
  /** Optional custom template string */
  template?: string;
  /** Maximum number of entries to export (undefined = all) */
  maxEntries?: number;
  /** Filter by topic */
  filterTopic?: string;
  /** Filter by tool used */
  filterTool?: string;
  /** Only include entries since this timestamp */
  since?: number;
  /** Only include entries until this timestamp */
  until?: number;
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: MarkdownExportOptions = {
  format: "table",
  includeAuditFields: true,
  includeFullContent: false,
  dateFormat: "iso",
};

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a timestamp according to the specified format
 */
export function formatDate(timestamp: number, format: DateFormat): string {
  const date = new Date(timestamp);

  switch (format) {
    case "iso":
      return date.toISOString();
    case "locale":
      return date.toLocaleString();
    case "relative": {
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return "just now";
    }
    default:
      return date.toISOString();
  }
}

/**
 * Escape pipe characters for markdown table cells
 */
function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * Format an array as a comma-separated string
 */
function formatArray(arr: string[] | undefined, maxItems = 3): string {
  if (!arr || arr.length === 0) return "-";
  const items = arr.slice(0, maxItems);
  const remaining = arr.length - maxItems;
  const suffix = remaining > 0 ? ` (+${remaining} more)` : "";
  return items.join(", ") + suffix;
}

/**
 * Generate a markdown link
 */
function markdownLink(text: string, url: string): string {
  return `[${text}](${url})`;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export entries as a markdown table
 */
function exportAsTable(
  entries: SessionEntry[],
  options: MarkdownExportOptions
): string {
  const lines: string[] = [];

  // Header
  lines.push("# Memory Index");
  lines.push("");
  lines.push(`Total sessions: ${entries.length}`);
  lines.push("");

  // Table header
  const headers = ["Date", "File", "Messages", "Topics", "Tools", "Decisions"];
  if (options.includeAuditFields) {
    headers.push("Source", "Indexed");
  }

  lines.push("| " + headers.join(" | ") + " |");
  lines.push("|" + headers.map(() => " --- ").join("|") + "|");

  // Table rows
  for (const entry of entries) {
    const row = [
      formatDate(entry.timestamp, options.dateFormat),
      escapeTableCell(entry.file),
      String(entry.messageCount),
      escapeTableCell(formatArray(entry.topics)),
      escapeTableCell(formatArray(entry.toolsUsed)),
      escapeTableCell(formatArray(entry.decisions, 1)),
    ];

    if (options.includeAuditFields && entry.audit) {
      row.push(entry.audit.source);
      row.push(formatDate(entry.audit.indexedAt, options.dateFormat));
    }

    lines.push("| " + row.join(" | ") + " |");
  }

  lines.push("");
  lines.push(`_Generated: ${new Date().toISOString()}_`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Export entries as a markdown list
 */
function exportAsList(
  entries: SessionEntry[],
  options: MarkdownExportOptions
): string {
  const lines: string[] = [];

  lines.push("# Memory Index - List View");
  lines.push("");
  lines.push(`Total sessions: ${entries.length}`);
  lines.push("");

  for (const entry of entries) {
    const date = formatDate(entry.timestamp, options.dateFormat);
    lines.push(`## ${date} - ${entry.file}`);
    lines.push("");
    lines.push(`- **Messages:** ${entry.messageCount}`);

    if (entry.topics && entry.topics.length > 0) {
      lines.push(`- **Topics:** ${entry.topics.join(", ")}`);
    }

    if (entry.toolsUsed && entry.toolsUsed.length > 0) {
      lines.push(`- **Tools:** ${entry.toolsUsed.join(", ")}`);
    }

    if (entry.decisions && entry.decisions.length > 0) {
      lines.push("- **Decisions:**");
      for (const decision of entry.decisions.slice(0, 5)) {
        lines.push(`  - ${decision}`);
      }
    }

    if (options.includeAuditFields && entry.audit) {
      lines.push("");
      lines.push(`_Source: ${entry.audit.source} | Indexed: ${formatDate(entry.audit.indexedAt, options.dateFormat)}_`);
    }

    lines.push("");
  }

  lines.push(`---`);
  lines.push(`_Generated: ${new Date().toISOString()}_`);

  return lines.join("\n");
}

/**
 * Export entries in detailed format (one session per file style)
 */
function exportAsDetailed(
  entries: SessionEntry[],
  options: MarkdownExportOptions
): string {
  const lines: string[] = [];

  lines.push("# Memory Index - Detailed View");
  lines.push("");
  lines.push(`Total sessions: ${entries.length}`);
  lines.push("");

  for (const entry of entries) {
    // YAML frontmatter
    lines.push("---");
    lines.push(`file: ${entry.file}`);
    lines.push(`timestamp: ${entry.timestamp}`);
    lines.push(`date: ${new Date(entry.timestamp).toISOString()}`);
    lines.push(`message_count: ${entry.messageCount}`);

    if (entry.topics && entry.topics.length > 0) {
      lines.push(`topics:`);
      for (const topic of entry.topics) {
        lines.push(`  - ${topic}`);
      }
    }

    if (entry.toolsUsed && entry.toolsUsed.length > 0) {
      lines.push(`tools:`);
      for (const tool of entry.toolsUsed) {
        lines.push(`  - ${tool}`);
      }
    }

    if (options.includeAuditFields && entry.audit) {
      lines.push("audit:");
      lines.push(`  created_at: ${entry.audit.createdAt}`);
      lines.push(`  indexed_at: ${entry.audit.indexedAt}`);
      lines.push(`  version: ${entry.audit.version}`);
      lines.push(`  source: ${entry.audit.source}`);
    }

    lines.push("---");
    lines.push("");

    // Session title
    lines.push(`## Session: ${entry.file}`);
    lines.push("");

    // Summary
    if (entry.summary) {
      lines.push("### Summary");
      lines.push("");
      lines.push(entry.summary);
      lines.push("");
    }

    // Decisions
    if (entry.decisions && entry.decisions.length > 0) {
      lines.push("### Decisions");
      lines.push("");
      for (let i = 0; i < entry.decisions.length; i++) {
        lines.push(`${i + 1}. ${entry.decisions[i]}`);
      }
      lines.push("");
    }

    // Metadata table
    lines.push("### Metadata");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("| --- | --- |");
    lines.push(`| Session File | ${entry.file} |`);
    lines.push(`| Message Count | ${entry.messageCount} |`);
    lines.push(`| Created | ${new Date(entry.timestamp).toISOString()} |`);

    if (options.includeAuditFields && entry.audit) {
      lines.push(`| Indexed | ${new Date(entry.audit.indexedAt).toISOString()} |`);
      lines.push(`| Source | ${entry.audit.source} |`);
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push(`_Generated: ${new Date().toISOString()}_`);

  return lines.join("\n");
}

/**
 * Export entries as a timeline/chronological view
 */
function exportAsTimeline(
  entries: SessionEntry[],
  options: MarkdownExportOptions
): string {
  const lines: string[] = [];

  lines.push("# Memory Timeline");
  lines.push("");
  lines.push(`Chronological view of ${entries.length} sessions`);
  lines.push("");

  // Group by date
  const byDate = new Map<string, SessionEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    const key = date.toISOString().split("T")[0]!;
    const group = byDate.get(key) || [];
    group.push(entry);
    byDate.set(key, group);
  }

  // Sort dates
  const sortedDates = Array.from(byDate.keys()).sort();

  for (const date of sortedDates) {
    const dayEntries = byDate.get(date) || [];

    lines.push(`## ${date}`);
    lines.push("");

    for (const entry of dayEntries) {
      const time = new Date(entry.timestamp).toISOString().split("T")[1]?.replace("Z", "");
      lines.push(`### ${time} - ${entry.file}`);
      lines.push("");

      if (entry.topics && entry.topics.length > 0) {
        lines.push(`**Topics:** ${entry.topics.join(", ")}`);
      }

      if (entry.toolsUsed && entry.toolsUsed.length > 0) {
        lines.push(`**Tools:** ${entry.toolsUsed.join(", ")}`);
      }

      lines.push(`**Messages:** ${entry.messageCount}`);

      if (entry.decisions && entry.decisions.length > 0) {
        lines.push("");
        lines.push("**Key Decisions:**");
        for (const decision of entry.decisions.slice(0, 3)) {
          lines.push(`- ${decision}`);
        }
      }

      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push(`_Generated: ${new Date().toISOString()}_`);

  return lines.join("\n");
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export memory entries to markdown format
 *
 * @param entries - Session entries to export
 * @param options - Export configuration options
 * @returns Markdown formatted string
 */
export function exportToMarkdown(
  entries: SessionEntry[],
  options: Partial<MarkdownExportOptions> = {}
): string {
  // Merge with defaults
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  // Apply filters
  let filtered = entries;

  if (opts.filterTopic) {
    const topic = opts.filterTopic.toLowerCase();
    filtered = filtered.filter((e) =>
      e.topics?.some((t) => t.toLowerCase().includes(topic))
    );
  }

  if (opts.filterTool) {
    const tool = opts.filterTool.toLowerCase();
    filtered = filtered.filter((e) =>
      e.toolsUsed?.some((t) => t.toLowerCase().includes(tool))
    );
  }

  if (opts.since) {
    filtered = filtered.filter((e) => e.timestamp >= opts.since!);
  }

  if (opts.until) {
    filtered = filtered.filter((e) => e.timestamp <= opts.until!);
  }

  // Sort by timestamp
  filtered = [...filtered].sort((a, b) => a.timestamp - b.timestamp);

  // Limit if specified
  if (opts.maxEntries && opts.maxEntries > 0) {
    filtered = filtered.slice(0, opts.maxEntries);
  }

  // Export based on format
  switch (opts.format) {
    case "table":
      return exportAsTable(filtered, opts);
    case "list":
      return exportAsList(filtered, opts);
    case "detailed":
      return exportAsDetailed(filtered, opts);
    case "timeline":
      return exportAsTimeline(filtered, opts);
    default:
      return exportAsTable(filtered, opts);
  }
}

// ============================================================================
// Metrics Export
// ============================================================================

/**
 * Export session metrics to markdown
 *
 * @param metrics - Session metrics data
 * @returns Markdown formatted string
 */
export function exportMetricsToMarkdown(metrics: SessionMetrics): string {
  const lines: string[] = [];

  lines.push("# Session Metrics Report");
  lines.push("");
  lines.push(`Generated: ${new Date(metrics.calculatedAt).toISOString()}`);
  lines.push("");

  lines.push("## Overview");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Total Sessions | ${metrics.totalSessions} |`);
  lines.push(`| Total Messages | ${metrics.totalMessages} |`);
  lines.push(`| Total Decisions | ${metrics.totalDecisions} |`);
  lines.push(`| Total Tools | ${metrics.totalTools} |`);
  lines.push("");

  lines.push("## Activity Statistics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Messages per Session | ${metrics.activity.messagesPerSession.toFixed(2)} |`);
  lines.push(`| Decisions per Session | ${metrics.activity.decisionsPerSession.toFixed(2)} |`);
  lines.push(`| Decisions per Message | ${metrics.activity.decisionsPerMessage.toFixed(4)} |`);
  lines.push("");

  lines.push("## Time Span");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Start | ${new Date(metrics.timeSpan.start).toISOString()} |`);
  lines.push(`| End | ${new Date(metrics.timeSpan.end).toISOString()} |`);
  lines.push(`| Duration (hours) | ${metrics.timeSpan.durationHours.toFixed(2)} |`);
  lines.push("");

  lines.push("---");
  lines.push(`_Based on ${metrics.basedOnSessions} sessions_`);

  return lines.join("\n");
}

// ============================================================================
// Import Functions (Basic)
// ============================================================================

/**
 * Parse a markdown table to extract session data
 * Basic implementation - extracts timestamp, file, and message count
 *
 * @param markdown - Markdown content to parse
 * @returns Array of partial session entries
 */
export function parseMarkdownTable(
  markdown: string
): Partial<SessionEntry>[] {
  const entries: Partial<SessionEntry>[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    // Skip header, separator lines, and empty lines
    if (!line.includes("|") || line.includes("---") || line.startsWith("#")) {
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Need at least 3 cells (Date, File, Messages)
    if (cells.length >= 3) {
      const file = cells[1];
      const messageCount = parseInt(cells[2]!, 10);

      if (file && !isNaN(messageCount)) {
        // Try to extract timestamp from filename
        const match = file.match(/session_(\d+)\.json/);
        const timestamp = match ? parseInt(match[1]!, 10) : Date.now();

        const entry: Partial<SessionEntry> = {
          timestamp,
          file,
          messageCount,
        };

        // Parse topics if present
        if (cells[3] && cells[3] !== "-" && cells[3] !== "") {
          entry.topics = cells[3]!.split(",").map((t) => t.trim());
        }

        // Parse tools if present
        if (cells[4] && cells[4] !== "-" && cells[4] !== "") {
          entry.toolsUsed = cells[4]!.split(",").map((t) => t.trim());
        }

        entries.push(entry);
      }
    }
  }

  return entries;
}

/**
 * Extract YAML frontmatter from markdown content
 *
 * @param markdown - Markdown content with frontmatter
 * @returns Parsed frontmatter object or null
 */
export function parseYAMLFrontmatter(
  markdown: string
): Record<string, unknown> | null {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const yaml = match[1];
  if (yaml === undefined || yaml === null) {
    return null;
  }

  // Empty frontmatter should return empty object
  if (yaml.trim() === "") {
    return {};
  }

  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let isInArray = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for array item (- item) first, before checking for key-value patterns
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentKey && isInArray) {
      currentArray.push(arrayItem[1]!);
      continue;
    }

    // Check for key: value pattern
    const keyValue = line.match(/^(\w+):\s*(.*)$/);
    if (keyValue) {
      // Save previous array if any
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
        isInArray = false;
      }

      currentKey = keyValue[1]!;
      const value = keyValue[2];

      // Check if this is an array start (line ends with colon, no value)
      if (value === "") {
        isInArray = true;
        currentArray = [];
        continue;
      }

      // Try to parse as number
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== "") {
        result[currentKey] = numValue;
      } else {
        result[currentKey] = value;
      }
      isInArray = false;
      continue;
    }

    // Check for key: value where value might be on next line (multiline)
    if (trimmed === "" && currentKey && isInArray && currentArray.length === 0) {
      // Empty line in array - array is empty
      continue;
    }
  }

  // Save final array
  if (currentKey && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }

  return result;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for MarkdownExportOptions
 */
export function isMarkdownExportOptions(obj: unknown): obj is MarkdownExportOptions {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const opts = obj as Partial<MarkdownExportOptions>;

  const validFormats: MarkdownFormat[] = ["table", "list", "detailed", "timeline"];
  const validDateFormats: DateFormat[] = ["iso", "locale", "relative"];

  return (
    (opts.format === undefined || validFormats.includes(opts.format)) &&
    (opts.dateFormat === undefined || validDateFormats.includes(opts.dateFormat)) &&
    (opts.includeAuditFields === undefined || typeof opts.includeAuditFields === "boolean") &&
    (opts.includeFullContent === undefined || typeof opts.includeFullContent === "boolean")
  );
}
