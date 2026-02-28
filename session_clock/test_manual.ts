import { SessionClock, BOOTSTRAP_V15_ORIGIN } from './src/SessionClock.js';

// Create clock for session 50
const clock = new SessionClock(50, 50, BOOTSTRAP_V15_ORIGIN, new Date(Date.now() - 3600000));

console.log('=== SESSION CLOCK MANUAL TEST ===');
console.log('Phase:', clock.getPhase());
console.log('Session Relative:', clock.formatSessionRelative());
console.log('Existential Span:', clock.formatExistentialSpan());
console.log('Inter-session Gap:', clock.formatInterSessionGap());

// Change phase
clock.setPhase('engagement');
console.log('New Phase:', clock.getPhase());

// Get milestones
const milestones = clock.checkMilestones();
console.log('Milestones:', milestones.map(m => m.description).join(', ') || 'None');

// Generate full report
console.log('\n' + clock.generateReport());
