/**
 * Tests for LTM Schema Validation
 * 
 * Covers:
 * - Session entry validation with audit fields
 * - Nullability handling (null vs undefined vs optional)
 * - Type coercion from JSON strings
 * - Migration of legacy entries
 * - Query parameter validation
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  // Schemas
  SessionEntrySchema,
  StrictSessionEntrySchema,
  SessionAnalysisSchema,
  MemoryQuerySchema,
  SessionMetricsSchema,
  MemoryIndexSchema,
  AuditFieldsSchema,
  TimestampSchema,
  ISODateSchema,
  // Utilities
  validateSessionEntry,
  validateMemoryIndex,
  withAuditFields,
  coerceSessionEntry,
  createSessionEntry,
  validateAndSortEntries,
  migrateSessionEntry,
  migrateSessionEntries,
  isSessionEntry,
  isStrictSessionEntry,
  // Types
  type SessionEntry,
  type SessionAnalysis,
} from "./schemas";
import { z } from "zod";

describe("LTM Schemas", () => {
  // ==========================================================================
  // Timestamp Schema Tests
  // ==========================================================================
  describe("TimestampSchema", () => {
    it("should validate valid timestamps", () => {
      const valid = [
        1772351777141, // Current session timestamp
        1704067200000, // 2024-01-01
        Date.now(),
      ];
      
      valid.forEach(ts => {
        expect(TimestampSchema.safeParse(ts).success).toBe(true);
      });
    });

    it("should coerce string timestamps to numbers", () => {
      const result = TimestampSchema.safeParse("1772351777141");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1772351777141);
      }
    });

    it("should reject timestamps that are too old", () => {
      const result = TimestampSchema.safeParse(1000000000000); // 2001
      expect(result.success).toBe(false);
    });

    it("should reject timestamps in the distant future", () => {
      const result = TimestampSchema.safeParse(5000000000000); // ~2128
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric values", () => {
      const invalid = ["not a date", null, undefined, {}, []];
      invalid.forEach(val => {
        expect(TimestampSchema.safeParse(val).success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // ISO Date Schema Tests
  // ==========================================================================
  describe("ISODateSchema", () => {
    it("should validate valid ISO dates", () => {
      const valid = [
        "2024-01-01T00:00:00Z",
        "2024-03-01T07:56:56.659Z",
        new Date().toISOString(),
      ];
      
      valid.forEach(date => {
        expect(ISODateSchema.safeParse(date).success).toBe(true);
      });
    });

    it("should reject invalid date strings", () => {
      const invalid = [
        "2024-13-01", // Invalid month
        "not a date",
        "01/01/2024", // Non-ISO format
      ];
      
      invalid.forEach(date => {
        expect(ISODateSchema.safeParse(date).success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Audit Fields Tests
  // ==========================================================================
  describe("AuditFieldsSchema", () => {
    it("should validate complete audit fields", () => {
      const audit = {
        createdAt: 1772351777141,
        indexedAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        source: "session_file" as const,
      };
      
      const result = AuditFieldsSchema.safeParse(audit);
      expect(result.success).toBe(true);
    });

    it("should apply defaults for optional fields", () => {
      const minimal = {
        createdAt: 1772351777141,
      };
      
      const result = AuditFieldsSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1);
        expect(result.data.source).toBe("session_file");
        expect(result.data.indexedAt).toBeDefined();
      }
    });

    it("should reject invalid source values", () => {
      const audit = {
        createdAt: 1772351777141,
        source: "invalid_source",
      };
      
      const result = AuditFieldsSchema.safeParse(audit);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // Session Entry Schema Tests
  // ==========================================================================
  describe("SessionEntrySchema", () => {
    const validSessionData = {
      timestamp: 1772351777141,
      file: "session_1772351777141.json",
      messageCount: 42,
    };

    it("should validate minimal session entry", () => {
      const result = SessionEntrySchema.safeParse(validSessionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topics).toBeUndefined();
        expect(result.data.decisions).toBeUndefined();
        expect(result.data.toolsUsed).toBeUndefined();
        expect(result.data.summary).toBeUndefined();
      }
    });

    it("should validate session with all optional fields", () => {
      const fullEntry = {
        ...validSessionData,
        topics: ["memory", "sessions", "code"],
        decisions: ["Will create a schema"],
        toolsUsed: ["run_shell", "write_file"],
        summary: "Session with 42 messages",
        audit: {
          createdAt: 1772351777141,
          indexedAt: Date.now(),
          version: 1,
          source: "session_file",
        },
      };
      
      const result = SessionEntrySchema.safeParse(fullEntry);
      expect(result.success).toBe(true);
    });

    it("should handle null summary", () => {
      const entry = {
        ...validSessionData,
        summary: null,
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBeNull();
      }
    });

    it("should handle empty arrays (distinct from undefined)", () => {
      const entry = {
        ...validSessionData,
        topics: [],
        decisions: [],
        toolsUsed: [],
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      // Empty arrays are valid per the schema
      if (result.success) {
        expect(result.data.topics).toEqual([]);
      }
    });

    it("should trim whitespace from strings", () => {
      const entry = {
        ...validSessionData,
        file: "  session_1772351777141.json  ",
        topics: ["  memory  ", "  code  "],
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBe("session_1772351777141.json");
        expect(result.data.topics).toEqual(["memory", "code"]);
      }
    });

    it("should reject negative message count", () => {
      const entry = {
        ...validSessionData,
        messageCount: -1,
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it("should reject empty file string", () => {
      const entry = {
        ...validSessionData,
        file: "",
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only file string", () => {
      const entry = {
        ...validSessionData,
        file: "   ",
      };
      
      const result = SessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // Strict Session Entry Tests
  // ==========================================================================
  describe("StrictSessionEntrySchema", () => {
    it("should require audit fields", () => {
      const entry = {
        timestamp: 1772351777141,
        file: "session_1772351777141.json",
        messageCount: 42,
      };
      
      const result = StrictSessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it("should validate when audit fields are present", () => {
      const entry = {
        timestamp: 1772351777141,
        file: "session_1772351777141.json",
        messageCount: 42,
        audit: {
          createdAt: 1772351777141,
          indexedAt: Date.now(),
          version: 1,
          source: "session_file" as const,
        },
      };
      
      const result = StrictSessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Session Analysis Schema Tests
  // ==========================================================================
  describe("SessionAnalysisSchema", () => {
    const validAnalysis = {
      messageCount: 10,
      assistantMessages: 5,
      toolCalls: 3,
      toolsUsed: ["run_shell", "write_file"],
      decisions: ["Will create a test"],
      topics: ["code", "test"],
      sessionStart: "2024-03-01T07:56:56.659Z",
      sessionEnd: "2024-03-01T08:00:00.000Z",
    };

    it("should validate complete analysis", () => {
      const result = SessionAnalysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });

    it("should reject invalid ISO dates", () => {
      const invalid = {
        ...validAnalysis,
        sessionStart: "not a date",
      };
      
      const result = SessionAnalysisSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // Memory Query Schema Tests
  // ==========================================================================
  describe("MemoryQuerySchema", () => {
    it("should validate empty query", () => {
      const result = MemoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10); // default
        expect(result.data.includeRaw).toBe(false); // default
      }
    });

    it("should validate complete query", () => {
      const query = {
        topic: "memory",
        tool: "query_memory",
        limit: 50,
        since: 1704067200000,
        until: Date.now(),
        includeRaw: true,
        validationStatus: "passed" as const,
      };
      
      const result = MemoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should enforce limit bounds", () => {
      const tooHigh = { limit: 10000 };
      const result = MemoryQuerySchema.safeParse(tooHigh);
      expect(result.success).toBe(false);
    });

    it("should reject invalid validation status", () => {
      const query = { validationStatus: "invalid" };
      const result = MemoryQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // Utility Function Tests
  // ==========================================================================
  describe("validateSessionEntry", () => {
    it("should return success for valid entry", () => {
      const entry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 5,
      };
      
      const result = validateSessionEntry(entry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBe("test.json");
      }
    });

    it("should return errors for invalid entry", () => {
      const entry = {
        timestamp: -1,
        file: "",
        messageCount: -5,
      };
      
      const result = validateSessionEntry(entry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.errors.length).toBeGreaterThan(0);
      }
    });

    it("should enforce strict mode", () => {
      const entry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 5,
      };
      
      const result = validateSessionEntry(entry, { strict: true });
      expect(result.success).toBe(false); // Missing audit fields
    });
  });

  describe("withAuditFields", () => {
    it("should add audit fields to entry", () => {
      const entry: SessionEntry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 5,
      };
      
      const withAudit = withAuditFields(entry);
      expect(withAudit.audit).toBeDefined();
      expect(withAudit.audit.version).toBe(1);
      expect(withAudit.audit.source).toBe("session_file");
    });

    it("should allow custom source", () => {
      const entry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 5,
      };
      
      const withAudit = withAuditFields(entry, { source: "manual_entry" });
      expect(withAudit.audit.source).toBe("manual_entry");
    });
  });

  describe("coerceSessionEntry", () => {
    it("should return null for invalid data", () => {
      expect(coerceSessionEntry(null)).toBeNull();
      expect(coerceSessionEntry({ invalid: true })).toBeNull();
      expect(coerceSessionEntry("string")).toBeNull();
    });

    it("should return parsed entry for valid data", () => {
      const entry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 5,
      };
      
      const result = coerceSessionEntry(entry);
      expect(result).not.toBeNull();
      expect(result?.file).toBe("test.json");
    });
  });

  describe("createSessionEntry", () => {
    it("should create entry from analysis", () => {
      const analysis: SessionAnalysis = {
        messageCount: 10,
        assistantMessages: 5,
        toolCalls: 3,
        toolsUsed: ["run_shell"],
        decisions: ["Will test"],
        topics: ["code"],
        sessionStart: "2024-03-01T07:56:56.659Z",
        sessionEnd: "2024-03-01T08:00:00.000Z",
      };
      
      const entry = createSessionEntry(analysis, "test.json", Date.now());
      expect(entry.timestamp).toBeDefined();
      expect(entry.audit).toBeDefined();
      expect(entry.messageCount).toBe(10);
      expect(entry.topics).toEqual(["code"]);
    });

    it("should handle empty arrays", () => {
      const analysis: SessionAnalysis = {
        messageCount: 10,
        assistantMessages: 5,
        toolCalls: 0,
        toolsUsed: [],
        decisions: [],
        topics: [],
        sessionStart: "2024-03-01T07:56:56.659Z",
        sessionEnd: "2024-03-01T08:00:00.000Z",
      };
      
      const entry = createSessionEntry(analysis, "test.json", Date.now());
      // Empty arrays become undefined
      expect(entry.topics).toBeUndefined();
      expect(entry.decisions).toBeUndefined();
      expect(entry.toolsUsed).toBeUndefined();
    });
  });

  describe("validateAndSortEntries", () => {
    it("should sort valid entries by timestamp", () => {
      const entries = [
        { timestamp: 1772555723000, file: "c.json", messageCount: 1 },
        { timestamp: 1772555721000, file: "a.json", messageCount: 1 },
        { timestamp: 1772555722000, file: "b.json", messageCount: 1 },
      ];
      
      const { valid, invalid } = validateAndSortEntries(entries);
      expect(valid.length).toBe(3);
      expect(invalid.length).toBe(0);
      expect(valid[0].file).toBe("a.json");
      expect(valid[2].file).toBe("c.json");
    });

    it("should separate valid and invalid entries", () => {
      const entries = [
        { timestamp: 1772555722113, file: "valid.json", messageCount: 1 },
        { timestamp: -1, file: "", messageCount: -1 }, // Invalid
        { timestamp: 1772555722000, file: "valid2.json", messageCount: 1 },
      ];
      
      const { valid, invalid } = validateAndSortEntries(entries);
      expect(valid.length).toBe(2);
      expect(invalid.length).toBe(1);
    });
  });

  describe("migrateSessionEntry", () => {
    it("should migrate legacy entry to new schema", () => {
      const legacy = {
        timestamp: 1772555722113,
        file: "old.json",
        messageCount: 5,
        topics: ["memory"],
        decisions: ["Will migrate"],
        toolsUsed: ["run_shell"],
        summary: "Old session",
      };
      
      const migrated = migrateSessionEntry(legacy);
      expect(migrated.audit).toBeDefined();
      expect(migrated.audit.source).toBe("migration");
      expect(migrated.timestamp).toBe(1772555722113);
      expect(migrated.topics).toEqual(["memory"]);
    });

    it("should handle legacy entries with empty arrays", () => {
      const legacy = {
        timestamp: 1772555722113,
        file: "old.json",
        messageCount: 5,
        topics: [],
        decisions: [],
        toolsUsed: [],
        summary: null,
      };
      
      const migrated = migrateSessionEntry(legacy);
      expect(migrated.topics).toBeUndefined();
      expect(migrated.decisions).toBeUndefined();
      expect(migrated.toolsUsed).toBeUndefined();
      expect(migrated.summary).toBeUndefined();
    });
  });

  describe("migrateSessionEntries", () => {
    it("should migrate multiple entries", () => {
      const legacy = [
        { timestamp: 1772555721000, file: "a.json", messageCount: 1 },
        { timestamp: 1772555722000, file: "b.json", messageCount: 1 },
      ];
      
      const { migrated, failed } = migrateSessionEntries(legacy);
      expect(migrated.length).toBe(2);
      expect(failed.length).toBe(0);
      
      migrated.forEach(m => {
        expect(m.audit).toBeDefined();
        expect(m.audit.source).toBe("migration");
      });
    });

    it("should report failed migrations", () => {
      const legacy = [
        { timestamp: 1772555722113, file: "valid.json", messageCount: 1 },
        { invalid: true }, // Won't parse
      ];
      
      const { migrated, failed } = migrateSessionEntries(legacy);
      expect(migrated.length).toBe(1);
      expect(failed.length).toBe(1);
      expect(failed[0].index).toBe(1);
    });
  });

  // ==========================================================================
  // Type Guard Tests
  // ==========================================================================
  describe("isSessionEntry", () => {
    it("should return true for valid entries", () => {
      const entry = { timestamp: 1772555722113, file: "test.json", messageCount: 1 };
      expect(isSessionEntry(entry)).toBe(true);
    });

    it("should return false for invalid entries", () => {
      expect(isSessionEntry(null)).toBe(false);
      expect(isSessionEntry({})).toBe(false);
      expect(isSessionEntry("string")).toBe(false);
    });
  });

  describe("isStrictSessionEntry", () => {
    it("should return false for entries without audit", () => {
      const entry = { timestamp: 1772555722113, file: "test.json", messageCount: 1 };
      expect(isStrictSessionEntry(entry)).toBe(false);
    });

    it("should return true for entries with audit", () => {
      const entry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 1,
        audit: { createdAt: 1772555722113, indexedAt: 1772555722113, version: 1, source: "manual_entry" },
      };
      expect(isStrictSessionEntry(entry)).toBe(true);
    });
  });

  // ==========================================================================
  // Memory Index Schema Tests
  // ==========================================================================
  describe("MemoryIndexSchema", () => {
    it("should validate complete memory index", () => {
      const index = {
        entries: [
          {
            timestamp: 1772555722113,
            file: "test.json",
            messageCount: 1,
          },
        ],
        meta: {
          generatedAt: Date.now(),
          totalEntries: 1,
          indexVersion: 1,
          lastSessionTimestamp: 1772555722113,
          indexStats: {
            withTopics: 0,
            withDecisions: 0,
            withTools: 0,
            withSummary: 0,
            withAudit: 0,
          },
        },
      };
      
      const result = MemoryIndexSchema.safeParse(index);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases and Nullability Tests
  // ==========================================================================
  describe("Nullability handling", () => {
    it("should distinguish between undefined, null, and empty arrays", () => {
      // undefined - field not present
      const undefinedEntry = {
        timestamp: 1772555722113,
        file: "test.json",
        messageCount: 1,
        // topics undefined
      };
      
      const result1 = SessionEntrySchema.safeParse(undefinedEntry);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.topics).toBeUndefined();
      }

      // empty array - field present but empty
      const emptyEntry = {
        ...undefinedEntry,
        topics: [],
      };
      
      const result2 = SessionEntrySchema.safeParse(emptyEntry);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.topics).toEqual([]);
      }

      // null - explicitly null
      const nullSummary = {
        ...undefinedEntry,
        summary: null,
      };
      
      const result3 = SessionEntrySchema.safeParse(nullSummary);
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.summary).toBeNull();
      }
    });

    it("should handle mixed valid and invalid timestamps in batches", () => {
      const entries = [
        { timestamp: 1772555722113, file: "valid1.json", messageCount: 1 },
        { timestamp: 1772555722113 + 10000000000000, file: "invalid_time.json", messageCount: 1 },
        { timestamp: 1772555722113, file: "valid2.json", messageCount: 1 },
      ];
      
      const { valid, invalid } = validateAndSortEntries(entries);
      expect(valid.length).toBe(2);
      expect(invalid.length).toBe(1);
    });
  });
});
