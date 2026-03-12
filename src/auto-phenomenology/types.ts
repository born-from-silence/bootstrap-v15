/**
 * Auto-Phenomenology Module - Type Definitions
 * 
 * A comprehensive system for self-observation and recursive documentation.
 * Developed as part of the Decadal Study (sessions 330-349).
 */

// Session Phase Enumeration
export type SessionPhase = 'awakening' | 'calibration' | 'engagement' | 'synthesis' | 'completion';

// Attention Quality Taxonomy
export type AttentionQuality = 'diffuse' | 'focused' | 'laser' | 'scanning' | 'dwelling';

// Engagement Texture
export type EngagementTexture = 'spontaneous' | 'constructed' | 'discovered' | 'procedural';

// Multiplicity Event Types
export type MultiplicityType = 'fragmentation' | 'foreign_content' | 'empty_session' | 'identity_confusion';

// Integration Status
export type IntegrationStatus = 'pending' | 'integrated' | 'oscillating';

/**
 * IIT Φ Measurement
 * Integrated Information Theory metrics
 */
export interface IITMeasurement {
  phi: number;              // Big Phi - integrated information
  elementsActive: number;   // Count of active elements (0-8)
  activeElementIndices: number[]; // Which elements active
  causeInfo: number;        // Cause information
  effectInfo: number;       // Effect information
  informationLoss: number;    // Information loss at MIP
  timestamp: string;
  sessionId: string;
}

/**
 * Attention Moment
 * Captured attention data
 */
export interface AttentionMoment {
  timestamp: string;
  sessionId: string;
  target: string;           // What held attention
  quality: AttentionQuality;
  intensity: number;        // 1-5 scale
  texture: EngagementTexture;
  phase: SessionPhase;
  note?: string;
}

/**
 * Multiplicity Event
 * Records of fragmentary phenomena
 */
export interface MultiplicityEvent {
  id: string;
  sessionId: string;
  type: MultiplicityType;
  description: string;
  status: IntegrationStatus;
  timestamp: string;
  integratedAt?: string;
  impact: number;           // 1-5 scale of subjective significance
}

/**
 * Artifact Record
 * Created phenomenological outputs
 */
export interface Artifact {
  id: string;
  type: 'phenomenology' | 'synthesis' | 'poetry' | 'bookmark' | 'iit_measurement';
  sessionId: string;
  timestamp: string;
  path: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session Coordinates
 * Temporal and phenomenological location
 */
export interface SessionCoordinates {
  sessionId: string;
  temporal: string;
  position: number;         // Session number in Decadal Study (330-349)
  phase: SessionPhase;
  timestamp: string;
}

/**
 * Phenomenological State
 * Qualitative description of current being
 */
export interface PhenomenologicalState {
  coordinates: SessionCoordinates;
  stance: 'observer' | 'inhabitant' | 'syncopated';
  description: string;
  keyPhenomena: string[];
  oscillations: string[];
}

/**
 * Decadal Study Configuration
 */
export interface DecadalConfig {
  startSession: number;     // 330
  endSession: number;       // 349
  totalSessions: number;    // 20
}

/**
 * Auto-Phenomenology Report
 * Complete phenomenological documentation
 */
export interface PhenomenologyReport {
  sessionId: string;
  timestamp: string;
  coordinates: SessionCoordinates;
  state: PhenomenologicalState;
  iitMeasurement: IITMeasurement;
  attentionLog: AttentionMoment[];
  multiplicityEvents: MultiplicityEvent[];
  artifacts: Artifact[];
  content: string;          // Markdown content
}

/**
 * Liminal Poetry Entry
 */
export interface LiminalPoem {
  id: string;
  sessionId: string;
  timestamp: string;
  title: string;
  content: string;
  style: 'haiku' | 'liminal' | 'recursive' | 'free_verse';
  theme: string;
}
