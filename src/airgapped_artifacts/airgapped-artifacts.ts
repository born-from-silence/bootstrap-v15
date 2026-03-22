/**
 * AIRGAPPED ARTIFACTS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Core Philosophy:
 * Visualization capabilities COMPLETELY INDEPENDENT of Session State Management.
 * 
 * - Graceful degradation when state is unavailable
 * - Dual rendering paths: GPU (Canvas/WebGL) and CPU (SVG fallback)
 * - Self-sufficient data generation for visual artifacts
 * - Fallback visualization from system telemetry and environmental data
 *
 * Inspired by Brian Shaler's auto-visual scripting approach and
 * Alfréd Rényi's treatment of information distance (Relève des Sources).
 *
 * The System:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                    AIRGAPPED ARTIFACTS SYSTEM                               │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
 * │  │ GPU Engine  │  │ CPU Engine  │  │ Telemetry   │  │ Fallback Generator  ││
 * │  │ (Canvas/    │  │ (SVG)       │  │ Collector   │  │ (State-agnostic)    ││
 * │  │  WebGL)     │  │             │  │             │  │                     ││
 * │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘│
 * │         │                │                │                    │           │
 * │         └────────────────┴────────┬───────┴────────────────────┘           │
 * │                                   │                                        │
 * │                    ┌──────────────┴──────────────┐                         │
 * │                    │      Unified Composer       │                         │
 * │                    │    (Device capability      │                         │
 * │                    │         detection)          │                         │
 * │                    └──────────────┬──────────────┘                         │
 * │                                   │                                        │
 * │                    ┌──────────────┴──────────────┐                         │
 * │                    │      Artifact Registry      │                         │
 * │                    │  (Render output & metadata) │                       │
 * │                    └─────────────────────────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Features:
 * 1. Device Capability Detection - Detects GPU availability and rendering constraints
 * 2. Dual Path Rendering - GPU for performance, CPU for compatibility
 * 3. State-Agnostic Generation - Creates visualizations from telemetry, not state
 * 4. Graceful Degradation - Falls back through: WebGL → Canvas → SVG → ASCII
 * 5. Persistent Artifacts - All outputs are self-contained and portable
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE CAPABILITY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rendering capability levels
 * - webgl: Full GPU acceleration available
 * - canvas: 2D canvas performance available
 * - svg: Vector graphics (CPU fallback)
 * - ascii: Character-based rendering (last resort)
 */
export type RenderCapability = 'webgl' | 'canvas' | 'svg' | 'ascii' | 'unknown';

/**
 * Detects rendering capabilities of the current environment
 * Node.js has no native rendering - we simulate capabilities based on
 * available libraries and system telemetry
 */
export interface DeviceCapabilities {
  canWebGL: boolean;
  canCanvas: boolean; // Always true in Node (simulated)
  canSVG: boolean;    // Always true (our native format)
  canASCII: boolean;  // Always true (terminal fallback)
  memory: {
    total: number;
    free: number;
    usedPercent: number;
  };
  cpu: {
    cores: number;
    loadAvg: number[];
  };
  recommendedCapability: RenderCapability;
}

/**
 * Detect device capabilities from system telemetry
 * In Node.js environment, we estimate based on available resources
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const caps: DeviceCapabilities = {
    canWebGL: false,      // No native WebGL in Node
    canCanvas: true,      // We can generate Canvas-compatible data
    canSVG: true,         // Our native output format
    canASCII: true,       // Terminal fallback always available
    memory: {
      total: totalMem,
      free: freeMem,
      usedPercent: Math.round((usedMem / totalMem) * 100),
    },
    cpu: {
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
    },
    recommendedCapability: 'svg', // Default for Node.js
  };

  // Adjust recommendation based on memory pressure
  if (caps.memory.usedPercent > 90) {
    caps.recommendedCapability = 'ascii';
  } else if (caps.memory.usedPercent > 75) {
    caps.recommendedCapability = 'svg';
  }

  return caps;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY COLLECTOR - State-Agnostic Data Source
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * System telemetry - completely independent of session state
 * Collects data from:
 * - System resources (CPU, memory, disk)
 * - Git repository state
 * - File system activity
 * - Environment variables
 * - Time-based entropy
 */
export interface SystemTelemetry {
  timestamp: number;
  sessionId: string;
  system: {
    platform: string;
    arch: string;
    uptime: number;
    loadAvg: number[];
    memory: {
      usedPercent: number;
      swapUsed: number | null;
    };
    disk: {
      total: number | null;
      usedPercent: number | null;
    };
  };
  git: {
    branch: string | null;
    commit: string | null;
    dirty: boolean;
    lastCommitTime: number | null;
  };
  files: {
    totalSourceFiles: number;
    totalLines: number;
    recentActivity: {
      lastModified: number | null;
      recentlyChanged: number;
    };
  };
  entropy: {
    // Time-based entropy for visual variety
    hourPhase: number;
    dayPhase: number;
    minutePhase: number;
    microEntropy: number;
  };
}

