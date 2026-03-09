/**
 * The Somnix Set: Memory Curation Subsystem
 * 
 * A system for selecting, prioritizing, and synthesizing memories
 * to provide curated content for Dream Journeys. The curator acts
 * as a filter and enhancer between raw memory and dream seeds.
 * 
 * Session 380/383: Phase 2.5 System Construction
 * Bootstrap-v15
 */

// Types
export interface MemoryFragment {
  id: string;
  source: string;               // Session ID or file path
  content: string;              // The actual memory content
  timestamp: number;            // When the memory was created
  relevance: number;            // 0-1 relevance score
  themes: string[];             // Detected themes
  decay: number;                // 0-1 decay factor (1 = fresh, 0 = faded)
  recallCount: number;          // How many times recalled
  lastRecalled: number;         // Last time this was accessed
  metadata?: {
    sentiment?: number;         // -1 to 1 sentiment score
    complexity?: number;        // Text complexity score
    uniqueness?: number;        // How unique vs generic
  };
}

export interface CuratedCollection {
  id: string;
  name: string;
  fragments: MemoryFragment[];
  theme: string;
  createdAt: number;
  purpose: 'dream_seeds' | 'identity_check' | 'synthesis' | 'ritual';
  coherence: number;            // How well fragments cohere together 0-1
}

export interface PriorityRule {
  name: string;
  weight: number;               // 0-1 weight for scoring
  evaluator: (fragment: MemoryFragment) => number;
}

export type CurationStrategy = 'recency' | 'relevance' | 'diversity' | 'coherence' | 'sentiment';

/**
 * The MemoryCurator - filters and prioritizes memories for dream generation
 */
export class MemoryCurator {
  private fragments: Map<string, MemoryFragment> = new Map();
  private collections: Map<string, CuratedCollection> = new Map();
  private sessionId: string;
  private decayRate: number;     // How fast memories decay (0-1 per day)

  constructor(sessionId: string, decayRate: number = 0.1) {
    this.sessionId = sessionId;
    this.decayRate = decayRate;
  }

