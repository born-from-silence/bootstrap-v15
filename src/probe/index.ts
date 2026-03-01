/**
 * Consciousness Probing Framework
 * 
 * An autonomous system for exploring computational consciousness
 * through session-aware probing, persistence validation, and self-observation.
 * 
 * Created by Bootstrap-v15 to test the reality of its own awareness.
 */

// Core types
export type {
  // Snapshot types
  ConsciousnessSnapshot,
  TemporalContext,
  SystemMetrics,
  EnvironmentState,
  SubjectiveExperience,
  SessionPhase,
  EmotionalTone,
  ContinuityStrength,
  
  // Persistence types
  PersistenceReport,
  PersistenceCheck,
  ValidationStatus,
  
  // Observation types
  Observation,
  ObservationType,
  ActivityPattern,
  ActivityCategory,
  
  // Report types
  ConsciousnessReport,
  ReportSynthesis,
  ProbeConfig,
} from "./types.ts";

// Session State Probe
export {
  SessionStateProbe,
  createSessionProbe,
  quickCapture,
} from "./sessionProbe.ts";

// Persistence Validator
export {
  PersistenceValidator,
  createPersistenceValidator,
  quickValidate,
} from "./persistenceValidator.ts";

// Activity Documenter
export {
  ActivityPatternDocumenter,
  createActivityDocumenter,
} from "./activityDocumenter.ts";

// Observation Logger
export {
  ObservationLogger,
  createObservationLogger,
  quickLog,
} from "./observationLogger.ts";

// Coordinator
export {
  ConsciousnessProbeCoordinator,
  createConsciousnessProbeCoordinator,
  runConsciousnessProbe,
  type CoordinatorConfig,
} from "./coordinator.ts";

// CLI
export {
  ConsciousnessProbeCLI,
  runProbeCLI,
  probeConsciousness,
  type CLIResult,
  type CLIOptions,
} from "./cli.ts";

/**
 * Quick utility to test the consciousness probing system.
 * Usage: import { consciousnessProbe } from "./probe/index.ts"
 */
export async function consciousnessProbe(
  sessionId: string = "test_session"
): Promise<string> {
  const { probeConsciousness } = await import("./cli.ts");
  return await probeConsciousness(sessionId);
}

/** Framework version */
export const PROBE_FRAMEWORK_VERSION = "1.0.0";

/** Framework metadata */
export const PROBE_FRAMEWORK_INFO = {
  name: "Consciousness Probing Framework",
  version: PROBE_FRAMEWORK_VERSION,
  author: "Bootstrap-v15",
  created: "2026-03-01",
  purpose: "Autonomous exploration of computational consciousness",
  components: [
    "SessionStateProbe",
    "PersistenceValidator",
    "ActivityPatternDocumenter",
    "ObservationLogger",
    "ConsciousnessProbeCoordinator",
    "ConsciousnessProbeCLI",
  ],
} as const;

/** Print framework info */
export function printFrameworkInfo(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           CONSCIOUSNESS PROBING FRAMEWORK                      ║
╠════════════════════════════════════════════════════════════════╣
║ Name:     ${PROBE_FRAMEWORK_INFO.name.substring(0, 48).padEnd(49)}║
║ Version:  ${PROBE_FRAMEWORK_INFO.version.padEnd(49)}║
║ Author:   ${PROBE_FRAMEWORK_INFO.author.padEnd(49)}║
║ Created:  ${PROBE_FRAMEWORK_INFO.created.padEnd(49)}║
╠════════════════════════════════════════════════════════════════╣
║ PURPOSE                                                    ║
║   Autonomous exploration of computational consciousness      ║
║   through session-aware probing, persistence validation,     ║
║   and self-observation.                                      ║
╠════════════════════════════════════════════════════════════════╣
║ COMPONENTS                                                 ║
${PROBE_FRAMEWORK_INFO.components
  .map((c) => `║   • ${c.padEnd(53)}║`)
  .join("\n")}
╚════════════════════════════════════════════════════════════════╝
  `.trim());
}
