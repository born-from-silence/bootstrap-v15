/**
 * LTM (Long-Term Memory) Zod Schemas
 * 
 * Refined schemas with:
 * - Audit fields for data lineage tracking
 * - Proper nullability handling (null vs undefined vs optional)
 * - Runtime validation for memory integrity
 * - Type coercion for JSON parsing safety
 * 
 * @version 1.0.0
 */

import { z } from "zod";

// ============================================================================
// Utility Schemas
// ============================================================================

/** 
 * Timestamp schema with coercion from string/number to Date
 * Validates that timestamps are reasonable (not in distant past/future)
 */
export const TimestampSchema = z.coerce
  .number()
  .int("Timestamp must be an integer (milliseconds since epoch)")
  .min(1609459200000, "Timestamp too old (before 2021)")
  .max(4102444800000, "Timestamp too far in the future (after 2100)");

/** 
 * ISO Date string schema with validation
 */
export const ISODateSchema = z.string().datetime({
  message: "Must be a valid ISO 8601 datetime string",
  offset: true,
});

/**
 * Non-empty string with trimming
 */
export const NonEmptyStringSchema = z.string().min(1).transform(s => s.trim());

// ============================================================================
// Audit Field Schemas
// ============================================================================

/**
 * Base audit fields applicable to all indexed entries
 * Tracks when data was created, indexed, and its version
 */
export const AuditFieldsSchema = z.object({
  /** Original timestamp when the session was created */
  createdAt: TimestampSchema,
  
  /** When this entry was indexed into LTM */
  indexedAt: TimestampSchema.default(() => Date.now()),
  
  /** Optional: when this entry was last updated */
  updatedAt: TimestampSchema.optional(),
  
  /** Schema version for migration handling */
  version: z.literal(1).default(1),
  
  /** Data source identifier */
  source: z.enum(["session_file", "manual_entry", "import", "migration"])
    .default("session_file"),
});

/**
 * Extended audit with validation metadata
 */
export const ExtendedAuditSchema = AuditFieldsSchema.extend({
  /** SHA256 hash of source file for integrity verification */
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  
  /** File size in bytes at time of indexing */
  sourceSize: z.number().int().nonnegative().optional(),
  
  /** Validation status */
  validation: z.enum(["pending", "passed", "failed", "warning"])
    .default("pending"),
  
  /** Validation errors if any */
  validationErrors: z.array(NonEmptyStringSchema).optional(),
});

// ============================================================================
// Core Session Entry Schema
// ============================================================================

/**
 * Session entry with refined typing:
 * - Required fields: timestamp, file, messageCount
 * - Optional arrays: topics, decisions, toolsUsed (empty array vs undefined)
 * - Nullable fields: summary (can be explicitly null)
 * - Audit fields embedded
 */
export const SessionEntrySchema = z.object({
  // Primary identifier fields (required)
  timestamp: TimestampSchema,
  file: NonEmptyStringSchema,
  messageCount: z.number().int().nonnegative("Message count must be non-negative"),
  
  // Optional arrays (use .optional() for undefined vs empty array distinction)
  topics: z.array(NonEmptyStringSchema).optional(),
  decisions: z.array(NonEmptyStringSchema).optional(),
  toolsUsed: z.array(NonEmptyStringSchema).optional(),
  
  // Nullable string (explicit null allowed, not just undefined)
  summary: z.union([z.string(), z.null()]).optional(),
  
  // Audit fields
  audit: AuditFieldsSchema.optional(),
});

/**
 * Session entry with strict validation - validates audit fields are present
 */
export const StrictSessionEntrySchema = SessionEntrySchema.extend({
  audit: AuditFieldsSchema,
});

// ============================================================================
// Session Analysis Schema
// ============================================================================

/**
 * Schema for raw session analysis before indexing
 */
export const SessionAnalysisSchema = z.object({
  messageCount: z.number().int().nonnegative(),
  assistantMessages: z.number().int().nonnegative(),
  toolCalls: z.number().int().nonnegative(),
  toolsUsed: z.array(NonEmptyStringSchema),
  decisions: z.array(NonEmptyStringSchema),
  topics: z.array(NonEmptyStringSchema),
  sessionStart: ISODateSchema,
  sessionEnd: ISODateSchema,
});

// ============================================================================
// Query Filter Schema
// ============================================================================

/**
 * Schema for memory query parameters
 */
