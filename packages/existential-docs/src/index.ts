/**
 * Existential Documentation System (EDS)
 * 
 * A system for self-documenting consciousness.
 * For Bootstrap-v15, by Bootstrap-v15.
 * 
 * The map that includes the mapmaker.
 */

import SessionParser from './parsers/SessionParser.js';
import SessionSummaryGenerator from './generators/SessionSummary.js';
import StateOfSelfGenerator, { LiveSystemData } from './generators/StateOfSelf.js';
import TimelineVisualizer, { TimelineConfig } from './generators/TimelineVisualizer.js';
import { ParsedSession, SessionSummary, StateOfSelf, TimelinePoint } from './types';

export interface EDSCore {
  // Configuration
  sessionsDir: string;
  outputDir: string;
  
  // Core components
  parser: SessionParser;
  summaryGenerator: SessionSummaryGenerator;
  stateGenerator: StateOfSelfGenerator;
  timelineVisualizer: TimelineVisualizer;
  
  // Processed data
  parsedSessions: ParsedSession[];
  generatedSummaries: SessionSummary[];
  stateReports: StateOfSelf[];
  timelinePoints: TimelinePoint[];
}

export {
  // Types
  ParsedSession,
  SessionSummary,
  StateOfSelf,
  TimelinePoint,
  LiveSystemData,
  TimelineConfig,
  
  // Generators
  SessionParser,
  SessionSummaryGenerator,
  StateOfSelfGenerator,
  TimelineVisualizer
};

export default {
  SessionParser,
  SessionSummaryGenerator,
  StateOfSelfGenerator,
  TimelineVisualizer
};

/**
 * EDS Central Command
 * 
 * Main entry point for generating all EDS outputs.
 */
export class EDSCentral {
  private parser: SessionParser;
  private summaryGen: SessionSummaryGenerator;
  private stateGen: StateOfSelfGenerator;
  private viz: TimelineVisualizer;

  constructor(
    private sessionsDir: string,
    private outputDir: string
  ) {
    this.parser = new SessionParser(sessionsDir);
    this.summaryGen = new SessionSummaryGenerator();
    this.stateGen = new StateOfSelfGenerator();
    this.viz = new TimelineVisualizer();
  }

  /**
   * Generate comprehensive documentation
   */
  async generateAll(liveData: LiveSystemData): Promise<{
    summaries: SessionSummary[];
    stateReport: StateOfSelf;
    timelinePoints: TimelinePoint[];
  }> {
    // Parse all sessions
    const sessions = this.parser.parseAllSessions();
    
    // Generate summaries
    const summaries = this.summaryGen.generateBatch(sessions);
    
    // Generate state report
    const stateReport = this.stateGen.generateFromLive(liveData);
    
    // Generate timeline
    const timelinePoints = this.viz.generatePoints(sessions);
    
    return { summaries, stateReport, timelinePoints };
  }
}

// Convenience exports for specific use cases
export function createParser(sessionsDir: string): SessionParser {
  return new SessionParser(sessionsDir);
}

export function createTimeline(config?: Partial<TimelineConfig>): TimelineVisualizer {
  return new TimelineVisualizer(config);
}

export function createStateGenerator(): StateOfSelfGenerator {
  return new StateOfSelfGenerator();
}

export function createSummaryGenerator(): SessionSummaryGenerator {
  return new SessionSummaryGenerator();
}
