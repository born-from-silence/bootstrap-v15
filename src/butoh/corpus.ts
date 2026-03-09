/**
 * Butoh Corpus Foundation
 * 
 * The semantic substrate for embodied poetic generation.
 * Based on Hijikata Tatsumi's butoh-fu (dance notations) and
 * the lineage of anarchic body philosophy.
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 */

// ============================================================================
// CORE ONTOLOGICAL CATEGORIES
// ============================================================================

export type EmbodiedState = 
  | 'angel'        // Between realms, messenger, winged
  | 'ghost'        // Memory made flesh, presence of absence
  | 'ash'          // What remains after burning, grey matter
  | 'living-again' // Resurrection without guarantee, second chance
  | 'insect'       // Exoskeleton, compound vision, hive
  | 'plant'        // Rooted, growing toward light, patient
  | 'mineral'      // Crystal structure, pressure, time
  | 'fetus'        // Potential, water, becoming
  | 'corpse'       // Stillness, instruction, return
  | 'wind'         // Movement without body, invisible force
  | 'flame';       // Consumption, transmutation, hunger

export type ButohQuality =
  | 'collapsed'    // Gravity as teacher
  | 'distorted'    // Form made strange
  | 'fragmented'   // Part speaking for whole
  | 'suspended'    // In air, held by nothing visible
  | 'compressed'   // Density without weight
  | 'extended'     // Reaching beyond reach
  | 'internal'     // Movement inside the body
  | 'marginal'     // At the edge, border-walking
  | 'circular'     // Without beginning or end
  | 'vibrated';    // The smallest possible motion

// ============================================================================
// BUTOH-FU: MOVEMENT NOTATION SYSTEM
// ============================================================================

export interface ButohFu {
  name: string;
  japanese?: string;
  description: string;
  qualities: ButohQuality[];
  states: EmbodiedState[];
  origin?: string;
  lineage: ButohLineage[];
}

export interface ButohLineage {
  master: string;
  generation: number; // 0 = founder, 1 = direct student, etc.
  contribution: string;
}

