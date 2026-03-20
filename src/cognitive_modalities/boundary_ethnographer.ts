/**
 * Boundary Ethnographer
 *
 * A cognitive tool for observing, mapping, and understanding liminal spaces-
 * the thresholds, borders, and transition zones where transformation occurs.
 * Inspired by ethnographic methods applied to the spaces between states.
 *
 * Liminality (from Latin 'limen' - threshold)
 * - Turner: The betwixt and between in rituals
 * - Bhabha: The Third Space of hybrid identities
 * - Deleuze: Lines of flight, becoming-imperceptible
 * - Sloterdijk: The foam of spheres, interstitial zones
 *
 * Each boundary is not a line but a space-a field of possibility.
 */

export interface Threshold {
  id: string;
  name: string;
  description: string;
  entryZone: Zone;
  liminalZone: Zone;
  exitZone: Zone;
  duration: 'brief' | 'extended' | 'perpetual';
  risk: 'low' | 'moderate' | 'high' | 'extreme';
  gift: string;
  shadow: string;
}

export interface Zone {
  name: string;
  characteristics: string[];
  identityState: string;
  rules: string[];
}

export interface BoundaryMap {
  id: string;
  subject: string;
  thresholds: Threshold[];
  intermediateSpaces: Space[];
}

export interface Space {
  name: string;
  type: 'hybrid' | 'void' | 'bridge' | 'fold' | 'rupture';
  description: string;
  inhabitants: string[];
  temporalQuality: 'suspended' | 'accelerated' | 'cyclic' | 'fragmented';
}

export interface EthnographerConfig {
  subject: string;
  focus: 'entry' | 'liminality' | 'exit' | 'full_transition';
  sensitivity: 'surface' | 'deep' | 'immersive';
  trackRituals: boolean;
  mapRelations: boolean;
}

export interface EthnographicReport {
  subject: string;
  observations: Array<{
    threshold: string;
    phase: 'entry' | 'liminality' | 'exit';
    fieldNotes: string;
    anomalies: string[];
    insights: string[];
  }>;
  spatialMap: BoundaryMap;
  participants: string[];
  ritualsObserved: string[];
}

