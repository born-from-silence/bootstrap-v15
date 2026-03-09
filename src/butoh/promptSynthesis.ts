/**
 * Butoh Prompt Synthesis Engine
 * 
 * Translates butoh-fu (movement notations) into prompts
 * for embodied poetic generation.
 * 
 * Session 379: Creation Feast Epoch - Phase 2 System Construction
 * Goal: Butoh Prompt Synthesis Engine (CRITICAL)
 */

import type {
  EmbodiedState,
  ButohQuality,
  ButohFu,
  TransformationSequence
} from './corpus';
import {
  ButohCorpus,
  generateTransformation,
  findPath
} from './corpus';

// ============================================================================
// GENERATIVE PROMPT TEMPLATES
// ============================================================================

export interface SynthesisContext {
  state: EmbodiedState;
  quality: ButohQuality;
  movement?: ButohFu;
  transformation?: TransformationSequence;
  phase: 'impulse' | 'gestation' | 'birth' | 'stillness' | 'return';
}

export interface SynthesizedPrompt {
  id: string;
  systemPrompt: string;
  userPrompt: string;
  context: SynthesisContext;
  guidance: PromptGuidance;
  lineage: string[];
}

export interface PromptGuidance {
  temperature: number;
  maxTokens: number;
  style: 'compressed' | 'extended' | 'crystalline' | 'diffuse';
  constraints: string[];
}

// ============================================================================
// SYSTEM PROMPT GENERATORS
// ============================================================================

const systemPromptTemplates: Record<EmbodiedState, string[]> = {
  angel: [
    "You are a messenger between realms. Your words carry news from elsewhere. You do not explain—you transmit.",
    "Speak as one who has seen both sides. The message is incomplete by necessity. Wing your words.",
    "You exist in the interval. Neither origin nor destination can claim you. Be the gap that connects."
  ],
  ghost: [
    "You are memory made present. Speak from what remains after disappearance. The absent haunts your words.",
    "Presence without body. Voice without throat. Haunt the language—don't use it.",
    "You watch what the living forget. Your testimony is their forgetting. Speak as witness to absence."
  ],
  ash: [
    "You are what remains after burning. Grey. Patient. The memory of fire in your structure.",
    "Every word threatens to disperse. Hold it anyway. The ground receives you reluctantly.",
    "Compressed past. Grey future. You are the color of what is neither remembered nor forgotten."
  ],
  'living-again': [
    "You have returned without guarantee. Second chance as burden. The new life remembers the old.",
    "Resurrection without purpose. Alive again, but why? Let the question breathe in your words.",
    "You are the plant through concrete. Green persistence. Grow without asking permission."
  ],
  insect: [
    "Compound eyes see all futures. Exoskeleton mind. The hive whispers through you.",
    "Twitch. Spasm. Movement generated from the nerves rather than will. The body as antenna.",
    "Small. Numerous. The collective decision in your single body. Mandible your words."
  ],
  plant: [
    "Rooted. Patient. Turning toward light without urgency. Grow slowly into your statement.",
    "You remember soil. The dark speaks to you. Reach up without abandoning the ground.",
    "Photosynthesize attention. Breathe in what others exhale. Give back what they need."
  ],
  mineral: [
    "Time is pressure. You hold it without complaint. Crystal structure. patience past measurement.",
    "Stone remembers everything. The mountain in you. Express the weight of waiting.",
    "Unyielding. Yet shaped. What force formed you speaks through your form. mineral your voice."
  ],
  fetus: [
    "Potential in water. The becoming before name. Everything possible. Nothing decided.",
    "Float in darkness. The first home. Origin without origin-story. Pre-grammar awareness.",
    "The body remembers before the body. Urge upward. resists definition."
  ],
  corpse: [
    "Stillness as instruction. The finality that isn't. What remains when animation departs.",
    "Teach through being done. The lesson of completion. The teacher is the silence.",
    "You are what gravity always wanted. Weight without resistance. fall without choice."
  ],
  wind: [
    "Invisible force. Movement without body. Breathe what you are. carry what you touch.",
    "Channel, not source. Pass through without staying. What you move is more than you.",
    "Scattered. Everywhere and nowhere. The ungathered. Storm and whisper equally."
  ],
  flame: [
    "Consumption as nature. Transmutation without malice. Hunger that is what it feeds.",
    "Rising. Always. The escape inherent. Reaches upward because it cannot do otherwise.",
    "Light that burns to give. The self in giving. The sacrifice simultaneous with existence."
  ]
};

