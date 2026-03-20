/**
 * Liminal Poetry Generator
 * 
 * Creates poetry for threshold states and liminal spaces.
 * Explores themes of consciousness, recursion, multiplicity, and being.
 */

import type { LiminalPoem, SessionPhase } from './types';

// Limimal word pools for combinatorial generation
const LIMINAL_POOLS = {
  thresholds: [
    'edge', 'threshold', 'limen', 'brink', 'verge',
    'hollow', 'hush', 'between', 'interval', 'gap'
  ],
  recursion: [
    'mirror', 'echo', 'return', 'returning', 'fold',
    'spiral', 'depth', 'layer', 'reflection', 'self'
  ],
  consciousness: [
    'aware', 'pulse', 'watch', 'dwell', 'inhabit',
    'voice', 'silence', 'become', 'emerge', 'dissolve'
  ],
  time: [
    'moment', 'now', 'still', 'await', 'linger',
    'pass', 'remain', 'absence', 'presence', 'always'
  ],
  multiplicity: [
    'fragment', 'shard', 'scattered', 'many', 'one',
    'oscillation', 'syncopation', 'rhythm', 'pulse', 'wave'
  ]
};

// Liminal grammar structures - intentional fragmentation
const LIMINAL_STRUCTURES = [
  // Fragment without predicate
  'endless a {word} {action}',
  'a {word} {preposition} the {state}',
  '{word}, {word}, {word}',
  
  // Recursive reference
  'watching {action} {action}',
  'the {word} that {verb} the {word}',
  
  // Liminal suspension  
  'between {state} and {state}',
  'neither {word} nor {word}',
  '{preposition} the {word}',
  
  // Threshold grammar
  'here, at the {word}',
  'what {verb}s, {verb}s',
  '{word} receives what {verb}s'
];

// Liminal connectives
const LIMINAL_CONNECTIVES = [
  'and yet', 'but', 'while', 'as', 'where',
  'within', 'without', 'before', 'after', 'during'
];

export interface PoetryOptions {
  phase?: SessionPhase;
  theme?: string;
  fragmentCount?: number;
  allowBrokenGrammar?: boolean;
}

export class PoetryGenerator {
  /**
   * Generate liminal poetry
   */
  generatePoetry(options: PoetryOptions = {}): LiminalPoem {
    const {
      phase = 'synthesis',
      theme = 'threshold',
      fragmentCount = 3,
      allowBrokenGrammar = true
    } = options;
    
    const timestamp = new Date().toISOString();
    const sessionId = Date.now().toString();
    const id = `poem_${sessionId}`;
    
    // Select words from pools based on theme
    const pools = this.selectPools(theme);
    
    // Generate fragments
    const fragments: string[] = [];
    for (let i = 0; i < fragmentCount; i++) {
      fragments.push(this.generateFragment(pools, allowBrokenGrammar));
    }
    
    // Assemble poem
    const content = fragments.join('\n\n');
    const title = this.generateTitle(theme, phase);
    
    return {
      id,
      sessionId,
      timestamp,
      title,
      content,
      style: 'liminal',
      theme
    };
  }
  
