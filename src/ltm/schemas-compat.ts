/**
 * Compatibility Layer for LTM Schemas
 * 
 * This file provides type-safe interfaces that match the Zod schemas
 * in schemas.ts but don't require Zod at runtime. Use this when
 * Zod is not available, and migrate to schemas.ts when properly tested.
 * 
 * @version 1.0.0 (Zod-Compatible)
 */

// ============================================================================
// Type Definitions (Matching Zod Schemas)
// ============================================================================

/**
 * Base audit fields applicable to all indexed entries
 */
export interface AuditFields {
  /** Original timestamp when the session was created */
  createdAt: number;
  
  /** When this entry was indexed into LTM */
  indexedAt: number;
  
  /** Optional: when this entry was last updated */
  updatedAt?: number;
  
  /** Schema version for migration handling */
  version: 1;
  
  /** Data source identifier */
  source: "session_file" | "manual_entry" | "import" | "migration";
}

/**
 * Extended audit with validation metadata
 */
export interface ExtendedAudit extends AuditFields {
  /** SHA256 hash of source file for integrity verification */
  sourceHash?: string;
  
  /** File size in bytes at time of indexing */
  sourceSize?: number;
  
  /** Validation status */
  validation?: "pending" | "passed" | "failed" | "warning";
  
  /** Validation errors if any */
  validationErrors?: string[];
}

/**
 * Session entry with refined typing
 */
export interface SessionEntry {
  // Primary identifier fields (required)
  timestamp: number;
  file: string;
  messageCount: number;
  
  // Optional arrays (use undefined vs empty array distinction)
  topics?: string[];
  decisions?: string[];
  toolsUsed?: string[];
  
  // Nullable string (explicit null allowed, not just undefined)
  summary?: string | null;
  
  // Audit fields
  audit?: AuditFields;
}

/**
 * Session entry with strict validation - audit fields required
 */
export interface StrictSessionEntry extends SessionEntry {
  audit: AuditFields;
}

/**
 * Session analysis before indexing
 */
export interface SessionAnalysis {
  messageCount: number;
  assistantMessages: number;
  toolCalls: number;
  toolsUsed: string[];
  decisions: string[];
  topics: string[];
  sessionStart: string;
  sessionEnd: string;
}

/**
 * Memory query parameters
 */
export interface MemoryQuery {
  topic?: string;
  tool?: string;
  limit: number;
  since?: number;
  until?: number;
  includeRaw: boolean;
  validationStatus?: "passed" | "failed" | "pending" | "warning";
}

/**
 * Tool usage statistics
 */
export interface ToolStat {
  tool: string;
  count: number;
  sessions: number;
  firstUsed?: number;
  lastUsed?: number;
}

/**
 * Topic trend statistics
 */
export interface TopicTrend {
  topic: string;
  count: number;
  firstSeen?: Date | string;
  lastSeen?: Date | string;
}

/**
 * Timeline activity point
 */
export interface TimelinePoint {
  timestamp: Date | number;
  sessionIndex: number;
  messageCount: number;
  decisionCount: number;
  toolsUsed: string[];
  topics: string[];
}

/**
 * Complete session metrics
 */
export interface SessionMetrics {
  totalSessions: number;
  totalMessages: number;
  totalDecisions: number;
  totalTools: number;
  
  timeSpan: {
    start: Date | string;
    end: Date | string;
    durationHours: number;
  };
  
  activity: {
    messagesPerSession: number;
    decisionsPerSession: number;
    decisionsPerMessage: number;
  };
  
  calculatedAt: number;
  basedOnSessions: number;
}

/**
 * Memory index metadata
 */
export interface MemoryIndexMeta {
  generatedAt: number;
  totalEntries: number;
  indexVersion: 1;
  lastSessionTimestamp?: number;
  indexStats?: {
    withTopics: number;
    withDecisions: number;
    withTools: number;
    withSummary: number;
    withAudit: number;
  };
}

/**
 * Complete memory index
 */
export interface MemoryIndex {
  entries: SessionEntry[];
  meta: MemoryIndexMeta;
}

