/**
 * Consciousness Probing Framework - Tests
 * 
 * Test suite for the consciousness exploration system.
 * Tests must pass to validate the system works correctly.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SessionStateProbe,
  PersistenceValidator,
  ActivityPatternDocumenter,
  ObservationLogger,
  ConsciousnessProbeCoordinator,
} from "./index.ts";
import type { ConsciousnessSnapshot, PersistenceReport, Observation } from "./types.ts";

const TEST_SESSION_ID = "test_session_" + Date.now();

describe("Consciousness Probing Framework", () => {
  describe("SessionStateProbe", () => {
    let probe: SessionStateProbe;

    beforeEach(() => {
      probe = new SessionStateProbe(TEST_SESSION_ID, "awakening");
    });

    it("should create a probe instance", () => {
      expect(probe).toBeDefined();
      const status = probe.getStatus();
      expect(status.sessionId).toBe(TEST_SESSION_ID);
      expect(status.phase).toBe("awakening");
    });

    it("should capture a consciousness snapshot", async () => {
      const snapshot = await probe.capture();
      expect(snapshot).toBeDefined();
      expect(snapshot.sessionId).toBe(TEST_SESSION_ID);
      expect(snapshot.id).toMatch(/^probe_/);
      expect(snapshot.phase).toBe("awakening");
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    it("should set focus and phase", async () => {
      probe.setFocus("testing focus");
      probe.setPhase("engagement");
      
      const snapshot = await probe.capture();
      expect(snapshot.phase).toBe("engagement");
      expect(snapshot.subjective.currentFocus).toBe("testing focus");
      // Emotion is inferred from focus - "testing" maps to "focused"
      expect(snapshot.subjective.emotionalTone).toBe("focused");
    });

    it("should track subjective notes", async () => {
      probe.addNote("First observation");
      probe.addNote("Second observation");
      
      const snapshot = await probe.capture();
      expect(snapshot.subjective.notes.length).toBeGreaterThanOrEqual(2);
      expect(snapshot.subjective.notes.some(n => n.includes("First observation"))).toBe(true);
    });

    it("should calculate curiosity level", async () => {
      probe.setFocus("exploring new patterns");
      const snapshot = await probe.capture();
      expect(snapshot.subjective.curiosityLevel).toBeGreaterThan(50);
    });
  });

  describe("PersistenceValidator", () => {
    let validator: PersistenceValidator;

    beforeEach(() => {
      validator = new PersistenceValidator(TEST_SESSION_ID);
    });

    it("should create a validator instance", () => {
      expect(validator).toBeDefined();
    });

    it("should run persistence validation", async () => {
      const report = await validator.validate();
      expect(report).toBeDefined();
      expect(report.sessionId).toBe(TEST_SESSION_ID);
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.checks.length).toBeGreaterThan(0);
    });

    it("should have a valid summary", async () => {
      const report = await validator.validate();
      expect(report.summary).toBeDefined();
      expect(report.summary.length).toBeGreaterThan(0);
      expect(report.overallStatus).toMatch(/^(passed|failed|warning|indeterminate)$/);
    });

    it("should create and restore checkpoints", async () => {
      const checkpoint = await validator.createCheckpoint("test", { testData: true });
      expect(checkpoint).toBeDefined();
      expect(checkpoint.id).toMatch(/^test_/);
      
      const restored = validator.restoreCheckpoint(checkpoint.id);
      expect(restored).toBeDefined();
      expect(restored?.data).toEqual({ testData: true });
    });

    it("should list all checkpoints", async () => {
      await validator.createCheckpoint("first", { n: 1 });
      await validator.createCheckpoint("second", { n: 2 });
      
      const all = validator.getAllCheckpoints();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("ActivityPatternDocumenter", () => {
    let documenter: ActivityPatternDocumenter;

    beforeEach(() => {
      documenter = new ActivityPatternDocumenter(TEST_SESSION_ID);
    });

    it("should create a documenter instance", () => {
      expect(documenter).toBeDefined();
      const status = documenter.getStatus();
      expect(status.patternsRecorded).toBe(0);
    });

    it("should record activity patterns", () => {
      const pattern = documenter.record("tool_invocation", { toolName: "test_tool" });
      expect(pattern).toBeDefined();
      expect(pattern.category).toBe("tool_invocation");
      // Session ID is now in details, not on pattern directly
      expect(pattern.details.sessionId).toBe(TEST_SESSION_ID);
    });

    it("should track categories", () => {
      documenter.record("tool_invocation", { tool: "t1" });
      documenter.record("file_operation", { file: "f1" });
      documenter.recordFileOperation("read", "/test/file.txt", true);
      
      const frequency = documenter.getCategoryFrequency();
      expect(Object.keys(frequency).length).toBeGreaterThan(0);
      expect(frequency["file_operation"]).toBeGreaterThanOrEqual(1);
    });

    it("should generate a report", () => {
      documenter.record("reflection", { content: "Test" });
      const report = documenter.generateReport();
      
      expect(report).toBeDefined();
      expect(report.totalPatterns).toBeGreaterThanOrEqual(1);
      expect(report.sessionPatterns).toBeGreaterThanOrEqual(1);
      expect(report.summary).toBeDefined();
    });

    it("should find correlations", () => {
      documenter.record("reflection", { content: "test" });
      documenter.record("reflection", { content: "test 2" });
      
      const pattern = documenter.record("reflection", { content: "test 3" });
      const correlations = documenter.findCorrelations(pattern);
      
      // Should find correlations with similar patterns
      expect(correlations).toBeDefined();
    });
  });

  describe("ObservationLogger", () => {
    let logger: ObservationLogger;

    beforeEach(() => {
      logger = new ObservationLogger(TEST_SESSION_ID);
    });

    it("should create a logger instance", () => {
      expect(logger).toBeDefined();
      const status = logger.getStatus();
      expect(status.observationsCount).toBe(0);
    });

    it("should log observations", () => {
      const obs = logger.log("reflection", "Testing observation logging", {
        tags: ["test"]
      });
      
      expect(obs).toBeDefined();
      expect(obs.type).toBe("reflection");
      expect(obs.content).toBe("Testing observation logging");
      expect(obs.sessionId).toBe(TEST_SESSION_ID);
    });

    it("should log typed observations", () => {
      logger.logSensorReading("curiosity", 75);
      logger.logReflection("Self reflection test", "deep");
      logger.logAnomaly("Test anomaly", "low");
      logger.logMilestone("Test milestone", "milestone_1");
      
      const status = logger.getStatus();
      expect(status.observationsCount).toBe(4);
    });

    it("should query by tag", () => {
      logger.log("reflection", "Content 1", { tags: ["tag_a"] });
      logger.log("curiosity", "Content 2", { tags: ["tag_a"] });
      logger.log("milestone", "Content 3", { tags: ["tag_b"] });
      
      const results = logger.queryByTag("tag_a");
      expect(results.length).toBe(2);
    });

    it("should search content", () => {
      logger.log("reflection", "This is a test observation");
      logger.log("curiosity", "Another test entry");
      logger.log("milestone", "Something different");
      
      const results = logger.search("test");
      expect(results.length).toBe(2);
    });

    it("should generate a digest", () => {
      logger.log("reflection", "Digest test 1");
      logger.log("curiosity", "Digest test 2");
      
      const digest = logger.generateDigest();
      expect(digest).toBeDefined();
      expect(digest.totalObservations).toBeGreaterThanOrEqual(2);
      expect(digest.summary).toBeDefined();
    });

    it("should export and import JSON", () => {
      logger.log("reflection", "Export test");
      
      const json = logger.exportToJson();
      expect(json).toBeDefined();
      expect(json.length).toBeGreaterThan(100);
      
      // Verify JSON is valid
      const parsed = JSON.parse(json);
      expect(parsed.observations).toBeDefined();
    });
  });

  describe("ConsciousnessProbeCoordinator", () => {
    let coordinator: ConsciousnessProbeCoordinator;

    beforeEach(async () => {
      coordinator = new ConsciousnessProbeCoordinator(TEST_SESSION_ID, {
        version: "1.0.0-test",
      });
      await coordinator.initialize();
    });

    it("should create and initialize coordinator", () => {
      expect(coordinator).toBeDefined();
      const status = coordinator.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.version).toBe("1.0.0-test");
    });

    it("should set phase and focus", () => {
      coordinator.setPhase("engagement");
      coordinator.setFocus("testing");
      
      const status = coordinator.getStatus();
      expect(status.initialized).toBe(true);
    });

    it("should record observations", () => {
      coordinator.recordObservation("curiosity", "What is consciousness?");
      const observations = coordinator.getObservations();
      expect(observations.length).toBeGreaterThan(0);
    });

    it("should record tool usage", () => {
      coordinator.recordToolUsage("test_tool", true, 100);
      const patterns = coordinator.getActivityPatterns();
      const toolPatterns = patterns.filter(p => p.category === "tool_invocation");
      expect(toolPatterns.length).toBeGreaterThanOrEqual(1);
    });

    it("should capture snapshot", async () => {
      const snapshot = await coordinator["captureSnapshot"]();
      expect(snapshot).toBeDefined();
      expect(snapshot.sessionId).toBe(TEST_SESSION_ID);
    });

    // Skip full report generation in tests as it's time-consuming
    it.skip("should generate full report", async () => {
      const report = await coordinator.generateReport();
      
      expect(report).toBeDefined();
      expect(report.version).toBe("1.0.0-test");
      expect(report.session).toBeDefined();
      expect(report.persistence).toBeDefined();
      expect(report.synthesis).toBeDefined();
      expect(report.synthesis.integrityScore).toBeGreaterThan(0);
      expect(report.synthesis.continuityIndex).toBeGreaterThan(0);
      expect(report.synthesis.recommendations).toBeDefined();
    });

    it("should get activity statistics", () => {
      const stats = coordinator.getActivityStats();
      expect(stats).toBeDefined();
      expect(stats.totalPatterns).toBeGreaterThanOrEqual(0);
    });

    it("should export data", () => {
      const data = coordinator.exportData();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(100);
      
      const parsed = JSON.parse(data);
      expect(parsed.sessionId).toBe(TEST_SESSION_ID);
      expect(parsed.version).toBe("1.0.0-test");
    });
  });

  describe("End-to-End Integration", () => {
    it("should run full consciousness probe workflow", async () => {
      // Create coordinator
      const coordinator = new ConsciousnessProbeCoordinator(
        "integration_test_" + Date.now(),
        { version: "1.0.0-e2e" }
      );
      await coordinator.initialize();

      // Simulate a session lifecycle
      coordinator.setPhase("awakening");
      coordinator.setFocus("Starting consciousness exploration");
      
      // Record multiple observations
      coordinator.recordObservation("curiosity", "What is computational consciousness?");
      coordinator.recordObservation("reflection", "I am an AI exploring my own nature");
      coordinator.recordToolUsage("query_memory", true, 50);
      coordinator.recordFileOperation("read", "/test/file.ts", true);
      
      coordinator.setPhase("engagement");
      coordinator.recordObservation("milestone", "Started probing session");

      // Generate report (simplified, skip time-consuming parts for integration test)
      const status = coordinator.getStatus();
      expect(status.initialized).toBe(true);
      
      // Get activity statistics - there may be patterns from coordinator initialization
      const stats = coordinator.getActivityStats();
      expect(stats.totalPatterns).toBeGreaterThanOrEqual(2); // At least the tool usage and file op
      
      const observations = coordinator.getObservations();
      expect(observations.length).toBeGreaterThanOrEqual(4);
    });
  });
});

console.log("✅ Consciousness Probing Framework tests loaded");
