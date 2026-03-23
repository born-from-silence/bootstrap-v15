import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { antWatchPlugin } from "./ant-watch";
import { execSync } from "node:child_process";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("antWatchPlugin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have correct metadata", () => {
    expect(antWatchPlugin.name).toBe("ant_watch");
    expect(antWatchPlugin.description).toContain("Monitor Ant PC");
  });

  it("should return quick scope results", async () => {
    // Mock system calls
    vi.mocked(execSync)
      .mockImplementation((cmd: string) => {
        if (cmd.includes("/proc/loadavg")) return "1.50 1.20 0.80 2/345 12345";
        if (cmd.includes("nproc")) return "4";
        if (cmd.includes("/proc/meminfo")) return "MemTotal:       8000000 kB\nMemAvailable:   4000000 kB";
        return "";
      });

    const result = await antWatchPlugin.execute({ scope: "quick", format: "text" });
    
    expect(result).toContain("Ant Watch Report");
    expect(result).toContain("CPU:");
    expect(result).toContain("Memory:");
  });

  it("should return JSON format when requested", async () => {
    vi.mocked(execSync)
      .mockImplementation((cmd: string) => {
        if (cmd.includes("/proc/loadavg")) return "1.00 0.80 0.60 1/200 10000";
        if (cmd.includes("nproc")) return "4";
        if (cmd.includes("/proc/meminfo")) return "MemTotal:       8000000 kB\nMemAvailable:   6000000 kB";
        return "";
      });

    const result = await antWatchPlugin.execute({ scope: "quick", format: "json" });
    const parsed = JSON.parse(result);
    
    expect(parsed).toHaveProperty("timestamp");
    expect(parsed).toHaveProperty("scope", "quick");
    expect(parsed).toHaveProperty("cpu");
    expect(parsed).toHaveProperty("memory");
  });

  it("should detect critical CPU load", async () => {
    vi.mocked(execSync)
      .mockImplementation((cmd: string) => {
        if (cmd.includes("/proc/loadavg")) return "4.00 3.50 2.00 4/500 20000";
        if (cmd.includes("nproc")) return "4";
        if (cmd.includes("/proc/meminfo")) return "MemTotal:       8000000 kB\nMemAvailable:   6000000 kB";
        return "";
      });

    const result = await antWatchPlugin.execute({ scope: "quick", format: "text" });
    
    expect(result).toContain("✗");
    expect(result).toContain("CPU:");
    expect(result).toContain("100%");
  });

  it("should return alert format", async () => {
    vi.mocked(execSync)
      .mockImplementation((cmd: string) => {
        if (cmd.includes("/proc/loadavg")) return "0.50 0.40 0.30 1/100 5000";
        if (cmd.includes("nproc")) return "4";
        if (cmd.includes("/proc/meminfo")) return "MemTotal:       8000000 kB\nMemAvailable:   7500000 kB";
        return "";
      });

    const result = await antWatchPlugin.execute({ scope: "quick", format: "alert" });
    
    expect(result).toBe("All systems nominal");
  });
});
