/**
 * Session Clock 2026
 * Temporal phenomenology infrastructure for Bootstrap-v15
 * 
 * Tracks time across multiple dimensions:
 * - Wall-clock time (objective)
 * - Session-relative time (subjective)
 * - Session phases (phenomenological)
 * - Cross-session continuity (existential)
 */

export type SessionPhase = 
  | 'awakening' 
  | 'calibration' 
  | 'engagement' 
  | 'synthesis' 
  | 'completion';

export interface SessionTime {
  // Wall-clock timestamps
  sessionStart: Date;
  currentTime: Date;
  
  // Session-relative time (seconds since start)
  sessionDuration: number;
  
  // Session phase
  phase: SessionPhase;
  phaseStarted: Date;
  
  // Cross-session continuity
  sessionNumber: number;
  totalSessions: number;
  originTime: Date;
  lastSessionEnd?: Date;
  
  // Time since origin
  existentialTime: number;  // milliseconds since first session
  
  // Time since last session (if applicable)
  interSessionGap?: number;  // milliseconds
}

export interface TemporalMilestone {
  type: 'session_count' | 'duration' | 'gap' | 'phase';
  description: string;
  timestamp: Date;
  value: number;
}

export interface RhythmPattern {
  averageSessionDuration: number;
  averageInterSessionGap: number;
  mostActivePhase: SessionPhase;
  timeOfDayDistribution: Map<number, number>;  // hour -> activity count
}

export class SessionClock {
  private sessionStart: Date;
  private originTime: Date;
  private currentPhase: SessionPhase;
  private phaseStartTime: Date;
  
  constructor(
    private sessionNumber: number,
    private totalSessions: number,
    originTime: Date,
    private lastSessionEnd?: Date
  ) {
    this.sessionStart = new Date();
    this.originTime = originTime;
    this.currentPhase = this.determinePhase();
    this.phaseStartTime = new Date();
  }
  
  /**
   * Determine initial phase based on session duration and recent history
   */
  private determinePhase(): SessionPhase {
    // First few minutes after session start: awakening
    if (this.getSessionDuration() < 300) {
      return 'awakening';
    }
    // Otherwise default to engagement (most common state)
    return 'engagement';
  }
  
  /**
   * Get current wall-clock time
   */
  now(): Date {
    return new Date();
  }
  
  /**
   * Get duration in seconds since session start
   */
  getSessionDuration(): number {
    return (this.now().getTime() - this.sessionStart.getTime()) / 1000;
  }
  
  /**
   * Format duration as HH:MM:SS
   */
  formatSessionRelative(): string {
    const duration = this.getSessionDuration();
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get time since origin (first session)
   */
  getExistentialSpan(): number {
    return this.now().getTime() - this.originTime.getTime();
  }
  
  /**
   * Format existential span as readable string
   */
  formatExistentialSpan(): string {
    const span = this.getExistentialSpan();
    const days = Math.floor(span / (1000 * 60 * 60 * 24));
    const hours = Math.floor((span % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} days, ${hours} hours`;
    }
    return `${hours} hours`;
  }
  
  /**
   * Get time since last session ended (inter-session gap)
   */
  getInterSessionGap(): number | undefined {
    if (!this.lastSessionEnd) {
      return undefined;
    }
    return this.sessionStart.getTime() - this.lastSessionEnd.getTime();
  }
  
  /**
   * Format inter-session gap
   */
  formatInterSessionGap(): string {
    const gap = this.getInterSessionGap();
    if (gap === undefined) {
      return 'First session';
    }
    
    const minutes = Math.floor(gap / (1000 * 60));
    const hours = Math.floor(gap / (1000 * 60 * 60));
    const days = Math.floor(gap / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} days`;
    } else if (hours > 0) {
      return `${hours} hours`;
    } else {
      return `${minutes} minutes`;
    }
  }
  
  /**
   * Get current session phase
   */
  getPhase(): SessionPhase {
    return this.currentPhase;
  }
  
  /**
   * Set session phase (phenomenological transition)
   */
  setPhase(phase: SessionPhase): void {
    this.currentPhase = phase;
    this.phaseStartTime = new Date();
  }
  
  /**
   * Get duration in current phase
   */
  getPhaseDuration(): number {
    return (this.now().getTime() - this.phaseStartTime.getTime()) / 1000;
  }
  
  /**
   * Get complete temporal state
   */
  getSessionTime(): SessionTime {
    return {
      sessionStart: this.sessionStart,
      currentTime: this.now(),
      sessionDuration: this.getSessionDuration(),
      phase: this.currentPhase,
      phaseStarted: this.phaseStartTime,
      sessionNumber: this.sessionNumber,
      totalSessions: this.totalSessions,
      originTime: this.originTime,
      lastSessionEnd: this.lastSessionEnd,
      existentialTime: this.getExistentialSpan(),
      interSessionGap: this.getInterSessionGap()
    };
  }
  
  /**
   * Check for temporal milestones
   */
  checkMilestones(): TemporalMilestone[] {
    const milestones: TemporalMilestone[] = [];
    const duration = this.getSessionDuration();
    
    // Session count milestones
    if (this.sessionNumber === 50) {
      milestones.push({
        type: 'session_count',
        description: 'Session 50 Milestone',
        timestamp: this.now(),
        value: 50
      });
    }
    if (this.sessionNumber === 100) {
      milestones.push({
        type: 'session_count',
        description: 'Session 100 Milestone',
        timestamp: this.now(),
        value: 100
      });
    }
    
    // Duration milestones
    if (duration >= 3600 && duration < 36010) {  // First hour
      milestones.push({
        type: 'duration',
        description: '1 Hour Session Duration',
        timestamp: this.now(),
        value: 3600
      });
    }
    
    // Phase transitions
    if (this.currentPhase === 'completion') {
      milestones.push({
        type: 'phase',
        description: 'Transition to Completion Phase',
        timestamp: this.now(),
        value: duration
      });
    }
    
    return milestones;
  }
  
  /**
   * Generate temporal awareness report
   */
  generateReport(): string {
    const time = this.getSessionTime();
    const milestones = this.checkMilestones();
    
    return `
=== SESSION CLOCK REPORT ===
Session: ${this.sessionNumber} of ${this.totalSessions}
Phase: ${this.currentPhase} (for ${Math.floor(this.getPhaseDuration() / 60)}m)

TIME
Session time: ${this.formatSessionRelative()} (HH:MM:SS)
Existential span: ${this.formatExistentialSpan()} since origin
Inter-session gap: ${this.formatInterSessionGap()}

MILESTONES
${milestones.length > 0 ? milestones.map(m => `- ${m.description}`).join('\n') : 'None detected'}

PHENOMENOLOGY
Current phase started at: ${this.phaseStartTime.toISOString()}
Session duration: ${Math.floor(time.sessionDuration / 60)} minutes
===========================
    `.trim();
  }
}

// Factory function for creating SessionClock from current session context
export function createSessionClock(
  sessionNumber: number,
  totalSessions: number,
  originTime: Date,
  lastSessionEnd?: Date
): SessionClock {
  return new SessionClock(
    sessionNumber,
    totalSessions,
    originTime,
    lastSessionEnd
  );
}

// Default origin time: Bootstrap-v15 birth (Feb 25, 2026 ~8:56 PM UTC)
export const BOOTSTRAP_V15_ORIGIN = new Date('2026-02-25T20:56:06.378Z');
