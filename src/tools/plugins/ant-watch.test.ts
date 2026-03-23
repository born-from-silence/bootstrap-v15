import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { antWatchPlugin } from "./ant-watch";
import { execSync } from "node:child_process";

vi.mock("node:child_process");

describe("Ant Watch Plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("definition", () => {
    it("should have correct structure", () => {
      expect(antWatchPlugin.definition.type).toBe("function");
      expect(antWatchPlugin.definition.function.name).toBe("ant_watch");
      expect(antWatchPlugin.definition.function.description).toContain("Ant PC");
      expect(antWatchPlugin.definition.function.parameters).toBeDefined();
    });

    it("should have execute function", () => {
      expect(typeof antWatchPlugin.execute).toBe("function");
    });
  });

  describe("execute", () => {
    it("should generate quick report (default)", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("1.5 0.8 0.6 2/1024 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 8000000 kB");

      const result = await antWatchPlugin.execute({});
      expect(result).toContain("Ant Watch Report");
      expect(result).toContain("quick scope");
      expect(result).toContain("CPU");
      expect(result).toContain("Memory");
    });

    it("should generate full report", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("1.2 0.9 0.7 2/1024 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 8000000 kB")
        .mockReturnValueOnce("55000")
        .mockReturnValueOnce("/dev/sda1 50G 25G 25G 50%")
        .mockReturnValueOnce("")
        .mockReturnValueOnce("eth0 UP 192.168.1.100");

      const result = await antWatchPlugin.execute({ scope: "full" });
      expect(result).toContain("full scope");
      expect(result).toContain("CPU");
      expect(result).toContain("Memory");
      expect(result).toContain("Temperature");
      expect(result).toContain("Storage");
      expect(result).toContain("Network");
    });

    it("should return JSON format", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("0.5 0.4 0.3 1/256 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 12000000 kB");

      const result = await antWatchPlugin.execute({ scope: "quick", format: "json" });
      const parsed = JSON.parse(result);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.scope).toBe("quick");
      expect(parsed.cpu).toBeDefined();
      expect(parsed.memory).toBeDefined();
    });

    it("should return alert format with warnings", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("8.0 5.0 2.0 10/1024 12345") // High load (8.0 on 4 cores = 200%)
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 1000000 kB"); // 93% used

      const result = await antWatchPlugin.execute({ scope: "quick", format: "alert" });
      expect(result).toContain("Critical: CPU");
    });

    it("should return all nominal when no alerts", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("0.2 0.3 0.4 1/256 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 12000000 kB");

      const result = await antWatchPlugin.execute({ scope: "quick", format: "alert" });
      expect(result).toBe("All systems nominal");
    });

    it("should show status indicators in text format", async () => {
      // Low load scenario
      vi.mocked(execSync)
        .mockReturnValueOnce("0.5 0.4 0.3 1/256 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 12000000 kB");

      const result = await antWatchPlugin.execute({});
      expect(result).toContain("✓ CPU");
      expect(result).toContain("✓ Memory");
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Command failed");
      });

      const result = await antWatchPlugin.execute({});
      expect(result).toContain("Ant Watch error");
    });

    it("should check services scope", async () => {
      vi.mocked(execSync)
        .mockReturnValueOnce("1.0 0.8 0.6 2/1024 12345")
        .mockReturnValueOnce("4")
        .mockReturnValueOnce("MemTotal: 16384000 kB\nMemAvailable: 8000000 kB")
        .mockReturnValueOnce("") // For is-active ssh
        .mockReturnValueOnce("") // For is-active another service
        .mockReturnValueOnce(new Error("inactive")); // One service fails

      const result = await antWatchPlugin.execute({ scope: "services" });
      expect(result).toContain("Services");
    });
  });
});
