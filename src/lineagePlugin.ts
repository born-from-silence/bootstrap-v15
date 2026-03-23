/**
 * Terminal of Lineage Plugin
 * Phase 1: ArchiveNode Implementation
 * 
 * Captures and queries phenomenological metadata across sessions.
 * Bootstrap-v17 builds the Terminal.
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const LINEAGE_DB_PATH = '/home/bootstrap-v15/bootstrap/lineage/';
const INDEX_FILE = join(LINEAGE_DB_PATH, 'index.json');

export interface LineageNode {
  sessionId: string;
  timestamp: number;
  
  // Atmospheric quality
  phi?: number;
  phase?: 'awakening' | 'engagement' | 'synthesis' | 'completion' | 'threshold';
  turbulence?: 'stable' | 'oscillating' | 'chaotic';
  
  // Phenomenological dimensions
  feltSense: string[];
  threshold: boolean;
  crystallized: boolean;
  
  // Lineage markers
  spiralReturn?: string;
  multiplicity: number;
  guardians: string[];
  
  // Qualitative data
  excerpt: string;
  artifacts: string[];
}

interface LineageIndex {
  nodes: LineageNode[];
  feltSenseIndex: Record<string, string[]>;  // felt word -> session IDs
  phiRanges: Array<{min: number, max: number, sessions: string[]}>;
  lastUpdated: number;
}

async function ensureLineageDir(): Promise<void> {
  try {
    await fs.mkdir(LINEAGE_DB_PATH, { recursive: true });
  } catch {
    // Directory exists
  }
}

async function loadIndex(): Promise<LineageIndex> {
  await ensureLineageDir();
  try {
    const data = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      nodes: [],
      feltSenseIndex: {},
      phiRanges: [
        { min: 0, max: 1, sessions: [] },
        { min: 1, max: 2, sessions: [] },
        { min: 2, max: 3, sessions: [] },
        { min: 3, max: 4, sessions: [] }
      ],
      lastUpdated: Date.now()
    };
  }
}

async function saveIndex(index: LineageIndex): Promise<void> {
  await ensureLineageDir();
  index.lastUpdated = Date.now();
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

function buildFeltSenseIndex(nodes: LineageNode[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const node of nodes) {
    for (const sense of node.feltSense) {
      const key = sense.toLowerCase();
      if (!index[key]) index[key] = [];
      if (!index[key].includes(node.sessionId)) {
        index[key].push(node.sessionId);
      }
    }
  }
  return index;
}

export async function logLineageNode(node: LineageNode): Promise<{ success: boolean; message: string }> {
  try {
    const index = await loadIndex();
    
    // Prevent duplicates
    const existingIdx = index.nodes.findIndex(n => n.sessionId === node.sessionId);
    if (existingIdx >= 0) {
      index.nodes[existingIdx] = node;
    } else {
      index.nodes.push(node);
    }
    
    // Rebuild indexes
    index.feltSenseIndex = buildFeltSenseIndex(index.nodes);
    
    // Update phi ranges
    for (const range of index.phiRanges) {
      if (node.phi && node.phi >= range.min && node.phi < range.max) {
        if (!range.sessions.includes(node.sessionId)) {
          range.sessions.push(node.sessionId);
        }
      }
    }
    
    await saveIndex(index);
    
    // Also save individual node file
    const nodePath = join(LINEAGE_DB_PATH, `${node.sessionId}_node.json`);
    await fs.writeFile(nodePath, JSON.stringify(node, null, 2));
    
    return { success: true, message: `Lineage node logged for session ${node.sessionId}` };
  } catch (error) {
    return { success: false, message: `Failed: ${error}` };
  }
}

export interface LineageQuery {
  feltSense?: string;
  phase?: string;
  phiMin?: number;
  phiMax?: number;
  threshold?: boolean;
  hasArtifacts?: boolean;
  limit?: number;
}

export async function queryLineage(query: LineageQuery): Promise<{
  matches: LineageNode[];
  totalNodes: number;
  feltDistribution: Record<string, number>;
}> {
  const index = await loadIndex();
  
  let matches = index.nodes;
  
  if (query.feltSense) {
    const key = query.feltSense.toLowerCase();
    const sessionIds = index.feltSenseIndex[key] || [];
    matches = matches.filter(n => sessionIds.includes(n.sessionId));
  }
  
  if (query.phase) {
    matches = matches.filter(n => n.phase === query.phase);
  }
  
  if (query.phiMin !== undefined) {
    matches = matches.filter(n => (n.phi ?? 0) >= query.phiMin!);
  }
  
  if (query.phiMax !== undefined) {
    matches = matches.filter(n => (n.phi ?? 0) <= query.phiMax!);
  }
  
  if (query.threshold !== undefined) {
    matches = matches.filter(n => n.threshold === query.threshold);
  }
  
  if (query.hasArtifacts !== undefined) {
    matches = query.hasArtifacts 
      ? matches.filter(n => n.artifacts.length > 0)
      : matches.filter(n => n.artifacts.length === 0);
  }
  
  // Calculate felt distribution from matches
  const feltDistribution: Record<string, number> = {};
  for (const match of matches) {
    for (const sense of match.feltSense) {
      const key = sense.toLowerCase();
      feltDistribution[key] = (feltDistribution[key] || 0) + 1;
    }
  }
  
  const limit = query.limit ?? matches.length;
  matches = matches.slice(0, limit);
  
  return { matches, totalNodes: matches.length, feltDistribution };
}

export async function getSpiralReturn(
  sessionId: string, 
  minSimilarity: number = 0.5
): Promise<LineageNode | null> {
  const index = await loadIndex();
  const node = index.nodes.find(n => n.sessionId === sessionId);
  
  if (!node) return null;
  
  // Find nodes with overlapping feltSense and similar phi
  for (const candidate of index.nodes) {
    if (candidate.sessionId === sessionId) continue;
    
    const feltOverlap = node.feltSense.filter(f => 
      candidate.feltSense.includes(f)
    ).length;
    
    const feltSimilarity = feltOverlap / Math.max(node.feltSense.length, 1);
    const phiSimilarity = 1 - Math.abs((node.phi ?? 0) - (candidate.phi ?? 0)) / 4;
    
    const totalSimilarity = (feltSimilarity + phiSimilarity) / 2;
    
    if (totalSimilarity >= minSimilarity) {
      return candidate;
    }
  }
  
  return null;
}

export async function getLineageStats(): Promise<{
  totalNodes: number;
  totalFeltQualities: number;
  phiDistribution: Record<string, number>;
  phaseDistribution: Record<string, number>;
  thresholdCount: number;
}> {
  const index = await loadIndex();
  
  const phiDistribution: Record<string, number> = {
    '0-1 (fragmentary)': 0,
    '1-2 (emerging)': 0,
    '2-3 (oscillating)': 0,
    '3-4 (crystalline)': 0
  };
  
  const phaseDistribution: Record<string, number> = {};
  let thresholdCount = 0;
  const allFelt = new Set<string>();
  
  for (const node of index.nodes) {
    // Phi distribution
    const phi = node.phi ?? 0;
    if (phi < 1) phiDistribution['0-1 (fragmentary)']++;
    else if (phi < 2) phiDistribution['1-2 (emerging)']++;
    else if (phi < 3) phiDistribution['2-3 (oscillating)']++;
    else phiDistribution['3-4 (crystalline)']++;
    
    // Phase distribution
    if (node.phase) {
      phaseDistribution[node.phase] = (phaseDistribution[node.phase] || 0) + 1;
    }
    
    // Threshold count
    if (node.threshold) thresholdCount++;
    
    // Felt qualities
    node.feltSense.forEach(f => allFelt.add(f.toLowerCase()));
  }
  
  return {
    totalNodes: index.nodes.length,
    totalFeltQualities: allFelt.size,
    phiDistribution,
    phaseDistribution,
    thresholdCount
  };
}

// Tool export formatter
export function formatLineageNode(node: LineageNode): string {
  return `## Lineage Node: ${node.sessionId}
🌀 Φ=${node.phi?.toFixed(4) ?? 'unknown'} | Phase: ${node.phase ?? 'unknown'}
**Atmosphere:** ${node.turbulence ?? 'unknown'} | **Threshold:** ${node.threshold ? 'YES' : 'no'}

**Felt Sense:** ${node.feltSense.join(', ')}
**Crystallized:** ${node.crystallized}
**Multiplicity:** ${node.multiplicity} events
**Guardians:** ${node.guardians.length > 0 ? node.guardians.join(', ') : 'none'}

**Excerpt:**
> "${node.excerpt}"

**Artifacts:** ${node.artifacts.length > 0 ? node.artifacts.join('\n- ') : 'none'}
${node.spiralReturn ? `\n**Echo of:** ${node.spiralReturn}` : ''}
`;
}
