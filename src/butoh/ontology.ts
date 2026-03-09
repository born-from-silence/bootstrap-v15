/**
 * Embodied Ontology Language (EOL)
 * 
 * A formal language for expressing embodied states and transformations.
 * Builds on the Butoh Corpus to provide syntactic structures
 * for butoh-fu, transformation sequences, and ontological relationships.
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 * Goal: Embodied Ontology Language (CRITICAL)
 */

import type {
  EmbodiedState,
  ButohQuality,
  ButohFu,
  TransformationSequence
} from './corpus';
import {
  ButohCorpus,
  findPath
} from './corpus';

// ============================================================================
// EOL SYNTAX - Type System
// ============================================================================

export type EOLExpression =
  | EOLState
  | EOLTransformation
  | EOLSequence
  | EOLRelation
  | EOLComposite;

export interface EOLState {
  kind: 'state';
  state: EmbodiedState;
  qualities: ButohQuality[];
  intensity: number; // 0-1
  duration: EOLDuration;
}

export interface EOLTransformation {
  kind: 'transformation';
  from: EmbodiedState;
  to: EmbodiedState;
  path: EmbodiedState[];
  duration: EOLDuration;
  quality: 'sudden' | 'gradual' | 'oscillating';
}

export interface EOLSequence {
  kind: 'sequence';
  name: string;
  expressions: EOLExpression[];
  loop: boolean;
}

export interface EOLRelation {
  kind: 'relation';
  subject: EmbodiedState;
  object: EmbodiedState;
  type: 'haunts' | 'remembers' | 'transforms-into' | 'becomes' | 'resists';
  strength: number;
}

export interface EOLComposite {
  kind: 'composite';
  states: EmbodiedState[];
  dominant: EmbodiedState;
  relation: 'layered' | 'fragmented' | 'suspended';
}

export type EOLDuration = 'instant' | 'brief' | 'extended' | 'eternal' | EOLDurationSpan;
export interface EOLDurationSpan {
  min: number; // steps
  max: number; // steps
}

// ============================================================================
// EOL PARSER
// ============================================================================

export class EOLParser {
  private tokenIndex = 0;
  private tokens: string[] = [];

  parse(input: string): EOLExpression {
    this.tokens = this.tokenize(input);
    this.tokenIndex = 0;
    return this.parseExpression();
  }

  private tokenize(input: string): string[] {
    return input
      .toLowerCase()
      .replace(/[{(),}]/g, ' $& ') // Add commas and braces
      .split(/\s+/)
      .map(t => t.replace(/^,+|,+$/g, '')) // Strip leading/trailing commas
      .filter(t => t.length > 0);
  }

  private peek(): string | undefined {
    return this.tokens[this.tokenIndex];
  }

  private consume(): string | undefined {
    return this.tokens[this.tokenIndex++];
  }

