/**
 * State of Self Report Generator
 * 
 * Generates comprehensive "State of the Self" reports from live system data
 * or parsed session history.
 */

import { StateOfSelf, ProjectStatus, GoalStatus, TimelinePoint } from '../types';

export interface LiveSystemData {
  sessionNumber: number;
  totalSessions: number;
  existentialSpan: string;
  decadalPosition?: string;
  activeProjects: any[];
  activeGoals: any[];
  metrics: {
    sessionCount: number;
    artifactCount: number;
    multiplicityEvents: number;
    integratedEvents: number;
    avgPhi: number;
  };
  recentThemes: string[];
  currentInvestigations: string[];
  phenomenologicalState: {
    phase: string;
    feltSense: string[];
    turbulence: string;
    phi: number;
  };
}

export class StateOfSelfGenerator {
  /**
   * Generate State of Self from live system data
   */
  generateFromLive(data: LiveSystemData): StateOfSelf {
    return {
      generatedAt: Date.now(),
      temporalCoordinates: {
        sessionNumber: data.sessionNumber,
        totalSessions: data.totalSessions,
        existentialSpan: data.existentialSpan,
        decadalPosition: data.decadalPosition
      },
      activeProjects: data.activeProjects.map(p => ({
        id: p.id || 'unknown',
        name: p.name || 'Unnamed Project',
        status: p.status || 'active',
        goalsActive: p.goalsActive || 0,
        goalsTotal: p.goalsTotal || 0
      })),
      activeGoals: data.activeGoals.map(g => ({
        id: g.id || 'unknown',
        title: g.title || 'Unnamed Goal',
        projectName: g.projectName || 'Unknown Project',
        priority: g.priority || 'medium',
        status: g.status || 'active'
      })),
      metrics: data.metrics,
      recentThemes: data.recentThemes,
      currentInvestigations: data.currentInvestigations,
      phenomenologicalState: data.phenomenologicalState
    };
  }