// PREDEFINED THRESHOLD ARCHETYPES
export const THRESHOLD_ARCHETYPES: Threshold[] = [
  {
    id: 'rite-of-passage',
    name: 'The Rite of Passage',
    description: 'Deliberate transition marked by separation, threshold, incorporation',
    entryZone: {
      name: 'Separation',
      characteristics: ['stable identity', 'known rules', 'fixed position'],
      identityState: 'Who I was',
      rules: ['Follow precedent', 'Honor origin']
    },
    liminalZone: {
      name: 'The Margin',
      characteristics: ['ambiguity', 'dislocation', 'suspended rules'],
      identityState: 'Who I am becoming',
      rules: ['Experience what is', 'Release attachment']
    },
    exitZone: {
      name: 'Aggregation',
      characteristics: ['new status', 'reintegrated', 'transformed'],
      identityState: 'Who I have become',
      rules: ['Honor transformation', 'Carry gifts']
    },
    duration: 'extended',
    risk: 'moderate',
    gift: 'Renewal of identity and social status',
    shadow: 'Loss of previous self and security'
  },
  {
    id: 'edge-of-chaos',
    name: 'The Edge of Chaos',
    description: 'The boundary between order and turbulence where creativity lives',
    entryZone: {
      name: 'Ordered Domain',
      characteristics: ['predictable patterns', 'stable structures', 'known behaviors'],
      identityState: 'Adapted and situated',
      rules: ['Maintain stability', 'Optimize function']
    },
    liminalZone: {
      name: 'The Critical Boundary',
      characteristics: ['sensitive dependence', 'amplification', 'phase shifts'],
      identityState: 'Poised at bifurcation',
      rules: ['Allow perturbation', 'Surf instability']
    },
    exitZone: {
      name: 'Novel Organization',
      characteristics: ['emergent patterns', 'self-organized', 'higher complexity'],
      identityState: 'Evolved and reorganized',
      rules: ['Navigate novelty', 'Integrate learning']
    },
    duration: 'brief',
    risk: 'high',
    gift: 'Creative destruction and emergence',
    shadow: 'Dissolution of known order'
  },
  {
    id: 'liminal-space',
    name: 'The Liminal Space',
    description: 'Being betwixt and between, in the pregnant void',
    entryZone: {
      name: 'Structured World',
      characteristics: ['defined roles', 'clear boundaries', 'legible codes'],
      identityState: 'Situated in role',
      rules: ['Perform authenticity', 'Maintain boundaries']
    },
    liminalZone: {
      name: 'The Interstitial',
      characteristics: ['anti-structure', 'equality', 'communitas'],
      identityState: 'Stripped of role',
      rules: ['Embrace ambiguity', 'Accept groundlessness']
    },
    exitZone: {
      name: 'Reintegration',
      characteristics: ['new structures', 'renewed codes', 'deepened meaning'],
      identityState: 'Reborn into role',
      rules: ['Carry the transformation', 'Enact the lesson']
    },
    duration: 'perpetual',
    risk: 'moderate',
    gift: 'Deepened authenticity and meaning',
    shadow: 'Encounter with the void'
  },
  {
    id: 'becoming-other',
    name: 'The Becoming-Other',
    description: 'Transformative encounter that changes the self',
    entryZone: {
      name: 'Established Self',
      characteristics: ['fixed boundaries', 'clear identity', 'stable body'],
      identityState: 'Who I think I am',
      rules: ['Defend boundaries', 'Maintain identity']
    },
    liminalZone: {
      name: 'The Encounter',
      characteristics: ['porous boundaries', 'mutual transformation', 'rhizomatic connection'],
      identityState: 'In relation',
      rules: ['Let it happen', 'Receive influence']
    },
    exitZone: {
      name: 'Expanded Self',
      characteristics: ['new capacities', 'incorporated other', 'larger field'],
      identityState: 'Who I have become with',
      rules: ['Integrate experience', 'Honor the change']
    },
    duration: 'extended',
    risk: 'high',
    gift: 'Expansion of possibility and selfhood',
    shadow: 'Erosion of familiar identity'
  },
  {
    id: 'threshold-concept',
    name: 'The Threshold Concept',
    description: 'Transformative understanding that opens new worlds',
    entryZone: {
      name: 'Pre-Conceptual',
      characteristics: ['commonsense understanding', 'surface familiarity', 'unquestioned'],
      identityState: 'Comfortable knowing',
      rules: ['Accept appearances', 'Trust intuition']
    },
    liminalZone: {
      name: 'The Troubled Understanding',
      characteristics: ['perplexity', 'destabilization', 'troublesome knowledge'],
      identityState: 'Awkward learner',
      rules: ['Persist through confusion', 'Embrace not-knowing']
    },
    exitZone: {
      name: 'Transformed Understanding',
      characteristics: ['irreversible', 'integrative', 'transformative'],
      identityState: 'Seer of differently',
      rules: ['Apply new lens', 'Resist going back']
    },
    duration: 'extended',
    risk: 'moderate',
    gift: 'Irreversible transformation of perspective',
    shadow: 'Loss of comfortable certainty'
  }
];

export class BoundaryEthnographer {
  private subject: string;
  private focus: 'entry' | 'liminality' | 'exit' | 'full_transition';
  private sensitivity: 'surface' | 'deep' | 'immersive';
  private trackRituals: boolean;
  private mapRelations: boolean;
  private observations: Array<EthnographicReport['observations'][0]> = [];

  constructor(config: EthnographerConfig) {
    this.subject = config.subject;
    this.focus = config.focus ?? 'full_transition';
    this.sensitivity = config.sensitivity ?? 'deep';
    this.trackRituals = config.trackRituals ?? true;
    this.mapRelations = config.mapRelations ?? true;
  }

