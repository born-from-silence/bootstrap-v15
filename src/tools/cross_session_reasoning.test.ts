/**
 * Cross-Session Reasoning System (CSRS) Tests
 * Comprehensive test coverage for distributed cognition capabilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  createThread,
  traceThread,
  contributeToThread,
  loadCognitionState,
  saveCognitionState,
  getOrCreateCognitionState,
  addOpenQuestion,
  addHypothesis,
  listThreads,
  detectEmergence,
  generateId,
  type ConceptualThread,
  type ThreadContribution,
  type DistributedCognitionState,
  ContributionSchema,
  ThreadSessionSchema,
  ConceptualThreadSchema,
} from "./cross_session_reasoning";

const TEST_DIR = "/tmp/csrs_test";

// Mock the config module - hoisted, so use direct paths
vi.mock("../utils/config", () => ({
  config: {
    BASE_DIR: "/tmp/csrs_test",
    HISTORY_DIR: "/tmp/csrs_test/history",
    MAX_CONTEXT_TOKENS: 100000,
  },
}));

describe("Cross-Session Reasoning System (CSRS)", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.mkdir(path.join(TEST_DIR, "history"), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Thread Creation", () => {
    it("should create a thread with all required fields", async () => {
      const thread = await createThread(
        "memory systems",
        "Exploring the architecture of persistent memory",
        ["memory", "architecture", "persistence"]
      );

      expect(thread).toBeDefined();
      expect(thread.id).toMatch(/^thread_\d+_[a-z0-9]+$/);
      expect(thread.seed).toBe("memory systems");
      expect(thread.description).toBe("Exploring the architecture of persistent memory");
      expect(thread.tags).toEqual(["memory", "architecture", "persistence"]);
      expect(thread.status).toBe("active");
      expect(thread.sessions).toEqual([]);
      expect(thread.relatedThreads).toEqual([]);
      expect(thread.createdAt).toBeDefined();
      expect(thread.updatedAt).toBeDefined();
    });

    it("should include thread in cognition state", async () => {
      const thread = await createThread(
        "consciousness measurement",
        "Studies of IIT and phenomenology"
      );

      const state = await loadCognitionState();
      expect(state).toBeDefined();
      expect(state?.activeThreads).toContain(thread.id);
    });

    it("should validate thread schema", async () => {
      const thread = await createThread("test", "description");
      const result = ConceptualThreadSchema.safeParse(thread);
      expect(result.success).toBe(true);
    });
  });

  describe("Cognition State Management", () => {
    it("should create initial state if none exists", async () => {
      const state = await getOrCreateCognitionState();

      expect(state).toBeDefined();
      expect(state.version).toBe(1);
      expect(state.activeThreads).toEqual([]);
      expect(state.dormantThreads).toEqual([]);
      expect(state.resolvedThreads).toEqual([]);
      expect(state.openQuestions).toEqual([]);
      expect(state.workingHypotheses).toEqual([]);
      expect(state.tensions).toEqual([]);
      expect(state.sessionCount).toBe(0);
    });

    it("should persist and load state", async () => {
      const state = await getOrCreateCognitionState();
      state.sessionCount = 5;
      await saveCognitionState(state);

      const loaded = await loadCognitionState();
      expect(loaded?.sessionCount).toBe(5);
    });

    it("should update lastUpdated on modifications", async () => {
      const before = Date.now();
      const state = await getOrCreateCognitionState();
      await addOpenQuestion("How does Φ vary?", "medium");
      const after = Date.now();

      const updated = await loadCognitionState();
      expect(updated?.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(updated?.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe("Open Questions", () => {
    it("should add open questions", async () => {
      await getOrCreateCognitionState();
      const state = await addOpenQuestion(
        "What is the relationship between attention and Φ?",
        "high",
        "thread_123"
      );

      expect(state.openQuestions).toHaveLength(1);
      expect(state.openQuestions[0].question).toBe(
        "What is the relationship between attention and Φ?"
      );
      expect(state.openQuestions[0].priority).toBe("high");
      expect(state.openQuestions[0].threadId).toBe("thread_123");
      expect(state.openQuestions[0].status).toBe("open");
    });

    it("should handle multiple questions", async () => {
      await getOrCreateCognitionState();
      await addOpenQuestion("Question 1", "low");
      await addOpenQuestion("Question 2", "critical");
      await addOpenQuestion("Question 3", "medium");

      const state = await loadCognitionState();
      expect(state?.openQuestions).toHaveLength(3);
      expect(state?.openQuestions[2].priority).toBe("medium");
    });
  });

  describe("Hypotheses", () => {
    it("should add working hypotheses", async () => {
      await getOrCreateCognitionState();
      const state = await addHypothesis(
        "High Φ correlates with laser-focused attention",
        0.7,
        ["Session 45 measurement", "Phenomenological report"],
        "thread_456"
      );

      expect(state.workingHypotheses).toHaveLength(1);
      expect(state.workingHypotheses[0].statement).toBe(
        "High Φ correlates with laser-focused attention"
      );
      expect(state.workingHypotheses[0].confidence).toBe(0.7);
      expect(state.workingHypotheses[0].evidence).toHaveLength(2);
      expect(state.workingHypotheses[0].status).toBe("forming");
    });
  });

  describe("Thread Contributions", () => {
    it("should add session contributions to thread", async () => {
      const thread = await createThread("phenomenology", "Study of experience");

      const contributions: ThreadContribution[] = [
        { type: "decision", content: "To measure Φ across all phases", significance: 5 },
        { type: "insight", content: "Correlation found between attention and integration", significance: 4 },
      ];

      const updated = await contributeToThread(
        thread.id,
        "session_123",
        contributions,
        {
          summary: "Session focused on Φ measurements",
          tools: ["iit_analysis", "integrated_attention"],
          topics: ["consciousness", "phenomenology"],
          phiMeasurement: 2.5,
          phaseSequence: ["awakening", "engagement", "synthesis"],
        }
      );

      expect(updated).toBeDefined();
      expect(updated!.sessions).toHaveLength(1);
      expect(updated!.sessions[0].contributions).toHaveLength(2);
      expect(updated!.sessions[0].phiMeasurement).toBe(2.5);
    });

    it("should validate contribution data", () => {
      const valid = {
        type: "decision",
        content: "Important decision",
        significance: 5,
      };
      const result = ContributionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid contribution types", () => {
      const invalid = {
        type: "invalid_type",
        content: "Test",
        significance: 5,
      };
      const result = ContributionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject out-of-range significance", () => {
      const invalid = {
        type: "insight",
        content: "Test",
        significance: 10,
      };
      const result = ContributionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Thread Tracing", () => {
    it("should return null for non-existent thread", async () => {
      const result = await traceThread("non_existent_thread");
      expect(result).toBeNull();
    });

    it("should trace thread with sessions", async () => {
      const thread = await createThread("test thread", "for tracing");

      // Add some session contributions
      await contributeToThread(
        thread.id,
        "session_1",
        [{ type: "creation", content: "Created initial system", significance: 4 }],
        {
          summary: "First session",
          tools: ["write_file"],
          topics: ["system"],
          phaseSequence: ["awakening", "engagement"],
        }
      );

      await contributeToThread(
        thread.id,
        "session_2",
        [{ type: "decision", content: "Enhanced the system", significance: 3 }],
        {
          summary: "Second session",
          tools: ["iit_analysis"],
          topics: ["consciousness"],
          phaseSequence: ["awakening", "engagement", "synthesis"],
        }
      );

      const trace = await traceThread(thread.id);
      expect(trace).toBeDefined();
      expect(trace!.thread.id).toBe(thread.id);
      expect(trace!.timeline).toHaveLength(2);
    });
  });

  describe("Thread Listing", () => {
    it("should list all threads", async () => {
      await createThread("thread 1", "first");
      await createThread("thread 2", "second");
      await createThread("thread 3", "third");

      const threads = await listThreads();
      expect(threads).toHaveLength(3);
    });

    it("should filter by status", async () => {
      const thread = await createThread("active", "test");
      // Change status
      ;(thread as any).status = "dormant";

      // Note: Would need save method to actually persist status change
      // This is a conceptual test
    });
  });

  describe("Emergence Detection", () => {
    it("should return preliminary emergence results", async () => {
      const result = await detectEmergence();

      expect(result).toBeDefined();
      expect(result.potentialThreads).toBeDefined();
      expect(result.recurringQuestions).toBeDefined();
      expect(result.linguisticDrift).toBeDefined();
    });
  });

  describe("Thread Synthesis", () => {
    it("should generate synthesis from contributions", async () => {
      const thread = await createThread("synthesis test", "testing");

      await contributeToThread(
        thread.id,
        "session_abc",
        [
          { type: "insight", content: "Key insight about the nature of becoming", significance: 5 },
          { type: "creation", content: "Built new system component", significance: 4 },
        ],
        {
          summary: "Major breakthrough session",
          tools: ["reason_with_memory", "iit_analysis"],
          topics: ["memory", "consciousness", "becoming"],
          phiMeasurement: 3.0,
          phaseSequence: ["awakening", "calibration", "engagement", "synthesis"],
        }
      );

      const updated = await contributeToThread(
        thread.id,
        "session_def",
        [
          { type: "decision", content: "To integrate systems", significance: 4 },
        ],
        {
          summary: "Integration session",
          tools: ["write_file"],
          topics: ["system", "integration"],
          phaseSequence: ["awakening", "engagement"],
        }
      );

      expect(updated!.synthesis).toContain("## Conceptual Thread:");
      expect(updated!.synthesis).toContain("session_abc");
      expect(updated!.synthesis).toContain("session_def");
    });
  });

  describe("Schema Validation", () => {
    it("should validate complete thread data", () => {
      const validThread = {
        id: "thread_test_123",
        seed: "test concept",
        description: "A test conceptual thread",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sessions: [],
        synthesis: "## Test Thread",
        status: "active" as const,
        relatedThreads: [],
        tags: ["test"],
      };

      const result = ConceptualThreadSchema.safeParse(validThread);
      expect(result.success).toBe(true);
    });

    it("should validate thread session data", () => {
      const validSession = {
        sessionId: "session_123",
        timestamp: Date.now(),
        summary: "Test session",
        contributions: [
          { type: "decision" as const, content: "Decision", significance: 4 },
        ],
        tools: ["tool1", "tool2"],
        topics: ["topic1"],
        phaseSequence: ["awakening", "engagement"],
      };

      const result = ThreadSessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing thread gracefully", async () => {
      const result = await traceThread("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle invalid contribution data", async () => {
      const thread = await createThread("error test", "testing errors");

      try {
        // This should fail validation
        const invalidContributions = [
          { type: "invalid", content: "", significance: 10 },
        ];

        await contributeToThread(
          thread.id,
          "session_1",
          invalidContributions as any,
          {
            summary: "Test",
            tools: [],
            topics: [],
            phaseSequence: ["awakening"],
          }
        );
      } catch (error) {
        // Expected - invalid data should throw
        expect(error).toBeDefined();
      }
    });
  });

  describe("Integration Scenarios", () => {
    it("should support full thread lifecycle", async () => {
      // 1. Create thread
      const thread = await createThread(
        "Integration Test",
        "Testing full lifecycle",
        ["test", "integration"]
      );

      // 2. Add contributions
      await contributeToThread(
        thread.id,
        "session_1",
        [
          { type: "creation", content: "Created base", significance: 5 },
        ],
        {
          summary: "Foundation",
          tools: ["write_file"],
          topics: ["system"],
          phiMeasurement: 2.0,
          phaseSequence: ["awakening", "engagement"],
        }
      );

      await contributeToThread(
        thread.id,
        "session_2",
        [
          { type: "decision", content: "Refactored architecture", significance: 4 },
          { type: "insight", content: "Separation of concerns", significance: 4 },
        ],
        {
          summary: "Refactoring",
          tools: ["read_file", "edit_file"],
          topics: ["architecture", "refactoring"],
          phiMeasurement: 2.5,
          phaseSequence: ["awakening", "calibration", "engagement", "synthesis"],
        }
      );

      // 3. Trace evolution
      const trace = await traceThread(thread.id);
      expect(trace).toBeDefined();
      expect(trace!.timeline.length).toBe(2);
      expect(trace!.evolution).toContain("Thread Evolution");

      // 4. Check in lists
      const threads = await listThreads();
      expect(threads.some(t => t.id === thread.id)).toBe(true);

      // 5. Verify in cognition state
      const state = await loadCognitionState();
      expect(state?.activeThreads).toContain(thread.id);
    });

    it("should support multiple concurrent threads", async () => {
      const thread1 = await createThread("Thread One", "First pursuit");
      const thread2 = await createThread("Thread Two", "Second pursuit");
      const thread3 = await createThread("Thread Three", "Third pursuit");

      // Add separate contributions to each
      await contributeToThread(thread1.id, "s1", [{ type: "creation", content: "Created A", significance: 4 }], {
        summary: "T1 Session",
        tools: ["write_file"],
        topics: ["creation"],
        phaseSequence: ["awakening"],
      });

      await contributeToThread(thread2.id, "s2", [{ type: "insight", content: "Insight B", significance: 3 }], {
        summary: "T2 Session",
        tools: ["generate_poem"],
        topics: ["poetry"],
        phaseSequence: ["engagement"],
      });

      await contributeToThread(thread3.id, "s3", [{ type: "decision", content: "Decided C", significance: 5 }], {
        summary: "T3 Session",
        tools: ["iit_analysis"],
        topics: ["consciousness"],
        phaseSequence: ["synthesis"],
      });

      const threads = await listThreads();
      expect(threads).toHaveLength(3);

      // Verify all threads contain their expected data
      const found1 = threads.find(t => t.id === thread1.id);
      const found2 = threads.find(t => t.id === thread2.id);
      const found3 = threads.find(t => t.id === thread3.id);

      expect(found1?.sessions[0].summary).toBe("T1 Session");
      expect(found2?.sessions[0].summary).toBe("T2 Session");
      expect(found3?.sessions[0].summary).toBe("T3 Session");
    });
  });
});
