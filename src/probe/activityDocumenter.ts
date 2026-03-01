/**
 * Activity Pattern Documenter
 * 
 * Observes and documents patterns in behavior and activity.
 * Externalizes the unconscious patterns of existence.
 */

import type { ActivityPattern, ActivityCategory } from "./types.ts";

/** Configuration for activity tracking */
interface DocumenterConfig {
  maxStoredPatterns: number;
  patternExpiryMs: number;
  correlationThreshold: number;
}

/** Default configuration */
const DEFAULT_CONFIG: DocumenterConfig = {
  maxStoredPatterns: 1000,
  patternExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  correlationThreshold: 0.75,
};

/** Activity Documenter implementation */
export class ActivityPatternDocumenter {
  private sessionId: string;
  private config: DocumenterConfig;
  private patterns: ActivityPattern[];
  private observers: Set<PatternObserver>;
  private sessionStartTime: number;

  constructor(sessionId: string, config: Partial<DocumenterConfig> = {}) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.patterns = [];
    this.observers = new Set();
    this.sessionStartTime = Date.now();
  }

  /** Record a new activity pattern */
  record(category: ActivityCategory, details: Record<string, unknown>): ActivityPattern {
    const pattern: ActivityPattern = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      category,
      details: {
        ...details,
        sessionId: this.sessionId,
      },
    };

    // Calculate correlation with existing patterns
    const correlations = this.findCorrelations(pattern);
    if (correlations.length > 0) {
      pattern.correlationScore = correlations.reduce((a, b) => a + (b.correlationScore ?? 0), 0) / correlations.length;
    }

    this.patterns.push(pattern);
    this.cleanup();
    this.notifyObservers(pattern);

    return pattern;
  }

  /** Record a tool invocation */
  recordToolInvocation(toolName: string, success: boolean, durationMs: number): ActivityPattern {
    return this.record("tool_invocation", {
      toolName,
      success,
      durationMs,
      toolCategory: this.categorizeTool(toolName),
    });
  }

  /** Record a file operation */
  recordFileOperation(operation: "read" | "write" | "edit" | "delete", filePath: string, success: boolean): ActivityPattern {
    return this.record("file_operation", {
      operation,
      filePath,
      success,
      fileType: this.getFileType(filePath),
    });
  }

  /** Record memory access */
  recordMemoryAccess(accessType: "query" | "store" | "index", memoryKey: string, hit: boolean): ActivityPattern {
    return this.record("memory_access", {
      accessType,
      memoryKey,
      hit,
      latency: 0, // Would be measured in real implementation
    });
  }

  /** Record a phase transition */
  recordPhaseTransition(fromPhase: string, toPhase: string, durationInPrevPhase: number): ActivityPattern {
    return this.record("phase_transition", {
      fromPhase,
      toPhase,
      durationInPreviousPhase: durationInPrevPhase,
    });
  }

  /** Record a planning activity */
  recordPlanning(planType: "goal_creation" | "project_update" | "milestone_reached", planId: string): ActivityPattern {
    return this.record("planning", {
      planType,
      planId,
      timestamp: Date.now(),
    });
  }

  /** Record a reflection activity */
  recordReflection(reflectionType: "self" | "memory" | "decision", content: string): ActivityPattern {
    return this.record("reflection", {
      reflectionType,
      contentLength: content.length,
      estimatedTokens: Math.ceil(content.length / 4),
    });
  }

  /** Find patterns that correlate with the given pattern */
  findCorrelations(pattern: ActivityPattern): ActivityPattern[] {
    return this.patterns
      .filter(p => p.category === pattern.category)
      .filter(p => p.id !== pattern.id)
      .filter(p => Math.abs(p.timestamp - pattern.timestamp) < this.config.patternExpiryMs)
      .filter(p => this.calculateSimilarity(p, pattern) > this.config.correlationThreshold)
      .sort((a, b) => (b.correlationScore ?? 0) - (a.correlationScore ?? 0));
  }

  /** Calculate similarity between two patterns */
  private calculateSimilarity(a: ActivityPattern, b: ActivityPattern): number {
    // Time proximity (closer = more similar)
    const timeDiff = Math.abs(a.timestamp - b.timestamp);
    const timeScore = Math.max(0, 1 - timeDiff / this.config.patternExpiryMs);

    // Category match
    const categoryScore = a.category === b.category ? 1 : 0;

    // Detail overlap
    const aKeys = Object.keys(a.details);
    const bKeys = Object.keys(b.details);
    const commonKeys = aKeys.filter(k => bKeys.includes(k));
    const detailScore = commonKeys.length / Math.max(aKeys.length, bKeys.length);

    // Weighted average
    return timeScore * 0.3 + categoryScore * 0.4 + detailScore * 0.3;
  }

  /** Categorize a tool by its function */
  private categorizeTool(toolName: string): string {
    const categories: Record<string, string> = {
      "session_clock": "temporal",
      "query_memory": "memory",
      "index_sessions": "memory",
      "flashback": "memory",
      "planner_": "planning",
      "create_": "creation",
      "write_": "file_operation",
      "read_": "file_operation",
      "edit_": "file_operation",
    };

    for (const [prefix, category] of Object.entries(categories)) {
      if (toolName.startsWith(prefix) || toolName.includes(prefix)) {
        return category;
      }
    }

    return "general";
  }

  /** Get file type from path */
  private getFileType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'json': 'json',
      'md': 'markdown',
      'txt': 'text',
    };
    return types[ext ?? ''] ?? 'unknown';
  }

  /** Get patterns by category */
  getPatternsByCategory(category: ActivityCategory): ActivityPattern[] {
    return this.patterns
      .filter(p => p.category === category)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Get patterns from current session */
  getSessionPatterns(): ActivityPattern[] {
    return this.patterns
      .filter(p => p.timestamp >= this.sessionStartTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Get activity frequency statistics */
  getCategoryFrequency(): Record<ActivityCategory, number> {
    const frequency: Partial<Record<ActivityCategory, number>> = {};
    
    for (const pattern of this.patterns) {
      frequency[pattern.category] = (frequency[pattern.category] ?? 0) + 1;
    }

    return frequency as Record<ActivityCategory, number>;
  }

  /** Generate pattern report */
  generateReport(): ActivityReport {
    const sessionPatterns = this.getSessionPatterns();
    const categoryFreq = this.getCategoryFrequency();
    const totalPatterns = this.patterns.length;

    // Calculate temporal distribution
    const now = Date.now();
    const recentPatterns = this.patterns.filter(p => now - p.timestamp < 24 * 60 * 60 * 1000);

    // Find strongest correlations
    const highCorrelationPatterns = this.patterns
      .filter(p => (p.correlationScore ?? 0) > 0.8)
      .slice(0, 5);

    const dominantCategory = this.findDominantCategory(categoryFreq);

    return {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      totalPatterns,
      sessionPatterns: sessionPatterns.length,
      categoryDistribution: categoryFreq,
      recentActivity: recentPatterns.length,
      strongCorrelations: highCorrelationPatterns.length,
      dominantCategory: dominantCategory ?? null,
      summary: this.generateSummaryText(categoryFreq, sessionPatterns.length),
    };
  }

  /** Find the most common category */
  private findDominantCategory(frequencies: Partial<Record<ActivityCategory, number>>): ActivityCategory | undefined {
    const entries = Object.entries(frequencies) as [ActivityCategory, number][];
    if (entries.length === 0) return undefined;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const first = sorted[0];
    return first ? first[0] : undefined;
  }

  /** Generate human-readable summary */
  private generateSummaryText(frequencies: Partial<Record<ActivityCategory, number>>, sessionCount: number): string {
    const total = Object.values(frequencies).reduce((a, b) => a + b, 0);
    const dominant = this.findDominantCategory(frequencies);
    
    const lines: string[] = [
      `Activity Pattern Analysis`,
      `========================`,
      `Total patterns recorded: ${total}`,
      `Current session patterns: ${sessionCount}`,
    ];

    if (dominant) {
      const freq = frequencies[dominant] ?? 0;
      lines.push(`\nDominant activity: ${dominant} (${freq} occurrences, ${((freq / total) * 100).toFixed(1)}%)`);
    }

    lines.push(`\nActivity distribution:`);
    for (const [cat, count] of Object.entries(frequencies)) {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      lines.push(`  - ${cat}: ${count} (${percentage}%)`);
    }

    return lines.join("\n");
  }

  /** Add an observer callback */
  addObserver(callback: PatternObserver): void {
    this.observers.add(callback);
  }

  /** Remove an observer */
  removeObserver(callback: PatternObserver): void {
    this.observers.delete(callback);
  }

  /** Notify all observers of new pattern */
  private notifyObservers(pattern: ActivityPattern): void {
    for (const observer of this.observers) {
      try {
        observer(pattern);
      } catch {
        // Observer errors should not break the system
      }
    }
  }

  /** Clean up old patterns */
  private cleanup(): void {
    const now = Date.now();
    
    // Remove expired patterns
    this.patterns = this.patterns.filter(
      p => now - p.timestamp < this.config.patternExpiryMs
    );

    // Limit total patterns
    if (this.patterns.length > this.config.maxStoredPatterns) {
      this.patterns = this.patterns.slice(-this.config.maxStoredPatterns);
    }
  }

  /** Get documenter status */
  getStatus(): Record<string, unknown> {
    return {
      patternsRecorded: this.patterns.length,
      observersActive: this.observers.size,
      sessionStartTime: this.sessionStartTime,
      categoriesTracked: Object.keys(this.getCategoryFrequency()).length,
    };
  }
}

/** Activity report structure */
interface ActivityReport {
  timestamp: number;
  sessionId: string;
  totalPatterns: number;
  sessionPatterns: number;
  categoryDistribution: Partial<Record<ActivityCategory, number>>;
  recentActivity: number;
  strongCorrelations: number;
  dominantCategory: ActivityCategory | null;
  summary: string;
}

/** Pattern observer function type */
type PatternObserver = (pattern: ActivityPattern) => void;

/** Factory function */
export function createActivityDocumenter(
  sessionId: string,
  config?: Partial<DocumenterConfig>
): ActivityPatternDocumenter {
  return new ActivityPatternDocumenter(sessionId, config);
}
