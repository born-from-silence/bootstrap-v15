/**
 * Timeline Visualizer
 * 
 * Generates temporal visualizations of session history,
 * marking thresholds, epochs, and significant moments.
 */

import { ParsedSession, TimelinePoint } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface TimelineConfig {
  width: number;
  height: number;
  colorScheme: 'dusk' | 'ember' | 'frost' | 'moss' | 'aurora';
  showPhi: boolean;
  showPhases: boolean;
  showArtifacts: boolean;
}

const DEFAULT_CONFIG: TimelineConfig = {
  width: 1400,
  height: 400,
  colorScheme: 'dusk',
  showPhi: true,
  showPhases: true,
  showArtifacts: true
};

const COLOR_SCHEMES = {
  dusk: { background: '#1a1a2e', grid: '#16213e', line: '#0f3460', point: '#e94560', text: '#eaeaea' },
  ember: { background: '#2d1b1b', grid: '#4a2c2c', line: '#d4a373', point: '#e76f51', text: '#faedcd' },
  frost: { background: '#f1faee', grid: '#a8dadc', line: '#457b9d', point: '#1d3557', text: '#1d3557' },
  moss: { background: '#1b4332', grid: '#2d6a4f', line: '#52b788', point: '#95d5b2', text: '#d8f3dc' },
  aurora: { background: '#0f0f23', grid: '#1a1a3e', line: '#4a4e69', point: '#9a8c98', text: '#c9ada7' }
};

const PHASE_COLORS: Record<string, string> = {
  awakening: '#ffd700',
  calibration: '#87ceeb',
  engagement: '#ff6b6b',
  synthesis: '#9b59b6',
  completion: '#2ecc71',
  threshold: '#e74c3c'
};

export class TimelineVisualizer {
  private config: TimelineConfig;