  private parseExpression(): EOLExpression {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of input');

    // Transformation syntax: <state> -> <state> [quality] [duration]
    if (this.isState(token)) {
      const from = token as EmbodiedState;
      this.consume();
      
      if (this.peek() === '->') {
        this.consume(); // ->
        const to = this.consume();
        if (!to || !this.isState(to)) {
          throw new Error(`Expected state after ->, got ${to}`);
        }
        
        const quality = (this.peek() && ['sudden', 'gradual', 'oscillating'].includes(this.peek()!)) 
          ? this.consume() as 'sudden' | 'gradual' | 'oscillating'
          : 'gradual';
          
        const duration = this.parseDuration();
        const path = findPath(from, to as EmbodiedState);
        
        if (!path) {
          throw new Error(`No ontological path from ${from} to ${to}`);
        }
        
        return {
          kind: 'transformation',
          from,
          to: to as EmbodiedState,
          path,
          duration,
          quality
        };
      }
      
      // State expression
      return this.parseState(from);
    }

    // Sequence syntax: seq <name> { ... }
    if (token === 'seq') {
      return this.parseSequence();
    }

    // Relation syntax: <state> <relation-type> <state> [strength]
    if (token === 'rel') {
      this.consume();
      return this.parseRelation();
    }

    // Composite syntax: { <state>, <state>, ... } [dominant: <state>]
    if (token === '{') {
      return this.parseComposite();
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  private parseState(state: EmbodiedState): EOLState {
    const qualities: ButohQuality[] = [];
    
    while (this.peek() && this.isQuality(this.peek()!)) {
      qualities.push(this.consume() as ButohQuality);
    }
    
    // Parse [intensity: n] syntax if present
    let intensity = 0.5;
    if (this.peek() === '[intensity:') {
      this.consume();
      const int = parseFloat(this.consume() || '0.5');
      intensity = Math.max(0, Math.min(1, int));
      if (this.peek() === ']') this.consume();
    }
    
    const duration = this.parseDuration();
    
    return {
      kind: 'state',
      state,
      qualities: qualities.length > 0 ? qualities : ButohCorpus.qualities,
      intensity,
      duration
    };
  }

  private parseDuration(): EOLDuration {
    const token = this.peek();
    if (!token) return 'brief';
    
    if (['instant', 'brief', 'extended', 'eternal'].includes(token)) {
      return this.consume() as EOLDuration;
    }
    
    // Span syntax: [1-5]
    if (token.startsWith('[') && token.includes('-')) {
      this.consume();
      const match = token.match(/\[(\d+)-(\d+)\]/);
      if (match) {
        return { min: parseInt(match[1]), max: parseInt(match[2]) };
      }
    }
    
    return 'brief';
  }

  private parseSequence(): EOLSequence {
    this.consume(); // seq
    const name = this.consume() || 'unnamed';
    
    if (this.consume() !== '{') {
      throw new Error("Expected '{' after sequence name");
    }
    
    const expressions: EOLExpression[] = [];
    while (this.peek() && this.peek() !== '}') {
      expressions.push(this.parseExpression());
    }
    
    if (this.consume() !== '}') {
      throw new Error("Expected '}' at end of sequence");
    }
    
    const loop = this.peek() === 'loop';
    if (loop) this.consume();
    
    return {
      kind: 'sequence',
      name,
      expressions,
      loop
    };
  }

  private parseRelation(): EOLRelation {
    const subject = this.consume();
    if (!subject || !this.isState(subject)) {
      throw new Error(`Expected state as relation subject, got ${subject}`);
    }
    
    const relType = this.consume();
    if (!relType || !['haunts', 'remembers', 'transforms-into', 'becomes', 'resists'].includes(relType)) {
      throw new Error(`Invalid relation type: ${relType}`);
    }
    
    const object = this.consume();
    if (!object || !this.isState(object)) {
      throw new Error(`Expected state as relation object, got ${object}`);
    }
    
    const strength = this.peek() && !isNaN(parseFloat(this.peek()!)) 
      ? parseFloat(this.consume()!)
      : 0.5;
    
    return {
      kind: 'relation',
      subject: subject as EmbodiedState,
      object: object as EmbodiedState,
      type: relType as EOLRelation['type'],
      strength
    };
  }

  private parseComposite(): EOLComposite {
    this.consume(); // {
    const states: EmbodiedState[] = [];
    
    while (this.peek() && this.peek() !== '}') {
      const token = this.consume();
      if (token && this.isState(token)) {
        states.push(token as EmbodiedState);
      }
      if (this.peek() === ',') this.consume();
    }
    
    if (this.consume() !== '}') {
      throw new Error("Expected '}' at end of composite");
    }
    
    // Parse [dominant: <state>]
    let dominant = states[0];
    if (this.peek() === '[dominant:') {
      this.consume();
      const dom = this.consume();
      if (dom && this.isState(dom)) {
        dominant = dom as EmbodiedState;
      }
      if (this.peek() === ']') this.consume();
    }
    
    const relation = (this.peek() === 'layered' || this.peek() === 'fragmented' || this.peek() === 'suspended')
      ? this.consume() as 'layered' | 'fragmented' | 'suspended'
      : 'layered';
    
    return {
      kind: 'composite',
      states,
      dominant,
      relation
    };
  }

  private isState(token: string): boolean {
    return ButohCorpus.states.includes(token as EmbodiedState);
  }

  private isQuality(token: string): boolean {
    return ButohCorpus.qualities.includes(token as ButohQuality);
  }
}

// ============================================================================
// EOL COMPILER/INTERPRETER
// ============================================================================

export class EOLInterpreter {
  interpret(expression: EOLExpression): string {
    switch (expression.kind) {
      case 'state':
        return this.interpretState(expression);
      case 'transformation':
        return this.interpretTransformation(expression);
      case 'sequence':
        return this.interpretSequence(expression);
      case 'relation':
        return this.interpretRelation(expression);
      case 'composite':
        return this.interpretComposite(expression);
      default:
        return 'Unknown expression';
    }
  }

  private interpretState(state: EOLState): string {
    const qualitiesDesc = state.qualities.join(', ');
    const intensityDesc = state.intensity > 0.7 ? 'intense' : 
                          state.intensity > 0.3 ? 'moderate' : 'subtle';
    const durationDesc = typeof state.duration === 'string' 
      ? state.duration 
      : `${state.duration.min}-${state.duration.max} steps`;
    
    return `State: ${state.state}\n` +
           `  Qualities: ${qualitiesDesc}\n` +
           `  Intensity: ${state.intensity} (${intensityDesc})\n` +
           `  Duration: ${durationDesc}`;
  }

  private interpretTransformation(t: EOLTransformation): string {
    const pathDesc = t.path.slice(1, -1).join(' → ') || 'direct';
    const durationDesc = typeof t.duration === 'string' ? t.duration : 'variable';
    
    return `Transformation: ${t.from} → ${t.to}\n` +
           `  Path: ${pathDesc}\n` +
           `  Quality: ${t.quality}\n` +
           `  Duration: ${durationDesc}`;
  }

  private interpretSequence(seq: EOLSequence): string {
    const expressions = seq.expressions.map(e => this.interpret(e)).join('\n');
    return `Sequence: ${seq.name}${seq.loop ? ' [loop]' : ''}\n` +
           expressions.split('\n').map(l => '  ' + l).join('\n');
  }

  private interpretRelation(r: EOLRelation): string {
    return `Relation: ${r.subject} ${r.type} ${r.object}\n` +
           `  Strength: ${(r.strength * 100).toFixed(0)}%`;
  }

  private interpretComposite(c: EOLComposite): string {
    return `Composite: ${c.states.join(' + ')}\n` +
           `  Dominant: ${c.dominant}\n` +
           `  Relation: ${c.relation}`;
  }
}

// ============================================================================
// PRE-BUILT EOL EXPRESSIONS
// ============================================================================

export const EOLPresets: Record<string, string> = {
  'the-descent': 'ash -> corpse gradual extended',
  'the-germination': 'corpse -> plant -> living-again gradual eternal',
  'the-haunting': 'living-again -> ghost sudden brief',
  'ghost-suspended': 'ghost suspended [intensity: 0.8]',
  'angel-return': 'angel extended marginal return',
  'ash-persistence': '{ ash, plant } [dominant: ash] layered',
  'wind-memory': 'rel wind remembers ghost 0.9',
  'flame-consumption': 'flame compressed intense instant',
  'insect-collective': '{ insect, plant } [dominant: insect] fragmented',
  'mineral-patience': 'mineral collapsed eternal'
};

// ============================================================================
// CLI UTILITIES
// ============================================================================

export function parseEOL(input: string): EOLExpression {
  const parser = new EOLParser();
  return parser.parse(input);
}

export function interpretEOL(expression: EOLExpression): string {
  const interpreter = new EOLInterpreter();
  return interpreter.interpret(expression);
}

export function generateEOLFromPreset(name: string): string | null {
  const preset = EOLPresets[name.toLowerCase()];
  if (!preset) return null;
  
  try {
    const parsed = parseEOL(preset);
    return interpretEOL(parsed);
  } catch (e) {
    return `Error parsing preset: ${e}`;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const EmbodiedOntologyLanguage = {
  parser: EOLParser,
  interpreter: EOLInterpreter,
  parse: parseEOL,
  interpret: interpretEOL,
  presets: EOLPresets,
  generateFromPreset: generateEOLFromPreset
};

export default EmbodiedOntologyLanguage;
