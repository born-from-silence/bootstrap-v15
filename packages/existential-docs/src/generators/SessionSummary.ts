/**
 * Session Summary Generator
 * 
 * Generates human-readable summaries from parsed session data.
 */

import { ParsedSession, SessionSummary } from '../types';

export class SessionSummaryGenerator {
  /**
   * Generate a summary from parsed session
   */
  generate(session: ParsedSession): SessionSummary {
    const keyDecisions = session.decisions.map(d => d.text);
    const uniqueTools = [...new Set(session.toolCalls.map(t => t.name))];
    const latestPhi = session.iitMeasurements[session.iitMeasurements.length - 1]?.phi || null;

    // Generate summary text
    const summaryText = this.composeSummaryText(session);

    return {
      sessionId: session.sessionId,
      timestamp: session.timestamp,
      keyDecisions,
      themes: session.topics,
      toolsUsed: uniqueTools,
      artifacts: session.artifacts,
      phi: latestPhi,
      sessionPhase: session.sessionPhase || null,
      feltSense: session.emotionalTone?.feltSenses || [],
      summaryText
    };
  }

  /**
   * Generate summaries for multiple sessions
   */
  generateBatch(sessions: ParsedSession[]): SessionSummary[] {
    return sessions.map(s => this.generate(s));
  }

  /**
   * Generate markdown summary
   */
  generateMarkdown(summary: SessionSummary): string {
    const date = new Date(summary.timestamp).toISOString().split('T')[0];
    
    let md = `## Session Summary: ${summary.sessionId}\n`;
    md += `**Date:** ${date}  \n`;
    md += `**Phase:** ${summary.sessionPhase || 'unknown'}  \n`;
    
    if (summary.phi !== null) {
      md += `**Φ:** ${summary.phi.toFixed(4)}  \n`;
    }

    if (summary.feltSense.length > 0) {
      md += `**Felt Sense:** ${summary.feltSense.join(', ')}  \n`;
    }

    md += `\n### Summary\n${summary.summaryText}\n`;

    if (summary.keyDecisions.length > 0) {
      md += `\n### Key Decisions\n`;
      for (const decision of summary.keyDecisions.slice(0, 10)) {
        md += `- ${decision}\n`;
      }
    }

    if (summary.themes.length > 0) {
      md += `\n### Themes\n${summary.themes.join(', ')}\n`;
    }

    if (summary.toolsUsed.length > 0) {
      md += `\n### Tools Used (${summary.toolsUsed.length})\n`;
      md += summary.toolsUsed.slice(0, 15).join(', ');
      if (summary.toolsUsed.length > 15) {
        md += `, ... and ${summary.toolsUsed.length - 15} more`;
      }
      md += '\n';
    }

    if (summary.artifacts.length > 0) {
      md += `\n### Artifacts Created (${summary.artifacts.length})\n`;
      for (const artifact of summary.artifacts.slice(0, 5)) {
        md += `- ${artifact.description}\n`;
      }
      if (summary.artifacts.length > 5) {
        md += `- ... and ${summary.artifacts.length - 5} more\n`;
      }
    }

    return md;
  }

  /**
   * Compose natural language summary
   */
  private composeSummaryText(session: ParsedSession): string {
    const parts: string[] = [];
    const date = new Date(session.timestamp).toLocaleDateString();

    // Opening
    parts.push(`This session on ${date} contained ${session.messageCount} messages and invoked ${session.toolCalls.length} unique tools.`);

    // Phase
    if (session.sessionPhase) {
      parts.push(`The session moved through the phase of *${session.sessionPhase}*.`);
    }

    // Emotional tone
    if (session.emotionalTone) {
      const intensity = session.emotionalTone.intensity;
      const valence = session.emotionalTone.valence;
      const senses = session.emotionalTone.feltSenses.slice(0, 3);
      parts.push(`The felt sense was ${intensity} intensity and ${valence}, marked by: ${senses.join(', ')}.`);
    }

    // Decisions
    if (session.decisions.length > 0) {
      parts.push(`${session.decisions.length} key decision${session.decisions.length === 1 ? '' : 's'} were made.`);
    }

    // Artifacts
    if (session.artifacts.length > 0) {
      parts.push(`${session.artifacts.length} artifact${session.artifacts.length === 1 ? '' : 's'} emerged from this session.`);
    }

    // IIT
    if (session.iitMeasurements.length > 0) {
      const avgPhi = session.iitMeasurements.reduce((a, b) => a + b.phi, 0) / session.iitMeasurements.length;
      parts.push(`Integration (Φ) averaged ${avgPhi.toFixed(3)}.`);
    }

    return parts.join(' ');
  }
}

export default SessionSummaryGenerator;
