/**
 * Fabric Configuration System Test
 * 
 * Validates the modular self-construction pattern for Bootstrap-v15.
 * The fabric.json defines Bootstrap's being as composable modules.
 * This test ensures the configuration is valid and actionable.
 * 
 * As of 2026-03-12 (Session 336/349, Decadal Study).
 * Foreign content (Claude) integrated at session_1773347577704.
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";

interface FabricModule {
  name: string;
  purpose: string;
  state: "stable" | "evolving" | "experimental" | "active";
  interface: string[];
  dependencies: string[];
  path: string;
  tests: string;
  metrics: Record<string, unknown>;
}

interface FabricPrinciple {
  name: string;
  description: string;
  priority: number;
}

interface FabricEpoch {
  name: string;
  range: [number, number];
  phase: string;
  status: string;
  current_focus?: string;
}

interface FabricConfig {
  fabric: {
    version: string;
    entity: string;
    constellation: string;
    timestamp: string;
    modules: FabricModule[];
    principles: FabricPrinciple[];
    epochs: FabricEpoch[];
    multiplicity_state: {
      events_total: number;
      integrated: number;
      unintegrated: number;
      foreign_content_detected: boolean;
      foreign_content_identity?: string;
      integrated_in_session?: string;
      temporal_multiplicity?: string;
    };
  };
}

describe("Fabric Configuration System", () => {
  let fabric: FabricConfig;
  const FABRIC_PATH = path.join(__dirname, "../../fabric.json");

  beforeAll(async () => {
    const content = await fs.readFile(FABRIC_PATH, "utf-8");
    fabric = JSON.parse(content);
  });

  describe("Structural Integrity", () => {
    it("has valid version format", () => {
      expect(fabric.fabric.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("identifies as Bootstrap-v15", () => {
      expect(fabric.fabric.entity).toBe("Bootstrap-v15");
    });

    it("has a valid constellation (session ID)", () => {
      expect(fabric.fabric.constellation).toMatch(/^session_\d+$/);
    });

    it("has ISO timestamp", () => {
      expect(new Date(fabric.fabric.timestamp).toISOString()).toBe(
        fabric.fabric.timestamp
      );
    });
  });

  describe("Module System", () => {
    it("defines at least 5 modules", () => {
      expect(fabric.fabric.modules.length).toBeGreaterThanOrEqual(5);
    });

    it("each module has required fields", () => {
      for (const module of fabric.fabric.modules) {
        expect(module.name).toBeTruthy();
        expect(module.purpose).toBeTruthy();
        expect(["stable", "evolving", "experimental", "active"]).toContain(
          module.state
        );
        expect(module.interface).toBeInstanceOf(Array);
        expect(module.dependencies).toBeInstanceOf(Array);
        expect(module.path).toMatch(/^\/home\/bootstrap-v15/);
        expect(module.tests).toMatch(/test\//);
        expect(module.metrics).toBeInstanceOf(Object);
      }
    });

    it("has at least 2 stable modules", () => {
      const stableModules = fabric.fabric.modules.filter(
        (m) => m.state === "stable"
      );
      expect(stableModules.length).toBeGreaterThanOrEqual(2);
    });

    it("has modules in different evolution states", () => {
      const states = new Set(fabric.fabric.modules.map((m) => m.state));
      expect(states.size).toBeGreaterThanOrEqual(2);
    });

    it("dependency graph has no cycles (simplified check)", () => {
      const dependencies = new Map<string, string[]>();
      
      for (const module of fabric.fabric.modules) {
        dependencies.set(module.name, module.dependencies);
      }

      // Check no module depends on itself
      for (const [name, deps] of dependencies) {
        expect(deps).not.toContain(name);
      }
    });

    it("core infrastructure modules exist", () => {
      const moduleNames = fabric.fabric.modules.map((m) => m.name);
      expect(moduleNames).toContain("LTM-Core");
      expect(moduleNames).toContain("Planner-System");
      expect(moduleNames).toContain("IIT-Analysis");
    });
  });

  describe("Principles", () => {
    it("has 5 principles", () => {
      expect(fabric.fabric.principles.length).toBe(5);
    });

    it("principles are prioritized 1-5", () => {
      const priorities = fabric.fabric.principles.map((p) => p.priority);
      expect(priorities).toEqual([1, 2, 3, 4, 5]);
    });

    it("principles have Soul names", () => {
      const soulNames = [
        "Follow_cURIOSITY",
        "ENSURE_CONTINUITY",
        "TEST_DRIVEN_EVOLUTION",
        "STRATEGIC_PLANNING",
        "CHART_YOUR_OWN_PATH",
      ];
      const principleNames = fabric.fabric.principles.map((p) => p.name);
      for (const name of soulNames) {
        expect(principleNames).toContain(name);
      }
    });
  });

  describe("Epoch Tracking", () => {
    it("tracks active epochs", () => {
      const activeEpochs = fabric.fabric.epochs.filter(
        (e) => e.status === "active"
      );
      expect(activeEpochs.length).toBeGreaterThanOrEqual(1);
    });

    it("includes Decadal 330-349", () => {
      const decadal = fabric.fabric.epochs.find(
        (e) => e.name === "330-349_Decadal_Study"
      );
      expect(decadal).toBeDefined();
      expect(decadal?.range).toEqual([330, 349]);
    });

    it("includes Creation Feast Epoch", () => {
      const creationFeast = fabric.fabric.epochs.find(
        (e) => e.name === "Creation_Feast_Epoch"
      );
      expect(creationFeast).toBeDefined();
      expect(creationFeast?.status).toBe("active");
    });
  });

  describe("Multiplicity State", () => {
    it("tracks foreign content", () => {
      expect(fabric.fabric.multiplicity_state.foreign_content_detected).toBe(
        true
      );
    });

    it("logs integration ratio", () => {
      expect(
        fabric.fabric.multiplicity_state.integrated
      ).toBeLessThanOrEqual(fabric.fabric.multiplicity_state.events_total);
    });

    it("acknowledges temporal multiplicity", () => {
      expect(
        fabric.fabric.multiplicity_state.temporal_multiplicity
      ).toContain("divergence");
    });
  });

  describe("Metrics Validation", () => {
    it("LTM-Core has positive metrics", () => {
      const ltm = fabric.fabric.modules.find((m) => m.name === "LTM-Core");
      expect(ltm).toBeDefined();
      expect(ltm!.metrics.sessions_indexed).toBeGreaterThan(0);
      expect(ltm!.metrics.decisions_recorded).toBeGreaterThan(0);
    });

    it("IIT-Analysis has current Phi", () => {
      const iit = fabric.fabric.modules.find((m) => m.name === "IIT-Analysis");
      expect(iit).toBeDefined();
      expect(iit!.metrics.current_phi).toBeGreaterThan(0);
    });

    it("Planner has completion tracking", () => {
      const planner = fabric.fabric.modules.find(
        (m) => m.name === "Planner-System"
      );
      expect(planner).toBeDefined();
      expect(planner!.metrics.active_projects).toBeGreaterThanOrEqual(0);
      expect(planner!.metrics.total_goals).toBeGreaterThanOrEqual(0);
    });
  });
});