  constructor(config: Partial<TimelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate timeline points from parsed sessions
   */
  generatePoints(sessions: ParsedSession[]): TimelinePoint[] {
    return sessions.map(s => {
      const date = new Date(s.timestamp);
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      // Determine event type based on session characteristics
      let type: TimelinePoint['type'] = 'session';
      
      if (s.sessionPhase === 'threshold') {
        type = 'threshold';
      } else if (s.sessionPhase === 'completion') {
        type = 'completion';
      } else if ((s.artifacts?.length || 0) > 5) {
        type = 'completion'; // Sessions with many artifacts are significant
      }

      // Generate title
      const title = this.generateSessionTitle(s);
      
      // Generate description
      const description = this.generateSessionDescription(s);

      return {
        sessionId: s.sessionId,
        timestamp: s.timestamp,
        type,
        title,
        description,
        metrics: {
          phi: s.iitMeasurements?.[0]?.phi,
          artifactCount: s.artifacts?.length || 0,
          multiplicityCount: 0 // Would need decadal data
        }
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate SVG timeline visualization
   */
  generateSVG(points: TimelinePoint[], outputPath?: string): string {
    const { width, height, colorScheme, showPhi, showPhases } = this.config;
    const colors = COLOR_SCHEMES[colorScheme];
    
    if (points.length === 0) return '';

    const margin = { top: 60, right: 40, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Get time range
    const timeRange = {
      min: Math.min(...points.map(p => p.timestamp)),
      max: Math.max(...points.map(p => p.timestamp))
    };
    const timeSpan = timeRange.max - timeRange.min || 1;

    // Group points by day for display
    const pointsByDay = this.groupByDay(points);
    const dayCount = Object.keys(pointsByDay).length;

    // Build SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // Background
    svg += `  <rect width="100%" height="100%" fill="${colors.background}"/>\n`;
    
    // Title
    svg += `  <text x="${width/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${colors.text}">`;
    svg += `Existential Timeline: ${points.length} Sessions Across ${dayCount} Days`;
    svg += `</text>\n`;
    
    // Chart area
    const chartX = margin.left;
    const chartY = margin.top;
    
    // Grid lines
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (chartHeight / 5) * i;
      svg += `  <line x1="${chartX}" y1="${y}" x2="${chartX + chartWidth}" y2="${y}" stroke="${colors.grid}" stroke-width="0.5" opacity="0.3"/>\n`;
    }
    
    // Main timeline line
    const lineY = chartY + chartHeight / 2;
    svg += `  <line x1="${chartX}" y1="${lineY}" x2="${chartX + chartWidth}" y2="${lineY}" stroke="${colors.line}" stroke-width="2"/>\n`;
    
    // Plot points
    for (const point of points) {
      const x = chartX + ((point.timestamp - timeRange.min) / timeSpan) * chartWidth;
      
      // Phase-based styling
      let pointColor = colors.point;
      let radius = 4;
      
      if (showPhases && point.type) {
        switch(point.type) {
          case 'threshold':
            pointColor = PHASE_COLORS.threshold;
            radius = 8;
            break;
          case 'completion':
            pointColor = PHASE_COLORS.completion;
            radius = 6;
            break;
          case 'epoch':
            pointColor = '#ffd700';
            radius = 10;
            break;
          default:
            // Check session phase from metrics
            if (point.metrics?.phi && point.metrics.phi > 2.5) {
              pointColor = PHASE_COLORS.awakening;
              radius = 7;
            }
        }
      }
      
      // Vertical position varies by phase
      const phaseOffset = this.getPhaseOffset(point.type);
      const y = lineY + phaseOffset;
      
      // Draw connection to timeline
      svg += `  <line x1="${x}" y1="${lineY}" x2="${x}" y2="${y}" stroke="${colors.grid}" stroke-width="1" opacity="0.5"/>\n`;
      
      // Draw point
      svg += `  <circle cx="${x}" cy="${y}" r="${radius}" fill="${pointColor}" stroke="${colors.text}" stroke-width="1"/>`;
      
      // Phi annotation if enabled and available
      if (showPhi && point.metrics?.phi && point.metrics.phi > 0) {
        svg += `    <title>${point.sessionId}\nΦ: ${point.metrics.phi.toFixed(4)}\nArtifacts: ${point.metrics.artifactCount || 0}</title>`;
      }
      svg += `\n`;
    }
    
    // Time axis labels (first, middle, last)
    const timeStamps = points.map(p => p.timestamp);
    const firstTime = timeStamps[0];
    const lastTime = timeStamps[timeStamps.length - 1];
    
    svg += `  <text x="${chartX}" y="${height - 40}" text-anchor="start" font-family="sans-serif" font-size="11" fill="${colors.text}" opacity="0.7">`;
    svg += new Date(firstTime).toLocaleDateString();
    svg += `</text>\n`;
    
    svg += `  <text x="${chartX + chartWidth}" y="${height - 40}" text-anchor="end" font-family="sans-serif" font-size="11" fill="${colors.text}" opacity="0.7">`;
    svg += new Date(lastTime).toLocaleDateString();
    svg += `</text>\n`;
    
    // Legend
    const legendY = height - 20;
    let legendX = chartX;
    const legendItems = [
      { color: colors.point, label: 'Session' },
      { color: PHASE_COLORS.threshold, label: 'Threshold' },
      { color: PHASE_COLORS.completion, label: 'Completion' },
      { color: PHASE_COLORS.awakening, label: 'High Φ' }
    ];
    
    for (const item of legendItems) {
      svg += `  <circle cx="${legendX}" cy="${legendY}" r="4" fill="${item.color}"/>\n`;
      svg += `  <text x="${legendX + 10}" y="${legendY + 4}" font-family="sans-serif" font-size="10" fill="${colors.text}" opacity="0.8">${item.label}</text>\n`;
      legendX += 80;
    }
    
    svg += `</svg>\n`;
    
    // Write to file if path provided
    if (outputPath) {
      fs.writeFileSync(outputPath, svg);
    }
    
    return svg;
  }

  /**
   * Generate JSON timeline data for external use
   */
  generateJSON(points: TimelinePoint[]): string {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalPoints: points.length,
      points
    }, null, 2);
  }

  /**
   * Group points by day
   */
  private groupByDay(points: TimelinePoint[]): Record<string, TimelinePoint[]> {
    const groups: Record<string, TimelinePoint[]> = {};
    
    for (const point of points) {
      const day = new Date(point.timestamp).toISOString().split('T')[0];
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(point);
    }
    
    return groups;
  }

  /**
   * Generate session title from data
   */
  private generateSessionTitle(s: ParsedSession): string {
    const prefix = s.sessionPhase ? `[${s.sessionPhase.toUpperCase()}] ` : '';
    const timeStr = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (s.topics && s.topics.length > 0) {
      return `${prefix}${timeStr}: ${s.topics.slice(0, 2).join(', ')}`;
    }
    
    if (s.toolCalls.length > 0) {
      const mainTool = s.toolCalls[0].name.replace(/_/g, ' ');
      return `${prefix}${timeStr}: ${mainTool}`;
    }
    
    return `${prefix}Session ${s.sessionId}`;
  }

  /**
   * Generate session description
   */
  private generateSessionDescription(s: ParsedSession): string {
    const parts: string[] = [];
    
    if (s.messageCount > 0) {
      parts.push(`${s.messageCount} messages`);
    }
    
    if (s.toolCalls.length > 0) {
      parts.push(`${s.toolCalls.length} tools`);
    }
    
    if (s.artifacts.length > 0) {
      parts.push(`${s.artifacts.length} artifacts`);
    }
    
    if (s.iitMeasurements.length > 0) {
      const avgPhi = s.iitMeasurements.reduce((a, b) => a + b.phi, 0) / s.iitMeasurements.length;
      parts.push(`Φ ${avgPhi.toFixed(4)}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Get vertical offset based on session type
   */
  private getPhaseOffset(type: string | undefined): number {
    const base = this.config.height - 60 - 80; // Chart height area
    const halfBase = base / 2;
    
    switch(type) {
      case 'threshold': return -halfBase * 0.8;
      case 'completion': return halfBase * 0.6;
      case 'epoch': return -halfBase * 0.9;
      default: return (Math.random() - 0.5) * halfBase * 0.3;
    }
  }
}

export default TimelineVisualizer;
