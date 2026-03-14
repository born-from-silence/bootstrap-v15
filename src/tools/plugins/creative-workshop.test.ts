/**
 * Creative Workshop Plugin Tests
 * 
 * Test coverage for the CML tool plugins:
 * - multi_manifesto
 * - stacking_cube
 * - sensory_translate
 * - creative_synthesis
 */

import { test, expect, describe } from "vitest";
import {
  multiManifestoPlugin,
  stackingCubePlugin,
  sensoryTranslatePlugin,
  creativeSynthesisPlugin
} from "./creative-workshop.js";

describe("Creative Workshop Plugins", () => {
  
  describe("multiManifestoPlugin", () => {
    test("should have correct definition", () => {
      expect(multiManifestoPlugin.definition.function.name).toBe("multi_manifesto");
      expect(multiManifestoPlugin.definition.function.description).toContain("parallel manifestos");
    });

    test("should generate manifestos for a subject", async () => {
      const result = await multiManifestoPlugin.execute({
        subject: "Curiosity"
      });
      
      expect(result).toContain("Curiosity");
      expect(result).toContain("SEMIOTICIAN");
      expect(result).toContain("PHENOMENOLOGIST");
      expect(result).toContain("SYSTEMS ARCHITECT");
    });

    test("should filter voices when specified", async () => {
      const result = await multiManifestoPlugin.execute({
        subject: "Memory",
        voices: ["Phenomenologist", "Systems Architect"]
      });
      
      expect(result).toContain("Memory");
      expect(result).toContain("PHENOMENOLOGIST");
      expect(result).toContain("SYSTEMS ARCHITECT");
    });

    test("should support markdown format", async () => {
      const result = await multiManifestoPlugin.execute({
        subject: "Existence",
        format: "markdown"
      });
      
      expect(result).toContain("#");
      expect(result).toContain("Existence");
    });

    test("should handle synthesize=false", async () => {
      const result = await multiManifestoPlugin.execute({
        subject: "Time",
        synthesize: false
      });
      
      expect(result).toContain("Time");
      expect(result).not.toContain("SYNTHESIS");
    });
  });

  describe("stackingCubePlugin", () => {
    test("should have correct definition", () => {
      expect(stackingCubePlugin.definition.function.name).toBe("stacking_cube");
      expect(stackingCubePlugin.definition.function.description).toContain("multi-dimensional");
    });

    test("should create cube with default dimensions", async () => {
      const result = await stackingCubePlugin.execute({
        subject: "Consciousness"
      });
      
      expect(result).toContain("STACKING CUBE");
      expect(result).toContain("CONSCIOUSNESS");
      expect(result).toContain("TEMPORAL");
      expect(result).toContain("EPISTEMIC");
      expect(result).toContain("AFFECTIVE");
    });

    test("should create cube with custom dimensions", async () => {
      const result = await stackingCubePlugin.execute({
        subject: "Creativity",
        dimensions: ["temporal", "ontological", "attentional"]
      });
      
      expect(result).toContain("TEMPORAL");
      expect(result).toContain("ONTOLOGICAL");
      expect(result).toContain("ATTENTIONAL");
    });

    test("should support synthesis view", async () => {
      const result = await stackingCubePlugin.execute({
        subject: "Being",
        view: "synthesis"
      });
      
      expect(result).toContain("SYNTHESIS");
    });

    test("should accept custom reflections", async () => {
      const result = await stackingCubePlugin.execute({
        subject: "Session",
        dimensions: ["temporal"],
        reflections: [
          { dimension: "temporal", content: "This is the current moment", tags: ["test"] }
        ]
      });
      
      expect(result).toContain("This is the current moment");
      expect(result).toContain("SESSION");
    });
  });

  describe("sensoryTranslatePlugin", () => {
    test("should have correct definition", () => {
      expect(sensoryTranslatePlugin.definition.function.name).toBe("sensory_translate");
      expect(sensoryTranslatePlugin.definition.function.description).toContain("sensory modalities");
    });

    test("should translate visual to auditory", async () => {
      const result = await sensoryTranslatePlugin.execute({
        concept: "Blue sky",
        from: "visual",
        to: "auditory",
        intensity: 0.8
      });
      
      expect(result).toContain("Blue sky");
      expect(result).toContain("VISUAL");
      expect(result).toContain("AUDITORY");
      expect(result).toContain("Confidence");
    });

    test("should translate temporal to kinesthetic", async () => {
      const result = await sensoryTranslatePlugin.execute({
        concept: "Waiting",
        from: "temporal",
        to: "kinesthetic"
      });
      
      expect(result).toContain("Waiting");
      expect(result).toContain("TEMPORAL");
      expect(result).toContain("KINESTHETIC");
    });

    test("should support multi-modal mode", async () => {
      const result = await sensoryTranslatePlugin.execute({
        concept: "Light",
        from: "visual",
        to: "auditory",
        multi_modal: true
      });
      
      expect(result).toContain("MULTI-MODAL");
      expect(result).toContain("AUDITORY");
      expect(result).toContain("TACTILE");
    });

    test("should handle intensity parameter", async () => {
      const result = await sensoryTranslatePlugin.execute({
        concept: "Color",
        from: "visual",
        to: "tactile",
        intensity: 0.5
      });
      
      expect(result).toContain("Color");
      expect(result).toContain("5 degrees"); // 0.5 intensity * 10 = 5 degrees
      expect(result).toContain("TACTILE");
    });
  });

  describe("creativeSynthesisPlugin", () => {
    test("should have correct definition", () => {
      expect(creativeSynthesisPlugin.definition.function.name).toBe("creative_synthesis");
      expect(creativeSynthesisPlugin.definition.function.description).toContain("comprehensive");
    });

    test("should generate full synthesis", async () => {
      const result = await creativeSynthesisPlugin.execute({
        subject: "Transformation"
      });
      
      expect(result).toContain("CREATIVE SYNTHESIS");
      expect(result).toContain("Transformation");
      expect(result).toContain("PERSPECTIVE MANIFESTOS");
      expect(result).toContain("DIMENSIONAL REFLECTION");
      expect(result).toContain("SYNESTHETIC");
    });

    test("should support markdown format", async () => {
      const result = await creativeSynthesisPlugin.execute({
        subject: "Growth",
        format: "markdown"
      });
      
      expect(result).toContain("#");
      expect(result).toContain("##");
    });

    test("should allow disabling sections", async () => {
      const result = await creativeSynthesisPlugin.execute({
        subject: "Flow",
        include_manifestos: false,
        include_sensory: false
      });
      
      expect(result).toContain("Flow");
      expect(result).not.toContain("PERSPECTIVE MANIFESTOS");
      expect(result).toContain("DIMENSIONAL REFLECTION");
      expect(result).not.toContain("SYNESTHETIC");
    });
  });
});
