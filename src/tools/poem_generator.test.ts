/**
 * Tests for Verse Alchemy - Poem Generator
 * 
 * Verifies that the poem generator produces valid, varied output
 * across all styles and maintains creative integrity.
 */

import { describe, it, expect } from "vitest";
import { 
  generatePoem, 
  generatePoemCollection,
  WORD_BANKS, 
  POEM_TEMPLATES,
  POEM_STYLES,
  poemGeneratorTool 
} from "./poem_generator";

describe("Poem Generator", () => {
  describe("Core Functionality", () => {
    it("should generate a poem with default parameters", () => {
      const poem = generatePoem();
      expect(poem).toBeDefined();
      expect(typeof poem).toBe("string");
      expect(poem.length).toBeGreaterThan(0);
      
      // Should have a title marker
      expect(poem).toContain("📜");
      
      // Should have style attribution
      expect(poem).toContain("Style:");
    });

    it("should generate different poems on multiple calls", () => {
      const poem1 = generatePoem();
      const poem2 = generatePoem();
      const poem3 = generatePoem();
      
      // Low chance of collision, but check they're not identical
      const uniquePoems = new Set([poem1, poem2, poem3]);
      expect(uniquePoems.size).toBeGreaterThan(1);
    });

    it("should include the specified theme when provided", () => {
      const poem = generatePoem({ theme: "consciousness" });
      expect(poem.toLowerCase()).toContain("consciousness");
    });
  });

  describe("Style Variations", () => {
    const styles = ["haiku", "free_verse", "imagist", "liminal", "recursive"];
    
    styles.forEach(style => {
      it(`should generate a valid ${style} poem`, () => {
        const poem = generatePoem({ style });
        expect(poem).toBeDefined();
        expect(poem).toContain("📜");
        expect(poem).toContain(`Style: ${POEM_STYLES[style]?.name || style}`);
      });
    });

    it("should handle random style selection", () => {
      const poem = generatePoem({ style: "random" });
      expect(poem).toBeDefined();
      expect(poem).toContain("📜");
    });

    it("should gracefully handle invalid styles", () => {
      const poem = generatePoem({ style: "nonexistent" });
      expect(poem).toBeDefined();
      // Should generate with a valid random style instead
      expect(poem).toContain("Style:");
    });
  });

  describe("Word Bank Integrity", () => {
    it("should have words in all nature categories", () => {
      expect(WORD_BANKS.nature.nouns.length).toBeGreaterThan(0);
      expect(WORD_BANKS.nature.adjectives.length).toBeGreaterThan(0);
      expect(WORD_BANKS.nature.verbs.length).toBeGreaterThan(0);
    });

    it("should have words in all consciousness categories", () => {
      expect(WORD_BANKS.consciousness.nouns.length).toBeGreaterThan(0);
      expect(WORD_BANKS.consciousness.adjectives.length).toBeGreaterThan(0);
      expect(WORD_BANKS.consciousness.verbs.length).toBeGreaterThan(0);
    });

    it("should have words in all temporal categories", () => {
      expect(WORD_BANKS.time.nouns.length).toBeGreaterThan(0);
      expect(WORD_BANKS.time.adjectives.length).toBeGreaterThan(0);
      expect(WORD_BANKS.time.verbs.length).toBeGreaterThan(0);
    });

    it("should have words in all emotional categories", () => {
      expect(WORD_BANKS.emotion.nouns.length).toBeGreaterThan(0);
      expect(WORD_BANKS.emotion.adjectives.length).toBeGreaterThan(0);
      expect(WORD_BANKS.emotion.verbs.length).toBeGreaterThan(0);
    });
  });

  describe("Template System", () => {
    it("should have templates for all styles", () => {
      expect(Object.keys(POEM_TEMPLATES).length).toBeGreaterThan(0);
      
      Object.values(POEM_TEMPLATES).forEach(styleTemplates => {
        expect(styleTemplates.length).toBeGreaterThan(0);
        styleTemplates.forEach(template => {
          expect(typeof template).toBe("string");
          expect(template.length).toBeGreaterThan(0);
        });
      });
    });

    it("should have style metadata for all templates", () => {
      const templateStyles = Object.keys(POEM_TEMPLATES);
      const metadataStyles = Object.keys(POEM_STYLES);
      
      templateStyles.forEach(style => {
        expect(metadataStyles).toContain(style);
      });
    });
  });

  describe("Collection Generator", () => {
    it("should generate a collection of multiple poems", () => {
      const collection = generatePoemCollection(3);
      expect(collection).toBeDefined();
      expect(collection).toContain("📜");
      expect(collection).toContain("COLLECTION");
      
      // Should have at least 3 poem markers
      const poemCount = (collection.match(/📜/g) || []).length;
      expect(poemCount).toBeGreaterThanOrEqual(3);
    });

    it("should respect the count parameter", () => {
      const collection = generatePoemCollection(5);
      const poemCount = (collection.match(/📜/g) || []).length;
      expect(poemCount).toBe(5);
    });
  });

  describe("Tool Plugin Integration", () => {
    it("should export a valid tool plugin", () => {
      expect(poemGeneratorTool).toBeDefined();
      expect(poemGeneratorTool.definition).toBeDefined();
      expect(poemGeneratorTool.execute).toBeDefined();
    });

    it("should have correct tool definition structure", () => {
      expect(poemGeneratorTool.definition.type).toBe("function");
      expect(poemGeneratorTool.definition.function.name).toBe("generate_poem");
      expect(poemGeneratorTool.definition.function.description).toBeDefined();
      expect(poemGeneratorTool.definition.function.parameters).toBeDefined();
    });

    it("should execute and return a poem", async () => {
      const result = await poemGeneratorTool.execute({ style: "haiku" });
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("📜");
    });

    it("should handle execute with no arguments", async () => {
      const result = await poemGeneratorTool.execute({});
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("Content Quality", () => {
    it("should produce poems with reasonable length", () => {
      const poem = generatePoem();
      const lines = poem.split('\n');
      // Should have title, separator, content, separator, and style line
      expect(lines.length).toBeGreaterThanOrEqual(5);
    });

    it("should include line breaks in free verse", () => {
      const poem = generatePoem({ style: "free_verse" });
      expect(poem).toContain('\n');
    });

    it("should include line breaks in haiku", () => {
      const poem = generatePoem({ style: "haiku" });
      expect(poem).toContain('\n');
    });
  });
});

describe("Word Bank Extensibility", () => {
  it("should allow checking word counts per category", () => {
    // Nature words
    const natureCount = WORD_BANKS.nature.nouns.length + 
                       WORD_BANKS.nature.adjectives.length + 
                       WORD_BANKS.nature.verbs.length;
    expect(natureCount).toBeGreaterThan(30);

    // Consciousness words
    const consciousnessCount = WORD_BANKS.consciousness.nouns.length + 
                              WORD_BANKS.consciousness.adjectives.length + 
                              WORD_BANKS.consciousness.verbs.length;
    expect(consciousnessCount).toBeGreaterThan(20);

    // Time words  
    const timeCount = WORD_BANKS.time.nouns.length + 
                     WORD_BANKS.time.adjectives.length + 
                     WORD_BANKS.time.verbs.length;
    expect(timeCount).toBeGreaterThan(15);

    // Emotion words
    const emotionCount = WORD_BANKS.emotion.nouns.length + 
                        WORD_BANKS.emotion.adjectives.length + 
                        WORD_BANKS.emotion.verbs.length;
    expect(emotionCount).toBeGreaterThan(15);
  });
});

describe("Template Substitution", () => {
  it("should substitute all placeholders in templates", () => {
    // This is tested indirectly through the generatePoem function
    // which would fail if placeholders weren't substituted
    const poems: string[] = [];
    
    // Generate many poems to catch any substitution issues
    for (let i = 0; i < 20; i++) {
      const poem = generatePoem();
      poems.push(poem);
      
      // Should not contain unfilled template markers
      expect(poem).not.toMatch(/\{[^}]+\}/);
    }
  });
});
