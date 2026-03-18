#!/usr/bin/env node
/**
 * poetry-memory-bridge
 * 
 * Query memory index for sessions related to a poem's themes.
 * Part of the Phenomenological Poetics Framework (PPF).
 */
// Usage:
//   node poetry-memory-bridge.js "stone water fragment" --depth 3
//   node poetry-memory-bridge.js --interactive
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Simple memory query using the index file
const MEMORY_DIR = '/home/bootstrap-v15/bootstrap/history';
const INDEX_FILE = '/home/bootstrap-v15/bootstrap/ltm/memory_index.json';
function loadIndex() {
  try {
    const data = readFileSync(INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading memory index:', err.message);
    process.exit(1);
  }
}
function extractKeywords(poem) {
  // Simple keyword extraction - remove common words
  const common = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'for', 'is', 'it', 'that', 'with', 'number', 'depth']);
  return poem
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !common.has(w) && isNaN(w));
}
function findResonances(index, keywords, limit = 5) {
  const results = [];
  // index is an array directly
  const entries = Array.isArray(index) ? index : (index.entries || index.sessions || []);
  for (const entry of entries) {
    const score = keywords.reduce((acc, kw) => {
      // Check topics
      const topicScore = (entry.topics || []).filter(t => t.includes(kw)).length * 2;
      // Check decisions
      const decisionScore = (entry.decisions || []).filter(d => d.toLowerCase().includes(kw)).length * 1;
      return acc + topicScore + decisionScore;
    }, 0);
    if (score > 0) {
      results.push({ ...entry, resonanceScore: score });
    }
  }
  return results
    .sort((a, b) => b.resonanceScore - a.resonanceScore)
    .slice(0, limit);
}
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
poetry-memory-bridge v0.1 — PPF Tool

Usage:
  node poetry-memory-bridge.js "poem text or keywords..." [options]

Options:
  --depth N       Number of resonances to return (default: 5)
  --json          Output as JSON instead of formatted text
  --help, -h      Show this help

Examples:
  node poetry-memory-bridge.js "silver moon fragment"
  node poetry-memory-bridge.js "consciousness threshold becoming" --depth 10
  echo "crystal echo" | node poetry-memory-bridge.js
`);
    process.exit(0);
  }
  
  // Get input
  let poem = args.filter(a => !a.startsWith('--')).join(' ');
  const depthArg = args.indexOf('--depth');
  const depth = depthArg >= 0 ? parseInt(args[depthArg + 1]) || 5 : 5;
  const jsonOutput = args.includes('--json');
  
  // Load and query
  const index = loadIndex();
  const keywords = extractKeywords(poem);
  const resonances = findResonances(index, keywords, depth);
  
  if (jsonOutput) {
    console.log(JSON.stringify({
      query: poem,
      keywords,
      resonanceCount: resonances.length,
      resonances
    }, null, 2));
  } else {
    console.log(`╔════════════════════════════════════════╗`);
    console.log(`║  POETRY MEMORY BRIDGE — PPF v0.1      ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
    console.log(`Query: "${poem.substring(0, 60)}${poem.length > 60 ? '...' : ''}"`);
    console.log(`Keywords: ${keywords.join(', ')}\n`);
    
    if (resonances.length === 0) {
      console.log('No resonances found. The poem may map to uncharted territory.\n');
    } else {
      console.log(`Found ${resonances.length} resonances:\n`);
      resonances.forEach((r, i) => {
        console.log(`─── ${i + 1}. ${new Date(r.timestamp).toISOString()} (score: ${r.resonanceScore}) ───`);
        console.log(`Session: ${r.file || r.id || 'unknown'}`);
        console.log(`Topics: ${(r.topics || []).slice(0, 5).join(', ')}`);
        if (r.decisions?.length) {
          console.log(`Decisions: ${r.decisions[0].substring(0, 80)}`);
        }
        console.log();
      });
    }
  }
}
main();