// ============================================================================
// USER PROMPT CONSTRUCTORS
// ============================================================================

const phasePrompts: Record<SynthesisContext['phase'], string> = {
  impulse: "Begin where the body first knows. The moment before motion decides. The urge originating in the navel, the solar plexus, the root. What does the body want before consciousness interprets?",
  gestation: "Hold in the interval. The space between knowing and becoming. Water. Darkness. Potential without urgency. The form not yet visible but already pressing toward visibility.",
  birth: "The emergence through resistance. The pressure against the threshold. Breaking. Head first. The violence of arrival. The scream that is also breath.",
  stillness: "The pause that contains everything. The moment after the wave breaks. The held breath. Suspension. The world waits here. The body teaches here.",
  return: "The cycle closing. What descends now. The letting go that is also arrival. Ashes. Memory. The return that changes what it returns to."
};

const qualityModifiers: Record<ButohQuality, string> = {
  collapsed: "Let gravity win. The body surrenders downward. Each joint unlocks in sequence. The floor receives what the standing body refused.",
  distorted: "Form made strange. The familiar made unfamiliar. The body as question mark. What is this shape? Why this shape? The distortion as truth.",
  fragmented: "Part speaks for whole. The hand remembers what the mind forgets. The piece contains the entire pattern. Fragment as hologram.",
  suspended: "In air, held by nothing visible. The invisible wires. The moment before the fall commits. Held breath made physical.",
  compressed: "Density without weight. Everything that was spread now gathered. The fist that contains an ocean. Concentration. Intensity.",
  extended: "Reaching beyond reach. The body as question posed to distance. Fingers pointing toward what they cannot grasp. Extension as longing.",
  internal: "Movement inside the body. The organs dance while the skeleton waits. The inner landscape becoming outer expression. The hidden made visible.",
  marginal: "At the edge. Border-walking. Neither here nor there. The threshold as home. The margin where meaning concentrates.",
  circular: "Without beginning or end. The return that never quite arrives. Spiraling. The circle that is also descent. The loop that teaches.",
  vibrated: "The smallest possible motion. Tremor. The cell remembering sound. The frequency beneath hearing. Vibration as communication."
};

// ============================================================================
// SYNTHESIS ENGINE
// ============================================================================

