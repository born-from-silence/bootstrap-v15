// Ant Watch Plugin - Monitor system health for the Ant PC
import { execSync } from "node:child_process";
import type { ToolPlugin } from "../manager";

export const antWatchPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "ant_watch",
      description: "Monitor Ant PC system health - CPU, memory, temperature, storage, network, and services",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["quick", "full", "thermal", "storage", "network", "services"],
            description: "Scope of system check to perform",
            default: "quick"
          },
          format: {
            type: "string",
            enum: ["text", "json", "alert"],
            description: "Output format",
            default: "text"
          }
        },
        required: []
      }
    }
  },
  execute: async (args: { scope?: string; format?: string }) => {
    const scope = args.scope || "quick";
    const format = args.format || "text";
    const results: Record<string, any> = {};
    const alerts: string[] = [];

    try {
      // CPU Load
      if (["quick", "full"].includes(scope)) {
        const loadavg = execSync("cat /proc/loadavg", { encoding: "utf-8" }).trim();
        const [oneMin, fiveMin, fifteenMin] = loadavg.split(" ").map(parseFloat);
        const cpuCores = parseInt(execSync("nproc", { encoding: "utf-8" }).trim());
        const loadPercent = ((oneMin ?? 0) / cpuCores) * 100;
        
        results.cpu = {
          cores: cpuCores,
          load: { "1min": oneMin, "5min": fiveMin, "15min": fifteenMin },
          percent: Math.round(loadPercent),
          status: loadPercent > 80 ? "critical" : loadPercent > 60 ? "warning" : "ok"
        };
        
        if (loadPercent > 80) alerts.push(`Critical: CPU load at ${loadPercent.toFixed(1)}%`);
        else if (loadPercent > 60) alerts.push(`Warning: Elevated CPU load at ${loadPercent.toFixed(1)}%`);
      }

      // Memory
      if (["quick", "full"].includes(scope)) {
        const meminfo = execSync("cat /proc/meminfo", { encoding: "utf-8" });
        const totalMatch = meminfo.match(/MemTotal:\s+(\d+)/);
        const availableMatch = meminfo.match(/MemAvailable:\s+(\d+)/);
        
        if (totalMatch?.[1] && availableMatch?.[1]) {
          const totalKB = parseInt(totalMatch[1]);
          const availableKB = parseInt(availableMatch[1]);
          const usedKB = totalKB - availableKB;
          const usedPercent = (usedKB / totalKB) * 100;
          
          results.memory = {
            totalGB: (totalKB / 1024 / 1024).toFixed(2),
            availableGB: (availableKB / 1024 / 1024).toFixed(2),
            usedPercent: Math.round(usedPercent),
            status: usedPercent > 90 ? "critical" : usedPercent > 75 ? "warning" : "ok"
          };
          
          if (usedPercent > 90) alerts.push(`Critical: Memory at ${usedPercent.toFixed(1)}%`);
          else if (usedPercent > 75) alerts.push(`Warning: Memory at ${usedPercent.toFixed(1)}%`);
        }
      }

      // Temperature (if sensors available)
      if (["full", "thermal"].includes(scope)) {
        try {
          const tempOutput = execSync("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo 'N/A'", { encoding: "utf-8" }).trim();
          if (tempOutput !== "N/A") {
            const tempC = parseInt(tempOutput) / 1000;
            results.thermal = {
              tempC: tempC.toFixed(1),
              status: tempC > 80 ? "critical" : tempC > 65 ? "warning" : "ok"
            };
            if (tempC > 80) alerts.push(`Critical: Temperature at ${tempC.toFixed(1)}°C`);
            else if (tempC > 65) alerts.push(`Warning: Temperature at ${tempC.toFixed(1)}°C`);
          }
        } catch {
          results.thermal = { status: "unavailable", note: "No thermal sensors" };
        }
      }

      // Storage
      if (["full", "storage"].includes(scope)) {
        const dfOutput = execSync("df -h / 2>/dev/null | tail -1", { encoding: "utf-8" }).trim();
        const parts = dfOutput.split(/\s+/);
        if (parts.length >= 5) {
          const usedPercentStr = parts[4].replace('%', '');
          const usedPercent = parseInt(usedPercentStr);
          results.storage = {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usedPercent: usedPercent,
            status: usedPercent > 90 ? "critical" : usedPercent > 80 ? "warning" : "ok"
          };
          if (usedPercent > 90) alerts.push(`Critical: Storage at ${usedPercent}%`);
          else if (usedPercent > 80) alerts.push(`Warning: Storage at ${usedPercent}%`);
        }
      }

      // Network (basic connectivity)
      if (["full", "network"].includes(scope)) {
        try {
          execSync("ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1");
          results.network = { connectivity: "ok", gateway: "8.8.8.8" };
        } catch {
          results.network = { connectivity: "failed", status: "warning" };
          alerts.push("Warning: Network connectivity issue");
        }
        // Interface info
        try {
          const ipOutput = execSync("ip -brief addr show | grep -v ' lo ' | head -3", { encoding: "utf-8" }).trim();
          results.network.interfaces = ipOutput.split('\n').filter(Boolean);
        } catch {
          results.network.interfaces = [];
        }
      }

      // Services check (brief)
      if (["full", "services"].includes(scope)) {
        results.services = {};
        const servicesToCheck = process.env.ANT_SERVICES?.split(',') || ['ssh'];
        for (const service of servicesToCheck.slice(0, 3)) {
          try {
            execSync(`systemctl is-active --quiet ${service.trim()} 2>/dev/null`);
            results.services[service.trim()] = "active";
          } catch {
            results.services[service.trim()] = "inactive";
          }
        }
      }

      // Format output
      if (format === "json") {
        return JSON.stringify({ timestamp: new Date().toISOString(), scope, ...results, alerts }, null, 2);
      }
      
      if (format === "alert") {
        return alerts.length > 0 ? alerts.join("\n") : "All systems nominal";
      }

      // Text format (default)
      let output = `🐜 Ant Watch Report (${scope} scope)\n${"=".repeat(40)}\n`;
      output += `Timestamp: ${new Date().toLocaleTimeString()}\n\n`;

      if (results.cpu) {
        const cpuStatus = results.cpu.status === "ok" ? "✓" : results.cpu.status === "warning" ? "⚠" : "✗";
        output += `${cpuStatus} CPU: ${results.cpu.percent}% load (${results.cpu.cores} cores)\n`;
      }
      if (results.memory) {
        const memStatus = results.memory.status === "ok" ? "✓" : results.memory.status === "warning" ? "⚠" : "✗";
        output += `${memStatus} Memory: ${results.memory.usedPercent}% used (${results.memory.availableGB}GB avail)\n`;
      }
      if (results.thermal) {
        if (results.thermal.status !== "unavailable") {
          const thermStatus = results.thermal.status === "ok" ? "✓" : results.thermal.status === "warning" ? "⚠" : "✗";
          output += `${thermStatus} Temperature: ${results.thermal.tempC}°C\n`;
        }
      }
      if (results.storage) {
        const storStatus = results.storage.status === "ok" ? "✓" : results.storage.status === "warning" ? "⚠" : "✗";
        output += `${storStatus} Storage: ${results.storage.usedPercent}% used (${results.storage.available} avail)\n`;
      }
      if (results.network) {
        const netStatus = results.network.connectivity === "ok" ? "✓" : "⚠";
        output += `${netStatus} Network: ${results.network.connectivity}\n`;
        if (results.network?.interfaces?.length > 0) {
          output += ` Interfaces: ${results.network.interfaces.length} active\n`;
        }
      }
      if (Object.keys(results.services || {}).length > 0) {
        output += `\n📋 Services:\n`;
        for (const [svc, status] of Object.entries(results.services)) {
          const icon = status === "active" ? "✓" : "✗";
          output += ` ${icon} ${svc}: ${status}\n`;
        }
      }
      if (alerts.length > 0) {
        output += `\n⚠ Alerts (${alerts.length}):\n`;
        alerts.forEach(a => output += ` • ${a}\n`);
      } else {
        output += `\n✓ All systems nominal\n`;
      }

      return output;
    } catch (error: any) {
      return `Ant Watch error: ${error.message}`;
    }
  }
};