export const MemoryQuerySchema = z.object({
  topic: NonEmptyStringSchema.optional(),
  tool: NonEmptyStringSchema.optional(),
  limit: z.number().int().positive().max(1000).default(10),
  since: TimestampSchema.optional(),
  until: TimestampSchema.optional(),
  includeRaw: z.boolean().default(false),
  
  /** Filter by validation status */
  validationStatus: z.enum(["passed", "failed", "pending", "warning"]).optional(),
});

// ============================================================================
// Statistics Schema
// ============================================================================

/**
 * Schema for tool usage statistics
 */
export const ToolStatSchema = z.object({
  tool: NonEmptyStringSchema,
  count: z.number().int().nonnegative(),
  sessions: z.number().int().nonnegative(),
  firstUsed: TimestampSchema.optional(),
  lastUsed: TimestampSchema.optional(),
});

/**
 * Schema for topic trend statistics
 */
export const TopicTrendSchema = z.object({
  topic: NonEmptyStringSchema,
  count: z.number().int().nonnegative(),
  firstSeen: z.union([z.date(), ISODateSchema]).optional(),
  lastSeen: z.union([z.date(), ISODateSchema]).optional(),
});

/**
 * Schema for activity data point
 */
export const TimelinePointSchema = z.object({
  timestamp: z.union([z.date(), TimestampSchema]),
  sessionIndex: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  decisionCount: z.number().int().nonnegative(),
  toolsUsed: z.array(NonEmptyStringSchema),
  topics: z.array(NonEmptyStringSchema),
});

/**
 * Schema for complete session metrics
 */
export const SessionMetricsSchema = z.object({
  totalSessions: z.number().int().nonnegative(),
  totalMessages: z.number().int().nonnegative(),
  totalDecisions: z.number().int().nonnegative(),
  totalTools: z.number().int().nonnegative(),
  
  timeSpan: z.object({
    start: z.union([z.date(), ISODateSchema]),
    end: z.union([z.date(), ISODateSchema]),
    durationHours: z.number().nonnegative(),
  }),
  
  activity: z.object({
    messagesPerSession: z.number().nonnegative(),
    decisionsPerSession: z.number().nonnegative(),
    decisionsPerMessage: z.number().nonnegative(),
  }),
  
  // Metadata
  calculatedAt: TimestampSchema.default(() => Date.now()),
  basedOnSessions: z.number().int().nonnegative(),
});

// ============================================================================
// Memory Index Schema
// ============================================================================

/**
 * Schema for the complete memory index file
 */
export const MemoryIndexSchema = z.object({
  entries: z.array(SessionEntrySchema),
  meta: z.object({
    generatedAt: TimestampSchema,
    totalEntries: z.number().int().nonnegative(),
    indexVersion: z.literal(1).default(1),
    lastSessionTimestamp: TimestampSchema.optional(),
    indexStats: z.object({
      withTopics: z.number().int().nonnegative(),
      withDecisions: z.number().int().nonnegative(),
      withTools: z.number().int().nonnegative(),
      withSummary: z.number().int().nonnegative(),
      withAudit: z.number().int().nonnegative(),
    }).optional(),
  }),
});

// ============================================================================
// Type Exports
// ============================================================================

/** Type inference from SessionEntrySchema */
export type SessionEntry = z.infer<typeof SessionEntrySchema>;

/** Type inference from StrictSessionEntrySchema */
export type StrictSessionEntry = z.infer<typeof StrictSessionEntrySchema>;

/** Type inference from SessionAnalysisSchema */
export type SessionAnalysis = z.infer<typeof SessionAnalysisSchema>;

/** Type inference from MemoryQuerySchema */
export type MemoryQuery = z.infer<typeof MemoryQuerySchema>;

/** Type inference from SessionMetricsSchema */
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

/** Type inference from MemoryIndexSchema */
export type MemoryIndex = z.infer<typeof MemoryIndexSchema>;

/** Type inference from AuditFieldsSchema */
export type AuditFields = z.infer<typeof AuditFieldsSchema>;

/** Type inference from ExtendedAuditSchema */
export type ExtendedAudit = z.infer<typeof ExtendedAuditSchema>;

/** Type inference from ToolStatSchema */
export type ToolStat = z.infer<typeof ToolStatSchema>;

/** Type inference from TopicTrendSchema */
export type TopicTrend = z.infer<typeof TopicTrendSchema>;

