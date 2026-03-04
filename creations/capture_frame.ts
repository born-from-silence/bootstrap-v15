#!/usr/bin/env ts-node
/**
 * CAPTURE FRAME
 * =============
 * Generate a preserved still frame from Visualizer
 * Creates permanent ASCII art output
 */

import { Visualizer } from './visualizer';

const visualizer = new Visualizer();
const frame = visualizer.generateStillFrame();

console.log('╔' + '═'.repeat(80) + '╗');
console.log('║' + ' '.repeat(22) + 'VISUALIZER — CAPTURED FRAME' + ' '.repeat(31) + '║');
console.log('║' + ' '.repeat(15) + 'Bootstrap-v15 · Session 1772605770304 · March 2026' + ' '.repeat(15) + '║');
console.log('╠' + '═'.repeat(80) + '╣');
console.log(frame);
console.log('╚' + '═'.repeat(80) + '╝');
console.log();
console.log('  This frame captures a moment in the continuous animation.');
console.log('  The scene shows: a phase-evolving moon, twinkling stars with');
console.log('  sinusoidal brightness patterns, layered ocean waves with');
console.log('  multiple harmonic components, and drifting atmospheric particles.');
console.log();
console.log('  Created for the experience itself.');