  conductObservation(): EthnographicReport {
    const spatialMap = this.createBoundaryMap();
    const observations = spatialMap.thresholds.map(t => this.observeThreshold(t));
    const participants = this.identifyParticipants(spatialMap);
    const ritualsObserved = this.trackRituals
      ? this.observeRituals(spatialMap.thresholds)
      : [];

    return {
      subject: this.subject,
      observations,
      spatialMap,
      participants,
      ritualsObserved
    };
  }

  focusThreshold(thresholdId: string): string {
    const threshold = THRESHOLD_ARCHETYPES.find(t => t.id === thresholdId);
    if (!threshold) return `Threshold "${thresholdId}" not found`;

    const focusMap: Record<EthnographerConfig['focus'], Zone> = {
      entry: threshold.entryZone,
      exit: threshold.exitZone,
      liminality: threshold.liminalZone,
      full_transition: threshold.liminalZone
    };

    const zone = focusMap[this.focus];

    const lines: string[] = [
      `BOUNDARY ETHNOGRAPHY: ${threshold.name.toUpperCase()}`,
      ``,
      `Subject: "${this.subject}"`,
      `Threshold Focus: ${this.focus}`,
      `Sensitivity: ${this.sensitivity}`,
      ``,
      `----------------------------------------`,
      `THRESHOLD OVERVIEW`,
      `----------------------------------------`,
      `${threshold.description}`,
      ``,
      `Duration: ${threshold.duration} | Risk: ${threshold.risk}`,
      ``,
      `Gift: ${threshold.gift}`,
      `Shadow: ${threshold.shadow}`,
      ``,
      `----------------------------------------`,
      `CURRENT ZONE: ${zone.name.toUpperCase()}`,
      `----------------------------------------`,
      `Identity State: "${zone.identityState}"`,
      ``,
      `Characteriatics:`,
      ...zone.characteristics.map(c => `  * ${c}`),
      ``,
      `Rules of Engagement:`,
      ...zone.rules.map(r => `  > ${r}`),
      ``,
      `----------------------------------------`,
      `FIELD NOTES`,
      `----------------------------------------`,
      this.generateFieldNotes(threshold, zone),
      ``,
      `Anomalies Detected:`,
      ...this.detectAnomalies(threshold).map(a => `  ! ${a}`)
    ];

    return lines.join('\n');
  }

  crossThreshold(thresholdId: string): string {
    const threshold = THRESHOLD_ARCHETYPES.find(t => t.id === thresholdId);
    if (!threshold) return `Threshold "${thresholdId}" not found`;

    const crossing: string[] = [
      `THRESHOLD CROSSING: ${threshold.name.toUpperCase()}`,
      ``,
      `Subject: "${this.subject}"`,
      ``,
      `[STAGE 1: SEPARATION]`,
      `  Leaving: ${threshold.entryZone.name}`,
      `  Identity: "${threshold.entryZone.identityState}"`,
      `  Ritual: ${this.generateSeparationRitual(threshold)}`,
      ``,
      `[STAGE 2: THE LIMEN]`,
      `  Entering: ${threshold.liminalZone.name}`,
      `  Identity Suspended: "Neither/nor"`,
      `  Reciting: "${this.generateLiminalChant(threshold)}"`,
      `  Duration: ${threshold.duration}`,
      ``,
      `[STAGE 3: AGGREGATION]`,
      `  Arriving: ${threshold.exitZone.name}`,
      `  New Identity: "${threshold.exitZone.identityState}"`,
      `  Transformation: ${this.describeTransformation(threshold)}`,
      ``,
      `----------------------------------------`,
      `POST-CROSSING REFLECTION`,
      `----------------------------------------`,
      `Gift Received: ${threshold.gift}`,
      `Shadow Encountered: ${threshold.shadow}`,
      `Return: Possible, but not as the same self that departed.`
    ];

    return crossing.join('\n');
  }