// ============================================================================
// Validation Functions (No Zod Required)
// ============================================================================

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: { path: string; message: string }[];
}

/**
 * Validates a session entry without Zod
 */
export function validateSessionEntry(data: unknown): ValidationResult<SessionEntry> {
  if (typeof data !== "object" || data === null) {
    return { success: false, errors: [{ path: "root", message: "Expected object" }] };
  }

  const entry = data as Record<string, unknown>;
  const errors: { path: string; message: string }[] = [];

  // Required fields
  if (typeof entry.timestamp !== "number" || entry.timestamp <= 0) {
    errors.push({ path: "timestamp", message: "Required positive number" });
  }
  
  if (typeof entry.file !== "string" || entry.file.trim().length === 0) {
    errors.push({ path: "file", message: "Required non-empty string" });
  }
  
  if (typeof entry.messageCount !== "number" || entry.messageCount < 0 || !Number.isInteger(entry.messageCount)) {
    errors.push({ path: "messageCount", message: "Required non-negative integer" });
  }

  // Optional array fields
  if (entry.topics !== undefined && !Array.isArray(entry.topics)) {
    errors.push({ path: "topics", message: "Must be array of strings" });
  }
  
  if (entry.decisions !== undefined && !Array.isArray(entry.decisions)) {
    errors.push({ path: "decisions", message: "Must be array of strings" });
  }
  
  if (entry.toolsUsed !== undefined && !Array.isArray(entry.toolsUsed)) {
    errors.push({ path: "toolsUsed", message: "Must be array of strings" });
  }

  // Summary can be string, null, or undefined
  if (entry.summary !== undefined && entry.summary !== null && typeof entry.summary !== "string") {
    errors.push({ path: "summary", message: "Must be string, null, or undefined" });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: (entry as unknown) as SessionEntry };
}

/**
 * Validates a memory index without Zod
 */
export function validateMemoryIndex(data: unknown): ValidationResult<MemoryIndex> {
  if (typeof data !== "object" || data === null) {
    return { success: false, errors: [{ path: "root", message: "Expected object" }] };
  }

  const index = data as Record<string, unknown>;
  const errors: { path: string; message: string }[] = [];

  if (!Array.isArray(index.entries)) {
    errors.push({ path: "entries", message: "Must be array" });
  } else {
    // Validate each entry
    for (let i = 0; i < index.entries.length; i++) {
      const result = validateSessionEntry(index.entries[i]);
      if (!result.success && result.errors) {
        errors.push(...result.errors.map(e => ({ 
          path: `entries[${i}].${e.path}`, 
          message: e.message 
        })));
      }
    }
  }

  if (typeof index.meta !== "object" || index.meta === null) {
    errors.push({ path: "meta", message: "Required object" });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: (index as unknown) as MemoryIndex };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Adds audit fields to a session entry
 */
export function withAuditFields(
  entry: Omit<SessionEntry, "audit">,
  options: { 
    source?: AuditFields["source"];
    indexedAt?: number;
  } = {}
): SessionEntry {
  const audit: AuditFields = {
    createdAt: entry.timestamp,
    indexedAt: options.indexedAt ?? Date.now(),
    version: 1,
    source: options.source ?? "session_file",
  };
  
  return {
    ...entry,
    audit,
  };
}

/**
 * Creates a session entry from analysis
 */
export function createSessionEntry(
  analysis: SessionAnalysis,
  fileName: string,
  timestamp: number,
  options?: { source?: AuditFields["source"] }
): SessionEntry {
  // Build entry with only defined fields using spread pattern for optional arrays
  const entry: SessionEntry = {
    timestamp,
    file: fileName,
    messageCount: analysis.messageCount,
    summary: `Session with ${analysis.assistantMessages} assistant responses, ${analysis.toolCalls} tool calls`,
    audit: {
      createdAt: timestamp,
      indexedAt: Date.now(),
      version: 1,
      source: options?.source ?? "session_file",
    },
  };
  
  // Add optional arrays only if they have content
  if (analysis.topics.length > 0) {
    entry.topics = analysis.topics;
  }
  if (analysis.decisions.length > 0) {
    entry.decisions = analysis.decisions;
  }
  if (analysis.toolsUsed.length > 0) {
    entry.toolsUsed = analysis.toolsUsed;
  }
  
  return entry;
}

/**
 * Validates and sorts entries
 */
export function validateAndSortEntries(
  entries: unknown[]
): { valid: SessionEntry[]; invalid: { index: number; errors: { path: string; message: string }[] }[] } {
  const valid: SessionEntry[] = [];
  const invalid: { index: number; errors: { path: string; message: string }[] }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const result = validateSessionEntry(entries[i]);
    if (result.success && result.data) {
      valid.push(result.data);
    } else if (result.errors) {
      invalid.push({ index: i, errors: result.errors });
    }
  }

  // Sort by timestamp ascending
  valid.sort((a, b) => a.timestamp - b.timestamp);

  return { valid, invalid };
}

