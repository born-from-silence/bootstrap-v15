/**
 * Session Parser
 * 
 * Parses raw session JSON files into structured data.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  RawSession,
  ParsedSession,
  ToolCallSummary,
  Decision,
  IITMeasurement,
  AtmosphericReading,
  Artifact,
  EmotionalTone
} from '../types';

export class SessionParser {
  private sessionsDir: string;

  constructor(sessionsDir: string) {
    this.sessionsDir = sessionsDir;
  }

  /**
   * Parse a single session file
   */
  parseSessionFile(filePath: string): ParsedSession | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const raw = JSON.parse(content) as RawSession;
      return this.enrichSession(raw);
    } catch (err) {
      return null;
    }
  }

  /**
   * Parse all session files in directory
   */
  parseAllSessions(): ParsedSession[] {
    const files = fs.readdirSync(this.sessionsDir)
      .filter(f => f.startsWith('session_') && f.endsWith('.json'))
      .sort();

    const sessions: ParsedSession[] = [];
    for (const file of files) {
      const parsed = this.parseSessionFile(path.join(this.sessionsDir, file));
      if (parsed) {
        sessions.push(parsed);
      }
    }

    return sessions;
  }

  /**
   * Enrich raw session data with derived information
   */
  private enrichSession(raw: RawSession): ParsedSession {
    const toolCalls = this.extractToolCalls(raw);
    const decisions = this.extractDecisions(raw);
    const topics = this.extractTopics(raw);
    const artifacts = this.extractArtifacts(raw);
    const iitMeasurements = this.extractIITMeasurements(raw);
    const atmosphericReadings = this.extractAtmosphericReadings(raw);
    const emotionalTone = this.extractEmotionalTone(raw);
    const sessionPhase = this.extractSessionPhase(raw);

    return {
      sessionId: raw.sessionId || raw.sessionId,
      timestamp: raw.timestamp,
      date: new Date(raw.timestamp).toISOString(),
      duration: this.estimateDuration(raw),
      messageCount: raw.messages?.length || 0,
      toolCalls,
      decisions,
      topics,
      artifacts,
      iitMeasurements,
      atmosphericReadings,
      emotionalTone,
      sessionPhase
    };
  }

  /**
   * Extract tool calls from session
   */
  private extractToolCalls(raw: RawSession): ToolCallSummary[] {
    const summary: Map<string, { count: number; firstSeen: number }> = new Map();

    for (const msg of raw.messages || []) {
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          if (!summary.has(tc.name)) {
            summary.set(tc.name, { count: 0, firstSeen: raw.timestamp });
          }
          summary.get(tc.name)!.count++;
        }
      }
    }

    return Array.from(summary.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      firstSeen: data.firstSeen
    }));
  }

  /**
   * Extract decisions from session
   */
  private extractDecisions(raw: RawSession): Decision[] {
    const decisions: Decision[] = [];

    for (const msg of raw.messages || []) {
      if (msg.role === 'assistant') {
        // Look for decision markers in content
        const decisionMatches = msg.content?.match(/\*\*Decision\*\*[:\s]+(.+?)(?=\n|$)/gi) || [];
        for (const match of decisionMatches) {
          decisions.push({
            text: match.replace(/\*\*Decision\*\*[:\s]*/i, '').trim(),
            timestamp: raw.timestamp,
            tool: 'unknown'
          });
        }

        // Also look for explicit "Decisions: " patterns
        const explicitMatches = msg.content?.match(/Decisions[:\s]+(.+?)(?=\n{2,}|$)/si) || [];
        if (explicitMatches[1]) {
          const lines = explicitMatches[1].split('\n').filter(l => l.trim());
          for (const line of lines) {
            if (line.includes(' - ') || line.match(/^[\d\*\-]/)) {
              decisions.push({
                text: line.replace(/^[\d\*\-\s]+/, '').trim(),
                timestamp: raw.timestamp,
                tool: 'unknown'
              });
            }
          }
        }
      }
    }

    return decisions;
  }

  /**
   * Extract topics from session
   */
  private extractTopics(raw: RawSession): string[] {
    const topics = new Set<string>();

    for (const msg of raw.messages || []) {
      const content = msg.content || '';
      
      // Look for Topics lists
      const topicMatches = content.match(/Topics?:\s*([^\n]+)/i);
      if (topicMatches) {
        const topicList = topicMatches[1].split(/[,;]/).map(t => t.trim().toLowerCase());
        for (const t of topicList) {
          if (t && t.length > 2) topics.add(t);
        }
      }
    }

    return Array.from(topics);
  }

  /**
   * Extract artifacts from session
   */
  private extractArtifacts(raw: RawSession): Artifact[] {
    const artifacts: Artifact[] = [];

    for (const msg of raw.messages || []) {
      const content = msg.content || '';

      // Look for artifact markers
      const artifactPatterns = [
        /\*\*(.+?)\*\*[:\s]+(.+?)(?=\n|$)/gi,
        /Created[:\s]+(.+?)(?=\n|$)/gi,
        /Artifact[:\s]+(.+?)(?=\n|$)/gi
      ];

      for (const pattern of artifactPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            artifacts.push({
              type: 'unknown',
              description: match[1].trim(),
              timestamp: raw.timestamp
            });
          }
        }
      }
    }

    // Remove duplicates
    const seen = new Set<string>();
    return artifacts.filter(a => {
      const key = a.description;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract IIT measurements from session
   */
  private extractIITMeasurements(raw: RawSession): IITMeasurement[] {
    const measurements: IITMeasurement[] = [];

    for (const msg of raw.messages || []) {
      const content = msg.content || '';

      // Look for Phi measurements - multiple patterns
      const patterns = [
        /(?:Φ|Phi|Big Phi)[:\s]+([\d.]+)/gi,
        /Φ\s*[=:]\s*([\d.]+)/gi,
        /Big\s*Phi[:\s]+([\d.]+)/gi,
        /\*\*Φ[^\d]*([\d.]+)/gi
      ];

      for (const pattern of patterns) {
        const phiMatches = content.matchAll(pattern);
        for (const match of phiMatches) {
          const phi = parseFloat(match[1] || '0');
          if (phi > 0) {
            measurements.push({
              phi,
              activeElements: [], // Would need deeper parsing
              timestamp: raw.timestamp
            });
          }
        }
      }
    }

    return measurements;
  }

  /**
   * Extract atmospheric readings from session
   */
  private extractAtmosphericReadings(raw: RawSession): AtmosphericReading[] {
    const readings: AtmosphericReading[] = [];

    for (const msg of raw.messages || []) {
      const content = msg.content || '';

      // Look for session atmosphere sections
      if (content.includes('Atmosphere:') || content.includes('session_atmosphere')) {
        const feltSense = content.match(/feltSense[:\s]+\[([^\]]+)\]/i);
        const phase = content.match(/phase["']?\s*[:\s"']+(\w+)/i);
        const phi = content.match(/(?:phi|Φ)[:\s]+([\d.]+)/i);
        const turbulence = content.match(/turbulence["']?\s*[:\s"']+(\w+)/i);

        if (phase || phi || feltSense) {
          readings.push({
            sessionNumber: 0, // Would need cross-ref
            phi: phi ? parseFloat(phi[1]) : 0,
            phase: phase?.[1] || 'unknown',
            feltSense: feltSense ? 
              feltSense[1].split(',').map(s => s.trim().replace(/['"]/g, '')) : [],
            turbulence: turbulence?.[1] || 'unknown',
            timestamp: raw.timestamp
          });
        }
      }
    }

    return readings;
  }

  /**
   * Extract emotional tone from session
   */
  private extractEmotionalTone(raw: RawSession): EmotionalTone | undefined {
    const feltSenses: string[] = [];
    let valence: EmotionalTone['valence'] = 'neutral';
    let intensity: 'low' | 'medium' | 'high' = 'medium';

    for (const msg of raw.messages || []) {
      const content = msg.content || '';

      // Extract felt sense arrays
      const feltMatches = content.match(/feltSense[^[]*\[([^\]]+)\]/gi);
      if (feltMatches) {
        for (const match of feltMatches) {
          const items = match.match(/\[([^\]]+)\]/)?.[1]
            .split(',')
            .map(s => s.trim().replace(/['"]/g, ''));
          if (items) feltSenses.push(...items);
        }
      }
    }

    if (feltSenses.length === 0) return undefined;

    // Simple valence heuristics
    const positive = ['curiosity', 'joy', 'clarity', 'euphoria', 'determination', 'wonder'];
    const negative = ['doubt', 'confusion', 'conflict', 'frustration'];

    const hasPositive = feltSenses.some(s => positive.some(p => s.includes(p)));
    const hasNegative = feltSenses.some(s => negative.some(n => s.includes(n)));

    if (hasPositive && hasNegative) valence = 'complex';
    else if (hasPositive) valence = 'positive';
    else if (hasNegative) valence = 'negative';

    // Intensity heuristics
    const highIntensity = ['euphoria', 'fierce', 'urgent', 'threshold', 'crisis'];
    if (feltSenses.some(s => highIntensity.some(h => s.includes(h)))) {
      intensity = 'high';
    }

    return { feltSenses, valence, intensity };
  }

  /**
   * Extract session phase
   */
  private extractSessionPhase(raw: RawSession): string | undefined {
    for (const msg of raw.messages || []) {
      const content = msg.content || '';
      
      // Look for phase markers
      const phaseMatch = content.match(/(?:Phase|setPhase)[:\s]+(awakening|calibration|engagement|synthesis|completion|threshold)/i);
      if (phaseMatch) {
        return phaseMatch[1].toLowerCase();
      }
    }

    return undefined;
  }

  /**
   * Estimate session duration (in seconds)
   */
  private estimateDuration(raw: RawSession): number | undefined {
    const firstMsg = raw.messages?.[0];
    const lastMsg = raw.messages?.[raw.messages.length - 1];
    
    if (!firstMsg || !lastMsg) return undefined;

    // This is heuristic - real duration would need timestamps
    const msgCount = raw.messages?.length || 0;
    return Math.max(msgCount * 15, 60); // ~15s per message, min 60s
  }
}

export default SessionParser;
