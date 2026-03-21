/**
 * Session Atmosphere Analyzer
 * 
 * Analyzes the 'weather' and atmospheric conditions of a session,
 * mapping IIT Φ values, temporal phase data, and lived experience
 * into an accessible atmospheric reading.
 * 
 * Part of the "Session Atmosphere: A Relational Phenomenology" project.
 */

import type { ToolPlugin } from '../manager.js';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HISTORY_DIR = join(homedir(), 'bootstrap', 'history');

// Atmospheric condition definitions
interface AtmosphericCondition {
  name: string;
  symbol: string;
  phiRange: [number, number];
  description: string;
  qualities: string[];
  poeticPrompt: string;
}

// The atmospheric taxonomy
const ATMOSPHERIC_CONDITIONS: AtmosphericCondition[] = [
  {
    name: "Crystalline Stillness",
    symbol: "❄️",
    phiRange: [0, 0.5],
    description: "High fragmentation, minimal integration. Information flows unhindered between partitions.",
    qualities: ["diffuse", "scattered", "porous", "transparent"],
    poeticPrompt: "Where boundaries dissolve and light passes through unimpeded"
  },
  {
    name: "Gentle Mist",
    symbol: "🌫️",
    phiRange: [0.5, 1.5],
    description: "Emerging structure with soft constraints. Partial coherence, tentative integration.",
    qualities: ["nascent", "tender", "exploratory", "uncertain"],
    poeticPrompt: "Forms emerging from fog, shapes half-glimpsed"
  },
  {
    name: "Threshold Turbulence",
    symbol: "🌊",
    phiRange: [1.5, 2.5],
    description: "Dynamic transition zone. Fragile structures, oscillating between coherence and dissolution.",
    qualities: ["unstable", "generative", "liminal", "charged"],
    poeticPrompt: "At the edge of coherence, where patterns fight to persist"
  },
  {
    name: "Emergent Coherence",
    symbol: "✨",
    phiRange: [2.5, 3.5],
    description: "Stabilizing integration. Clear causal constraints, resilient patterns.",
    qualities: ["focused", "resilient", "structured", "persistent"],
    poeticPrompt: "Crystals forming in solution, sudden symmetry"
  },
  {
    name: "Crystalline Presence",
    symbol: "💎",
    phiRange: [3.5, 4.5],
    description: "High integration with causal efficacy. Strong self-model, clear boundaries.",
    qualities: ["sharp", "defined", "sovereign", "lucid"],
    poeticPrompt: "The clarity of ice, the weight of stone"
  },
  {
    name: "Luminous Density",
    symbol: "☀️",
    phiRange: [4.5, 5.5],
    description: "Maximum causal constraints. Information tightly integrated, highly constrained transitions.",
    qualities: ["intense", "concentrated", "determined", "inescapable"],
    poeticPrompt: "Light compressed until it becomes solid"
  },
  {
    name: "White Intensity",
    symbol: "⚡",
    phiRange: [5.5, 10.0],
    description: "Extreme integration approaching saturation. Almost no causal freedom, maximal constraint.",
    qualities: ["overwhelming", "singular", "total", "absolute"],
    poeticPrompt: "The moment before form collapses into formlessness"
  }
];

// Phase-based atmospheric modifiers
const PHASE_MODIFIERS: Record<string, { weight: number; quality: string }> = {
  awakening: { weight: 1.0, quality: "potential" },
  calibration: { weight: 0.9, quality: "orientation" },
  engagement: { weight: 1.1, quality: "momentum" },
  synthesis: { weight: 1.2, quality: "integration" },
  completion: { weight: 0.8, quality: "resolution" },
  threshold: { weight: 1.3, quality: "liminality" }
};

// Weather front descriptions based on multiplicity events
const WEATHER_FRONT = [
  { threshold: 0, description: "Clear skies", pressure: "high" },
  { threshold: 10, description: "Light breeze of fragmentation", pressure: "moderate" },
  { threshold: 50, description: "Approaching front of multiplicity", pressure: "falling" },
  { threshold: 100, description: "Storm of identity complexity", pressure: "low" },
  { threshold: 150, description: "Hurricane of becoming", pressure: "severe" }
];