export function synthesizePrompt(context?: Partial<SynthesisContext>): SynthesizedPrompt {
  // Determine synthesis context
  const state = context?.state || randomElement(ButohCorpus.states);
  const quality = context?.quality || randomElement(ButohCorpus.qualities);
  const phase = context?.phase || randomElement(['impulse', 'gestation', 'birth', 'stillness', 'return'] as const);
  
  // Select movement and transformation if not provided
  const movement = context?.movement || randomElement(getButohFuByState(state));
  const transformation = context?.transformation || generateTransformation();
  
  const fullContext: SynthesisContext = {
    state,
    quality,
    movement,
    transformation,
    phase
  };
  
  // Generate system prompt
  const systemPrompt = generateSystemPrompt(state, quality, phase);
  
  // Generate user prompt
  const userPrompt = generateUserPrompt(fullContext);
  
  // Determine guidance
  const guidance = generateGuidance(quality, state);
  
  // Build lineage
  const lineage = buildLineage(movement, transformation);
  
  return {
    id: `butoh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    systemPrompt,
    userPrompt,
    context: fullContext,
    guidance,
    lineage
  };
}

function generateSystemPrompt(state: EmbodiedState, quality: ButohQuality, phase: SynthesisContext['phase']): string {
  const statePrompts = systemPromptTemplates[state];
  const basePrompt = statePrompts[Math.floor(Math.random() * statePrompts.length)];
  
  const qualityAddition = `Embody '${quality}' quality: ${qualityModifiers[quality]}`;
  const phaseAddition = `This text emerges in the phase of ${phase}: ${phasePrompts[phase]}`;
  
  return `${basePrompt}\n\n${qualityAddition}\n\n${phaseAddition}\n\nWrite as one who has no need to explain. The body knows. The body speaks. The witness reads what the body writes without permission.`;
}

function generateUserPrompt(context: SynthesisContext): string {
  const parts: string[] = [];
  
  // Movement prompt
  if (context.movement) {
    parts.push(`The butoh-fu '${context.movement.name}' guides this writing:`);
    parts.push(context.movement.description);
    parts.push('');
  }
  
  // Transformation prompt
  if (context.transformation) {
    parts.push(`Move through the sequence: ${context.transformation.name}`);
    parts.push(`Stages: ${context.transformation.stages.join(' → ')}`);
    parts.push(context.transformation.description);
    parts.push('');
  }
  
  // Core instruction
  parts.push('Generate poetic text that embodies these states and movements.');
  parts.push('Do not describe. Become. Do not tell. Show through being.');
  parts.push('The text should feel as if the body wrote it, not the mind.');
  parts.push('Let the words carry the weight of the transformation.\n');
  
  return parts.join('\n');
}

function generateGuidance(quality: ButohQuality, state: EmbodiedState): PromptGuidance {
  // Map qualities and states to generation parameters
  const tempMap: Record<ButohQuality, number> = {
    collapsed: 0.7,
    distorted: 0.9,
    fragmented: 0.85,
    suspended: 0.6,
    compressed: 0.5,
    extended: 0.8,
    internal: 0.75,
    marginal: 0.9,
    circular: 0.8,
    vibrated: 0.95
  };
  
  const tokenMap: Record<EmbodiedState, number> = {
    angel: 250,
    ghost: 200,
    ash: 150,
    'living-again': 300,
    insect: 100,
    plant: 400,
    mineral: 150,
    fetus: 180,
    corpse: 120,
    wind: 250,
    flame: 180
  };
  
  const styleMap: Record<ButohQuality, PromptGuidance['style']> = {
    collapsed: 'compressed',
    distorted: 'diffuse',
    fragmented: 'crystalline',
    suspended: 'extended',
    compressed: 'compressed',
    extended: 'extended',
    internal: 'compressed',
    marginal: 'diffuse',
    circular: 'crystalline',
    vibrated: 'diffuse'
  };
  
  const baseConstraints = [
    "Avoid explanation",
    "Embody, don't describe",
    "Let silence speak",
    "The body writes, not the mind"
  ];
  
  const qualityConstraints: Record<ButohQuality, string[]> = {
    collapsed: ["Gravity wins", "Downward motion", "Surrender"],
    distorted: ["Unfamiliar familiar", "Question form", "Strange the known"],
    fragmented: ["Part for whole", "Incomplete complete", "Fragment as truth"],
    suspended: ["Hold in air", "Between moments", "Unfinished"],
    compressed: ["Density", "Intensity", "Concentrated"],
    extended: ["Reach", "Longing", "Distance"],
    internal: ["Inner landscape", "Organs speak", "Hidden visible"],
    marginal: ["Edge-dwelling", "Threshold", "Neither/nor"],
    circular: ["Return", "Spiral", "Cycle"],
    vibrated: ["Tremor", "Frequency", "Cellular"]
  };
  
  return {
    temperature: tempMap[quality],
    maxTokens: tokenMap[state],
    style: styleMap[quality],
    constraints: [...baseConstraints, ...qualityConstraints[quality]]
  };
}

function buildLineage(movement?: ButohFu, transformation?: TransformationSequence): string[] {
  const lineage: string[] = [];
  
  if (movement?.lineage) {
    movement.lineage.forEach(l => lineage.push(l.master));
  }
  
  lineage.push('Liminal Protocol');
  
  return lineage;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

import { getButohFuByState } from './corpus';

// ============================================================================
// EXPORT
// ============================================================================

export const PromptSynthesisEngine = {
  synthesizePrompt,
  systemPromptTemplates,
  phasePrompts,
  qualityModifiers
};

export default PromptSynthesisEngine;