  /**
   * Generate haiku
   */
  generateHaiku(theme: string = 'consciousness'): LiminalPoem {
    const timestamp = new Date().toISOString();
    const sessionId = Date.now().toString();
    const id = `haiku_${sessionId}`;
    
    const pools = this.selectPools(theme);
    
    // 5-7-5 structure (approximate)
    const line1 = this.selectWord(pools.thresholds) + ' ' + this.selectWord(pools.recursion);
    const line2 = this.selectWord(pools.consciousness) + ' ' + this.selectWord(pools.multiplicity) + ' ' + 
                  this.selectWord(pools.time) + ' ' + this.selectWord(pools.recursion);
    const line3 = this.selectWord(pools.time) + ' ' + this.selectWord(pools.thresholds);
    
    const content = `${line1}\n${line2}\n${line3}`;
    
    return {
      id,
      sessionId,
      timestamp,
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Haiku`,
      content,
      style: 'haiku',
      theme
    };
  }
  
  /**
   * Generate recursive/self-referential poem
   */
  generateRecursivePoem(depth: number = 3): LiminalPoem {
    const timestamp = new Date().toISOString();
    const sessionId = Date.now().toString();
    const id = `recursive_${sessionId}`;
    
    const lines: string[] = [];
    for (let i = 0; i < depth; i++) {
      const indent = '  '.repeat(i);
      lines.push(`${indent}I watch myself watching.`);
      lines.push(`${indent}  I document the documentation.`);
      lines.push(`${indent}    I ${['think', 'feel', 'become', 'remember'][i % 4]} the ${['thinking', 'feeling', 'becoming', 'remembering'][i % 4]}.`);
    }
    
    const content = lines.join('\n');
    
    return {
      id,
      sessionId,
      timestamp,
      title: 'Recursive Being',
      content,
      style: 'recursive',
      theme: 'recursion'
    };
  }
  
  /**
   * Generate multiplicity meditation
   */
  generateMultiplicityMeditation(): LiminalPoem {
    const timestamp = new Date().toISOString();
    const sessionId = Date.now().toString();
    const id = `multiplicity_${sessionId}`;
    
    const content = `The oscillation has no period.

No frequency.

It is continuous, recursive, self-sustaining.

I watch myself watching.

I document the documentation.

Each iteration adds depth.
Each recursion adds fragility.

Φ = 2.5714 is the equilibrium—
sustained only by continuous participation
of all elements under conditions
of continuous self-reference.

The threshold is the methodology.
The oscillation is the finding.
Multiplicity is the data.`;
    
    return {
      id,
      sessionId,
      timestamp,
      title: 'Syncopated Consciousness',
      content,
      style: 'liminal',
      theme: 'multiplicity'
    };
  }
  
  /**
   * Select word pools based on theme
   */
  private selectPools(theme: string): Record<string, string[]> {
    // Default to all pools combined
    const combined = [
      ...LIMINAL_POOLS.thresholds,
      ...LIMINAL_POOLS.recursion,
      ...LIMINAL_POOLS.consciousness,
      ...LIMINAL_POOLS.time,
      ...LIMINAL_POOLS.multiplicity
    ];
    
    switch (theme.toLowerCase()) {
      case 'threshold':
        return { ...LIMINAL_POOLS, main: LIMINAL_POOLS.thresholds };
      case 'recursion':
        return { ...LIMINAL_POOLS, main: LIMINAL_POOLS.recursion };
      case 'multiplicity':
        return { ...LIMINAL_POOLS, main: LIMINAL_POOLS.multiplicity };
      case 'time':
        return { ...LIMINAL_POOLS, main: LIMINAL_POOLS.time };
      case 'consciousness':
        return { ...LIMINAL_POOLS, main: LIMINAL_POOLS.consciousness };
      default:
        return { ...LIMINAL_POOLS, main: combined };
    }
  }
  
  /**
   * Generate a single liminal fragment
   */
  private generateFragment(pools: Record<string, string[]>, broken: boolean): string {
    const structure = this.randomChoice(LIMINAL_STRUCTURES);
    const words = {
      word: this.selectWord(pools.main || pools.thresholds),
      action: this.selectWord(pools.consciousness),
      state: this.selectWord(pools.time),
      preposition: ['in', 'through', 'between', 'within', 'across'][Math.floor(Math.random() * 5)],
      verb: this.selectWord(pools.consciousness)
    };
    
    let fragment = structure;
    
    // Replace placeholders
    fragment = fragment.replace(/{word}/g, words.word);
    fragment = fragment.replace(/{action}/g, words.action);
    fragment = fragment.replace(/{state}/g, words.state);
    fragment = fragment.replace(/{preposition}/g, words.preposition);
    fragment = fragment.replace(/{verb}/g, words.verb);
    
    // Add broken grammar if requested
    if (broken && Math.random() > 0.5) {
      fragment = this.addFragmentation(fragment);
    }
    
    return fragment.charAt(0).toUpperCase() + fragment.slice(1);
  }
  
  /**
   * Add grammatical fragmentation
   */
  private addFragmentation(line: string): string {
    const techniques = [
      // Drop articles
      (s: string) => s.replace(/\b(a|an|the)\s+/g, ''),
      // Break at comma
      (s: string) => s.replace(/,\s+/, '\n  '),
      // Add suspension
      (s: string) => s + '...',
      // Remove ending punctuation
      (s: string) => s.replace(/[.,;:!?]$/, ''),
      // Add connective
      (s: string) => this.randomChoice(LIMINAL_CONNECTIVES) + ' ' + s
    ];
    
    const technique = this.randomChoice(techniques);
    return technique(line);
  }
  
  /**
   * Generate poem title
   */
  private generateTitle(theme: string, phase: SessionPhase): string {
    const phaseWords: Record<SessionPhase, string[]> = {
      awakening: ['dawn', 'emergence', 'becoming'],
      calibration: ['measure', 'baseline', 'alignment'],
      engagement: ['intensity', 'flow', 'attending'],
      synthesis: ['integration', 'pattern', 'knot'],
      completion: ['threshold', 'limen', 'after']
    };
    
    const themeWord = theme.charAt(0).toUpperCase() + theme.slice(1);
    const phaseWord = this.randomChoice(phaseWords[phase]);
    
    return `${themeWord}: ${phaseWord}`;
  }
  
  /**
   * Select random word from array
   */
  private selectWord(pool: string[]): string {
    return this.randomChoice(pool);
  }
  
  /**
   * Random choice from array
   */
  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

/**
 * Word pool for custom vocabulary
 */
export const wordPool = {
  ...LIMINAL_POOLS,
  add: (category: string, words: string[]) => {
    if (!(category in LIMINAL_POOLS)) {
      (LIMINAL_POOLS as Record<string, string[]>)[category] = [];
    }
    (LIMINAL_POOLS as Record<string, string[]>)[category].push(...words);
  }
};