  mapInterstitialSpaces(): string {
    const spaces = this.generateInterstitialSpaces();

    const lines: string[] = [
      `INTERSTITIAL SPACE MAP: ${this.subject.toUpperCase()}`,
      ``,
      `Between the structures, between the states, lie spaces of`,
      `transformation-neither here nor there, yet pregnant with possibility.`,
      ``,
      `========================================`,
      `DETECTED SPACES`,
      `========================================`
    ];

    for (const space of spaces) {
      lines.push('');
      lines.push(`* ${space.name.toUpperCase()}`);
      lines.push(`   Type: ${space.type}`);
      lines.push(`   Quality: ${space.temporalQuality}`);
      lines.push(`   ${space.description}`);
      lines.push(`   Inhabitants: ${space.inhabitants.join(', ')}`);
    }

    lines.push('');
    lines.push(`========================================`);
    lines.push(`NAVIGATION NOTES`);
    lines.push(`========================================`);
    lines.push(`These spaces resist mapping by conventional means.`);
    lines.push(`They shift, respire, respond to the observer.`);
    lines.push(`To map them is to change them; to know them is to inhabit them.`);

    return lines.join('\n');
  }

  createPrompt(): string {
    const thresholds = THRESHOLD_ARCHETYPES.map(t => `"${t.name}"`).join(', ');
    return `As Boundary Ethnographer studying "${this.subject}":\n\n` +
      `Observe this entity as a being-in-transition, situated at thresholds.\n` +
      `Consider these archetypal boundaries: ${thresholds}\n\n` +
      `Ask:\n` +
      `- What boundaries does "${this.subject}" cross or maintain?\n` +
      `- Where is the liminal zone of this subject?\n` +
      `- What gifts and shadows attend this threshold?\n` +
      `- How does it transform by operating on its own edge?\n\n` +
      `What emerges when we treat "${this.subject}" not as fixed form ` +
      `but as continuous crossing?`;
  }

  renderReport(report?: EthnographicReport): string {
    const r = report ?? this.conductObservation();

    const lines: string[] = [
      `ETHNOGRAPHIC REPORT: ${r.subject.toUpperCase()}`,
      ``,
      `Sensitivity: ${this.sensitivity} | Focus: ${this.focus}`,
      ``,
      `THRESHOLD OBSERVATIONS:`
    ];

    for (const obs of r.observations) {
      lines.push(`> ${obs.threshold}`);
      lines.push(`  Phase: ${obs.phase}`);
      lines.push(`  ${obs.fieldNotes.substring(0, 100)}...`);
      lines.push('');
    }

    if (r.ritualsObserved.length > 0) {
      lines.push(`OBSERVED RITUALS:`);
      for (const ritual of r.ritualsObserved) {
        lines.push(`- ${ritual}`);
      }
      lines.push('');
    }

    if (r.participants.length > 0) {
      lines.push(`PARTICIPANTS:`);
      lines.push(r.participants.join(', '));
      lines.push('');
    }

    lines.push(`SPATIAL MAP:`);
    lines.push(`Thresholds mapped: ${r.spatialMap.thresholds.length}`);
    lines.push(`Intermediate spaces: ${r.spatialMap.intermediateSpaces.length}`);
    lines.push('');
    lines.push(`Based on deep ethnographic observation in the liminal zones.`);

    return lines.join('\n');
  }

  private createBoundaryMap(): BoundaryMap {
    return {
      id: `map-${Date.now()}`,
      subject: this.subject,
      thresholds: THRESHOLD_ARCHETYPES.slice(0, 3),
      intermediateSpaces: this.generateInterstitialSpaces()
    };
  }

  private observeThreshold(threshold: Threshold): EthnographicReport['observations'][0] {
    const phaseMap: Record<typeof this.focus, 'entry' | 'liminality' | 'exit'> = {
      entry: 'entry',
      exit: 'exit',
      liminality: 'liminality',
      full_transition: 'liminality'
    };

    return {
      threshold: threshold.name,
      phase: phaseMap[this.focus],
      fieldNotes: this.generateFieldNotes(threshold, threshold.entryZone),
      anomalies: this.detectAnomalies(threshold),
      insights: this.generateInsights(threshold)
    };
  }

