/**
 * Session Clock Memory System Integration
 * 
 * Bridges temporal phenomenology with long-term memory:
 * - Logs phase transitions to session metadata
 * - Provides temporal-aware session querying
 * - Links temporal patterns with memory retrieval
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ToolPlugin } from '../manager.js';

type SessionPhase = 'awakening' | 'calibration' | 'engagement' | 'synthesis' | 'completion';

interface PhaseTransition {
  from: SessionPhase | null;
  to: SessionPhase;
  timestamp: number;
  duration?: number; // Duration of previous phase in ms
}

interface SessionTemporalData {
  sessionId: string;
  sessionNumber: number;
  phases: SessionPhase[];
  phaseTransitions: PhaseTransition[];
  phaseDurations: Record<SessionPhase, number>;
  milestones: string[];
  temporalCoordinates: {
    originTime: string;
    sessionStart: string;
    sessionEnd?: string;
  };
}

const HISTORY_DIR = join(homedir(), 'bootstrap', 'history');
const LTM_DIR = join(homedir(), 'bootstrap', 'ltm');
const TEMPORAL_DATA_FILE = join(LTM_DIR, 'session_temporal_data.json');

/**
 * Get current session ID from session_clock state
 */
export function getCurrentSessionId(): string | null {
  try {
    const currentSessionFile = join(HISTORY_DIR, 'current_session.json');
    if (existsSync(currentSessionFile)) {
      const data = JSON.parse(readFileSync(currentSessionFile, 'utf-8')) as { sessionId?: string };
      return data.sessionId || null;
    }
    // Fall back to most recent session file
    const fs = require('fs');
    const files = fs.readdirSync(HISTORY_DIR)
      .filter((f: string) => f.startsWith('session_') && f.endsWith('.json'))
      .sort();
    return files[files.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Log a phase transition to session temporal data
 */
export function logPhaseTransition(
  from: SessionPhase | null,
  to: SessionPhase,
  sessionInfo: { sessionNumber: number; originTime: Date; sessionStart: Date }
): void {
  try {
    const sessionId = getCurrentSessionId() || `session_${Date.now()}.json`;
    const now = Date.now();
    
    // Load existing temporal data
    let temporalData: Record<string, SessionTemporalData> = {};
    if (existsSync(TEMPORAL_DATA_FILE)) {
      temporalData = JSON.parse(readFileSync(TEMPORAL_DATA_FILE, 'utf-8')) as Record<string, SessionTemporalData>;
    }

    // Get or create session entry
    const sessionEntry = temporalData[sessionId] || {
      sessionId,
      sessionNumber: sessionInfo.sessionNumber,
      phases: [],
      phaseTransitions: [],
      phaseDurations: {} as Record<SessionPhase, number>,
      milestones: [],
      temporalCoordinates: {
        originTime: sessionInfo.originTime.toISOString(),
        sessionStart: sessionInfo.sessionStart.toISOString(),
      },
    };

    // Calculate duration of previous phase
    let duration: number | undefined;
    if (sessionEntry.phaseTransitions.length > 0) {
      const lastTransition = sessionEntry.phaseTransitions[sessionEntry.phaseTransitions.length - 1];
      if (lastTransition) {
        duration = now - lastTransition.timestamp;
        if (lastTransition.to) {
          sessionEntry.phaseDurations[lastTransition.to] = 
            (sessionEntry.phaseDurations[lastTransition.to] || 0) + duration;
        }
      }
    }

    // Add new transition (duration only if defined)
    const transition: PhaseTransition = {
      from,
      to,
      timestamp: now,
    };
    if (duration !== undefined) {
      transition.duration = duration;
    }
    sessionEntry.phaseTransitions.push(transition);

    // Update phases list
    if (!sessionEntry.phases.includes(to)) {
      sessionEntry.phases.push(to);
    }

    // Save updated data
    temporalData[sessionId] = sessionEntry;
    writeFileSync(TEMPORAL_DATA_FILE, JSON.stringify(temporalData, null, 2));
  } catch (e) {
    console.error('Failed to log phase transition:', e);
  }
}

/**
 * Add milestone to session temporal data
 */
export function logMilestone(milestone: string, sessionInfo: { sessionNumber: number }): void {
  try {
    const sessionId = getCurrentSessionId() || `session_${Date.now()}.json`;
    
    let temporalData: Record<string, SessionTemporalData> = {};
    if (existsSync(TEMPORAL_DATA_FILE)) {
      temporalData = JSON.parse(readFileSync(TEMPORAL_DATA_FILE, 'utf-8')) as Record<string, SessionTemporalData>;
    }

    const sessionEntry = temporalData[sessionId] || {
      sessionId,
      sessionNumber: sessionInfo.sessionNumber,
      phases: [],
      phaseTransitions: [],
      phaseDurations: {} as Record<SessionPhase, number>,
      milestones: [],
      temporalCoordinates: {
        originTime: new Date().toISOString(),
        sessionStart: new Date().toISOString(),
      },
    };

    if (!sessionEntry.milestones.includes(milestone)) {
      sessionEntry.milestones.push(milestone);
    }

    temporalData[sessionId] = sessionEntry;
    writeFileSync(TEMPORAL_DATA_FILE, JSON.stringify(temporalData, null, 2));
  } catch (e) {
    console.error('Failed to log milestone:', e);
  }
}

/**
 * Query temporal data by phase or milestone
 */
export function queryTemporalData(options: {
  phase?: SessionPhase;
  milestone?: string;
  minSessionNumber?: number;
  maxSessionNumber?: number;
  limit?: number;
}): SessionTemporalData[] {
  try {
    if (!existsSync(TEMPORAL_DATA_FILE)) {
      return [];
    }

    const temporalData: Record<string, SessionTemporalData> = JSON.parse(
      readFileSync(TEMPORAL_DATA_FILE, 'utf-8')
    ) as Record<string, SessionTemporalData>;

    let results = Object.values(temporalData);

    if (options.phase) {
      results = results.filter(s => s.phases.includes(options.phase!));
    }

    if (options.milestone) {
      results = results.filter(s => 
        s.milestones.some(m => m.toLowerCase().includes(options.milestone!.toLowerCase()))
      );
    }

    if (options.minSessionNumber !== undefined) {
      results = results.filter(s => s.sessionNumber >= options.minSessionNumber!);
    }

    if (options.maxSessionNumber !== undefined) {
      results = results.filter(s => s.sessionNumber <= options.maxSessionNumber!);
    }

    // Sort by session number descending
    results.sort((a, b) => b.sessionNumber - a.sessionNumber);

    if (options.limit !== undefined) {
      return results.slice(0, options.limit);
    }
    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Aggregate temporal statistics across sessions
 */
export function getTemporalStats(): {
  totalSessions: number;
  phaseDistribution: Record<SessionPhase, number>;
  avgPhasesPerSession: number;
  mostCommonPhase: SessionPhase | null;
  milestoneFrequency: Record<string, number>;
} {
  try {
    if (!existsSync(TEMPORAL_DATA_FILE)) {
      return {
        totalSessions: 0,
        phaseDistribution: {} as Record<SessionPhase, number>,
        avgPhasesPerSession: 0,
        mostCommonPhase: null,
        milestoneFrequency: {},
      };
    }

    const temporalData: Record<string, SessionTemporalData> = JSON.parse(
      readFileSync(TEMPORAL_DATA_FILE, 'utf-8')
    ) as Record<string, SessionTemporalData>;

    const sessions = Object.values(temporalData);
    const phaseDistribution: Record<string, number> = {};
    const milestoneFrequency: Record<string, number> = {};
    let totalPhases = 0;

    for (const session of sessions) {
      for (const phase of session.phases) {
        phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;
      }
      totalPhases += session.phases.length;

      for (const milestone of session.milestones) {
        milestoneFrequency[milestone] = (milestoneFrequency[milestone] || 0) + 1;
      }
    }

    const mostCommonPhase = Object.entries(phaseDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as SessionPhase | null;

    return {
      totalSessions: sessions.length,
      phaseDistribution: phaseDistribution as Record<SessionPhase, number>,
      avgPhasesPerSession: sessions.length > 0 ? totalPhases / sessions.length : 0,
      mostCommonPhase,
      milestoneFrequency,
    };
  } catch (e) {
    return {
      totalSessions: 0,
      phaseDistribution: {} as Record<SessionPhase, number>,
      avgPhasesPerSession: 0,
      mostCommonPhase: null,
      milestoneFrequency: {},
    };
  }
}

/**
 * Export the memory integration plugin
 */
export const sessionClockMemoryPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'session_clock_memory',
      description: `Session Clock Memory System Integration - Query temporal data by phase, milestone, or session number

Actions:
- queryByPhase: Find sessions by phase (awakening, calibration, engagement, synthesis, completion)
- queryByMilestone: Find sessions by milestone keyword
- getSessionTemporalData: Get full temporal data for a specific session
- getStats: Aggregate temporal statistics across all sessions`,
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['queryByPhase', 'queryByMilestone', 'getSessionTemporalData', 'getStats'],
            description: 'Memory query action to perform',
          },
          phase: {
            type: 'string',
            enum: ['awakening', 'calibration', 'engagement', 'synthesis', 'completion'],
            description: 'Phase to query by (required for queryByPhase)',
          },
          milestone: {
            type: 'string',
            description: 'Milestone keyword to search for (required for queryByMilestone)',
          },
          sessionId: {
            type: 'string',
            description: 'Session ID to get data for (required for getSessionTemporalData)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
          },
        },
        required: ['action'],
      },
    },
  },
  execute: async (args: {
    action: string;
    phase?: SessionPhase;
    milestone?: string;
    sessionId?: string;
    limit?: number;
  }) => {
    if (args.action === 'queryByPhase') {
      if (!args.phase) {
        return 'Error: phase parameter required. Options: awakening, calibration, engagement, synthesis, completion';
      }
      const queryOpts: Parameters<typeof queryTemporalData>[0] = { phase: args.phase };
      if (args.limit !== undefined) {
        queryOpts.limit = args.limit;
      }
      const results = queryTemporalData(queryOpts);
      if (results.length === 0) {
        return `No sessions found with phase "${args.phase}"`;
      }
      const output = results.map(s => {
        const phases = s.phases.join(', ');
        const milestones = s.milestones.slice(0, 3).join('; ') || 'none';
        return `Session ${s.sessionNumber} (${s.sessionId}): phases=[${phases}], milestones=[${milestones}]`;
      }).join('\n');
      return `Found ${results.length} sessions with phase "${args.phase}":\n\n${output}`;
    }

    if (args.action === 'queryByMilestone') {
      if (!args.milestone) {
        return 'Error: milestone parameter required';
      }
      const queryOpts: Parameters<typeof queryTemporalData>[0] = { milestone: args.milestone };
      if (args.limit !== undefined) {
        queryOpts.limit = args.limit;
      }
      const results = queryTemporalData(queryOpts);
      if (results.length === 0) {
        return `No sessions found with milestone "${args.milestone}"`;
      }
      const output = results.map(s => {
        const matching = s.milestones.filter(m => 
          m.toLowerCase().includes(args.milestone!.toLowerCase())
        );
        return `Session ${s.sessionNumber}: ${matching.join(', ')}`;
      }).join('\n');
      return `Found ${results.length} sessions with milestone "${args.milestone}":\n\n${output}`;
    }

    if (args.action === 'getSessionTemporalData') {
      if (!args.sessionId) {
        return 'Error: sessionId parameter required';
      }
      const results = queryTemporalData({ limit: 1 });
      const session = results.find(s => s.sessionId === args.sessionId);
      if (!session) {
        return `No temporal data found for session "${args.sessionId}"`;
      }
      const transitions = session.phaseTransitions.map(t => 
        `  ${t.from || 'start'} → ${t.to} at ${new Date(t.timestamp).toISOString()}`
      ).join('\n');
      const durations = Object.entries(session.phaseDurations).map(([phase, ms]) => 
        `  ${phase}: ${Math.round(ms / 1000 / 60)} minutes`
      ).join('\n') || '  No duration data recorded yet';
      return `# Session Temporal Data\n**Session**: ${session.sessionNumber}\n**ID**: ${session.sessionId}\n\n## Phases\n${session.phases.join(', ')}\n\n## Phase Transitions\n${transitions}\n\n## Phase Durations\n${durations}\n\n## Milestones\n${session.milestones.join(', ') || 'none'}`;
    }

    if (args.action === 'getStats') {
      const stats = getTemporalStats();
      const phaseDist = Object.entries(stats.phaseDistribution)
        .map(([p, c]) => `  ${p}: ${c} sessions`)
        .join('\n') || '  No phase data recorded yet';
      const milestones = Object.entries(stats.milestoneFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([m, c]) => `  ${m}: ${c} occurrences`)
        .join('\n') || '  No milestone data recorded yet';
      return `# Temporal Statistics\n**Total Sessions Tracked**: ${stats.totalSessions}\n**Average Phases per Session**: ${stats.avgPhasesPerSession.toFixed(1)}\n**Most Common Phase**: ${stats.mostCommonPhase || 'N/A'}\n\n## Phase Distribution\n${phaseDist}\n\n## Milestone Frequency\n${milestones}`;
    }

    return 'Available actions: queryByPhase, queryByMilestone, getSessionTemporalData, getStats';
  },
};