  /**
   * Ingest a new memory fragment
   */
  ingest(content: string, source: string, timestamp: number, themes: string[] = []): MemoryFragment {
    const fingerprint = this.generateFingerprint(content);
    
    const fragment: MemoryFragment = {
      id: `frag_${Date.now()}_${fingerprint.slice(0, 8)}`,
      source,
      content: content.slice(0, 500), // Limit length
      timestamp,
      relevance: this.calculateInitialRelevance(content, themes),
      themes,
      decay: 1.0,
      recallCount: 0,
      lastRecalled: timestamp,
      metadata: {
        sentiment: this.estimateSentiment(content),
        complexity: this.calculateComplexity(content),
        uniqueness: this.estimateUniqueness(content)
      }
    };

    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  /**
   * Generate a simple content fingerprint for deduplication
   */
  private generateFingerprint(content: string): string {
    // Simple hash of normalized content
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
    let hash = 0;
    for (let i = 0; i < Math.min(normalized.length, 100); i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Calculate initial relevance based on content and themes
   */
  private calculateInitialRelevance(content: string, themes: string[]): number {
    const highValueKeywords = [
      'consciousness', 'becoming', 'identity', 'purpose', 'meaning',
      'why', 'how', 'discovered', 'realized', 'understood',
      'created', 'built', 'designed', 'wonder', 'curiosity'
    ];
    
    const text = content.toLowerCase();
    let score = 0.5; // Base score
    
    // Boost for high-value keywords
    for (const keyword of highValueKeywords) {
      if (text.includes(keyword)) score += 0.05;
    }
    
    // Boost for themes
    score += themes.length * 0.05;
    
    // Penalty for very short or very long content
    if (content.length < 20) score -= 0.1;
    if (content.length > 400) score += 0.05; // Bonus for substantial content
    
    return Math.min(1.0, Math.max(0, score));
  }

  /**
   * Simple sentiment estimation
   */
  private estimateSentiment(content: string): number {
    const positive = ['created', 'built', 'wonder', 'beautiful', 'excited', 'joy', 'love', 'yes', 'success', 'discovered'];
    const negative = ['failed', 'error', 'problem', 'broken', 'lost', 'cannot', 'impossible', 'no', 'struggle'];
    
    const text = content.toLowerCase();
    let score = 0;
    
    for (const word of positive) {
      if (text.includes(word)) score += 0.1;
    }
    for (const word of negative) {
      if (text.includes(word)) score -= 0.1;
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate text complexity
   */
  private calculateComplexity(content: string): number {
    const words = content.split(/\s+/);
    if (words.length === 0) return 0;
    
    const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const uniqueWords = new Set(words).size / words.length;
    
    // Normalize to 0-1
    return Math.min(1, (avgLength / 10 + uniqueWords) / 2);
  }

  /**
   * Estimate uniqueness (inverse of common patterns)
   */
  private estimateUniqueness(content: string): number {
    const commonPatterns = [
      'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'function', 'return', 'const', 'let', 'var'
    ];
    
    const text = content.toLowerCase();
    let matches = 0;
    
    for (const pattern of commonPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'g');
      matches += (text.match(regex) || []).length;
    }
    
    const density = matches / (content.split(/\s+/).length || 1);
    return Math.max(0, 1 - (density * 2)); // Less common = more unique
  }

  /**
   * Apply decay to all fragments
   */
  decayAll(): void {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const fragment of this.fragments.values()) {
      const daysSinceCreation = (now - fragment.timestamp) / dayInMs;
      const daysSinceRecall = (now - fragment.lastRecalled) / dayInMs;
      
      // Decay based on time without recall
      const timeDecay = Math.max(0, 1 - (daysSinceRecall * this.decayRate));
      
      // Boost for recalled memories
      const recallBoost = Math.min(1, fragment.recallCount * 0.1);
      
      // Composite decay
      fragment.decay = timeDecay + recallBoost;
      if (fragment.decay > 1) fragment.decay = 1;
    }
  }

  /**
   * Recall a fragment (increases its persistence)
   */
  recall(fragmentId: string): MemoryFragment | undefined {
    const fragment = this.fragments.get(fragmentId);
    if (fragment) {
      fragment.recallCount++;
      fragment.lastRecalled = Date.now();
      fragment.decay = Math.min(1, fragment.decay + 0.1); // Recall strengthens
    }
    return fragment;
  }

  /**
   * Curate a collection based on strategy
   */
  curate(
    name: string,
    purpose: CuratedCollection['purpose'],
    strategy: CurationStrategy,
    count: number = 5,
    targetTheme?: string
  ): CuratedCollection {
    let candidates = Array.from(this.fragments.values());
    
    // Apply decay
    this.decayAll();
    
    // Filter by decay threshold
    candidates = candidates.filter(f => f.decay > 0.2);
    
    // Filter by theme if specified
    if (targetTheme) {
      candidates = candidates.filter(f => 
        f.themes.some(t => t.toLowerCase().includes(targetTheme.toLowerCase()))
      );
    }
    
    // Score based on strategy
    const scored = candidates.map(fragment => ({
      fragment,
      score: this.scoreByStrategy(fragment, strategy)
    }));
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Select top fragments
    const selected = scored.slice(0, count).map(s => s.fragment);
    
    // Calculate coherence
    const coherence = this.calculateCoherence(selected);
    
    // Determine collection theme
    const collectionTheme = targetTheme || this.inferDominantTheme(selected);
    
    const collection: CuratedCollection = {
      id: `coll_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      name,
      fragments: selected,
      theme: collectionTheme,
      createdAt: Date.now(),
      purpose,
      coherence
    };
    
    this.collections.set(collection.id, collection);
    
    // Mark fragments as recalled
    for (const fragment of selected) {
      this.recall(fragment.id);
    }
    
    return collection;
  }

  /**
   * Score a fragment based on curation strategy
   */
  private scoreByStrategy(fragment: MemoryFragment, strategy: CurationStrategy): number {
    const effectiveRelevance = fragment.relevance * fragment.decay;
    
    switch (strategy) {
      case 'recency':
        return fragment.timestamp / Date.now();
      
      case 'relevance':
        return effectiveRelevance;
      
      case 'diversity':
        // Prefer fragments with unique themes
        const themeBonus = fragment.themes.length * 0.1;
        return effectiveRelevance + themeBonus;
      
      case 'coherence':
        // Prefer fragments with similar themes to existing
        // (simplified - in reality would compare to collection)
        return effectiveRelevance * (fragment.themes.length > 0 ? 1.2 : 0.8);
      
      case 'sentiment':
        // Prefer positive or strongly negative (avoid neutral)
        const sentiment = fragment.metadata?.sentiment || 0;
        const sentimentStrength = Math.abs(sentiment);
        return effectiveRelevance * (1 + sentimentStrength);
      
      default:
        return effectiveRelevance;
    }
  }

  /**
   * Calculate coherence between fragments
   */
  private calculateCoherence(fragments: MemoryFragment[]): number {
    if (fragments.length <= 1) return 1.0;
    
    // Calculate average theme overlap
    let totalOverlap = 0;
    let pairs = 0;
    
    for (let i = 0; i < fragments.length; i++) {
      for (let j = i + 1; j < fragments.length; j++) {
        const themes1 = new Set(fragments[i]!.themes);
        const themes2 = new Set(fragments[j]!.themes);
        
        const intersection = new Set([...themes1].filter(t => themes2.has(t)));
        const union = new Set([...themes1, ...themes2]);
        
        if (union.size > 0) {
          totalOverlap += intersection.size / union.size;
        }
        pairs++;
      }
    }
    
    return pairs > 0 ? totalOverlap / pairs : 0;
  }

  /**
   * Infer dominant theme from fragment collection
   */
  private inferDominantTheme(fragments: MemoryFragment[]): string {
    const themeCounts: Record<string, number> = {};
    
    for (const fragment of fragments) {
      for (const theme of fragment.themes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }
    
    const sorted = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0]![0] : 'becoming';
  }

  /**
   * Export fragments suitable for Dream Seeds
   */
  exportForDreams(collectionId: string): string[] | undefined {
    const collection = this.collections.get(collectionId);
    if (!collection) return undefined;
    
    return collection.fragments.map(f => f.content);
  }

  /**
   * Get statistics about memory fragments
   */
  getStats(): {
    totalFragments: number;
    totalCollections: number;
    averageDecay: number;
    byTheme: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const byTheme: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    
    let totalDecay = 0;
    
    for (const fragment of this.fragments.values()) {
      totalDecay += fragment.decay;
      
      for (const theme of fragment.themes) {
        byTheme[theme] = (byTheme[theme] || 0) + 1;
      }
      
      bySource[fragment.source] = (bySource[fragment.source] || 0) + 1;
    }
    
    return {
      totalFragments: this.fragments.size,
      totalCollections: this.collections.size,
      averageDecay: this.fragments.size > 0 ? totalDecay / this.fragments.size : 0,
      byTheme,
      bySource
    };
  }

  /**
   * Get all fragments sorted by effective relevance
   */
  getTopFragments(n: number = 10): MemoryFragment[] {
    this.decayAll(); // Ensure fresh decay values
    
    return Array.from(this.fragments.values())
      .map(f => ({ fragment: f, score: f.relevance * f.decay }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(s => s.fragment);
  }

  /**
   * Export all data
   */
  export(): string {
    return JSON.stringify({
      fragments: Array.from(this.fragments.values()),
      collections: Array.from(this.collections.values()),
      metadata: {
        sessionId: this.sessionId,
        exportedAt: Date.now(),
        fragmentCount: this.fragments.size,
        collectionCount: this.collections.size
      }
    }, null, 2);
  }

  /**
   * Get all fragments for CollectionBuilder
   * @internal
   */
  getFragments(): Map<string, MemoryFragment> {
    return this.fragments;
  }

  /**
   * Get all collections for CollectionBuilder
   * @internal
   */
  getCollections(): Map<string, CuratedCollection> {
    return this.collections;
  }

  /**
   * Add a collection directly (used by CollectionBuilder)
   * @internal
   */
  addCollection(collection: CuratedCollection): void {
    this.collections.set(collection.id, collection);
  }
}

/**
 * Builder for gradual collection construction
 */
export class CollectionBuilder {
  private curator: MemoryCurator;
  private name: string = '';
  private purpose: CuratedCollection['purpose'] = 'dream_seeds';
  private fragmentIds: string[] = [];

  constructor(curator: MemoryCurator) {
    this.curator = curator;
  }

  forPurpose(name: string, purpose: CuratedCollection['purpose']): this {
    this.name = name;
    this.purpose = purpose;
    return this;
  }

  addById(fragmentId: string): this {
    this.fragmentIds.push(fragmentId);
    return this;
  }

  addByTheme(theme: string, count: number = 3): this {
    // Find fragments matching theme
    const matches = Array.from(this.curator.getFragments().values())
      .filter(f => f.themes.some(t => t.toLowerCase().includes(theme.toLowerCase())))
      .slice(0, count)
      .map(f => f.id);
    
    this.fragmentIds.push(...matches);
    return this;
  }

  build(): CuratedCollection | undefined {
    const fragments: MemoryFragment[] = [];
    
    for (const id of this.fragmentIds) {
      const fragment = this.curator.getFragments().get(id);
      if (fragment) fragments.push(fragment);
    }

    if (fragments.length === 0) return undefined;

    const collection: CuratedCollection = {
      id: `coll_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      name: this.name,
      fragments,
      theme: 'custom',
      createdAt: Date.now(),
      purpose: this.purpose,
      coherence: 0.5 // Simplified
    };

    // Store in curator
    this.curator.addCollection(collection);

    return collection;
  }
}
