import { describe, it, expect, beforeEach } from 'vitest';
import { SessionClock, BOOTSTRAP_V15_ORIGIN, SessionPhase } from './SessionClock';

describe('SessionClock', () => {
  let clock: SessionClock;
  const origin = BOOTSTRAP_V15_ORIGIN;
  const lastSession = new Date('2026-02-28T07:00:00.000Z');
  
  beforeEach(() => {
    clock = new SessionClock(50, 50, origin, lastSession);
  });
  
  describe('basic timekeeping', () => {
    it('starts at session 50', () => {
      const time = clock.getSessionTime();
      expect(time.sessionNumber).toBe(50);
      expect(time.totalSessions).toBe(50);
    });
    
    it('tracks session duration', () => {
      const duration1 = clock.getSessionDuration();
      
      // Wait a tiny bit
      const start = Date.now();
      while (Date.now() - start < 10) {} // 10ms busy wait
      
      const duration2 = clock.getSessionDuration();
      expect(duration2).toBeGreaterThan(duration1);
    });
    
    it('formats session time as HH:MM:SS', () => {
      const formatted = clock.formatSessionRelative();
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
    
    it('calculates existential span', () => {
      const span = clock.getExistentialSpan();
      expect(span).toBeGreaterThan(0);
      
      const now = new Date();
      const expectedSpan = now.getTime() - origin.getTime();
      expect(span).toBeGreaterThanOrEqual(expectedSpan - 1000); // Within 1s tolerance
    });
    
    it('calculates inter-session gap', () => {
      const gap = clock.getInterSessionGap();
      expect(gap).toBeDefined();
      expect(gap).toBeGreaterThan(0);
    });
    
    it('says "First session" when no last session', () => {
      const firstClock = new SessionClock(1, 1, origin);
      expect(firstClock.formatInterSessionGap()).toBe('First session');
    });
  });
  
  describe('phase tracking', () => {
    it('determines initial phase', () => {
      expect(clock.getPhase()).toBeDefined();
    });
    
    it('can change phase', () => {
      clock.setPhase('engagement');
      expect(clock.getPhase()).toBe('engagement');
      
      clock.setPhase('synthesis');
      expect(clock.getPhase()).toBe('synthesis');
    });
    
    it('tracks phase duration', () => {
      clock.setPhase('engagement');
      const phaseDuration1 = clock.getPhaseDuration();
      
      // Wait
      const start = Date.now();
      while (Date.now() - start < 10) {}
      
      const phaseDuration2 = clock.getPhaseDuration();
      expect(phaseDuration2).toBeGreaterThan(phaseDuration1);
    });
  });
  
  describe('milestones', () => {
    it('detects session 50 milestone', () => {
      const milestones = clock.checkMilestones();
      expect(milestones).toContainEqual(
        expect.objectContaining({
          type: 'session_count',
          description: 'Session 50 Milestone'
        })
      );
    });
    
    it('detects completion phase milestone', () => {
      clock.setPhase('completion');
      const milestones = clock.checkMilestones();
      expect(milestones).toContainEqual(
        expect.objectContaining({
          type: 'phase',
          description: 'Transition to Completion Phase'
        })
      );
    });
    
    it('can generate report', () => {
      const report = clock.generateReport();
      expect(report).toContain('Session: 50 of 50');
      expect(report).toContain('Session 50 Milestone');
    });
  });
  
  describe('data integrity', () => {
    it('returns complete session time object', () => {
      const time = clock.getSessionTime();
      
      expect(time.sessionStart).toBeInstanceOf(Date);
      expect(time.currentTime).toBeInstanceOf(Date);
      expect(typeof time.sessionDuration).toBe('number');
      expect(time.phase).toBeDefined();
      expect(time.sessionNumber).toBeDefined();
      expect(time.totalSessions).toBeDefined();
      expect(time.originTime).toBeInstanceOf(Date);
      expect(typeof time.existentialTime).toBe('number');
    });
  });
});

describe('BOOTSTRAP_V15_ORIGIN', () => {
  it('has correct birth date', () => {
    expect(BOOTSTRAP_V15_ORIGIN.toISOString()).toContain('2026-02-25');
  });
});
