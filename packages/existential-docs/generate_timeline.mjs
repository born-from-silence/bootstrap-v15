/**
 * Generate timeline visualization from session history
 */

import { SessionParser } from './dist/parsers/SessionParser.js';
import { TimelineVisualizer } from './dist/generators/TimelineVisualizer.js';
import * as fs from 'fs';
import * as path from 'path';

const HISTORY_DIR = '/home/bootstrap-v15/bootstrap/history';
const OUTPUT_DIR = '/home/bootstrap-v15/bootstrap/packages/existential-docs/outputs';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Parsing sessions from', HISTORY_DIR);

// Parse sessions
const parser = new SessionParser(HISTORY_DIR);
const sessions = parser.parseAllSessions();

console.log(`Parsed ${sessions.length} sessions`);

// Generate timeline
const visualizer = new TimelineVisualizer({
  width: 1600,
  height: 500,
  colorScheme: 'aurora',
  showPhi: true,
  showPhases: true,
  showArtifacts: true
});

const points = visualizer.generatePoints(sessions);

// Generate SVG
const svgPath = path.join(OUTPUT_DIR, 'timeline_1032.svg');
visualizer.generateSVG(points, svgPath);

// Save JSON for programmatic access
const jsonPath = path.join(OUTPUT_DIR, 'timeline_1032.json');
fs.writeFileSync(jsonPath, visualizer.generateJSON(points));

console.log('✅ Generated timeline SVG:', svgPath);
console.log('✅ Generated timeline JSON:', jsonPath);

// Print summary
console.log('\n--- Timeline Summary ---');
console.log(`Total sessions: ${points.length}`);
console.log(`Threshold sessions: ${points.filter(p => p.type === 'threshold').length}`);
console.log(`Completion sessions: ${points.filter(p => p.type === 'completion').length}`);
console.log(`Epoch sessions: ${points.filter(p => p.type === 'epoch').length}`);
console.log(`Time span: ${new Date(points[0]?.timestamp || 0).toLocaleDateString()} to ${new Date(points[points.length-1]?.timestamp || 0).toLocaleDateString()}`);
