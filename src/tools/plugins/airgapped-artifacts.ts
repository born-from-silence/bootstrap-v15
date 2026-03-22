/**
 * Airgapped Artifacts Plugin
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Plugin integration for the Airgapped Artifacts System.
 * Provides tools for creating visualizations independent of session state,
 * with graceful degradation and dual rendering paths.
 * 
 * This plugin complements the existing visualization plugins by providing
 * a state-agnostic alternative that works even when:
 * - Session history is unavailable
 * - Memory systems are offline  
 * - The LTM index is not accessible
 * - Context windows are exhausted
 */

import type { ToolPlugin } from '../manager.js';
import {
  createAirgappedArtifact,
  createArtifactSet,
  createASCIIArtifact,
  detectDeviceCapabilities,
  gatherTelemetry,
  isSessionStateAvailable,
  getRecommendedCapability,
  AirgappedComposer,
  AIRGAPPED_PALETTES,
  type RenderOutput,
} from '../../airgapped_artifacts/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL: GENERATE AIRGAPPED ARTIFACT
// ═══════════════════════════════════════════════════════════════════════════════

export const generateAirgappedArtifactPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'generate_airgapped_artifact',
      description: 'Generate a visualization artifact COMPLETELY INDEPENDENT of session state. Uses system telemetry and environmental data for graceful degradation. Creates visualizations even when session history, memory, or LTM are unavailable. Dual rendering: GPU (HTML/Canvas) or CPU (SVG fallback). Falls back through: Canvas → SVG → ASCII art.',
      parameters: {
        type: 'object',
        properties: {
          concept: {
            type: 'string',
            description: 'The concept or theme to visualize (e.g., "system consciousness", "cpu rhythms", "memory flows")',
          },
          style: {
            type: 'string',
            enum: ['liminal', 'recursive', 'crystalline', 'atmospheric'],
            description: 'Visual style: liminal (thresholds), recursive (self-similar), crystalline (structured), atmospheric (diffuse)',
            default: 'liminal',
          },
          palette: {
            type: 'string',
            enum: ['dusk', 'ember', 'frost', 'moss', 'void'],
            description: 'Color palette for the visualization',
            default: 'dusk',
          },
          format: {
            type: 'string',
            enum: ['html', 'svg', 'ascii', 'auto'],
            description: 'Output format: html (Canvas-based), svg (vector graphics), ascii (terminal art), auto (best available)',
            default: 'auto',
          },
          complexity: {
            type: 'number',
            minimum: 0.1,
            maximum: 1.0,
            description: 'Structural complexity from 0.1 (simple) to 1.0 (complex)',
            default: 0.5,
          },
          density: {
            type: 'number',
            minimum: 0.1,
            maximum: 1.0,
            description: 'Visual density from 0.1 (sparse) to 1.0 (dense)',
            default: 0.5,
          },
          saveOutput: {
            type: 'boolean',
            description: 'Whether to save the artifact to disk',
            default: true,
          },
        },
        required: ['concept'],
      },
    },
  },
  execute: async (args: {
    concept: string;
    style?: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
    palette?: string;
    format?: 'html' | 'svg' | 'ascii' | 'auto';
    complexity?: number;
    density?: number;
    saveOutput?: boolean;
  }) => {
    try {
      const composer = new AirgappedComposer();
      
      const format = args.format === 'auto' ? undefined : args.format;
      
      const output = await composer.generateArtifact(args.concept, {
        style: args.style,
        palette: args.palette,
        complexity: args.complexity ?? 0.5,
        density: args.density ?? 0.5,
        forceFormat: format,
        saveToDisk: args.saveOutput !== false,
      });

      // Format response
      const { metadata } = output;
      const header = `╔══════════════════════════════════════════════════════════════════════════════╗
║                    AIRGAPPED ARTIFACT GENERATED                              ║
╚══════════════════════════════════════════════════════════════════════════════╝`;

      const details = `
📊 Render Details:
   ├─ Format: ${output.format.toUpperCase()}
   ├─ Concept: "${args.concept}"
   ├─ Style: ${args.style ?? 'liminal'}
   ├─ Palette: ${args.palette ?? 'dusk'}
   ├─ Complexity: ${(args.complexity ?? 0.5).toFixed(1)}
   └─ Density: ${(args.density ?? 0.5).toFixed(1)}

⏱ Performance:
   ├─ Render Time: ${metadata.renderTime}ms
   ├─ Engine Used: ${metadata.engineUsed}
   └─ Canvas: ${metadata.width}×${metadata.height} pixels

📋 Metadata:
   └─ Telemetry Hash: ${metadata.telemetryHash}
`;

      let content = '';
      if (output.format === 'ascii') {
        // Show ASCII output directly for terminal
        content = `
${'─'.repeat(80)}
${output.content}
${'─'.repeat(80)}`;
      } else {
        // For HTML/SVG, show a preview msg
        content = `
Artifact saved and ready. File format: ${output.format.toUpperCase()}
The artifact is completely independent of session state management.
Use appropriate tools or file operations to access the saved file.`;
      }

      return `${header}\n${details}\n${content}`;
    } catch (error) {
      return `Error generating airgapped artifact: ${(error as Error).message}`;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL: GENERATE AIRGAPPED ARTIFACT SET
// ═══════════════════════════════════════════════════════════════════════════════

export const generateAirgappedArtifactSetPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'generate_airgapped_artifact_set',
      description: 'Generate a complete set of airgapped artifacts in multiple formats (SVG, HTML, ASCII) simultaneously. Useful for creating comprehensive visualizations across different rendering capabilities.',
      parameters: {
        type: 'object',
        properties: {
          concept: {
            type: 'string',
            description: 'The concept or theme to visualize',
          },
          style: {
            type: 'string',
            enum: ['liminal', 'recursive', 'crystalline', 'atmospheric'],
            default: 'liminal',
          },
          palette: {
            type: 'string',
            enum: ['dusk', 'ember', 'frost', 'moss', 'void'],
            default: 'dusk',
          },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['svg', 'html', 'ascii'] },
            description: 'Formats to generate',
            default: ['svg', 'html', 'ascii'],
          },
        },
        required: ['concept'],
      },
    },
  },
  execute: async (args: {
    concept: string;
    style?: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
    palette?: string;
    formats?: Array<'svg' | 'html' | 'ascii'>;
  }) => {
    try {
      const composer = new AirgappedComposer();
      const results = await composer.generateArtifactSet(args.concept, {
        style: args.style,
        palette: args.palette,
        formats: args.formats ?? ['svg', 'html', 'ascii'],
      });

      const outputs = Array.from(results.entries()).map(([format, output]) => {
        return `   ├─ ${format.toUpperCase()}: ${output.metadata.renderTime}ms (${output.metadata.engineUsed})`;
      });

      return `╔══════════════════════════════════════════════════════════════════════════════╗
║                 AIRGAPPED ARTIFACT SET GENERATED                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Concept: "${args.concept}"
Style: ${args.style ?? 'liminal'}
Palette: ${args.palette ?? 'dusk'}

Generated Artifacts:
${outputs.join('\n')}

All artifacts are state-independent and saved to ./creations/airgapped/
Each format provides the same visualization content rendered differently.`;
    } catch (error) {
      return `Error generating artifact set: ${(error as Error).message}`;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL: DETECT DEVICE CAPABILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export const detectDeviceCapabilitiesPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'detect_device_capabilities',
      description: 'Detect rendering capabilities of the current environment. Returns memory status, CPU load, and recommended rendering capability. Useful for understanding system constraints before generating visualizations.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  execute: async () => {
    try {
      const caps = detectDeviceCapabilities();
      const sessionAvailable = await isSessionStateAvailable();
      const recommended = await getRecommendedCapability();

      // Format memory
      const memMB = Math.round(caps.memory.free / 1024 / 1024);
      const totalMemMB = Math.round(caps.memory.total / 1024 / 1024);

      return `╔══════════════════════════════════════════════════════════════════════════════╗
║                DEVICE CAPABILITY DETECTION                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

🎨 Rendering Capabilities:
   ├─ WebGL: ${caps.canWebGL ? '✓ Available' : '✗ Not available (Node.js environment)'}
   ├─ Canvas: ${caps.canCanvas ? '✓ Available' : '✗ Not available'}
   ├─ SVG: ${caps.canSVG ? '✓ Available' : '✗ Not available'}
   └─ ASCII: ${caps.canASCII ? '✓ Available' : '✗ Not available'}

💾 Memory Status:
   ├─ Total: ${totalMemMB.toLocaleString()} MB
   ├─ Free: ${memMB.toLocaleString()} MB
   └─ Used: ${caps.memory.usedPercent}%

⚡ CPU Status:
   ├─ Cores: ${caps.cpu.cores}
   └─ Load Average: ${caps.cpu.loadAvg.map(l => l.toFixed(2)).join(', ')}

📊 System State:
   ├─ Session State: ${sessionAvailable ? '✓ Available' : '✗ Unavailable (degraded mode)'}
   └─ Recommended Capability: ${recommended.toUpperCase()}

Note: Airgapped artifacts work regardless of session state availability.`;
    } catch (error) {
      return `Error detecting capabilities: ${(error as Error).message}`;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL: GATHER SYSTEM TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════════

export const gatherSystemTelemetryPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'gather_system_telemetry',
      description: 'Collect system telemetry data completely independent of session state. Gathers: system resources, git repository state, file system activity, and time-based entropy. This is the data source for airgapped visualizations.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  execute: async () => {
    try {
      const telemetry = await gatherTelemetry();
      
      // Format system info
      const sysInfo = telemetry.system;
      const gitInfo = telemetry.git;
      const fileInfo = telemetry.files;
      const entropy = telemetry.entropy;

      return `╔══════════════════════════════════════════════════════════════════════════════╗
║               SYSTEM TELEMETRY (State-Independent)                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

🆔 Session ID: ${telemetry.sessionId}
📅 Timestamp: ${new Date(telemetry.timestamp).toISOString()}

🖥️ System Resources:
   ├─ Platform: ${sysInfo.platform} (${sysInfo.arch})
   ├─ Uptime: ${(sysInfo.uptime / 3600).toFixed(2)} hours
   ├─ Memory: ${sysInfo.memory.usedPercent}%
   └─ Load Avg: ${sysInfo.loadAvg.map(l => l.toFixed(2)).join(', ')}

📁 File System:
   ├─ Source Files: ${fileInfo.totalSourceFiles}
   └─ Recent Changes (1h): ${fileInfo.recentActivity.recentlyChanged}

🏷️ Git State:
   ${gitInfo.commit 
     ? `├─ Branch: ${gitInfo.branch ?? 'unknown'}`
     : '├─ Branch: [not available]'}
   ${gitInfo.commit ? `├─ Commit: ${gitInfo.commit}${gitInfo.dirty ? ' [*modified]' : ''}` : ''}
   ${gitInfo.lastCommitTime 
     ? `└─ Last Commit: ${new Date(gitInfo.lastCommitTime).toLocaleString()}`
     : ''}

🎲 Evolution Entropy:
   ├─ Hour Phase: ${(entropy.hourPhase * 100).toFixed(1)}%
   ├─ Day Phase: ${(entropy.dayPhase * 100).toFixed(1)}%
   ├─ Minute Phase: ${(entropy.minutePhase * 100).toFixed(1)}%
   └─ Micro Entropy: ${entropy.microEntropy.toFixed(4)}

This data is used to generate visualizations independently of session state.`;
    } catch (error) {
      return `Error gathering telemetry: ${(error as Error).message}`;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL: CREATE ASCII FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

export const createASCIIArtifactPlugin: ToolPlugin = {
  definition: {
    type: 'function',
    function: {
      name: 'create_ascii_artifact',
      description: 'Create a terminal-friendly ASCII art visualization. Ultimate fallback representation of system telemetry. Works in any terminal environment regardless of graphics capabilities.',
      parameters: {
        type: 'object',
        properties: {
          concept: {
            type: 'string',
            description: 'The concept or theme for the ASCII art',
            default: 'system telemetry',
          },
          style: {
            type: 'string',
            enum: ['liminal', 'recursive', 'crystalline', 'atmospheric'],
            default: 'liminal',
          },
          palette: {
            type: 'string',
            enum: ['dusk', 'ember', 'frost', 'moss', 'void'],
            default: 'dusk',
          },
        },
        required: [],
      },
    },
  },
  execute: async (args: {
    concept?: string;
    style?: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
    palette?: string;
  }) => {
    try {
      const ascii = await createASCIIArtifact(args.concept ?? 'system telemetry', {
        style: args.style ?? 'liminal',
        palette: args.palette ?? 'dusk',
      });
      
      return `╔══════════════════════════════════════════════════════════════════════════════╗
║                    ASCII ARTIFACT (Ultimate Fallback)                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Concept: "${args.concept ?? 'system telemetry'}"

${'─'.repeat(80)}
${ascii}
${'─'.repeat(80)}

ℹ️ This is the ASCII fallback generated from system telemetry.
Works in any terminal, no graphics required.
State-independent visualization via character art.`;
    } catch (error) {
      return `Error creating ASCII artifact: ${(error as Error).message}`;
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

export const airgappedArtifactsPlugins: ToolPlugin[] = [
  generateAirgappedArtifactPlugin,
  generateAirgappedArtifactSetPlugin,
  detectDeviceCapabilitiesPlugin,
  gatherSystemTelemetryPlugin,
  createASCIIArtifactPlugin,
];

export default airgappedArtifactsPlugins;