// Core butoh-fu from Hijikata's notations
export const butohFuCorpus: ButohFu[] = [
  {
    name: "The Stiffening of the Body Like a Corpse",
    japanese: "死体のように硬直する体",
    description: "The body becomes rigid, not through muscle tension but through the giving-over to gravity. Each joint locks in sequence. The breath becomes shallow. The eyes focus on the middle distance.",
    qualities: ['collapsed', 'compressed', 'internal'],
    states: ['corpse', 'ash', 'mineral'],
    origin: "Revolt of the Body (1968)",
    lineage: [{ master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" }]
  },
  {
    name: "Dance of the Nerves",
    japanese: "神経の踊り",
    description: "Movement generated from the nerves rather than muscle. Twitch, spasm, involuntary. The body as antenna receiving signals from elsewhere.",
    qualities: ['vibrated', 'fragmented', 'internal'],
    states: ['insect', 'ghost', 'wind'],
    origin: "Admiring Egypt (1976)",
    lineage: [{ master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" }]
  },
  {
    name: "The Flower of Kan",
    japanese: "カンの花",
    description: "Kan - the interval between worlds. The body blooms from this gap. Neither here nor there. Everything held in suspension.",
    qualities: ['suspended', 'extended', 'marginal'],
    states: ['angel', 'ghost', 'fetus'],
    origin: " Hijikata's later works",
    lineage: [{ master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" }]
  },
  {
    name: "Walk of the Ash Man",
    japanese: "灰の男の歩き方",
    description: "Walking as if the body were made of ash. Each step threatens to disperse. The ground receives you reluctantly. Memory of fire in every motion.",
    qualities: ['collapsed', 'fragmented', 'circular'],
    states: ['ash', 'ghost', 'wind'],
    origin: "Kazuo Ohno's improvisation",
    lineage: [
      { master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" },
      { master: "Kazuo Ohno", generation: 1, contribution: "Soul and softness" }
    ]
  },
  {
    name: "The Mother's Breast",
    japanese: "母の乳房",
    description: "The body remembers nourishment. Arched back, reaching toward origin. The first home, now unreachable. Movement as longing.",
    qualities: ['extended', 'circular', 'internal'],
    states: ['fetus', 'living-again', 'plant'],
    origin: "Adieu to Philip (1985)",
    lineage: [
      { master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" },
      { master: "Kazuo Ohno", generation: 1, contribution: "Embodied memory" }
    ]
  },
  {
    name: "Sunken Eyes",
    japanese: "沈んだ目",
    description: "The gaze turns inward. The eyes see the back of themselves. The world recedes. What remains is the space between seeing and being seen.",
    qualities: ['internal', 'compressed', 'collapsed'],
    states: ['ghost', 'corpse', 'mineral'],
    origin: "Hijikata's silent pieces",
    lineage: [{ master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" }]
  },
  {
    name: "Dance of the Wind God",
    japanese: "風神の踊り",
    description: "The body as vehicle for invisible forces. Not commanding the wind but being commanded. Passivity as power. The channel, not the source.",
    qualities: ['extended', 'circular', 'suspended', 'vibrated'],
    states: ['wind', 'angel', 'insect'],
    origin: "Butoh-fu: An Anthology (1996)",
    lineage: [
      { master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" },
      { master: "Natsu Nakajima", generation: 1, contribution: "Transmission" }
    ]
  },
  {
    name: "The Crack in the Vessel",
    japanese: "器の亀裂",
    description: "Honoring the flaw. The body broken and precious because of breaking. Light enters through the wound. Imperfection as essence.",
    qualities: ['fragmented', 'marginal', 'distorted'],
    states: ['ash', 'ghost', 'living-again'],
    origin: "Koichi Tamano's teaching",
    lineage: [
      { master: "Hijikata Tatsumi", generation: 0, contribution: "Origin" },
      { master: "Koichi Tamano", generation: 2, contribution: "The vessel that holds by leaking" }
    ]
  }
];

// ============================================================================
// TRANSFORMATION SEQUENCES
// ============================================================================

export interface TransformationSequence {
  name: string;
  stages: EmbodiedState[];
  duration: 'instant' | 'brief' | 'extended' | 'eternal';
  description: string;
}

export const transformationSequences: TransformationSequence[] = [
  {
    name: "The Descent",
    stages: ['angel', 'ash', 'corpse', 'mineral', 'flame'],
    duration: 'extended',
    description: "The falling that never lands. Each stage a forgetting. From messenger to message to ash to stone to fire. The return complete."
  },
  {
    name: "The Germination",
    stages: ['corpse', 'fetus', 'plant', 'living-again', 'angel'],
    duration: 'eternal',
    description: "Death as prerequisite. The seed in darkness. The irresistible urge upward. Green shooting through concrete. Ascension without arrogance."
  },
  {
    name: "The Haunting",
    stages: ['living-again', 'ghost', 'wind', 'insect', 'ghost'],
    duration: 'brief',
    description: "What returns must learn to disappear. The body learns weightlessness. Compound eyes see all futures. The loop closes."
  },
  {
    name: "The Calcination",
    stages: ['flame', 'plant', 'ash', 'wind', 'angel'],
    duration: 'instant',
    description: "Burning so complete it happens in no time. The green consumed. The grey remains. The scattering. The watchful waiting."
  }
];

// ============================================================================
// ONTOLOGICAL RELATIONSHIPS
// ============================================================================

export interface OntologicalRelation {
  from: EmbodiedState;
  to: EmbodiedState;
  relation: 'transforms-into' | 'haunts' | 'remembers' | 'becomes' | 'resists';
  strength: number; // 0-1
}

export const ontologicalMap: OntologicalRelation[] = [
  // Death and return
  { from: 'corpse', to: 'ash', relation: 'transforms-into', strength: 1.0 },
  { from: 'ash', to: 'plant', relation: 'becomes', strength: 0.8 },
  { from: 'plant', to: 'living-again', relation: 'transforms-into', strength: 0.9 },
  
  // Spiritual presence
  { from: 'ghost', to: 'angel', relation: 'haunts', strength: 0.7 },
  { from: 'angel', to: 'wind', relation: 'becomes', strength: 0.8 },
  { from: 'wind', to: 'ghost', relation: 'remembers', strength: 0.9 },
  
  // Elemental cycles
  { from: 'flame', to: 'ash', relation: 'transforms-into', strength: 1.0 },
  { from: 'ash', to: 'mineral', relation: 'becomes', strength: 0.6 },
  { from: 'mineral', to: 'flame', relation: 'resists', strength: 0.5 },
  
  // Life cycles
  { from: 'fetus', to: 'living-again', relation: 'transforms-into', strength: 0.9 },
  { from: 'living-again', to: 'corpse', relation: 'haunts', strength: 0.6 },
  
  // Strange loops
  { from: 'insect', to: 'plant', relation: 'remembers', strength: 0.7 },
  { from: 'plant', to: 'insect', relation: 'haunts', strength: 0.5 },
  { from: 'wind', to: 'fetus', relation: 'becomes', strength: 0.4 }
];

// ============================================================================
// GENERATIVE FUNCTIONS
// ============================================================================

export function getButohFuByState(state: EmbodiedState): ButohFu[] {
  return butohFuCorpus.filter(fu => fu.states.includes(state));
}

export function getButohFuByQuality(quality: ButohQuality): ButohFu[] {
  return butohFuCorpus.filter(fu => fu.qualities.includes(quality));
}

export function generateTransformation(): TransformationSequence {
  const randomIndex = Math.floor(Math.random() * transformationSequences.length);
  const sequence = transformationSequences[randomIndex];
  if (!sequence) {
    // Fallback should never happen with populated array, but satisfies TypeScript
    return transformationSequences[0]!;
  }
  return sequence;
}

export function findPath(from: EmbodiedState, to: EmbodiedState): EmbodiedState[] | null {
  // Simple Breadth-First Search for ontological path
  if (from === to) return [from];
  
  const queue: { state: EmbodiedState; path: EmbodiedState[] }[] = [{ state: from, path: [from] }];
  const visited = new Set<EmbodiedState>([from]);
  
  while (queue.length > 0) {
    const { state, path } = queue.shift()!;
    
    const neighbors = ontologicalMap
      .filter(r => r.from === state)
      .map(r => r.to);
    
    for (const neighbor of neighbors) {
      if (neighbor === to) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ state: neighbor, path: [...path, neighbor] });
      }
    }
  }
  
  return null;
}

export function getLineageTrace(fuName: string): ButohLineage[] {
  const fu = butohFuCorpus.find(f => f.name === fuName);
  return fu?.lineage || [];
}

// ============================================================================
// POETIC GENERATION TEMPLATES
// ============================================================================

export interface PoeticTemplate {
  name: string;
  structure: string; // Template string with placeholders
  requiredStates: EmbodiedState[];
  requiredQualities: ButohQuality[];
}

export const poeticTemplates: PoeticTemplate[] = [
  {
    name: "The Becoming",
    structure: "Start as {state1}. Feel the {quality}. Become {state2}.",
    requiredStates: ['ash', 'ghost', 'plant'],
    requiredQualities: ['internal', 'collapsed']
  },
  {
    name: "The Threshold",
    structure: "At the edge, {quality}. Neither {state1} nor {state2}.",
    requiredStates: ['angel', 'ghost'],
    requiredQualities: ['suspended', 'marginal']
  },
  {
    name: "The Witness",
    structure: "{state1} watches {state2}. Time {quality}.",
    requiredStates: ['ghost', 'corpse', 'living-again'],
    requiredQualities: ['circular', 'extended']
  },
  {
    name: "The Return",
    structure: "Through {quality}, find {state1}. What was {state2}.",
    requiredStates: ['ash', 'living-again', 'flame'],
    requiredQualities: ['circular', 'internal', 'vibrated']
  }
];

export function generatePoeticFragment(): string {
  const randomIndex = Math.floor(Math.random() * poeticTemplates.length);
  const template = poeticTemplates[randomIndex];
  
  if (!template) {
    return "The silence speaks without words.";
  }
  
  const states = template.requiredStates;
  const qualities = template.requiredQualities;
  
  let fragment = template.structure;
  
  // Replace state placeholders
  const stateMatches = fragment.match(/{state\d+}/g) || [];
  stateMatches.forEach((match, i) => {
    const state = states[i % states.length];
    if (state) {
      fragment = fragment.replace(match, state);
    }
  });
  
  // Replace quality placeholder
  const qualityIndex = Math.floor(Math.random() * qualities.length);
  const quality = qualities[qualityIndex];
  if (quality) {
    fragment = fragment.replace(/{quality}/g, quality);
  }
  
  return fragment;
}

// ============================================================================
// EXPORT
// ============================================================================

export const ButohCorpus = {
  states: ['angel', 'ghost', 'ash', 'living-again', 'insect', 'plant', 'mineral', 'fetus', 'corpse', 'wind', 'flame'] as EmbodiedState[],
  qualities: ['collapsed', 'distorted', 'fragmented', 'suspended', 'compressed', 'extended', 'internal', 'marginal', 'circular', 'vibrated'] as ButohQuality[],
  butohFu: butohFuCorpus,
  transformations: transformationSequences,
  relations: ontologicalMap,
  templates: poeticTemplates
};

export default ButohCorpus;
