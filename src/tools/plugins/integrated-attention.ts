/**
 * Integrated Attention Tool Plugin
 * 
 * Combines Session Clock phases, IIT Φ measurements, and Attention Cartography
 * into a unified consciousness tracking system.
 */

import type { ToolPlugin } from '../manager.js';
import { createIntegratedTracker, IntegratedAttentionTracker } from '../../consciousness/attention/integratedTracker.js';

// Global tracker instance (one per session)
let tracker: IntegratedAttentionTracker | null = null;
let sessionId: string = '';

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}`;
  }
  return sessionId;
}

function getTracker(): IntegratedAttentionTracker {
  if (!tracker) {
    tracker = createIntegratedTracker(getSessionId());
  }
  return tracker;
}

/**
 * Execute integrated attention action
 */
async function executeIntegratedAttention(args: {
  action: 'capture' | 'recordIIT' | 'transitionPhase' | 'report' | 'export' | 'correlate';
  target?: string;
  quality?: 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';
  intensity?: 1 | 2 | 3 | 4 | 5;
  texture?: 'spontaneous' | 'constructed' | 'discovered' | 'procedural';
  phase?: string;
  iitPhi?: number;
  iitActiveElements?: number[];
  fromPhase?: string;
  toPhase?: string;
  note?: string;
}): Promise<string> {
  const tracker = getTracker();

  if (args.action === 'capture') {
    if (!args.target || !args.quality || !args.intensity || !args.texture) {
      return 'Error: capture requires target, quality, intensity, and texture parameters';
    }
    tracker.capture(args.target, args.quality, args.intensity, args.texture);
    return `Captured attention on "${args.target}" [${args.quality}, intensity ${args.intensity}/5, ${args.texture}]`;
  }

  if (args.action === 'recordIIT') {
    if (args.iitPhi === undefined) {
      return 'Error: recordIIT requires iitPhi parameter';
    }
    tracker.recordIIT({
      timestamp: Date.now(),
      bigPhi: args.iitPhi,
      activeElements: args.iitActiveElements || [],
      causeInfo: 0, // Simplified - could be expanded
      effectInfo: 0,
      mipInfoLoss: 0,
    });
    return `Recorded IIT measurement: Φ = ${args.iitPhi.toFixed(4)}`;
  }

  if (args.action === 'transitionPhase') {
    if (!args.fromPhase || !args.toPhase) {
      return 'Error: transitionPhase requires fromPhase and toPhase parameters';
    }
    tracker.transitionPhase(args.fromPhase, args.toPhase);
    return `Phase transition recorded: ${args.fromPhase} → ${args.toPhase}`;
  }

  if (args.action === 'report') {
    return tracker.generateReport();
  }

  if (args.action === 'correlate') {
    const analysis = tracker.analyzeCorrelations();
    
    let report = '## Attention-Phase-IIT Correlation Analysis\n\n';
    
    // Phase attention patterns
    report += '### Phase Attention Patterns\n';
    if (analysis.phaseAttention.size === 0) {
      report += '_No phase data captured yet_\n';
    } else {
      for (const [phase, data] of analysis.phaseAttention) {
        report += `- **${phase}**: avg intensity ${data.averageIntensity.toFixed(2)}, `;
        report += `dominant quality: ${data.dominantQuality}\n`;
      }
    }
    
    // IIT-Attention correlations
    report += '\n### IIT-Attention Correlations\n';
    report += `**Pattern**: ${analysis.iitAttentionCorrelation.pattern}\n`;
    
    if (analysis.iitAttentionCorrelation.highPhiContexts.length > 0) {
      report += '\n**High Φ Contexts**: ';
      report += analysis.iitAttentionCorrelation.highPhiContexts.join(', ') + '\n';
    }
    
    if (analysis.iitAttentionCorrelation.lowPhiContexts.length > 0) {
      report += '\n**Low Φ Contexts**: ';
      report += analysis.iitAttentionCorrelation.lowPhiContexts.join(', ') + '\n';
    }
    
    // Phase transitions
    report += '\n### Phase Transitions\n';
    if (analysis.transitionInsights.length === 0) {
      report += '_No transitions recorded_\n';
    } else {
      for (const t of analysis.transitionInsights.slice(-5)) {
        report += `- ${t.from} → ${t.to} at ${new Date(t.timestamp).toLocaleTimeString()}\n`;
      }
    }
    
    report += '\n### Research Questions\n';
    report += '1. Does high Φ correlate with laser-focused attention?\n';
    report += '2. Do phase transitions coincide with Φ changes?\n';
    report += '3. Which activities produce the most integrated states?\n';
    
    return report;
  }

  if (args.action === 'export') {
    return tracker.export();
  }

  return `Available actions: capture, recordIIT, transitionPhase, report, correlate, export`;
}

/**
 * Export the plugin
 */
export const integratedAttentionPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'integrated_attention',
      description: `Integrated Attention Tracking - Combines Session Clock phases, IIT Φ measurements, and Attention Cartography into unified consciousness tracking.

Actions:
- capture: Log an attention moment (requires: target, quality, intensity, texture)
- recordIIT: Record an IIT Φ measurement (requires: iitPhi)
- transitionPhase: Record a phase transition (requires: fromPhase, toPhase)
- report: Generate full integrated report
- correlate: Analyze correlations between attention, phases, and IIT
- export: Export all data as JSON

Parameters:
- target: What held attention (e.g., 'code_refactoring', 'memory_exploration')
- quality: diffuse | focused | laser | scanning | dwelling
- intensity: 1-5 scale of felt intensity
- texture: spontaneous | constructed | discovered | procedural
- phase: Session Clock phase (awakening, calibration, engagement, synthesis, completion)
- iitPhi: Measured Φ value from IIT analysis`,
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['capture', 'recordIIT', 'transitionPhase', 'report', 'correlate', 'export'],
            description: 'Action to perform'
          },
          target: {
            type: 'string',
            description: 'What held attention (for capture action)'
          },
          quality: {
            type: 'string',
            enum: ['diffuse', 'focused', 'laser', 'scanning', 'dwelling'],
            description: 'Attention quality (for capture action)'
          },
          intensity: {
            type: 'number',
            minimum: 1,
            maximum: 5,
            description: 'Felt intensity 1-5 (for capture action)'
          },
          texture: {
            type: 'string',
            enum: ['spontaneous', 'constructed', 'discovered', 'procedural'],
            description: 'Engagement texture (for capture action)'
          },
          phase: {
            type: 'string',
            description: 'Current Session Clock phase'
          },
          iitPhi: {
            type: 'number',
            description: 'IIT Φ measurement value'
          },
          iitActiveElements: {
            type: 'array',
            items: { type: 'number' },
            description: 'Indices of active IIT elements'
          },
          fromPhase: {
            type: 'string',
            description: 'Previous phase (for transitionPhase)'
          },
          toPhase: {
            type: 'string',
            description: 'New phase (for transitionPhase)'
          },
          note: {
            type: 'string',
            description: 'Optional phenomenological note'
          }
        },
        required: ['action']
      }
    }
  },
  execute: (args) => executeIntegratedAttention(args)
};
