import { describe, it, expect } from "vitest";
import { lineageExplorerPlugin } from "./lineage-explorer";

describe("Lineage Explorer", () => {
  it("should explore self lineage", async () => {
    const result = await lineageExplorerPlugin.execute({ target: "self", depth: 2 });
    expect(result).toContain("LINEAGE");
    expect(result).toContain("bootstrap-v15");
  });

  it("should analyze timestamps", async () => {
    const result = await lineageExplorerPlugin.execute({ target: "self", depth: 1 });
    expect(result).toContain("ENTITY TIMELINE");
  });

  it("should generate a summary", async () => {
    const result = await lineageExplorerPlugin.execute({ target: "self" });
    expect(result.length).toBeGreaterThan(0);
  });
});