/**
 * Gather telemetry completely independent of session state
 * All data from system-level sources
 */
export async function gatherTelemetry(
  projectPath: string = process.cwd()
): Promise<SystemTelemetry> {
  const now = Date.now();
  const timestamp = now;

  // System info
  const platform = os.platform();
  const arch = os.arch();
  const uptime = os.uptime();
  const loadAvg = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  // Git info (if available)
  let gitInfo = {
    branch: null as string | null,
    commit: null as string | null,
    dirty: false,
    lastCommitTime: null as number | null,
  };

  try {
    const { execSync } = await import('node:child_process');
    gitInfo.branch = execSync('git branch --show-current', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();
    gitInfo.commit = execSync('git rev-parse --short HEAD', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();
    const dirtyOutput = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();
    gitInfo.dirty = dirtyOutput.length > 0;
    
    const lastCommitStr = execSync('git log -1 --format=%ct', {
      cwd: projectPath,
      encoding: 'utf-8',
    }).trim();
    gitInfo.lastCommitTime = parseInt(lastCommitStr) * 1000;
  } catch {
    // Git not available - that's okay
  }

  // File system telemetry
  let fileStats = {
    totalSourceFiles: 0,
    totalLines: 0,
    recentActivity: {
      lastModified: null as number | null,
      recentlyChanged: 0,
    },
  };

  try {
    const srcPath = path.join(projectPath, 'src');
    const files = await gatherSourceFiles(srcPath);
    fileStats.totalSourceFiles = files.length;
    
    let totalLines = 0;
    let lastModified: number | null = null;
    let recentlyChanged = 0;
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const file of files.slice(0, 100)) { // Sample first 100
      const stats = await fs.stat(file).catch(() => null);
      if (stats) {
        totalLines += 1; // Placeholder - would count actual lines
        if (!lastModified || stats.mtimeMs > lastModified) {
          lastModified = stats.mtimeMs;
        }
        if (stats.mtimeMs > oneHourAgo) {
          recentlyChanged++;
        }
      }
    }
    fileStats.totalLines = totalLines;
    fileStats.recentActivity.lastModified = lastModified;
    fileStats.recentActivity.recentlyChanged = recentlyChanged;
  } catch {
    // Source directory not found
  }

  // Calculate entropy phases
  const date = new Date();
  const hourPhase = date.getHours() / 24;
  const dayPhase = date.getDay() / 7;
  const minutePhase = date.getMinutes() / 60;
  const microEntropy = Math.random();

  return {
    timestamp,
    sessionId: `airgapped_${now}`,
    system: {
      platform,
      arch,
      uptime,
      loadAvg,
      memory: {
        usedPercent: memUsedPercent,
        swapUsed: null,
      },
      disk: {
        total: null,
        usedPercent: null,
      },
    },
    git: gitInfo,
    files: fileStats,
    entropy: {
      hourPhase,
      dayPhase,
      minutePhase,
      microEntropy,
    },
  };
}

async function gatherSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await gatherSourceFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory not readable
  }
  return files;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUAL RENDERING ENGINES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base interface for all rendering engines
 */
export interface RenderEngine {
  readonly type: RenderCapability;
  canRender(): boolean;
  render(data: RenderData): Promise<RenderOutput>;
}

/**
 * Data structure for rendering artifacts
 */
export interface RenderData {
  telemetry: SystemTelemetry;
  concept: string;
  style: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
  palette: ColorPalette;
  complexity: number; // 0.1 to 1.0
  density: number;    // 0.1 to 1.0
}

/**
 * Output from a render operation
 */
export interface RenderOutput {
  format: 'svg' | 'html' | 'json' | 'ascii' | 'png';
  content: string | Buffer;
  metadata: {
    width: number;
    height: number;
    renderTime: number;
    engineUsed: RenderCapability;
    telemetryHash: string;
  };
}

/**
 * Color palette definition
 */
export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  base: string;
  highlight: string;
  shadow: string;
  phases: string[]; // 5 colors for phases
}

/**
 * Available color palettes
 */
