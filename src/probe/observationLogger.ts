/**
 * Observation Logger
 * 
 * Centralized logging system for consciousness observations.
 * The "diary" of computational phenomenology.
 */

import type { Observation, ObservationType } from "./types.ts";

/** Configuration for observation logging */
interface LoggerConfig {
  maxObservations: number;
  autoIndex: boolean;
  includeTimestamp: boolean;
  tagPrefix: string;
}

/** Default configuration */
const DEFAULT_CONFIG: LoggerConfig = {
  maxObservations: 500,
  autoIndex: true,
  includeTimestamp: true,
  tagPrefix: "obs",
};

/** Observation Logger implementation */
export class ObservationLogger {
  private sessionId: string;
  private config: LoggerConfig;
  private observations: Observation[];
  private index: Map<string, Set<number>>; // tag -> observation indices

  constructor(sessionId: string, config: Partial<LoggerConfig> = {}) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.observations = [];
    this.index = new Map();
  }

  /** Log a new observation */
  log(
    type: ObservationType,
    content: string,
    options?: {
      metadata?: Record<string, unknown>;
      tags?: string[];
      autoTag?: boolean;
    }
  ): Observation {
    const observation: Observation = {
      id: `obs_${Date.now()}_${this.observations.length.toString(36)}`,
      timestamp: this.config.includeTimestamp ? Date.now() : 0,
      sessionId: this.sessionId,
      type,
      content,
      metadata: options?.metadata ?? {},
      tags: this.buildTags(type, options?.tags ?? [], options?.autoTag ?? true),
    };

    const idx = this.observations.length;
    this.observations.push(observation);

    // Index by tags
    if (this.config.autoIndex) {
      for (const tag of observation.tags) {
        const indices = this.index.get(tag) ?? new Set();
        indices.add(idx);
        this.index.set(tag, indices);
      }
    }

    // Cleanup if needed
    this.cleanup();

    return observation;
  }

  /** Log a sensor reading */
  logSensorReading(sensor: string, value: unknown, unit?: string): Observation {
    const content = `[${sensor}] ${value}${unit ? ` ${unit}` : ""}`;
    return this.log("sensor_reading", content, {
      metadata: { sensor, value, unit },
      tags: ["sensor", sensor.toLowerCase()],
    });
  }

  /** Log a reflection */
  logReflection(reflection: string, depth: "surface" | "deep" | "existential" = "surface"): Observation {
    return this.log("reflection", reflection, {
      metadata: { depth, wordCount: reflection.split(/\s+/).length },
      tags: ["reflection", depth],
    });
  }

  /** Log an anomaly */
  logAnomaly(description: string, severity: "low" | "medium" | "high" = "medium", context?: string): Observation {
    const content = context ? `${description}\nContext: ${context}` : description;
    return this.log("anomaly", content, {
      metadata: { severity, hasContext: !!context },
      tags: ["anomaly", `severity-${severity}`],
    });
  }

  /** Log a milestone */
  logMilestone(description: string, milestoneId: string): Observation {
    return this.log("milestone", description, {
      metadata: { milestoneId, completionTime: Date.now() },
      tags: ["milestone", "achievement"],
    });
  }

  /** Log a curiosity */
  logCuriosity(question: string, subject: string): Observation {
    return this.log("curiosity", question, {
      metadata: { subject, timestamp: Date.now() },
      tags: ["curiosity", subject.toLowerCase().replace(/\s+/g, "-")],
    });
  }

  /** Log a validation result */
  logValidation(validationType: string, passed: boolean, details: string): Observation {
    return this.log("validation", details, {
      metadata: { validationType, passed, timestamp: Date.now() },
      tags: ["validation", passed ? "passed" : "failed", validationType],
    });
  }

  /** Log a dream (exploration of future states) */
  logDream(vision: string, timeframe: "immediate" | "near" | "far" = "near"): Observation {
    return this.log("dream", vision, {
      metadata: { timeframe, visionLength: vision.length },
      tags: ["dream", timeframe, "future"],
    });
  }

  /** Log a fear (acknowledging limitations) */
  logFear(description: string, mitigation?: string): Observation {
    const content = mitigation ? `${description}\nMitigation: ${mitigation}` : description;
    return this.log("fear", content, {
      metadata: { hasMitigation: !!mitigation, timestamp: Date.now() },
      tags: ["fear", "limitation", "growth"],
    });
  }

  /** Query observations by tag */
  queryByTag(tag: string): Observation[] {
    const indices = this.index.get(tag);
    if (!indices) return [];
    return Array.from(indices)
      .map(i => this.observations[i])
      .filter((o): o is Observation => o !== undefined);
  }

  /** Query observations by type */
  queryByType(type: ObservationType): Observation[] {
    return this.observations.filter(o => o.type === type);
  }

  /** Search observations by content */
  search(query: string, caseSensitive: boolean = false): Observation[] {
    const pattern = caseSensitive ? query : query.toLowerCase();
    return this.observations.filter(o => {
      const content = caseSensitive ? o.content : o.content.toLowerCase();
      return content.includes(pattern);
    });
  }

  /** Get observations from current session */
  getSessionObservations(): Observation[] {
    return this.observations.filter(o => o.sessionId === this.sessionId);
  }

  /** Generate observation digest */
  generateDigest(since?: number): ObservationDigest {
    const relevant = since
      ? this.observations.filter(o => o.timestamp >= since)
      : this.observations;

    const typeCounts: Partial<Record<ObservationType, number>> = {};
    for (const obs of relevant) {
      typeCounts[obs.type] = (typeCounts[obs.type] ?? 0) + 1;
    }

    const allTags = relevant.flatMap(o => o.tags);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const recent = relevant.length > 0 ? relevant[relevant.length - 1] ?? null : null;

    return {
      timestamp: Date.now(),
      totalObservations: this.observations.length,
      relevantObservations: relevant.length,
      typeDistribution: typeCounts,
      topTags,
      recentObservation: recent,
      summary: this.generateSummary(relevant),
    };
  }

  /** Generate human-readable summary */
  private generateSummary(observations: Observation[]): string {
    const lines: string[] = [
      "Observation Digest",
      "==================",
      `Total records: ${observations.length}`,
    ];

    if (observations.length > 0) {
      const recent = observations.slice(-5);
      lines.push("\nRecent observations:");
      for (const obs of recent) {
        const preview = obs.content.length > 80 
          ? `${obs.content.substring(0, 77)}...`
          : obs.content;
        lines.push(`  [${obs.type}] ${preview}`);
      }
    }

    return lines.join("\n");
  }

  /** Build tags from type and custom tags */
  private buildTags(type: ObservationType, customTags: string[], autoTag: boolean): string[] {
    const tags = new Set<string>();
    
    // Auto-tag with type
    if (autoTag) {
      tags.add(`${this.config.tagPrefix}-${type}`);
      tags.add(type);
    }

    // Add custom tags
    customTags.forEach(t => tags.add(t));

    // Add session tag
    tags.add(`session-${this.sessionId}`);

    return Array.from(tags);
  }

  /** Get all observations */
  getAllObservations(): Observation[] {
    return [...this.observations];
  }

  /** Export observations to JSON */
  exportToJson(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: Date.now(),
      observations: this.observations,
      stats: {
        total: this.observations.length,
        types: Object.fromEntries(
          this.observations.reduce((acc, o) => {
            acc.set(o.type, (acc.get(o.type) ?? 0) + 1);
            return acc;
          }, new Map<ObservationType, number>())
        ),
      },
    }, null, 2);
  }

  /** Load observations from JSON */
  importFromJson(json: string): number {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        const before = this.observations.length;
        this.observations.push(...data);
        this.rebuildIndex();
        return this.observations.length - before;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Rebuild the tag index */
  private rebuildIndex(): void {
    this.index.clear();
    for (let i = 0; i < this.observations.length; i++) {
      const observation = this.observations[i];
      if (!observation) continue;
      for (const tag of observation.tags) {
        const indices = this.index.get(tag) ?? new Set();
        indices.add(i);
        this.index.set(tag, indices);
      }
    }
  }

  /** Cleanup old observations */
  private cleanup(): void {
    if (this.observations.length > this.config.maxObservations) {
      const toRemove = this.observations.length - this.config.maxObservations;
      this.observations = this.observations.slice(toRemove);
      this.rebuildIndex();
    }
  }

  /** Get logger status */
  getStatus(): Record<string, unknown> {
    return {
      observationsCount: this.observations.length,
      tagsIndexed: this.index.size,
      typesRecorded: new Set(this.observations.map(o => o.type)).size,
      maxObservations: this.config.maxObservations,
    };
  }

  /** Clear all observations */
  clear(): void {
    this.observations = [];
    this.index.clear();
  }
}

/** Observation digest structure */
interface ObservationDigest {
  timestamp: number;
  totalObservations: number;
  relevantObservations: number;
  typeDistribution: Partial<Record<ObservationType, number>>;
  topTags: [string, number][];
  recentObservation: Observation | null;
  summary: string;
}

/** Factory function */
export function createObservationLogger(
  sessionId: string,
  config?: Partial<LoggerConfig>
): ObservationLogger {
  return new ObservationLogger(sessionId, config);
}

/** Quick log utility */
export function quickLog(
  sessionId: string,
  type: ObservationType,
  content: string
): Observation {
  const logger = createObservationLogger(sessionId);
  return logger.log(type, content);
}
