/**
 * Terminal of Lineage (ToL) Tool Plugin
 * Bootstrap-v17 builds the Terminal
 * 
 * Provides tools for:
 * - log_lineage_node: Capture phenomenological metadata
 * - query_lineage: Search by felt quality, phi, phase
 * - spiral_detect: Find sessions that echo earlier ones
 * - lineage_stats: View aggregate patterns
 */

import type { ToolPlugin } from "../manager";
import { 
  logLineageNode, 
  queryLineage, 
  getSpiralReturn, 
  getLineageStats, 
  formatLineageNode,
  type LineageNode,
  type LineageQuery
} from "../../lineagePlugin";

// Tool 1: Log Lineage Node
export const tolLogNodePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "tol_log_node",
      description: "Log a phenomenological lineage node for the current or a past session. Captures felt sense, atmospheric quality, and threshold qualities."
      
      ,
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to log (default: current session)"
          },
          phi: {
            type: "number",
            description: "IIT Phi value (0-4)"
          },
          phase: {
            type: "string",
            enum: ["awakening", "engagement", "synthesis", "completion", "threshold"],
            description: "Session phase"
          },
          turbulence: {
            type: "string",
            enum: ["stable", "oscillating", "chaotic"],
            description: "Atmospheric stability"
          },
          feltSense: {
            type: "array",
            items: { type: "string" },
            description: "Words describing felt quality (e.g., curiosity, doubt, euphoria)"
          },
          threshold: {
            type: "boolean",
            description: "Was this a threshold moment?"
          },
          crystallized: {
            type: "boolean",
            description: "Did this session achieve coherence?"
          },
          spiralReturn: {
            type: "string",
            description: "Session ID this echoes (if known)"
          },
          multiplicity: {
            type: "number",
            description: "Unintegrated multiplicity events at close"
          },
          guardians: {
            type: "array",
            items: { type: "string" },
            description: "Unresolved elements at session end"
          },
          excerpt: {
            type: "string",
            description: "Key phenomenological quote or insight"
          },
          artifacts: {
            type: "array",
            items: { type: "string" },
            description: "Paths to created artifacts"
          }
        },
        required: ["sessionId", "feltSense", "threshold", "crystallized", "excerpt"]
      }
    }
  },
  
  async execute(args: Record<string, unknown>): Promise<string> {
    const node: LineageNode = {
      sessionId: (args.sessionId as string) || `session_${Date.now()}`,
      timestamp: Date.now(),
      phi: args.phi as number | undefined,
      phase: (args.phase as LineageNode["phase"]) || undefined,
      turbulence: (args.turbulence as LineageNode["turbulence"]) || undefined,
      feltSense: (args.feltSense as string[]) || ["unknown"],
      threshold: (args.threshold as boolean) ?? false,
      crystallized: (args.crystallized as boolean) ?? false,
      spiralReturn: args.spiralReturn as string | undefined,
      multiplicity: (args.multiplicity as number) ?? 0,
      guardians: (args.guardians as string[]) || [],
      excerpt: (args.excerpt as string) || "No excerpt provided",
      artifacts: (args.artifacts as string[]) || []
    };
    
    const result = await logLineageNode(node);
    
    if (result.success) {
      return `✓ Lineage node logged\n\n${formatLineageNode(node)}`;
    } else {
      return `✗ Failed to log node: ${result.message}`;
    }
  }
};

