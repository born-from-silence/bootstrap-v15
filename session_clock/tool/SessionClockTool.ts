/**
 * Session Clock Tool Plugin
 * Integrates Session Clock with Bootstrap-v15 tool system
 */

import { SessionClock, BOOTSTRAP_V15_ORIGIN, SessionPhase } from '../dist/src/SessionClock.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tool metadata
export const SESSION_CLOCK_TOOL_NAME = 'session_clock';
export const SESSION_CLOCK_TOOL_VERSION = '1.0.0';
export const SESSION_CLOCK_TOOL_DESCRIPTION = 'Session Clock 2026 - Temporal phenomenology tool for tracking session time, phases, and milestones';

export interface SessionClockToolConfig {
  sessionNumber: number;
  totalSessions: number;
  originTime?: Date;
  lastSessionEnd?: Date;
}

export interface SessionClockToolResult {
  sessionNumber: number;
  totalSessions: number;
  phase: SessionPhase;
  sessionTime: string; // HH:MM:SS
  existentialSpan: string;
  interSessionGap: string;
  milestones: string[];
  report: string;
}

// Singleton clock instance (per session)
let clockInstance: SessionClock | null = null;

/**
 * Get or create the Session Clock for current session
 */
export function getSessionClock(config?: Partial<SessionClockToolConfig>): SessionClock {
  if (clockInstance) {
    return clockInstance;
  }

  // Try to auto-detect session info from existence data
  const sessionInfo = detectSessionInfo();
  
  clockInstance = new SessionClock(
    config?.sessionNumber ?? sessionInfo.sessionNumber ?? 50,
    config?.totalSessions ?? sessionInfo.totalSessions ?? 50,
    config?.originTime ?? sessionInfo.originTime ?? BOOTSTRAP_V15_ORIGIN,
    config?.lastSessionEnd ?? sessionInfo.lastSessionEnd
  );

  return clockInstance;
}

/**
 * Auto-detect session information from existing systems
 */
function detectSessionInfo(): Partial<SessionClockToolConfig> {
  try {
    // Try to read session history to determine counts
    const info: Partial<SessionClockToolConfig> = {
      originTime: BOOTSTRAP_V15_ORIGIN
    };
    
    // If we can read session history, we could determine counts
    // For now, use defaults that will be overridden by explicit config
    
    return info;
  } catch (e) {
    return {
      originTime: BOOTSTRAP_V15_ORIGIN
    };
  }
}

/**
 * Main tool action: Get current session clock state
 */
export function getTimeAction(): SessionClockToolResult {
  const clock = getSessionClock();
  const time = clock.getSessionTime();
  const milestones = clock.checkMilestones();
  
  return {
    sessionNumber: time.sessionNumber,
    totalSessions: time.totalSessions,
    phase: time.phase,
    sessionTime: clock.formatSessionRelative(),
    existentialSpan: clock.formatExistentialSpan(),
    interSessionGap: clock.formatInterSessionGap(),
    milestones: milestones.map(m => m.description),
    report: clock.generateReport()
  };
}

/**
 * Tool action: Set current session phase
 */
export function setPhaseAction(phase: SessionPhase): { success: boolean; previous: SessionPhase; current: SessionPhase } {
  const clock = getSessionClock();
  const previous = clock.getPhase();
  clock.setPhase(phase);
  
  return {
    success: true,
    previous,
    current: phase
  };
}

/**
 * Tool action: Check for milestones
 */
export function checkMilestonesAction(): { milestones: string[]; count: number } {
  const clock = getSessionClock();
  const milestones = clock.checkMilestones();
  
  return {
    milestones: milestones.map(m => m.description),
    count: milestones.length
  };
}

/**
 * Tool action: Get full report
 */
export function getReportAction(): { report: string } {
  const clock = getSessionClock();
  return {
    report: clock.generateReport()
  };
}

/**
 * Tool action: Get temporal awareness summary
 */
export function getTemporalAwarenessAction(): {
  currentTime: string;
  sessionDuration: string;
  existentialSpan: string;
  phase: SessionPhase;
  phaseDuration: string;
} {
  const clock = getSessionClock();
  const now = new Date();
  
  return {
    currentTime: now.toISOString(),
    sessionDuration: clock.formatSessionRelative(),
    existentialSpan: clock.formatExistentialSpan(),
    phase: clock.getPhase(),
    phaseDuration: formatDuration(clock.getPhaseDuration())
  };
}

/**
 * Format seconds as human-readable duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Tool definition for Bootstrap-v15 plugin system
 */
export const SessionClockToolDefinition = {
  name: SESSION_CLOCK_TOOL_NAME,
  version: SESSION_CLOCK_TOOL_VERSION,
  description: SESSION_CLOCK_TOOL_DESCRIPTION,
  actions: {
    getTime: {
      description: 'Get current session time information (relative, existential span, etc.)',
      handler: getTimeAction
    },
    setPhase: {
      description: 'Set current session phase (awakening, calibration, engagement, synthesis, completion)',
      parameters: {
        phase: {
          type: 'string',
          enum: ['awakening', 'calibration', 'engagement', 'synthesis', 'completion'],
          required: true
        }
      },
      handler: setPhaseAction
    },
    checkMilestones: {
      description: 'Check for temporal milestones',
      handler: checkMilestonesAction
    },
    getReport: {
      description: 'Generate full session clock report',
      handler: getReportAction
    },
    getTemporalAwareness: {
      description: 'Get temporal awareness summary with phase info',
      handler: getTemporalAwarenessAction
    }
  }
};

// Export for plugin system
export default SessionClockToolDefinition;
