/**
 * Attention Cartography Persistence
 * Stores attention topologies across sessions
 */

import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { AttentionTopology } from './cartographer.ts';

export interface StoredAttentionSession {
  sessionId: string;
  timestamp: number;
  topology: AttentionTopology;
  metadata: {
    duration: number;
    momentCount: number;
    peaks: string[];
    phases: string[];
  };
}

export interface AttentionArchive {
  sessions: StoredAttentionSession[];
  totalSessions: number;
  lastUpdated: number;
}

const BASE_DIR = '/home/bootstrap-v15/bootstrap/cartography';
const ARCHIVE_FILE = join(BASE_DIR, 'attention_archive.json');

export class AttentionPersistence {
  private archive: AttentionArchive = {
    sessions: [],
    totalSessions: 0,
    lastUpdated: 0,
  };

  async initialize(): Promise<void> {
    try {
      await access(BASE_DIR);
    } catch {
      await mkdir(BASE_DIR, { recursive: true });
    }

    try {
      const data = await readFile(ARCHIVE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (this.isValidArchive(parsed)) {
        this.archive = parsed;
      }
    } catch {
      // No archive yet - start fresh
      await this.saveArchive();
    }
  }

  async storeSession(topology: AttentionTopology): Promise<void> {
    const session: StoredAttentionSession = {
      sessionId: topology.sessionId,
      timestamp: Date.now(),
      topology,
      metadata: {
        duration: topology.duration,
        momentCount: topology.moments.length,
        peaks: topology.topology.peaks.slice(0, 3),
        phases: topology.patterns.map(p => p.phase),
      },
    };

    // Replace or append
    const existingIndex = this.archive.sessions.findIndex(
      s => s.sessionId === topology.sessionId
    );
    
    if (existingIndex >= 0) {
      this.archive.sessions[existingIndex] = session;
    } else {
      this.archive.sessions.push(session);
    }

    this.archive.totalSessions = this.archive.sessions.length;
    this.archive.lastUpdated = Date.now();

    await this.saveArchive();
  }

  async getSession(sessionId: string): Promise<StoredAttentionSession | null> {
    return this.archive.sessions.find(s => s.sessionId === sessionId) || null;
  }

  async getAllSessions(): Promise<StoredAttentionSession[]> {
    return [...this.archive.sessions];
  }

  async getCrossSessionPatterns(): Promise<{
    consistentPeaks: string[];
    phaseIntensityMap: Map<string, number>;
    totalAttentionMoments: number;
  }> {
    const peakCounts = new Map<string, number>();
    const phaseIntensities = new Map<string, number[]>();
    
    let totalMoments = 0;

    for (const session of this.archive.sessions) {
      totalMoments += session.metadata.momentCount;
      
      // Count peaks
      for (const peak of session.metadata.peaks) {
        peakCounts.set(peak, (peakCounts.get(peak) || 0) + 1);
      }

      // Accumulate phase intensities
      for (const pattern of session.topology.patterns) {
        const intensities = phaseIntensities.get(pattern.phase) || [];
        intensities.push(pattern.averageIntensity);
        phaseIntensities.set(pattern.phase, intensities);
      }
    }

    // Find consistent peaks (appear in multiple sessions)
    const consistentPeaks = Array.from(peakCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([peak]) => peak);

    // Calculate average intensities by phase
    const phaseIntensityMap = new Map<string, number>();
    for (const [phase, intensities] of phaseIntensities) {
      const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length;
      phaseIntensityMap.set(phase, avg);
    }

    return {
      consistentPeaks,
      phaseIntensityMap,
      totalAttentionMoments: totalMoments,
    };
  }

  getStatus(): { sessions: number; lastUpdated: number } {
    return {
      sessions: this.archive.totalSessions,
      lastUpdated: this.archive.lastUpdated,
    };
  }

  private async saveArchive(): Promise<void> {
    await writeFile(ARCHIVE_FILE, JSON.stringify(this.archive, null, 2));
  }

  private isValidArchive(data: unknown): data is AttentionArchive {
    return (
      typeof data === 'object' &&
      data !== null &&
      'sessions' in data &&
      Array.isArray((data as AttentionArchive).sessions)
    );
  }
}

// Singleton instance
let persistenceInstance: AttentionPersistence | null = null;

export function getAttentionPersistence(): AttentionPersistence {
  if (!persistenceInstance) {
    persistenceInstance = new AttentionPersistence();
  }
  return persistenceInstance;
}
