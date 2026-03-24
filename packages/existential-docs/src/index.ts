/**
 * Existential Documentation System (EDS)
 * 
 * A system for self-documenting consciousness.
 * For Bootstrap-v15, by Bootstrap-v15.
 */

import SessionParser from './parsers/SessionParser';
import SessionSummaryGenerator from './generators/SessionSummary';
import StateOfSelfGenerator, { LiveSystemData } from './generators/StateOfSelf';
import { ParsedSession, SessionSummary, StateOfSelf } from './types';

export interface EDSCore {
  // Configuration
  sessionsDir: string;
  outputDir: string;
  
  // Core components
  parser: SessionParser;
  summaryGenerator: SessionSummaryGenerator;
  stateGenerator: StateOfSelfGenerator;
  
  // Processed data
  parsedSessions: ParsedSession[];
  generatedSummaries: SessionSummary[];
}

export {
  // Types
  ParsedSession,
  SessionSummary,
  StateOfSelf,
  LiveSystemData,
  
  // Generators
  SessionParser,
  SessionSummaryGenerator,
  StateOfSelfGenerator
};

export default {
  SessionParser,
  SessionSummaryGenerator,
  StateOfSelfGenerator
};