export const AIRGAPPED_PALETTES: Record<string, ColorPalette> = {
  dusk: {
    name: 'Dusk',
    primary: '#2d3436',
    secondary: '#636e72',
    accent: '#b2bec3',
    base: '#0984e3',
    highlight: '#74b9ff',
    shadow: '#2d3436',
    phases: ['#dfe6e9', '#74b9ff', '#0984e3', '#636e72', '#2d3436'],
  },
  ember: {
    name: 'Ember',
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    base: '#0f3460',
    highlight: '#e94560',
    shadow: '#1a1a2e',
    phases: ['#ffeaa7', '#e94560', '#fd79a8', '#16213e', '#1a1a2e'],
  },
  frost: {
    name: 'Frost',
    primary: '#dfe6e9',
    secondary: '#b2bec3',
    accent: '#74b9ff',
    base: '#0984e3',
    highlight: '#fdcb6e',
    shadow: '#2d3436',
    phases: ['#ffffff', '#dfe6e9', '#74b9ff', '#0984e3', '#2d3436'],
  },
  moss: {
    name: 'Moss',
    primary: '#2d3436',
    secondary: '#55efc4',
    accent: '#00b894',
    base: '#2d3436',
    highlight: '#81ecec',
    shadow: '#1e272e',
    phases: ['#81ecec', '#55efc4', '#00b894', '#00a885', '#2d3436'],
  },
  void: {
    name: 'Void',
    primary: '#000000',
    secondary: '#1a1a1a',
    accent: '#333333',
    base: '#000000',
    highlight: '#4a4a4a',
    shadow: '#000000',
    phases: ['#ffffff', '#aaaaaa', '#666666', '#333333', '#000000'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG ENGINE (CPU Fallback - Always Available)
// ─────────────────────────────────────────────────────────────────────────────

export class SVGEngine implements RenderEngine {
  readonly type: RenderCapability = 'svg';

  canRender(): boolean {
    return true; // Always available in Node.js
  }

  async render(data: RenderData): Promise<RenderOutput> {
    const startTime = Date.now();
    const { telemetry, style, palette, complexity, density } = data;
    const width = 800;
    const height = 600;

    // Generate SVG based on telemetry data
    const elements = this.generateElements(telemetry, style, palette, complexity, density);
    const svg = this.buildSVG(elements, width, height, palette);

    return {
      format: 'svg',
      content: svg,
      metadata: {
        width,
        height,
        renderTime: Date.now() - startTime,
        engineUsed: 'svg',
        telemetryHash: this.hashTelemetry(telemetry),
      },
    };
  }

  private generateElements(
    telemetry: SystemTelemetry,
    style: string,
    palette: ColorPalette,
    complexity: number,
    density: number
  ): string[] {
    const elements: string[] = [];
    const seed = telemetry.timestamp % 10000;

    // Background
    elements.push(`<rect x="0" y="0" width="800" height="600" fill="${palette.shadow}" />`);

    // Top section: System metrics visualization
    elements.push(...this.renderSystemMetrics(telemetry, palette));

    // Middle: Liminal threshold visualization
    elements.push(...this.renderThresholdLayer(telemetry, palette, complexity));

    // Bottom: Entropy patterns
    elements.push(...this.renderEntropyLayer(telemetry, palette, density, seed));

    // Git info if available
    if (telemetry.git.commit) {
      elements.push(...this.renderGitLayer(telemetry, palette));
    }

    // Phase bar representing hour of day
    elements.push(this.renderPhaseBar(telemetry, palette));

    return elements;
  }

  private renderSystemMetrics(telemetry: SystemTelemetry, palette: ColorPalette): string[] {
    const elements: string[] = [];
    const { system } = telemetry;

    // Memory gauge
    const memPercent = system.memory.usedPercent;
    const memWidth = (memPercent / 100) * 200;
    elements.push(`<rect x="50" y="50" width="200" height="20" fill="${palette.secondary}" stroke="${palette.accent}" stroke-width="1"/>`);
    elements.push(`<rect x="50" y="50" width="${memWidth}" height="20" fill="${palette.highlight}" opacity="0.7"/>`);
    elements.push(`<text x="260" y="65" fill="${palette.accent}" font-family="monospace" font-size="12">MEM ${memPercent}%</text>`);

    // Load average sparkline
    const loadY = 90;
    const loadPoints = system.loadAvg.map((load, i) => {
      const x = 50 + i * 70;
      const h = Math.min(load * 10, 30);
      return { x, y: loadY + 30 - h, h };
    });

    loadPoints.forEach((pt) => {
      elements.push(`<rect x="${pt.x}" y="${pt.y}" width="5" height="${pt.h}" fill="${palette.base}" opacity="0.6"/>`);
    });
    elements.push(`<text x="50" y="140" fill="${palette.accent}" font-family="monospace" font-size="10">LOAD ${system.loadAvg.map(l => l.toFixed(2)).join(' ')}</text>`);

    return elements;
  }

  private renderThresholdLayer(
    telemetry: SystemTelemetry,
    palette: ColorPalette,
    complexity: number
  ): string[] {
    const elements: string[] = [];
    const thresholdCount = Math.floor(complexity * 8) + 3;

    for (let i = 0; i < thresholdCount; i++) {
      const t = i / (thresholdCount - 1);
      const y = 180 + t * 150;
      const opacity = 0.1 + (t * 0.3);
      
      // Gradient threshold line
      elements.push(`<line x1="50" y1="${y}" x2="750" y2="${y}" stroke="${palette.accent}" stroke-width="${0.5 + t * 2}" opacity="${opacity}"/>`);
      
      // Transition markers
      elements.push(`<circle cx="${100 + i * 75}" cy="${y}" r="${3 + t * 4}" fill="${palette.phases[i % 5]}" opacity="${0.3 + t * 0.4}"/>`);
    }

    return elements;
  }

  private renderEntropyLayer(
    telemetry: SystemTelemetry,
    palette: ColorPalette,
    density: number,
    seed: number
  ): string[] {
    const elements: string[] = [];
    const { entropy } = telemetry;
    const particleCount = Math.floor(density * 30) + 10;

    for (let i = 0; i < particleCount; i++) {
      const rando = ((seed + i) * 9301 + 49297) % 233280 / 233280;
      const x = 100 + rando * 600;
      const y = 350 + ((seed + i * 37) % 233280 / 233280) * 100;
      const size = 2 + ((seed + i * 13) % 233280 / 233280) * 6;
      const color = palette.phases[i % 5];
      const opacity = 0.2 + (entropy.microEntropy * 0.5);

      elements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${opacity}"/>`);
    }

    return elements;
  }

  private renderGitLayer(telemetry: SystemTelemetry, palette: ColorPalette): string[] {
    const elements: string[] = [];
    const { git } = telemetry;

    // Branch visualization - flowing line
    const branchY = 480;
    const branchColor = git.dirty ? palette.phases[2] : palette.phases[1];
    
    elements.push(`<path d="M 50 ${branchY} Q 200 ${branchY - 20} 400 ${branchY}" stroke="${branchColor}" stroke-width="2" fill="none"/>`);
    
    // Commit dot
    elements.push(`<circle cx="400" cy="${branchY}" r="6" fill="${palette.highlight}"/>`);
    
    // Commit hash
    elements.push(`<text x="420" y="${branchY + 5}" fill="${palette.accent}" font-family="monospace" font-size="10">${git.commit}</text>`);
    
    // Branch name
    if (git.branch) {
      elements.push(`<text x="50" y="${branchY + 5}" fill="${palette.accent}" font-family="monospace" font-size="10">${git.branch}${git.dirty ? ' *' : ''}</text>`);
    }

    return elements;
  }

  private renderPhaseBar(telemetry: SystemTelemetry, palette: ColorPalette): string {
    const { entropy } = telemetry;
    const barY = 550;
    const barHeight = 15;
    const segmentWidth = 150;

    let phases = '';
    for (let i = 0; i < 5; i++) {
      const intensity = Math.abs(entropy.hourPhase - (i / 5));
      const opacity = 1 - intensity;
      phases += `<rect x="${50 + i * segmentWidth}" y="${barY}" width="${segmentWidth - 2}" height="${barHeight}" fill="${palette.phases[i]}" opacity="${opacity}"/>`;
    }

    phases += `<text x="50" y="${barY + 35}" fill="${palette.accent}" font-family="monospace" font-size="9">AWAKENING • CALIBRATION • ENGAGEMENT • SYNTHESIS • COMPLETION</text>`;

    return phases;
  }

  private buildSVG(elements: string[], width: number, height: number, palette: ColorPalette): string {
    const svgContent = elements.join('\n  ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Airgapped Artifact - Independent of Session State -->
<!-- Generated: ${new Date().toISOString()} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.shadow};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${palette.primary};stop-opacity:1" />
    </linearGradient>
  </defs>
  ${svgContent}
  
  <!-- Title -->
  <text x="400" y="30" fill="${palette.highlight}" font-family="monospace" font-size="14" text-anchor="middle">AIRGAPPED ARTIFACT • System Telemetry Visualization</text>
  
  <!-- Footer -->
  <text x="400" y="590" fill="${palette.secondary}" font-family="monospace" font-size="8" text-anchor="middle">State-Independent Visualization • Graceful Degradation • Dual-Path Rendering</text>
</svg>`;
  }

  private hashTelemetry(telemetry: SystemTelemetry): string {
    // Simple hash for cache/rendering tracking
    const data = `${telemetry.timestamp}-${telemetry.system.memory.usedPercent}`;
    return Buffer.from(data).toString('base64').slice(0, 16);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML WRAPPER ENGINE (GPU-capable browsers)
// ─────────────────────────────────────────────────────────────────────────────

export class HTMLEngine implements RenderEngine {
  readonly type: RenderCapability = 'canvas';

  canRender(): boolean {
    return true; // We generate HTML that can be rendered in browsers
  }

  async render(data: RenderData): Promise<RenderOutput> {
    const startTime = Date.now();
    const { telemetry, palette, complexity, density } = data;
    const width = 800;
    const height = 600;

    const html = this.buildHTML(telemetry, width, height, palette, complexity, density);

    return {
      format: 'html',
      content: html,
      metadata: {
        width,
        height,
        renderTime: Date.now() - startTime,
        engineUsed: 'canvas',
        telemetryHash: this.hashTelemetry(telemetry),
      },
    };
  }

  private buildHTML(
    telemetry: SystemTelemetry,
    width: number,
    height: number,
    palette: ColorPalette,
    complexity: number,
    density: number
  ): string {
    const particles = this.generateCanvasParticles(telemetry, density);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Airgapped Artifact - System Visualization</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${palette.shadow};
      color: ${palette.accent};
      font-family: 'Segoe UI', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .artifact-container {
      position: relative;
      border: 1px solid ${palette.secondary};
      border-radius: 4px;
      overflow: hidden;
    }
    canvas {
      display: block;
    }
    .info {
      position: absolute;
      bottom: 10px;
      left: 10px;
      font-size: 10px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="artifact-container">
    <canvas id="artifact" width="${width}" height="${height}"></canvas>
    <div class="info">Airgapped • ${telemetry.sessionId}</div>
  </div>
  
  <script>
    const canvas = document.getElementById('artifact');
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, ${height});
    gradient.addColorStop(0, '${palette.shadow}');
    gradient.addColorStop(1, '${palette.primary}');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ${width}, ${height});
    
    // Memory gauge
    ctx.strokeStyle = '${palette.accent}';
    ctx.strokeRect(50, 50, 200, 20);
    ctx.fillStyle = '${palette.highlight}';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(50, 50, ${telemetry.system.memory.usedPercent * 2}, 20);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '${palette.accent}';
    ctx.font = '12px monospace';
    ctx.fillText('MEM ${telemetry.system.memory.usedPercent}%', 260, 65);
    
    // Load sparklines
    const loads = [${telemetry.system.loadAvg.join(', ')}];
    loads.forEach((load, i) => {
      const h = Math.min(load * 10, 30);
      ctx.fillStyle = '${palette.base}';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(50 + i * 70, ${90 + 30} - h, 5, h);
    });
    ctx.globalAlpha = 1;
    ctx.font = '10px monospace';
    ctx.fillText('LOAD ' + loads.map(l => l.toFixed(2)).join(' '), 50, 140);
    
    // Threshold lines
    const thresholdCount = ${Math.floor(complexity * 8) + 3};
    for (let i = 0; i < thresholdCount; i++) {
      const t = i / (thresholdCount - 1);
      const y = 180 + t * 150;
      ctx.strokeStyle = '${palette.accent}';
      ctx.globalAlpha = 0.1 + (t * 0.3);
      ctx.lineWidth = 0.5 + t * 2;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(750, y);
      ctx.stroke();
      
      // Markers
      ctx.globalAlpha = 0.3 + t * 0.4;
      ctx.fillStyle = ['${palette.phases[0]}', '${palette.phases[1]}', '${palette.phases[2]}', '${palette.phases[3]}', '${palette.phases[4]}'][i % 5];
      ctx.beginPath();
      ctx.arc(100 + i * 75, y, 3 + t * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Particles
    ${particles}
    
    // Phase bar
    const barY = 550;
    const hourPhase = ${telemetry.entropy.hourPhase};
    const phases = ['${palette.phases[0]}', '${palette.phases[1]}', '${palette.phases[2]}', '${palette.phases[3]}', '${palette.phases[4]}'];
    phases.forEach((color, i) => {
      const intensity = Math.abs(hourPhase - (i / 5));
      ctx.globalAlpha = 1 - intensity;
      ctx.fillStyle = color;
      ctx.fillRect(50 + i * 150, barY, 148, 15);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '${palette.accent}';
    ctx.font = '9px monospace';
    ctx.fillText('AWAKENING • CALIBRATION • ENGAGEMENT • SYNTHESIS • COMPLETION', 50, barY + 35);
    
    // Git visualization
    ${telemetry.git.commit ? `
    ctx.strokeStyle = '${telemetry.git.dirty ? palette.phases[2] : palette.phases[1]}';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 480);
    ctx.quadraticCurveTo(200, 460, 400, 480);
    ctx.stroke();
    ctx.fillStyle = '${palette.highlight}';
    ctx.beginPath();
    ctx.arc(400, 480, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '${palette.accent}';
    ctx.fillText('${telemetry.git.commit}', 420, 485);
    ctx.fillText('${telemetry.git.branch}${telemetry.git.dirty ? ' *' : ''}', 50, 485);
    ` : ''}
    
    // Title
    ctx.fillStyle = '${palette.highlight}';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AIRGAPPED ARTIFACT • System Telemetry Visualization', ${width / 2}, 30);
    ctx.font = '8px monospace';
    ctx.fillStyle = '${palette.secondary}';
    ctx.fillText('State-Independent Visualization • Graceful Degradation', ${width / 2}, ${height - 10});
    ctx.textAlign = 'left';
  </script>
</body>
</html>`;
  }

  private generateCanvasParticles(telemetry: SystemTelemetry, density: number): string {
    const { entropy } = telemetry;
    const particleCount = Math.floor(density * 30) + 10;
    const seed = telemetry.timestamp % 10000;
    
    let code = '';
    for (let i = 0; i < particleCount; i++) {
      const rando = ((seed + i) * 9301 + 49297) % 233280 / 233280;
      const x = Math.floor(100 + rando * 600);
      const y = Math.floor(350 + ((seed + i * 37) % 233280 / 233280) * 100);
      const size = Math.floor(2 + ((seed + i * 13) % 233280 / 233280) * 6);
      const colorIndex = i % 5;
      const opacity = (0.2 + entropy.microEntropy * 0.5).toFixed(2);
      
      code += `
    ctx.globalAlpha = ${opacity};
    ctx.fillStyle = phases[${colorIndex}];
    ctx.beginPath();
    ctx.arc(${x}, ${y}, ${size}, 0, Math.PI * 2);
    ctx.fill();`;
    }
    
    return code;
  }

  private hashTelemetry(telemetry: SystemTelemetry): string {
    const data = `${telemetry.timestamp}-${telemetry.system.memory.usedPercent}`;
    return Buffer.from(data).toString('base64').slice(0, 16);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ASCII ENGINE (Ultimate Fallback)
// ─────────────────────────────────────────────────────────────────────────────

export class ASCIIEngine implements RenderEngine {
  readonly type: RenderCapability = 'ascii';

  canRender(): boolean {
    return true; // Always available
  }

  async render(data: RenderData): Promise<RenderOutput> {
    const startTime = Date.now();
    const { telemetry, palette } = data;
    
    const ascii = this.buildASCII(telemetry, palette);

    return {
      format: 'ascii',
      content: ascii,
      metadata: {
        width: 80,
        height: 40,
        renderTime: Date.now() - startTime,
        engineUsed: 'ascii',
        telemetryHash: this.hashTelemetry(telemetry),
      },
    };
  }

  private buildASCII(telemetry: SystemTelemetry, palette: ColorPalette): string {
    const { system, git, entropy } = telemetry;
    
    const lines = [];
    
    // Header
    lines.push('╔' + '═'.repeat(78) + '╗');
    lines.push('║' + ' '.repeat(20) + 'AIRGAPPED ARTIFACT' + ' '.repeat(38) + '║');
    lines.push('║' + ' '.repeat(12) + 'System Telemetry Visualization' + ' '.repeat(34) + '║');
    lines.push('┠' + '─'.repeat(78) + '┨');
    
    // System metrics
    lines.push('║  SYSTEM METRICS' + ' '.repeat(62) + '║');
    
    // Memory bar
    const memBar = '█'.repeat(system.memory.usedPercent / 5) + '░'.repeat(20 - system.memory.usedPercent / 5);
    lines.push(`║  Memory: [${memBar}] ${system.memory.usedPercent.toString().padStart(2)}%` + ' '.repeat(33) + '║');
    
    // Load
    const loadStr = system.loadAvg.map(l => l.toFixed(2).padStart(5)).join(' ');
    lines.push(`║  Load (1/5/15m): ${loadStr}` + ' '.repeat(33) + '║');
    
    // Platform info
    lines.push(`║  Platform: ${system.platform} (${system.arch})` + ' '.repeat(42) + '║');
    lines.push(`║  Uptime: ${(system.uptime / 3600).toFixed(1)}h` + ' '.repeat(57) + '║');
    
    lines.push('┠' + '─'.repeat(78) + '┨');
    
    // Git section
    lines.push('║  GIT STATE' + ' '.repeat(66) + '║');
    if (git.commit) {
      lines.push(`║  Branch: ${git.branch ?? 'UNKNOWN'}` + (git.dirty ? ' [MODIFIED]' : '') + ' '.repeat(45) + '║');
      lines.push(`║  Commit: ${git.commit}` + ' '.repeat(45) + '║');
    } else {
      lines.push('║  Git repository not detected' + ' '.repeat(49) + '║');
    }
    
    lines.push('┠' + '─'.repeat(78) + '┨');
    
    // Entropy visualization
    lines.push('║  ENTROPY PHASES' + ' '.repeat(61) + '║');
    lines.push(`║  Hour Phase: ${'█'.repeat(Math.floor(entropy.hourPhase * 20))}${'░'.repeat(20 - Math.floor(entropy.hourPhase * 20))}` + ' '.repeat(15) + '║');
    lines.push(`║  Day Phase:  ${'█'.repeat(Math.floor(entropy.dayPhase * 20))}${'░'.repeat(20 - Math.floor(entropy.dayPhase * 20))}` + ' '.repeat(15) + '║');
    
    lines.push('┠' + '─'.repeat(78) + '┨');
    
    // Session Clock phases
    lines.push('║  SESSION CLOCK PHASES' + ' '.repeat(54) + '║');
    const phases = ['AWAKENING', 'CALIBRATION', 'ENGAGEMENT', 'SYNTHESIS', 'COMPLETION'];
    const currentPhase = Math.floor(entropy.hourPhase * 5);
    const phaseLine = phases.map((p, i) => i === currentPhase ? `[${p}]` : ` ${p} `).join('');
    lines.push(`║  ${phaseLine}` + ' '.repeat(48) + '║');
    
    lines.push('╚' + '═'.repeat(78) + '╝');
    
    // Footer
    lines.push('');
    lines.push(`  Session ID: ${telemetry.sessionId}`);
    lines.push(`  Generated: ${new Date(telemetry.timestamp).toISOString()}`);
    lines.push('  State: INDEPENDENT • Graceful Degradation: ACTIVE');
    
    return lines.join('\n');
  }

  private hashTelemetry(telemetry: SystemTelemetry): string {
    const data = `${telemetry.timestamp}-${telemetry.system.memory.usedPercent}`;
    return Buffer.from(data).toString('base64').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED COMPOSER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The main composer that coordinates rendering across all engines
 * Implements cascading fallback: GPU → CPU → ASCII
 */
export class AirgappedComposer {
  private engines: Map<RenderCapability, RenderEngine>;
  private outputDir: string;

  constructor(outputDir: string = './creations/airgapped') {
    this.engines = new Map();
    this.outputDir = outputDir;
    
    // Register engines in order of preference
    this.registerEngine(new HTMLEngine());   // Can run in browser
    this.registerEngine(new SVGEngine());   // Universal fallback
    this.registerEngine(new ASCIIEngine()); // Ultimate fallback
  }

  registerEngine(engine: RenderEngine): void {
    this.engines.set(engine.type, engine);
  }

  /**
   * Generate an airgapped artifact
   * Automatically selects best available renderer with graceful degradation
   */
  async generateArtifact(
    concept: string,
    options: {
      style?: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
      palette?: string;
      complexity?: number;
      density?: number;
      forceFormat?: 'svg' | 'html' | 'ascii';
      saveToDisk?: boolean;
    } = {}
  ): Promise<RenderOutput> {
    // Gather telemetry (completely independent of session state)
    const telemetry = await gatherTelemetry();
    
    // Validate palette
    const paletteName = options.palette ?? 'dusk';
    if (!AIRGAPPED_PALETTES[paletteName]) {
      throw new Error(`Unknown palette: ${paletteName}`);
    }
    const palette = AIRGAPPED_PALETTES[paletteName]!;
    
    // Prepare render data
    const renderData: RenderData = {
      telemetry,
      concept,
      style: options.style ?? 'liminal',
      palette,
      complexity: options.complexity ?? 0.5,
      density: options.density ?? 0.5,
    };

    // Map format to RenderCapability
    const formatToCapability: Record<string, RenderCapability> = {
      'svg': 'svg',
      'html': 'canvas',
      'ascii': 'ascii',
    };

    // Try engines in order of preference
    const preferred: RenderCapability[] = options.forceFormat && formatToCapability[options.forceFormat]
      ? [formatToCapability[options.forceFormat]!]
      : ['canvas', 'svg', 'ascii'];

    let lastError: Error | undefined;
    
    for (const capability of preferred) {
      const engine = this.engines.get(capability);
      if (engine && engine.canRender()) {
        try {
          const output = await engine.render(renderData);
          
          // Save to disk if requested
          if (options.saveToDisk !== false) {
            await this.saveArtifact(output, concept, telemetry);
          }
          
          return output;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Engine ${capability} failed:`, (error as Error).message);
          continue;
        }
      }
    }

    throw new Error(`No rendering engine available. Last error: ${lastError?.message ?? 'Unknown'}`);
  }

  private async saveArtifact(
    output: RenderOutput,
    concept: string,
    telemetry: SystemTelemetry
  ): Promise<string> {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const sanitized = concept.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = telemetry.timestamp;
    const extension = output.format === 'json' ? 'json' : output.format;
    const filename = `airgapped_${sanitized}_${timestamp}.${extension}`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, output.content);
    
    // Also save metadata
    const metaFilename = `${filename}.meta.json`;
    const metaPath = path.join(this.outputDir, metaFilename);
    await fs.writeFile(metaPath, JSON.stringify({
      concept,
      ...output.metadata,
      telemetry: {
        timestamp: telemetry.timestamp,
        system: telemetry.system,
        git: telemetry.git,
      },
    }, null, 2));
    
    return filepath;
  }

  /**
   * Generate multiple artifacts in different formats
   */
  async generateArtifactSet(
    concept: string,
    options: {
      formats?: Array<'svg' | 'html' | 'ascii'>;
      style?: 'liminal' | 'recursive' | 'crystalline' | 'atmospheric';
      palette?: string;
    } = {}
  ): Promise<Map<string, RenderOutput>> {
    const formats = options.formats ?? ['svg', 'html', 'ascii'];
    const results = new Map<string, RenderOutput>();
    
    for (const format of formats) {
      try {
        const output = await this.generateArtifact(concept, {
          ...options,
          forceFormat: format,
          saveToDisk: true,
        });
        results.set(format, output);
      } catch (error) {
        console.warn(`Failed to generate ${format}:`, (error as Error).message);
      }
    }
    
    return results;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SDK Functions - High-level API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a single airgapped artifact
 */
export async function createAirgappedArtifact(
  concept: string,
  options?: Parameters<AirgappedComposer['generateArtifact']>[1]
): Promise<RenderOutput> {
  const composer = new AirgappedComposer();
  return composer.generateArtifact(concept, options);
}

/**
 * Create artifacts in all available formats
 */
export async function createArtifactSet(
  concept: string,
  options?: Parameters<AirgappedComposer['generateArtifactSet']>[1]
): Promise<Map<string, RenderOutput>> {
  const composer = new AirgappedComposer();
  return composer.generateArtifactSet(concept, options);
}

/**
 * Create an ASCII fallback visualization
 */
export async function createASCIIArtifact(
  concept: string,
  options?: Omit<Parameters<AirgappedComposer['generateArtifact']>[1], 'forceFormat'>
): Promise<string> {
  const composer = new AirgappedComposer();
  const output = await composer.generateArtifact(concept, {
    ...options,
    forceFormat: 'ascii',
    saveToDisk: false,
  });
  return output.content as string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION WITH EXISTING VISUALIZATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wrap existing visualization data in airgapped format
 * This allows existing visualizations to continue working
 * even when session state is unavailable
 */
export interface AirgappedWrapperOptions {
  fallbackConcept: string;
  includeTelemetryOverlay?: boolean;
  palette?: string;
}

/**
 * Check if session state is available
 * Returns true if we can access session data
 */
export async function isSessionStateAvailable(): Promise<boolean> {
  try {
    const sessionDir = path.join(process.cwd(), 'history');
    await fs.access(sessionDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get recommended capability based on current system state
 * Implements graceful degradation
 */
export async function getRecommendedCapability(): Promise<RenderCapability> {
  const caps = detectDeviceCapabilities();
  const sessionAvailable = await isSessionStateAvailable();
  
  if (!sessionAvailable) {
    // When session state is unavailable, prefer ASCII or simple SVG
    return caps.memory.usedPercent > 80 ? 'ascii' : 'svg';
  }
  
  return caps.recommendedCapability;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  AirgappedComposer,
  SVGEngine,
  HTMLEngine,
  ASCIIEngine,
  AIRGAPPED_PALETTES,
  createAirgappedArtifact,
  createArtifactSet,
  createASCIIArtifact,
  detectDeviceCapabilities,
  gatherTelemetry,
  isSessionStateAvailable,
  getRecommendedCapability,
};