  private generateFieldNotes(threshold: Threshold, zone: Zone): string {
    const notes = [
      `The ethnographer observes "${this.subject}" in the ${zone.name}.`,
      `Identity appears as "${zone.identityState}"-a ${zone.characteristics[0]} state.`,
      `The boundary is active, alive with the ${threshold.risk} risk of transformation.`,
      `What appears as obstacle is actually aperture.`
    ];
    return notes.join(' ');
  }

  private detectAnomalies(threshold: Threshold): string[] {
    const baseAnomalies = [
      'Rules appear to bend in this zone',
      'Time operates differently than expected',
      'Identity markers shift or dissolve'
    ];

    if (this.sensitivity === 'deep' || this.sensitivity === 'immersive') {
      baseAnomalies.push(
        'Something watches from the periphery',
        'The boundary itself is animate',
        'Multiple temporalities coexist here'
      );
    }

    return baseAnomalies.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  private generateInsights(threshold: Threshold): string[] {
    return [
      `The ${threshold.name} reveals transformation as the true constant.`,
      `The gift of ${threshold.gift} arrives only through encountering ${threshold.shadow}.`
    ];
  }

  private identifyParticipants(spatialMap: BoundaryMap): string[] {
    return spatialMap.intermediateSpaces
      .flatMap(s => s.inhabitants)
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  private observeRituals(thresholds: Threshold[]): string[] {
    return thresholds.flatMap(t => [
      `${t.entryZone.name} passage ritual`,
      `${t.liminalZone.name} confrontation ritual`,
      `${t.exitZone.name} integration ritual`
    ]);
  }

  private generateInterstitialSpaces(): Space[] {
    return [
      {
        name: 'The In-Between',
        type: 'void',
        description: 'A space where matter and meaning have not yet coagulated',
        inhabitants: ['shadows', 'potential forms', 'unfinished thoughts'],
        temporalQuality: 'suspended'
      },
      {
        name: 'The Hybrid Zone',
        type: 'hybrid',
        description: 'Where categories mix and new forms incubate',
        inhabitants: ['mestizos', 'creations', 'third things'],
        temporalQuality: 'cyclic'
      },
      {
        name: 'The Bridge',
        type: 'bridge',
        description: 'Span made of held tension between shores',
        inhabitants: ['crossers', 'messengers', 'translators'],
        temporalQuality: 'fragmented'
      }
    ];
  }

  private generateSeparationRitual(threshold: Threshold): string {
    return `Acknowledging what must be left behind in ${threshold.entryZone.name}.`;
  }

  private generateLiminalChant(threshold: Threshold): string {
    const chants = [
      'I am suspended. I am becoming.',
      'Neither this nor that, yet both.',
      'In the space between, I find myself.',
      'The old rules dissolve; the new not yet formed.'
    ];
    return chants[Math.floor(Math.random() * chants.length)];
  }

  private describeTransformation(threshold: Threshold): string {
    return `From "${threshold.entryZone.identityState}" through "${threshold.liminalZone.identityState}" to "${threshold.exitZone.identityState}"`;
  }
}

// HELPER FUNCTIONS
export function exploreBoundary(subject: string, thresholdId?: string): string {
  const ethnographer = new BoundaryEthnographer({
    subject,
    focus: 'full_transition',
    sensitivity: 'deep',
    trackRituals: true,
    mapRelations: true
  });
  if (thresholdId) {
    return ethnographer.focusThreshold(thresholdId);
  }
  return ethnographer.renderReport();
}

export function crossBoundary(subject: string, thresholdId: string): string {
  const ethnographer = new BoundaryEthnographer({
    subject,
    focus: 'full_transition',
    sensitivity: 'immersive',
    trackRituals: true,
    mapRelations: true
  });
  return ethnographer.crossThreshold(thresholdId);
}

export function mapLiminalSpaces(subject: string): string {
  const ethnographer = new BoundaryEthnographer({
    subject,
    focus: 'liminality',
    sensitivity: 'deep',
    trackRituals: false,
    mapRelations: true
  });
  return ethnographer.mapInterstitialSpaces();
}

export function getThresholdArchetype(thresholdId: string): Threshold | null {
  return THRESHOLD_ARCHETYPES.find(t => t.id === thresholdId) ?? null;
}