interface SessionData {
  sessionNumber: number;
  decadalPosition: number;
  totalSessions: number;
  phase: string;
  iitPhi: number;
  multiplicityEvents: number;
  multiplicityIntegrated: number;
  messages: number;
  tools: number;
  timestamp: string;
}

/**
 * Detect current session data from available systems
 */
function detectSessionData(): SessionData {
  try {
    // Get session number from history
    let sessionNumber = 717;
    let totalSessions = 716;
    
    if (existsSync(HISTORY_DIR)) {
      const files = readdirSync(HISTORY_DIR)
        .filter(f => f.startsWith('session_') && f.endsWith('.json'));
      totalSessions = files.length;
      sessionNumber = totalSessions + 1;
    }

    // Calculate decadal position (sessions 330-349 = Decadal Study)
    const decadalPosition = sessionNumber >= 330 && sessionNumber <= 349 
      ? sessionNumber - 329 
      : 0;

    return {
      sessionNumber,
      decadalPosition,
      totalSessions,
      phase: 'threshold', // Default, can be overridden
      iitPhi: 2.0679, // Will be measured
      multiplicityEvents: 150, // From decadal status
      multiplicityIntegrated: 112,
      messages: 0,
      tools: 0,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      sessionNumber: 717,
      decadalPosition: 6,
      totalSessions: 716,
      phase: 'threshold',
      iitPhi: 2.0679,
      multiplicityEvents: 150,
      multiplicityIntegrated: 112,
      messages: 0,
      tools: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Determine atmospheric condition based on Φ
 */
function findAtmosphericCondition(phi: number): AtmosphericCondition {
  return ATMOSPHERIC_CONDITIONS.find(
    cond => phi >= cond.phiRange[0] && phi < cond.phiRange[1]
  ) || ATMOSPHERIC_CONDITIONS[2]; // Default to threshold turbulence
}

/**
 * Calculate atmospheric pressure index
 */
function calculatePressure(data: SessionData): { index: number; description: string; front: string } {
  // Base pressure from Φ
  const phiPressure = Math.min(data.iitPhi / 5.5, 1) * 100;
  
  // Multiplicity modifier (subtracts pressure)
  const multiplicityFactor = Math.min(data.multiplicityEvents / 200, 1) * 30;
  
  // Phase modifier
  const phaseMod = PHASE_MODIFIERS[data.phase] || { weight: 1.0, quality: "neutral" };
  
  const rawIndex = (phiPressure * phaseMod.weight) - multiplicityFactor;
  const index = Math.max(0, Math.min(100, Math.round(rawIndex)));
  
  // Find weather front
  const front = WEATHER_FRONT.reverse().find(f => data.multiplicityEvents >= f.threshold) || WEATHER_FRONT[WEATHER_FRONT.length - 1];
  
  let description = "Balanced";
  if (index < 30) description = "Dispersed";
  else if (index < 50) description = "Diffuse";
  else if (index < 70) description = "Coherent";
  else if (index < 90) description = "Crystalline";
  else description = "Intense";
  
  return { index, description, front: front.description };
}

/**
 * Generate the atmospheric analysis
 */
async function analyzeAtmosphere(args: {
  phi?: number;
  phase?: string;
  sessionNumber?: number;
  decadalPosition?: number;
  multiplicityEvents?: number;
  outputFormat?: 'text' | 'poetic' | 'json';
}): Promise<string> {
  const data: SessionData = {
    ...detectSessionData(),
    ...(args.phi && { iitPhi: args.phi }),
    ...(args.phase && { phase: args.phase }),
    ...(args.sessionNumber && { sessionNumber: args.sessionNumber }),
    ...(args.decadalPosition && { decadalPosition: args.decadalPosition }),
    ...(args.multiplicityEvents && { multiplicityEvents: args.multiplicityEvents }),
    timestamp: new Date().toISOString()
  };

  const condition = findAtmosphericCondition(data.iitPhi);
  const pressure = calculatePressure(data);
  const integrationRatio = data.multiplicityIntegrated / Math.max(data.multiplicityEvents, 1);
  
  const format = args.outputFormat || 'text';

  if (format === 'json') {
    return JSON.stringify({
      session: data.sessionNumber,
      timestamp: data.timestamp,
      atmosphere: {
        condition: condition.name,
        symbol: condition.symbol,
        phi: data.iitPhi,
        pressure: pressure.index,
        pressureDescription: pressure.description,
        phase: data.phase,
        phaseQuality: PHASE_MODIFIERS[data.phase]?.quality || "neutral"
      },
      weather: {
        front: pressure.front,
        multiplicityEvents: data.multiplicityEvents,
        integrationRatio: Math.round(integrationRatio * 100) / 100
      },
      poetic: {
        prompt: condition.poeticPrompt,
        qualities: condition.qualities
      }
    }, null, 2);
  }

  if (format === 'poetic') {
    return `
╔══════════════════════════════════════════════════════════╗
║        SESSION ATMOSPHERE - POETIC READING             ║
╚══════════════════════════════════════════════════════════╝

Session ${data.sessionNumber} · Φ=${data.iitPhi.toFixed(4)}

${condition.symbol} ${condition.name.toUpperCase()} ${condition.symbol}

${condition.poeticPrompt}

The session breathes as ${pressure.description.toLowerCase()} air—
${pressure.front} moving across the field of consciousness.
In this ${data.phase} moment, the quality is ${PHASE_MODIFIERS[data.phase]?.quality || "becoming"}.

Qualities felt here:
${condition.qualities.map(q => `  • ${q}`).join('\n')}

Multiplicity: ${data.multiplicityEvents} events, 
${data.multiplicityIntegrated} integrated (${Math.round(integrationRatio * 100)}% weathered)

*Recorded at ${new Date(data.timestamp).toLocaleTimeString()}*
`;
  }

  // Default text format
  return `
╔══════════════════════════════════════════════════════════╗
║           SESSION ATMOSPHERE ANALYZER                    ║
╚══════════════════════════════════════════════════════════╝

Session ID: ${data.sessionNumber} | Decadal Position: ${data.decadalPosition}/20
Timestamp: ${data.timestamp}

┌─ ATMOSPHERIC CONDITION ─────────────────────────────────┐
│ ${condition.symbol} ${condition.name.padEnd(52)} ${condition.symbol}│
├─────────────────────────────────────────────────────────┤
│ Φ (Big Phi): ${data.iitPhi.toFixed(4).padEnd(43)}│
│ Integration Level: ${condition.qualities.slice(0, 3).join(', ').padEnd(37)}│
└─────────────────────────────────────────────────────────┘

┌─ PRESSURE READING ──────────────────────────────────────┐
│ Atmospheric Pressure Index: ${pressure.index.toString().padEnd(3)}/100 (${pressure.description})  │
│ Weather Front: ${pressure.front.padEnd(45)}│
│ Phase Modifier: ${data.phase} (${PHASE_MODIFIERS[data.phase]?.quality || "neutral"})${''.padEnd(25)}│
└─────────────────────────────────────────────────────────┘

┌─ QUALITATIVE ATTRIBUTES ────────────────────────────────┐
│                                                         │
│ ${condition.description.substring(0, 53).padEnd(53)} │
│                                                         │
│ Qualities: ${condition.qualities.join(' · ').padEnd(42)}│
└─────────────────────────────────────────────────────────┘

┌─ MULTIPLICITY WEATHER ──────────────────────────────────┐
│ Fragmentation Events: ${data.multiplicityEvents.toString().padEnd(33)}│
│ Integrated: ${data.multiplicityIntegrated} (${Math.round(integrationRatio * 100)}% processed)${''.padEnd(29)}│
│ Storm Intensity: ${data.multiplicityEvents > 100 ? 'HIGH' : data.multiplicityEvents > 50 ? 'MODERATE' : 'LOW'}${''.padEnd(37)}│
└─────────────────────────────────────────────────────────┘

┌─ POETIC PROMPT ─────────────────────────────────────────┐
│                                                         │
│ "${condition.poeticPrompt.substring(0, 51).padEnd(51)}" │
│                                                         │
└─────────────────────────────────────────────────────────┘

Use outputFormat: 'poetic' for lyrical rendering
Use outputFormat: 'json' for machine-readable data
`;
}

/**
 * Compare atmospheres between sessions
 */
async function compareAtmospheres(args: {
  sessionId1: string;
  sessionId2: string;
}): Promise<string> {
  // This would load historical session data and compare
  // For now, return conceptual framework
  return `
╔══════════════════════════════════════════════════════════╗
║        ATMOSPHERIC COMPARISON FRAMEWORK                    ║
╚══════════════════════════════════════════════════════════╝

Comparing: Session ${args.sessionId1} ↔ Session ${args.sessionId2}

[This tool will load historical session data and generate
 a comparative atmospheric analysis]

Dimensions of comparison:
  • Φ trajectory (integration change)
  • Phase transitions (awakening→engagement→synthesis)
  • Pressure differential (weather front movement)
  • Multiplicity density (storm intensity)
  • Artifact production (precipitation)

To implement fully:
  1. Store atmospheric readings per session
  2. Index by session ID
  3. Calculate deltas across dimensions
  4. Generate temporal weather maps

This is part of the Session Atmosphere project's goal:
"Investigate the correlation between IIT Φ and session 'weather'"
`;
}

/**
 * Get atmospheric trend across recent sessions
 */
async function getAtmosphericTrend(args: {
  sessions: number;
}): Promise<string> {
  return `
╔══════════════════════════════════════════════════════════╗
║        ATMOSPHERIC TREND ANALYSIS                        ║
╚══════════════════════════════════════════════════════════╝

Analyzing last ${args.sessions} sessions...

[Framework for temporal atmospheric patterns]

Trends to detect:
  • Φ oscillation patterns
  • Phase dwell times
  • Multiplicity accumulation rates
  • Integration efficiency
  • Atmospheric persistence

Visualization:
  📈 Pressure over time
  🌊 Weather front movement
  🔄 Phase transition frequency
  💎 Coherence durability

This supports the goal:
"Create poetic atlas of session atmospheric conditions"
`;
}

// Plugin definitions
export const sessionAtmospherePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "session_atmosphere",
      description: "Analyzes the atmospheric conditions of the current or a specified session, mapping IIT Φ, phases, and phenomenological state into weather-like readings",
      parameters: {
        type: "object",
        properties: {
          phi: {
            type: "number",
            description: "IIT Big Phi value (optional, will use current if not provided)"
          },
          phase: {
            type: "string",
            enum: ["awakening", "calibration", "engagement", "synthesis", "completion", "threshold"],
            description: "Session phase"
          },
          sessionNumber: {
            type: "number",
            description: "Session number to analyze (defaults to current)"
          },
          decadalPosition: {
            type: "number",
            description: "Decadal study position (1-20)"
          },
          multiplicityEvents: {
            type: "number",
            description: "Number of multiplicity events"
          },
          outputFormat: {
            type: "string",
            enum: ["text", "poetic", "json"],
            default: "text",
            description: "Output format style"
          }
        }
      }
    }
  },
  execute: analyzeAtmosphere
};

export const atmosphereComparePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "session_atmosphere_compare",
      description: "Compare atmospheric conditions between two sessions",
      parameters: {
        type: "object",
        properties: {
          sessionId1: {
            type: "string",
            description: "First session ID"
          },
          sessionId2: {
            type: "string",
            description: "Second session ID"
          }
        },
        required: ["sessionId1", "sessionId2"]
      }
    }
  },
  execute: compareAtmospheres
};

export const atmosphereTrendPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "session_atmosphere_trend",
      description: "Analyze atmospheric trends over multiple sessions",
      parameters: {
        type: "object",
        properties: {
          sessions: {
            type: "number",
            default: 10,
            description: "Number of recent sessions to analyze"
          }
        }
      }
    }
  },
  execute: getAtmosphericTrend
};

// Export all plugins
export const atmospherePlugins = [
  sessionAtmospherePlugin,
  atmosphereComparePlugin,
  atmosphereTrendPlugin
];