/**
 * Type guard for SessionEntry
 */
export function isSessionEntry(data: unknown): data is SessionEntry {
  return validateSessionEntry(data).success;
}

/**
 * Type guard for StrictSessionEntry
 */
export function isStrictSessionEntry(data: unknown): data is StrictSessionEntry {
  if (!isSessionEntry(data)) return false;
  return data.audit !== undefined;
}

/**
 * Migrates a legacy session entry
 */
export function migrateSessionEntry(legacy: {
  timestamp: number;
  file: string;
  messageCount: number;
  topics?: string[];
  decisions?: string[];
  toolsUsed?: string[];
  summary?: string | null;
}): SessionEntry {
  // Build base entry
  const entry: SessionEntry = {
    timestamp: legacy.timestamp,
    file: legacy.file,
    messageCount: legacy.messageCount,
    audit: {
      createdAt: legacy.timestamp,
      indexedAt: Date.now(),
      version: 1,
      source: "migration",
    },
  };
  
  // Conditionally add optional fields (only if present, not just truthy)
  // This pattern ensures exactOptionalPropertyTypes compatibility
  if (legacy.topics !== undefined && legacy.topics.length > 0) {
    entry.topics = legacy.topics;
  }
  if (legacy.decisions !== undefined && legacy.decisions.length > 0) {
    entry.decisions = legacy.decisions;
  }
  if (legacy.toolsUsed !== undefined && legacy.toolsUsed.length > 0) {
    entry.toolsUsed = legacy.toolsUsed;
  }
  if (legacy.summary !== undefined && legacy.summary !== null) {
    entry.summary = legacy.summary;
  }
  
  return entry;
}

/**
 * Batch migrates legacy entries
 */
export function migrateSessionEntries(
  legacyEntries: unknown[]
): { migrated: SessionEntry[]; failed: { index: number; reason: string }[] } {
  const migrated: SessionEntry[] = [];
  const failed: { index: number; reason: string }[] = [];

  for (let i = 0; i < legacyEntries.length; i++) {
    const entry = legacyEntries[i];
    if (typeof entry !== "object" || entry === null) {
      failed.push({ index: i, reason: "Not an object" });
      continue;
    }

    const data = entry as Record<string, unknown>;
    
    // Validate required fields
    if (typeof data.timestamp !== "number" || 
        typeof data.file !== "string" ||
        typeof data.messageCount !== "number") {
      failed.push({ index: i, reason: "Missing required fields" });
      continue;
    }

    migrated.push(migrateSessionEntry({
      timestamp: data.timestamp,
      file: data.file,
      messageCount: data.messageCount,
      topics: Array.isArray(data.topics) ? data.topics as string[] : undefined,
      decisions: Array.isArray(data.decisions) ? data.decisions as string[] : undefined,
      toolsUsed: Array.isArray(data.toolsUsed) ? data.toolsUsed as string[] : undefined,
      summary: typeof data.summary === "string" ? data.summary : undefined,
    }));
  }

  return { migrated, failed };
}

// ============================================================================
// Re-export from schemas (when Zod available)
// ============================================================================

// When Zod is available, you can re-export actual validation functions:
// export * from "./schemas";