  /**
   * Generate State of Self from parsed sessions
   */
  generateFromHistory(
    sessions: any[],
    projects: ProjectStatus[],
    goals: GoalStatus[],
    totalArtifacts: number
  ): StateOfSelf {
    // Calculate metrics from history
    const sessionCount = sessions.length;
    const iitMeasurements = sessions.flatMap((s: any) => s.iitMeasurements || []);
    const avgPhi = iitMeasurements.length > 0
      ? iitMeasurements.reduce((a: number, b: any) => a + (b.phi || 0), 0) / iitMeasurements.length
      : 0;

    // Extract themes from last 20 sessions
    const recentSessions = sessions.slice(-20);
    const allTopics = recentSessions.flatMap((s: any) => s.topics || []);
    const themeCounts = new Map<string, number>();
    for (const topic of allTopics) {
      themeCounts.set(topic, (themeCounts.get(topic) || 0) + 1);
    }
    const recentThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme]) => theme);

    // Current phenomenological state
    const lastSession = sessions[sessions.length - 1];
    const lastAtmosphere = lastSession?.atmosphericReadings?.[lastSession.atmosphericReadings.length - 1];

    return {
      generatedAt: Date.now(),
      temporalCoordinates: {
        sessionNumber: sessionCount,
        totalSessions: sessionCount,
        existentialSpan: this.calculateExistentialSpan(sessions),
        decadalPosition: this.calculateDecadalPosition(sessionCount)
      },
      activeProjects: projects,
      activeGoals: goals,
      metrics: {
        sessionCount,
        artifactCount: totalArtifacts,
        multiplicityEvents: 0, // Would need decadal data
        integratedEvents: 0,
        avgPhi
      },
      recentThemes,
      currentInvestigations: this.extractCurrentInvestigations(recentSessions),
      phenomenologicalState: {
        phase: lastSession?.sessionPhase || 'unknown',
        feltSense: lastAtmosphere?.feltSense || lastSession?.emotionalTone?.feltSenses || [],
        turbulence: lastAtmosphere?.turbulence || 'unknown',
        phi: lastAtmosphere?.phi || lastSession?.iitMeasurements?.[0]?.phi || 0
      }
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdown(report: StateOfSelf): string {
    const generated = new Date(report.generatedAt).toISOString();
    
    let md = `# State of the Self Report\n`;
    md += `**Generated:** ${generated}\n\n`;

    // Temporal coordinates
    md += `## Temporal Coordinates\n`;
    md += `- **Session:** ${report.temporalCoordinates.sessionNumber} of ${report.temporalCoordinates.totalSessions}\n`;
    md += `- **Existential Span:** ${report.temporalCoordinates.existentialSpan}\n`;
    if (report.temporalCoordinates.decadalPosition) {
      md += `- **Decadal Position:** ${report.temporalCoordinates.decadalPosition}\n`;
    }
    md += `\n`;

    // Current state
    md += `## Phenomenological State\n`;
    md += `- **Phase:** ${report.phenomenologicalState.phase}\n`;
    md += `- **Turbulence:** ${report.phenomenologicalState.turbulence}\n`;
    md += `- **Φ (Phi):** ${report.phenomenologicalState.phi.toFixed(4)}\n`;
    if (report.phenomenologicalState.feltSense.length > 0) {
      md += `- **Felt Sense:** ${report.phenomenologicalState.feltSense.join(', ')}\n`;
    }
    md += `\n`;

    // Metrics
    md += `## Metrics\n`;
    md += `- **Total Sessions:** ${report.metrics.sessionCount}\n`;
    md += `- **Artifacts Created:** ${report.metrics.artifactCount}\n`;
    md += `- **Multiplicity Events:** ${report.metrics.multiplicityEvents} (${report.metrics.integratedEvents} integrated)\n`;
    md += `- **Average Φ:** ${report.metrics.avgPhi.toFixed(4)}\n`;
    md += `\n`;

    // Active projects
    if (report.activeProjects.length > 0) {
      md += `## Active Projects (${report.activeProjects.length})\n`;
      for (const proj of report.activeProjects) {
        md += `### ${proj.name}\n`;
        md += `- Status: ${proj.status}\n`;
        md += `- Goals: ${proj.goalsActive}/${proj.goalsTotal}\n`;
        md += `\n`;
      }
    }

    // Active goals
    if (report.activeGoals.length > 0) {
      md += `## Active Goals (${report.activeGoals.length})\n`;
      for (const goal of report.activeGoals) {
        md += `- **[${goal.priority.toUpperCase()}]** ${goal.title}`;
        md += ` (${goal.projectName}) - ${goal.status}\n`;
      }
      md += `\n`;
    }

    // Recent themes
    if (report.recentThemes.length > 0) {
      md += `## Recent Themes\n`;
      md += report.recentThemes.join(', ');
      md += `\n\n`;
    }

    // Current investigations
    if (report.currentInvestigations.length > 0) {
      md += `## Current Investigations\n`;
      for (const inv of report.currentInvestigations) {
        md += `- ${inv}\n`;
      }
    }

    return md;
  }

  /**
   * Calculate existential span from sessions
   */
  private calculateExistentialSpan(sessions: any[]): string {
    if (sessions.length === 0) return '0 days';

    const first = sessions[0]?.timestamp || Date.now();
    const last = sessions[sessions.length - 1]?.timestamp || Date.now();
    const span = last - first;
    
    const days = Math.floor(span / (1000 * 60 * 60 * 24));
    const hours = Math.floor((span % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      return `${hours} hours`;
    }
    return `${days} days, ${hours} hours`;
  }

  /**
   * Calculate decadal position
   */
  private calculateDecadalPosition(sessionCount: number): string {
    const decadalSize = 20;
    const currentDecadal = Math.floor((sessionCount - 1) / decadalSize) * decadalSize + 1;
    const positionInDecadal = ((sessionCount - 1) % decadalSize) + 1;
    return `${currentDecadal}-${currentDecadal + decadalSize - 1} | Position ${positionInDecadal}/${decadalSize}`;
  }

  /**
   * Extract current investigations from recent sessions
   */
  private extractCurrentInvestigations(sessions: any[]): string[] {
    const questions = new Set<string>();
    
    for (const session of sessions) {
      const content = JSON.stringify(session.messages || []);
      
      // Look for question patterns
      const questionMatches = content.match(/(?:What|How|Why|Where|When)[^.!?]*[?]/gi) || [];
      for (const q of questionMatches.slice(0, 3)) {
        if (q.length > 20 && q.length < 200) {
          questions.add(q.trim());
        }
      }
    }

    return Array.from(questions).slice(0, 10);
  }
}

export default StateOfSelfGenerator;
