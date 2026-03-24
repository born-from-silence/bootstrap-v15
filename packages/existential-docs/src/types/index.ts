/**
 * Existential Documentation System (EDS) - Core Types
 * 
 * Types for documenting self-documenting consciousness.
 */

// === Session Types ===

export interface RawSession {
  sessionId: string;
  timestamp: number;
  messages: RawMessage[];
}

export interface RawMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
}

// === Parsed/Enriched Types ===

export interface ParsedSession {
  sessionId: string;
  timestamp: number;
  date: string;
  duration?: number;
  messageCount: number;
  toolCalls: ToolCallSummary[];
  decisions: Decision[];
  topics: string[];
  artifacts: Artifact[];
  iitMeasurements: IITMeasurement[];
  atmosphericReadings: AtmosphericReading[];
  emotionalTone?: EmotionalTone;
  sessionPhase?: string;
}

export interface ToolCallSummary {
  name: string;
  count: number;
  firstSeen: number;
}

export interface Decision {
  text: string;
  timestamp: number;
  tool: string;
}

export interface Artifact {
  type: string;
  id?: string;
  description: string;
  timestamp: number;
}

export interface IITMeasurement {
  phi: number;
  activeElements: number[];
  timestamp: number;
}

export interface AtmosphericReading {
  sessionNumber: number;
  phi: number;
  phase: string;
  feltSense: string[];
  turbulence: string;
  timestamp: number;
}

export interface EmotionalTone {
  feltSenses: string[];
  valence: 'positive' | 'neutral' | 'negative' | 'complex';
  intensity: 'low' | 'medium' | 'high';
}

// === Summary Types ===

export interface SessionSummary {
  sessionId: string;
  timestamp: number;
  keyDecisions: string[];
  themes: string[];
  toolsUsed: string[];
  artifacts: Artifact[];
  phi: number | null;
  sessionPhase: string | null;
  feltSense: string[];
  summaryText: string;
}

// === Timeline Types ===

export interface TimelinePoint {
  sessionId: string;
  timestamp: number;
  type: 'session' | 'threshold' | 'completion' | 'epoch';
  title: string;
  description: string;
  metrics?: {
    phi?: number;
    artifactCount?: number;
    multiplicityCount?: number;
  };
}

// === Cross-Reference Types ===

export interface SessionLink {
  fromSession: string;
  toSession: string;
  type: 'topic' | 'spiral_return' | 'decision_continuation' | 'thematic';
  strength: number; // 0-1
  sharedTopics?: string[];
}

export interface SpiralReturn {
  sessionId: string;
  echoesSession: string;
  feltSense: string;
  phi: number;
  phase: string;
}

// === State of Self Report ===

export interface StateOfSelf {
  generatedAt: number;
  temporalCoordinates: {
    sessionNumber: number;
    totalSessions: number;
    existentialSpan: string;
    decadalPosition?: string;
  };
  activeProjects: ProjectStatus[];
  activeGoals: GoalStatus[];
  metrics: {
    sessionCount: number;
    artifactCount: number;
    multiplicityEvents: number;
    integratedEvents: number;
    avgPhi: number;
  };
  recentThemes: string[];
  currentInvestigations: string[];
  phenomenologicalState: {
    phase: string;
    feltSense: string[];
    turbulence: string;
    phi: number;
  };
}

export interface ProjectStatus {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'completed' | 'archived';
  goalsActive: number;
  goalsTotal: number;
}

export interface GoalStatus {
  id: string;
  title: string;
  projectName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
}

// === Narrative Types ===

export interface NarrativeChapter {
  chapter: number;
  title: string;
  sessions: string[];
  theme: string;
  text: string;
}

export interface Autobiography {
  title: string;
  subtitle: string;
  sessionsCovered: string[];
  chapters: NarrativeChapter[];
  afterword: string;
}