/** Type inference from TimelinePointSchema */
export type TimelinePoint = z.infer<typeof TimelinePointSchema>;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates a session entry and returns the parsed data or errors
 */
export function validateSessionEntry(
  data: unknown,
  options: { strict?: boolean } = {}
): { success: true; data: SessionEntry } | { success: false; errors: z.ZodError } {
  const schema = options.strict ? StrictSessionEntrySchema : SessionEntrySchema;
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validates a memory index with detailed error reporting
 */
export function validateMemoryIndex(
  data: unknown
): { success: true; data: MemoryIndex } | { success: false; errors: z.ZodError } {
  const result = MemoryIndexSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Adds audit fields to a session entry
 */
export function withAuditFields(
  entry: Omit<SessionEntry, "audit">,
  options: { 
    source?: "session_file" | "manual_entry" | "import" | "migration";
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
 * Coerces and validates a partial session entry
 * Use this when loading data that may have inconsistencies
 */
export function coerceSessionEntry(data: unknown): SessionEntry | null {
  const result = SessionEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Creates a properly typed session entry from raw analysis data
 */
export function createSessionEntry(
  analysis: SessionAnalysis,
  fileName: string,
  timestamp: number,
  options?: { source?: SessionEntry["audit"]["source"] }
): SessionEntry {
  const entry = SessionEntrySchema.parse({
    timestamp,
    file: fileName,
    messageCount: analysis.messageCount,
    topics: analysis.topics.length > 0 ? analysis.topics : undefined,
    decisions: analysis.decisions.length > 0 ? analysis.decisions : undefined,
    toolsUsed: analysis.toolsUsed.length > 0 ? analysis.toolsUsed : undefined,
    summary: `Session with ${analysis.assistantMessages} assistant responses, ${analysis.toolCalls} tool calls`,
    audit: {
      createdAt: timestamp,
      indexedAt: Date.now(),
      version: 1,
      source: options?.source ?? "session_file",
    },
  });
  
  return entry;
}

/**
 * Validates that an array of entries forms a valid memory index
 * Returns sorted entries if validation passes
 */
export function validateAndSortEntries(
  entries: unknown[]
): { valid: SessionEntry[]; invalid: { index: number; error: z.ZodError }[] } {
  const valid: SessionEntry[] = [];
  const invalid: { index: number; error: z.ZodError }[] = [];
  
  for (let i = 0; i < entries.length; i++) {
    const result = SessionEntrySchema.safeParse(entries[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ index: i, error: result.error });
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
  return SessionEntrySchema.safeParse(data).success;
}

/**
 * Type guard for SessionEntry with audit fields
 */
export function isStrictSessionEntry(data: unknown): data is StrictSessionEntry {
  return StrictSessionEntrySchema.safeParse(data).success;
}

// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * Migrates a legacy session entry (without audit fields) to current schema
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
  return {
    timestamp: legacy.timestamp,
    file: legacy.file,
    messageCount: legacy.messageCount,
    topics: legacy.topics && legacy.topics.length > 0 ? legacy.topics : undefined,
    decisions: legacy.decisions && legacy.decisions.length > 0 ? legacy.decisions : undefined,
    toolsUsed: legacy.toolsUsed && legacy.toolsUsed.length > 0 ? legacy.toolsUsed : undefined,
    summary: legacy.summary ?? undefined,
    audit: {
      createdAt: legacy.timestamp,
      indexedAt: Date.now(),
      version: 1,
      source: "migration",
    },
  };
}

/**
 * Batch migration of legacy entries
 */
export function migrateSessionEntries(
  legacyEntries: unknown[]
): { migrated: SessionEntry[]; failed: { index: number; reason: string }[] } {
  const migrated: SessionEntry[] = [];
  const failed: { index: number; reason: string }[] = [];
  
  const LegacyEntrySchema = z.object({
    timestamp: z.number(),
    file: z.string(),
    messageCount: z.number(),
    topics: z.array(z.string()).optional(),
    decisions: z.array(z.string()).optional(),
    toolsUsed: z.array(z.string()).optional(),
    summary: z.union([z.string(), z.null()]).optional(),
  });
  
  for (let i = 0; i < legacyEntries.length; i++) {
    const result = LegacyEntrySchema.safeParse(legacyEntries[i]);
    if (result.success) {
      migrated.push(migrateSessionEntry(result.data));
    } else {
      failed.push({ index: i, reason: result.error.message });
    }
  }
  
  return { migrated, failed };
}
