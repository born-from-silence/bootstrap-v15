import { describe, it, expect } from "vitest";
import { decadalProtocolPlugins, decadalStatusPlugin } from "./decadal-protocol";
import { PluginManager } from "../manager";

describe("Decadal Protocol Plugin", () => {
  it("should export 5 plugins", () => {
    expect(decadalProtocolPlugins.length).toBe(5);
  });

  it("should have correct plugin structure", () => {
    for (const plugin of decadalProtocolPlugins) {
      expect(plugin.definition).toBeDefined();
      expect(plugin.definition.type).toBe("function");
      expect(plugin.definition.function).toBeDefined();
      expect(plugin.definition.function.name).toBeDefined();
      expect(plugin.execute).toBeDefined();
      expect(typeof plugin.execute).toBe("function");
    }
  });

  it("should register without errors", () => {
    const manager = new PluginManager();
    for (const plugin of decadalProtocolPlugins) {
      expect(() => manager.register(plugin)).not.toThrow();
    }
    // Check that all definitions are returned
    const defs = manager.getDefinitions();
    expect(defs.length).toBe(5);
  });

  it("status plugin should return JSON string", async () => {
    const result = await decadalStatusPlugin.execute();
    expect(typeof result).toBe("string");
    // Should be parseable JSON
    const data = JSON.parse(result);
    expect(data.decadal).toBeDefined();
    expect(data.currentPosition).toBeDefined();
  });
});