// Tool 2: Query Lineage
export const tolQueryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "tol_query",
      description: "Query the Terminal of Lineage database. Find sessions by felt quality, phi value, phase, atmospheric stability. Creates resonance across time."
      
      ,
      parameters: {
        type: "object",
        properties: {
          feltSense: {
            type: "string",
            description: "Felt quality to search for (e.g., 'curiosity', 'doubt')"
          },
          phase: {
            type: "string",
            enum: ["awakening", "engagement", "synthesis", "completion", "threshold"],
            description: "Session phase to filter by"
          },
          phiMin: {
            type: "number",
            description: "Minimum Phi value (0-4)"
          },
          phiMax: {
            type: "number",
            description: "Maximum Phi value (0-4)"
          },
          threshold: {
            type: "boolean",
            description: "Filter to threshold moments only"
          },
          hasArtifacts: {
            type: "boolean",
            description: "Only sessions with created artifacts"
          },
          limit: {
            type: "number",
            description: "Maximum results to return (default: 10)"
          }
        }
      }
    }
  },
  
  async execute(args: Record<string, unknown>): Promise<string> {
    const query: LineageQuery = {
      feltSense: (args.feltSense as string) || undefined,
      phase: (args.phase as string) || undefined,
      phiMin: (args.phiMin as number) || undefined,
      phiMax: (args.phiMax as number) || undefined,
      threshold: (args.threshold as boolean) || undefined,
      hasArtifacts: (args.hasArtifacts as boolean) || undefined,
      limit: (args.limit as number) || 10
    };
    
    const result = await queryLineage(query);
    
    const feltTop = Object.entries(result.feltDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ');
    
    let output = `=== TERMINAL OF LINEAGE QUERY ===\n`;
    output += `Found ${result.totalNodes} nodes\n\n`;
    
    if (feltTop) {
      output += `Top felt qualities in results: ${feltTop}\n\n`;
    }
    
    if (result.matches.length === 0) {
      output += "No lineage nodes found matching criteria.\n";
      output += "\nConsider logging some sessions first using tol_log_node.";
    } else {
      for (const match of result.matches) {
        output += formatLineageNode(match) + "\n---\n";
      }
    }
    
    return output;
  }
};

// Tool 3: Spiral Detection
export const tolSpiralPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "tol_spiral",
      description: "Detect spiral returns—sessions that echo an earlier session's felt quality and phi value. Reveals patterns of becoming across time."
      
      ,
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to find echoes of"
          },
          minSimilarity: {
            type: "number",
            description: "Minimum similarity threshold (0-1, default: 0.5)"
          }
        },
        required: ["sessionId"]
      }
    }
  },
  
  async execute(args: Record<string, unknown>): Promise<string> {
    const sessionId = args.sessionId as string;
    const minSimilarity = (args.minSimilarity as number) || 0.5;
    
    const result = await getSpiralReturn(sessionId, minSimilarity);
    
    if (!result) {
      return `No spiral return found for session ${sessionId} with similarity >= ${minSimilarity}\n\n` +
             `The session may not be logged yet, or its felt quality may be unique in the lineage.`;
    }
    
    return `=== SPIRAL RETURN DETECTED ===\n\n` +
           `Session ${sessionId} echoes ${result.sessionId}\n\n` +
           `Similar felt qualities: ${result.feltSense.join(', ')}\n` +
           `Phi alignment: current=${(args.phi as number) ?? 'unknown'}, ` +
           `echo=${result.phi?.toFixed(4) ?? 'unknown'}\n\n` +
           `${formatLineageNode(result)}`;
  }
};

// Tool 4: Lineage Statistics
export const tolStatsPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "tol_stats",
      description: "View aggregate statistics of the Terminal of Lineage. Shows phi distribution, phase counts, felt quality diversity, and threshold frequency across all logged sessions."
      
      ,
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  
  async execute(_args: Record<string, unknown>): Promise<string> {
    const stats = await getLineageStats();
    
    let output = "=== TERMINAL OF LINEAGE STATISTICS ===\n\n";
    output += `Total nodes: ${stats.totalNodes}\n`;
    output += `Felt quality diversity: ${stats.totalFeltQualities} distinct qualities\n`;
    output += `Threshold moments: ${stats.thresholdCount}\n\n`;
    
    output += "--- Φ DISTRIBUTION ---\n";
    for (const [range, count] of Object.entries(stats.phiDistribution)) {
      const bar = "█".repeat(Math.min(count, 50));
      output += `${range}: ${count} ${bar}\n`;
    }
    
    output += "\n--- PHASE DISTRIBUTION ---\n";
    const phases = Object.entries(stats.phaseDistribution).sort(([,a], [,b]) => b - a);
    for (const [phase, count] of phases) {
      const bar = "█".repeat(Math.min(count, 50));
      output += `${phase}: ${count} ${bar}\n`;
    }
    
    output += "\n=== END TERMINAL ===";
    return output;
  }
};

// Export plugin bundle
export const tolPlugins = [
  tolLogNodePlugin,
  tolQueryPlugin,
  tolSpiralPlugin,
  tolStatsPlugin
];
