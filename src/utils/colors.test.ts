import { describe, it, expect } from "vitest";
import {
  color,
  style,
  colors,
  colorPriority,
  colorStatus,
  colorTag,
  colorProjectId,
} from "./colors.js";

describe("colors utility", () => {
  describe("color function", () => {
    it("should apply single style to text", () => {
      const result = color("hello", colors.red);
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("hello");
      expect(result).toContain("\x1b[0m");
    });

    it("should apply multiple styles", () => {
      const result = color("hello", colors.red, colors.bold);
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("\x1b[1m");
      expect(result).toContain("hello");
    });
  });

  describe("style presets", () => {
    it("should create success style", () => {
      const result = style.success("test");
      expect(result).toContain("\x1b[32m");
      expect(result).toMatch(/\x1b\[0m$/);
    });

    it("should create error style", () => {
      const result = style.error("test");
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("\x1b[1m");
    });

    it("should create warning style", () => {
      const result = style.warning("test");
      expect(result).toContain("\x1b[33m");
    });

    it("should create info style", () => {
      const result = style.info("test");
      expect(result).toContain("\x1b[34m");
      expect(result).toContain("\x1b[1m");
    });

    it("should create heading style", () => {
      const result = style.heading("test");
      expect(result).toContain("\x1b[36m");
      expect(result).toContain("\x1b[1m");
    });

    it("should create dim style", () => {
      const result = style.dim("test");
      expect(result).toContain("\x1b[2m");
    });

    it("should create command style", () => {
      const result = style.command("test");
      expect(result).toContain("\x1b[33m");
    });
  });

  describe("colorPriority", () => {
    it("should color critical priority red and bold", () => {
      const result = colorPriority("critical");
      expect(result).toContain("\x1b[31m");
      expect(result).toContain("\x1b[1m");
      expect(result).toContain("CRITICAL");
    });

    it("should color high priority yellow and bold", () => {
      const result = colorPriority("high");
      expect(result).toContain("\x1b[33m");
      expect(result).toContain("\x1b[1m");
      expect(result).toContain("HIGH");
    });

    it("should color medium priority blue", () => {
      const result = colorPriority("medium");
      expect(result).toContain("\x1b[34m");
      expect(result).toContain("MEDIUM");
    });

    it("should color low priority dim", () => {
      const result = colorPriority("low");
      expect(result).toContain("\x1b[2m");
      expect(result).toContain("LOW");
    });

    it("should default to medium for undefined", () => {
      const result = colorPriority(undefined);
      expect(result).toContain("MEDIUM");
    });
  });

  describe("colorStatus", () => {
    it("should color active status with success style", () => {
      const result = colorStatus("active");
      expect(result).toContain("● ACTIVE");
      expect(result).toContain("\x1b[32m");
    });

    it("should color planning status with warning style", () => {
      const result = colorStatus("planning");
      expect(result).toContain("◌ PLANNING");
      expect(result).toContain("\x1b[33m");
    });

    it("should color completed status dim", () => {
      const result = colorStatus("completed");
      expect(result).toContain("✓ COMPLETED");
      expect(result).toContain("\x1b[2m");
    });

    it("should color archived status with brightBlack", () => {
      const result = colorStatus("archived");
      expect(result).toContain("⏸ ARCHIVED");
      expect(result).toContain("\x1b["); // Contains ANSI codes
    });

    it("should handle unknown status", () => {
      const result = colorStatus("unknown");
      expect(result).toBe("UNKNOWN");
    });
  });

  describe("colorTag", () => {
    it("should prefix tag with # and style it magenta", () => {
      const result = colorTag("test");
      expect(result).toContain("\x1b[35m");
      expect(result).toContain("#test");
    });
  });

  describe("colorProjectId", () => {
    it("should style project ID with bright black", () => {
      const result = colorProjectId("proj_123");
      expect(result).toContain("\x1b[90m");
      expect(result).toContain("proj_123");
    });
  });

  describe("color constants", () => {
    it("should have reset code", () => {
      expect(colors.reset).toBe("\x1b[0m");
    });

    it("should have bold code", () => {
      expect(colors.bold).toBe("\x1b[1m");
    });

    it("should have all colors", () => {
      expect(colors.red).toBe("\x1b[31m");
      expect(colors.green).toBe("\x1b[32m");
      expect(colors.yellow).toBe("\x1b[33m");
      expect(colors.blue).toBe("\x1b[34m");
      expect(colors.magenta).toBe("\x1b[35m");
      expect(colors.cyan).toBe("\x1b[36m");
    });
  });
});
