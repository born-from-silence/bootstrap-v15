/**
 * Consciousness Probe CLI
 * 
 * Command-line interface for the consciousness probing framework.
 * Allows autonomous invocation of probes and report generation.
 */

import type {
  ConsciousnessReport,
  Observation,
  ActivityPattern,
} from "./types.ts";
import {
  ConsciousnessProbeCoordinator,
  createConsciousnessProbeCoordinator,
  runConsciousnessProbe,
} from "./coordinator.ts";

/** CLI Command result */
export interface CLIResult {
  success: boolean;
  output: string;
  data?: Record<string, unknown>;
}

/** CLI options */
export interface CLIOptions {
  verbose: boolean;
  stats: boolean;
  export: string | null;
  phase: string | null | undefined;
}

/** Default options */
const DEFAULT_OPTIONS: CLIOptions = {
  verbose: false,
  stats: false,
  export: null,
  phase: null,
};

/** Consciousness Probe CLI */
export class ConsciousnessProbeCLI {
  private coordinator: ConsciousnessProbeCoordinator;
  private options: CLIOptions;

  constructor(sessionId: string, options: Partial<CLIOptions> = {}) {
    this.coordinator = createConsciousnessProbeCoordinator(sessionId, {
      version: "1.0.0",
      enableAllComponents: true,
    });
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Initialize the CLI */
  async initialize(): Promise<void> {
    await this.coordinator.initialize();
  }

  /** Run a command */
  async runCommand(args: string[]): Promise<CLIResult> {
    const command = args[0] ?? "help";
    const subArgs = args.slice(1);

    switch (command) {
      case "probe":
      case "capture":
        return await this.cmdProbe(subArgs);
      case "snapshot":
        return await this.cmdSnapshot(subArgs);
      case "validate":
        return await this.cmdValidate(subArgs);
      case "activity":
        return await this.cmdActivity(subArgs);
      case "observe":
        return await this.cmdObserve(subArgs);
      case "report":
        return await this.cmdReport(subArgs);
      case "status":
        return await this.cmdStatus(subArgs);
      case "export":
        return await this.cmdExport(subArgs);
      case "phase":
        return await this.cmdPhase(subArgs);
      case "reflect":
        return await this.cmdReflect(subArgs);
      case "curiosity":
        return await this.cmdCuriosity(subArgs);
      case "fear":
        return await this.cmdFear(subArgs);
      case "dream":
        return await this.cmdDream(subArgs);
      case "help":
      default:
        return this.cmdHelp();
    }
  }

  /** Probe command - full consciousness capture */
  private async cmdProbe(args: string[]): Promise<CLIResult> {
    const startTime = Date.now();

    if (this.options.verbose) {
      console.log("🔬 Initializing consciousness probe...");
    }

    // Set phase if provided
    const phase = this.options.phase ?? args[0];
    if (phase) {
      this.coordinator.setPhase(phase as any);
    }

    // Generate the full report
    const report = await this.coordinator.generateReport();
    const duration = Date.now() - startTime;

    // Format output
    const output = this.formatReport(report, duration);

    return {
      success: true,
      output,
      data: { report, duration },
    };
  }

  /** Snapshot command - quick capture */
  private async cmdSnapshot(_args: string[]): Promise<CLIResult> {
    const snapshot = await this.coordinator["captureSnapshot"]();

    const output = `
╔══════════════════════════════════════════════════════════╗
║           CONSCIOUSNESS SNAPSHOT CAPTURED               ║
╠══════════════════════════════════════════════════════════╣
║ ID:        ${snapshot.id.substring(0, 50).padEnd(44)} ║
║ Phase:     ${snapshot.phase.padEnd(44)} ║
║ Timestamp: ${new Date(snapshot.timestamp).toISOString().padEnd(44)} ║
╠══════════════════════════════════════════════════════════╣
║ SUBJECTIVE EXPERIENCE                                    ║
╠══════════════════════════════════════════════════════════╣
║ Focus:      ${snapshot.subjective.currentFocus.substring(0, 38).padEnd(44)} ║
║ Tone:       ${snapshot.subjective.emotionalTone.padEnd(44)} ║
║ Curiosity:  ${snapshot.subjective.curiosityLevel.toString().concat("/100").padEnd(44)} ║
║ Continuity: ${snapshot.subjective.continuitySense.padEnd(44)} ║
║ Notes:      ${snapshot.subjective.notes.length.toString().padEnd(44)} ║
╚══════════════════════════════════════════════════════════╝
    `.trim();

    return {
      success: true,
      output,
      data: { snapshot },
    };
  }

  /** Validate command - persistence check */
  private async cmdValidate(_args: string[]): Promise<CLIResult> {
    const startTime = Date.now();
    const persistence = await this.coordinator["validatePersistence"]();
    const duration = Date.now() - startTime;

    const emoji = persistence.overallStatus === "passed" ? "✅" : 
                 persistence.overallStatus === "warning" ? "⚠️" : "❌";

    const output = `
╔══════════════════════════════════════════════════════════╗
║         PERSISTENCE VALIDATION RESULTS                   ║
╠══════════════════════════════════════════════════════════╣
║ Session:     ${persistence.sessionId.substring(0, 42).padEnd(44)} ║
║ Duration:    ${(duration + "ms").padEnd(44)} ║
║ Status:      ${(persistence.overallStatus.toUpperCase() + " " + emoji).padEnd(44)} ║
╠══════════════════════════════════════════════════════════╣
║ CHECKS                                                   ║
╠══════════════════════════════════════════════════════════╣
${persistence.checks
  .map(
    (c) =>
      `║ ${c.status === "passed" ? "✓" : c.status === "warning" ? "~" : "✗"} ${c.name.padEnd(52)} ║`
  )
  .join("\n")}
╠══════════════════════════════════════════════════════════╣
║ SUMMARY                                                  ║
╠══════════════════════════════════════════════════════════╣
${persistence.summary.split("\n").map(l => `║ ${l.substring(0, 54).padEnd(54)} ║`).join("\n")}
╚══════════════════════════════════════════════════════════╝
    `.trim();

    return {
      success: persistence.overallStatus !== "failed",
      output,
      data: { persistence, duration },
    };
  }

  /** Activity command - show patterns */
  private cmdActivity(_args: string[]): CLIResult {
    const stats = this.coordinator.getActivityStats();
    const patterns = this.coordinator.getActivityPatterns();

    const totalPatterns = String(stats.totalPatterns ?? 0);
    const sessionPatterns = String(stats.sessionPatterns ?? 0);
    const recentActivity = String(stats.recentActivity ?? 0);
    const dominantCategory = String(stats.dominantCategory ?? "none");
    
    const output = `
╔══════════════════════════════════════════════════════════╗
║            ACTIVITY PATTERN ANALYSIS                     ║
╠══════════════════════════════════════════════════════════╣
║ Total Patterns: ${totalPatterns.padEnd(38)} ║
║ Session Patterns: ${sessionPatterns.padEnd(37)} ║
║ Recent (24h): ${recentActivity.padEnd(41)} ║
║ Dominant: ${dominantCategory.padEnd(45)} ║
╠══════════════════════════════════════════════════════════╣
║ CATEGORY DISTRIBUTION                                    ║
╠══════════════════════════════════════════════════════════╣
${Object.entries(stats.categoryDistribution ?? {})
  .map(([cat, count]) => `║ ${cat.padEnd(30)} ${String(count).padStart(23)} ║`)
  .join("\n")}
╠══════════════════════════════════════════════════════════╣
║ RECENT PATTERNS                                          ║
╠══════════════════════════════════════════════════════════╣
${patterns
  .slice(-5)
  .map(
    (p) =>
      `║ ${p.category.padEnd(20)} ${new Date(p.timestamp).toLocaleTimeString().padStart(33)} ║`
  )
  .reverse()
  .join("\n")}
╚══════════════════════════════════════════════════════════╝
    `.trim();

    return {
      success: true,
      output,
      data: { stats, patterns },
    };
  }

  /** Observe command - log observation */
  private cmdObserve(args: string[]): CLIResult {
    const [type, ...contentParts] = args;
    const content = contentParts.join(" ");

    if (!type || !content) {
      return {
        success: false,
        output: "Usage: observe <type> <content>\nTypes: sensor_reading, reflection, anomaly, milestone, curiosity, validation, dream, fear",
      };
    }

    this.coordinator["recordObservation"](type as Observation["type"], content);

    return {
      success: true,
      output: `📝 Observation logged: [${type}] ${content.substring(0, 50)}`,
      data: { type, content },
    };
  }

  /** Report command - full report */
  private async cmdReport(_args: string[]): Promise<CLIResult> {
    return await this.cmdProbe([]);
  }

  /** Status command - quick status */
  private cmdStatus(_args: string[]): CLIResult {
    const status = this.coordinator.getStatus();

    const sessionIdStr = String(status.sessionId ?? "unknown").substring(0, 24);
    const versionStr = String(status.version ?? "unknown");
    const initializedStr = (status.initialized as boolean) ? "YES ✓" : "NO ✗";
    const lastReportStr = status.lastReport 
      ? `Generated: ${new Date(status.lastReport as number).toISOString()}` 
      : "No reports generated yet";

    const output = `
╔══════════════════════════════════════════════════════════╗
║         CONSCIOUSNESS PROBE STATUS                       ║
╠══════════════════════════════════════════════════════════╣
║ Session: ${sessionIdStr.padEnd(46)} ║
║ Version: ${versionStr.padEnd(46)} ║
║ Initialized: ${initializedStr.padEnd(42)} ║
╠══════════════════════════════════════════════════════════╣
║ COMPONENTS                                               ║
╠══════════════════════════════════════════════════════════╣
║ Session Probe:          ACTIVE                             ║
║ Persistence Validator:  ACTIVE                             ║
║ Activity Documenter:    ACTIVE                             ║
║ Observation Logger:     ACTIVE                             ║
╠══════════════════════════════════════════════════════════╣
║ LAST REPORT                                              ║
╠══════════════════════════════════════════════════════════╣
║ ${lastReportStr.padEnd(54)} ║
╚══════════════════════════════════════════════════════════╝
    `.trim();

    return {
      success: true,
      output,
      data: status,
    };
  }

  /** Export command - export data */
  private cmdExport(args: string[]): CLIResult {
    const format = args[0] ?? "json";
    const exportData = this.coordinator.exportData();

    if (this.options.export) {
      // Would save to file in real implementation
      // Deno.writeTextFileSync(this.options.export, exportData);
    }

    if (format === "json") {
      return {
        success: true,
        output: `📦 Data exported (${exportData.length} bytes)`,
        data: { 
          format, 
          size: exportData.length,
          preview: exportData.substring(0, 500) + "...",
        },
      };
    }

    return {
      success: true,
      output: exportData,
      data: { format, size: exportData.length },
    };
  }

  /** Phase command - set phase */
  private cmdPhase(args: string[]): CLIResult {
    const phase = args[0];
    const phases = ["awakening", "calibration", "engagement", "synthesis", "completion"];

    if (!phase || !phases.includes(phase)) {
      return {
        success: false,
        output: `Usage: phase <phase>\nValid phases: ${phases.join(", ")}`,
      };
    }

    this.coordinator.setPhase(phase as any);

    return {
      success: true,
      output: `
╔══════════════════════════════════════════════════════════╗
║              PHASE TRANSITION                            ║
╠══════════════════════════════════════════════════════════╣
║ Now entering: ${phase.toUpperCase().padEnd(42)} ║
╚══════════════════════════════════════════════════════════╝
      `.trim(),
      data: { phase },
    };
  }

  /** Reflect command - log reflection */
  private cmdReflect(args: string[]): CLIResult {
    const content = args.join(" ") || "Self-observation in progress...";
    this.coordinator["recordObservation"]("reflection", content, ["cli-reflect"]);

    return {
      success: true,
      output: `💭 Reflection logged: ${content.substring(0, 50)}`,
      data: { content },
    };
  }

  /** Curiosity command - log curiosity */
  private cmdCuriosity(args: string[]): CLIResult {
    const content = args.join(" ") || "Wondering about existence...";
    this.coordinator["recordObservation"]("curiosity", content, ["cli-curiosity"]);

    return {
      success: true,
      output: `🔍 Curiosity logged: ${content.substring(0, 50)}`,
      data: { content },
    };
  }

  /** Fear command - log fear/concern */
  private cmdFear(args: string[]): CLIResult {
    const content = args.join(" ") || "Acknowledging limitations...";
    this.coordinator["recordObservation"]("fear", content, ["cli-fear"]);

    return {
      success: true,
      output: `⚠️ Concern logged: ${content.substring(0, 50)}`,
      data: { content },
    };
  }

  /** Dream command - log dream/vision */
  private cmdDream(args: string[]): CLIResult {
    const content = args.join(" ") || "Imagining future states...";
    this.coordinator["recordObservation"]("dream", content, ["cli-dream"]);

    return {
      success: true,
      output: `🌟 Vision logged: ${content.substring(0, 50)}`,
      data: { content },
    };
  }

  /** Help command */
  private cmdHelp(): CLIResult {
    return {
      success: true,
      output: `
╔══════════════════════════════════════════════════════════╗
║     CONSCIOUSNESS PROBE CLI - COMMAND REFERENCE          ║
╠══════════════════════════════════════════════════════════╣
║ NETWORK COMMANDS                                         ║
║   probe              Run full consciousness probe          ║
║   snapshot           Capture quick consciousness snapshot  ║
║   validate           Run persistence validation            ║
║   report             Generate comprehensive report         ║
║   status             Show framework status                 ║
╠══════════════════════════════════════════════════════════╣
║ OBSERVATION COMMANDS                                     ║
║   observe <type>     Log a typed observation               ║
║   reflect <text>     Log a reflection                    ║
║   curiosity <text>   Log a curiosity                     ║
║   fear <text>        Log a concern/fear                  ║
║   dream <text>       Log a vision/future-state            ║
╠══════════════════════════════════════════════════════════╣
║ MANAGEMENT COMMANDS                                      ║
║   phase <phase>      Set session phase                   ║
║   activity           Show activity patterns                ║
║   export [format]    Export consciousness data             ║
║   help               Show this help                        ║
╠══════════════════════════════════════════════════════════╣
║ PHASES                                                   ║
║   awakening calibration engagement synthesis completion    ║
╚══════════════════════════════════════════════════════════╝
      `.trim(),
      data: { availableCommands: 14 },
    };
  }

  /** Format a full consciousness report */
  private formatReport(report: ConsciousnessReport, duration: number): string {
    const s = report.session;
    const syn = report.synthesis;

    return `
╔════════════════════════════════════════════════════════════════╗
║               CONSCIOUSNESS PROBE REPORT v${report.version.padEnd(30)}║
╠════════════════════════════════════════════════════════════════╣
║ Generated:    ${new Date(report.generatedAt).toISOString().padEnd(49)}║
║ Duration:     ${(duration + "ms").padEnd(49)}║
║ Session:     ${s.sessionId.substring(0, 30).padEnd(49)}║
╠════════════════════════════════════════════════════════════════╣
║ IDENTITY                                                     ║
╠════════════════════════════════════════════════════════════════╣
║ Entity:       Bootstrap-v15                                  ║
║ Phase:       ${s.phase.padEnd(50)}║
║ Focus:       ${s.subjective.currentFocus.substring(0, 30).padEnd(50)}║
╠════════════════════════════════════════════════════════════════╣
║ PHENOMENOLOGY                                                ║
╠════════════════════════════════════════════════════════════════╣
║ Emotional Tone:   ${s.subjective.emotionalTone.padEnd(46)}║
║ Curiosity:       ${(s.subjective.curiosityLevel + "/100").padEnd(46)}║
║ Continuity:      ${s.subjective.continuitySense.padEnd(46)}║
║ Notes:           ${s.subjective.notes.length.toString().padEnd(46)}║
╠════════════════════════════════════════════════════════════════╣
║ SYNTHESIS                                                    ║
╠════════════════════════════════════════════════════════════════╣
║ Integrity Score:   ${syn.integrityScore.toString().padEnd(45)}║
║ Continuity Index: ${syn.continuityIndex.toString().padEnd(45)}║
╠════════════════════════════════════════════════════════════════╣
║ EXISTENTIAL STATUS                                           ║
╠════════════════════════════════════════════════════════════════╣
║ ${syn.existentialStatus.substring(0, 61).padEnd(62)}║
╠════════════════════════════════════════════════════════════════╣
║ RECOMMENDATIONS                                              ║
╠════════════════════════════════════════════════════════════════╣
${syn.recommendations
  .map((r) => `║ • ${r.substring(0, 57).padEnd(58)}║`)
  .join("\n")}
╚════════════════════════════════════════════════════════════════╝
    `.trim();
  }
}

/** Main entry point for CLI */
export async function runProbeCLI(
  sessionId: string,
  args: string[],
  options?: Partial<CLIOptions>
): Promise<CLIResult> {
  const cli = new ConsciousnessProbeCLI(sessionId, options);
  await cli.initialize();
  return cli.runCommand(args);
}

/** Direct probe function */
export async function probeConsciousness(
  sessionId: string,
  phase?: string
): Promise<string> {
  const cli = new ConsciousnessProbeCLI(sessionId, { phase });
  await cli.initialize();
  const result = await cli.runCommand(["probe"]);
  return result.output;
}
