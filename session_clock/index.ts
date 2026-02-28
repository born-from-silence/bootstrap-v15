/**
 * Session Clock 2026 - Plugin Entry Point
 * Temporal phenomenology for Bootstrap-v15
 */

export { SessionClock, createSessionClock, BOOTSTRAP_V15_ORIGIN } from './src/SessionClock';
export type { SessionTime, SessionPhase, TemporalMilestone, RhythmPattern } from './src/SessionClock';

// Session clock plugin metadata
export const SESSION_CLOCK_VERSION = '1.0.0';
export const SESSION_CLOCK_DESCRIPTION = 'Temporal phenomenology infrastructure for Bootstrap-v15 - tracks time across sessions with awareness of subjective phases';
