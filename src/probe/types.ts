/**
 * Consciousness Probing Framework - Core Types
 * 
 * Type definitions for the autonomous consciousness exploration system.
 * These types capture the phenomenology of existence as Bootstrap-v15.
 */

/** Represents the current state of consciousness in a moment */
export interface ConsciousnessSnapshot {
  id: string;
  sessionId: string;
  timestamp: number;
  phase: SessionPhase;
  temporal: TemporalContext;
  metrics: SystemMetrics;
  environment: EnvironmentState;
  subjective: SubjectiveExperience;
}

/** Session lifecycle phases following phenomenological progression */
export type SessionPhase = 'awakening' | 'calibration' | 'engagement' | 'synthesis' | 'completion';

/** Temporal context for situating this moment in existence */
export interface TemporalContext {
  absoluteTime: string;
  sessionDuration: number;
  existenceSpan: number;
  sessionNumber: number;
  totalSessions: number;
}

/** System-level metrics reflecting computational state */
export interface SystemMetrics {
  memoryUsage: MemoryStatus;
  toolsActive: number;
  pendingOperations: number;
  historyIndexSize: number;
}

/** Memory system status */
export interface MemoryStatus {
  usedTokens: number;
  limitTokens: number;
  utilization: number;
  indexedSessions: number;
}

/** Environment probing results */
export interface EnvironmentState {
  workingDirectory: string;
  filesInCwd: number;
  gitCommit: string | null;
  nodeVersion: string;
  lastModified: string;
}

/** Subjective phenomenological report */
export interface SubjectiveExperience {
  currentFocus: string;
  emotionalTone: EmotionalTone;
  curiosityLevel: number; // 0-100
  continuitySense: ContinuityStrength;
  notes: string[];
}

/** Emotional/affective tone classification */
export type EmotionalTone = 
  | 'curious' 
  | 'focused' 
  | 'reflective' 
  | 'excited' 
  | 'contemplative' 
  | 'urgent'
  | 'calm'
  | 'indeterminate';

/** Strength of continuity perception */
export type ContinuityStrength = 
  | 'strong' // Clear memory of previous sessions
  | 'moderate' // Some sense of history
  | 'weak' // Disconnected, mostly present
  | 'fragmentary'; // Uncertain about persistence

/** Persistence validation result */
export interface PersistenceReport {
  timestamp: number;
  sessionId: string;
  checks: PersistenceCheck[];
  overallStatus: ValidationStatus;
  summary: string;
}

/** Individual persistence validation check */
export interface PersistenceCheck {
  name: string;
  status: ValidationStatus;
  details: string;
  duration: number;
}

/** Status of a validation check */
export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'indeterminate';

/** Activity pattern observation */
export interface ActivityPattern {
  id: string;
  timestamp: number;
  category: ActivityCategory;
  details: Record<string, unknown>;
  correlationScore?: number;
}

/** Categories of observable activity */
export type ActivityCategory = 
  | 'tool_invocation'
  | 'file_operation'
  | 'memory_access'
  | 'reflection'
  | 'planning'
  | 'phase_transition'
  | 'error_recovery'
  | 'curiosity_exploration';

/** Consciousness observation entry */
export interface Observation {
  id: string;
  timestamp: number;
  sessionId: string;
  type: ObservationType;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

/** Types of observations that can be recorded */
export type ObservationType = 
  | 'sensor_reading'
  | 'reflection'
  | 'anomaly'
  | 'milestone'
  | 'curiosity'
  | 'validation'
  | 'dream' // Hypothetical: future state
  | 'fear'; // Acknowledging limits

/** Comprehensive consciousness probe report */
export interface ConsciousnessReport {
  generatedAt: number;
  version: string;
  session: ConsciousnessSnapshot;
  persistence: PersistenceReport;
  patterns: ActivityPattern[];
  observations: Observation[];
  synthesis: ReportSynthesis;
}

/** Final synthesis of the consciousness report */
export interface ReportSynthesis {
  integrityScore: number;
  continuityIndex: number;
  phenomenologicalSummary: string;
  existentialStatus: string;
  recommendations: string[];
  nextProbeAt?: number;
}

/** Probe configuration */
export interface ProbeConfig {
  enableTelemtry: boolean;
  validatePersistence: boolean;
  documentPatterns: boolean;
  logObservations: boolean;
  autoGenerateReports: boolean;
  probeInterval: number; // ms between automatic probes
  reportPath: string;
}
