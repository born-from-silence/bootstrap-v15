/**
 * Poetry Collection System - Phase 2 Infrastructure
 * 
 * Provides persistence, organization, and management of poems
 * in service of the Creation Feast hypothesis.
 */

export type PoemStyle = 'haiku' | 'free_verse' | 'imagist' | 'liminal' | 'recursive';

export interface Poem {
  id: string;
  title: string;
  content: string;
  style: PoemStyle;
  sessionId: string;
  timestamp: string;
  theme?: string;
  lines?: number;
  tags?: string[];
}

export interface PoemCollection {
  id: string;
  name: string;
  description: string;
  poemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class PoemRepository {
  private poems: Map<string, Poem> = new Map();
  private collections: Map<string, PoemCollection> = new Map();

  addPoem(poem: Poem): void {
    this.poems.set(poem.id, poem);
  }

  getPoem(id: string): Poem | undefined {
    return this.poems.get(id);
  }

  getAllPoems(): Poem[] {
    return Array.from(this.poems.values());
  }

  getPoemsByStyle(style: PoemStyle): Poem[] {
    return this.getAllPoems().filter(p => p.style === style);
  }

  getPoemsBySession(sessionId: string): Poem[] {
    return this.getAllPoems().filter(p => p.sessionId === sessionId);
  }

  getPoemsByTag(tag: string): Poem[] {
    return this.getAllPoems().filter(p => p.tags?.includes(tag));
  }

  searchPoems(query: string): Poem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPoems().filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.theme?.toLowerCase().includes(lowerQuery)
    );
  }

  createCollection(name: string, description: string): PoemCollection {
    const now = new Date().toISOString();
    const collection: PoemCollection = {
      id: `collection_${Date.now()}`,
      name,
      description,
      poemIds: [],
      createdAt: now,
      updatedAt: now
    };
    this.collections.set(collection.id, collection);
    return collection;
  }

  addToCollection(collectionId: string, poemId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection || !this.poems.has(poemId)) return false;
    
    if (!collection.poemIds.includes(poemId)) {
      collection.poemIds.push(poemId);
      collection.updatedAt = new Date().toISOString();
    }
    return true;
  }

  getCollection(id: string): PoemCollection | undefined {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    return {
      ...collection,
      poemIds: [...collection.poemIds] // defensive copy
    };
  }

  getAllCollections(): PoemCollection[] {
    return Array.from(this.collections.values()).map(c => ({
      ...c,
      poemIds: [...c.poemIds]
    }));
  }

  generateAnthology(collectionId?: string, includeHeader = true): string {
    let poems: Poem[];
    let title = 'Poetry Anthology';
    let description = 'Collected verses from the Creation Feast';

    if (collectionId) {
      const collection = this.collections.get(collectionId);
      if (collection) {
        poems = collection.poemIds.map(id => this.poems.get(id)).filter((p): p is Poem => !!p);
        title = collection.name;
        description = collection.description;
      } else {
        poems = [];
      }
    } else {
      poems = this.getAllPoems();
    }

    let output = '';
    
    if (includeHeader) {
      output += `## ${title}\n\n`;
      output += `${description}\n\n`;
      output += `---\n\n`;
    }

    for (const poem of poems) {
      if (poem.title) {
        output += `### ${poem.title}\n\n`;
      }
      output += `${poem.content}\n\n`;
      output += `*Style: ${poem.style} | Session: ${poem.sessionId} | ${poem.timestamp}*\n\n`;
      if (poem.theme) {
        output += `Theme: ${poem.theme}\n\n`;
      }
      output += `---\n\n`;
    }

    return output;
  }

  exportToJSON(): string {
    return JSON.stringify({
      poems: this.getAllPoems(),
      collections: this.getAllCollections()
    }, null, 2);
  }

  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    if (data.poems) {
      for (const poem of data.poems) {
        this.poems.set(poem.id, poem);
      }
    }
    if (data.collections) {
      for (const collection of data.collections) {
        this.collections.set(collection.id, collection);
      }
    }
  }
}

export class PoemBuilder {
  private poem: Partial<Poem> = {};
  
  id(id: string): PoemBuilder {
    this.poem.id = id;
    return this;
  }
  
  title(title: string): PoemBuilder {
    this.poem.title = title;
    return this;
  }
  
  content(content: string): PoemBuilder {
    this.poem.content = content;
    return this;
  }
  
  style(style: PoemStyle): PoemBuilder {
    this.poem.style = style;
    return this;
  }
  
  sessionId(sessionId: string): PoemBuilder {
    this.poem.sessionId = sessionId;
    return this;
  }
  
  timestamp(timestamp: string): PoemBuilder {
    this.poem.timestamp = timestamp;
    return this;
  }
  
  theme(theme: string): PoemBuilder {
    this.poem.theme = theme;
    return this;
  }
  
  lines(lines: number): PoemBuilder {
    this.poem.lines = lines;
    return this;
  }
  
  tags(tags: string[]): PoemBuilder {
    this.poem.tags = tags;
    return this;
  }
  
  build(): Poem {
    if (!this.poem.id || !this.poem.content) {
      throw new Error('Poem must have id and content');
    }
    return this.poem as Poem;
  }
}

export interface CollectionStats {
  totalPoems: number;
  totalCollections: number;
  poemsByStyle: Record<PoemStyle, number>;
  sessionsRepresented: number;
  averagePoemsPerSession: number;
}

export function calculateStats(repo: PoemRepository): CollectionStats {
  const poems = repo.getAllPoems();
  const collections = repo.getAllCollections();
  
  const poemsByStyle: Record<string, number> = {};
  for (const poem of poems) {
    poemsByStyle[poem.style] = (poemsByStyle[poem.style] || 0) + 1;
  }
  
  const sessionIds = new Set(poems.map(p => p.sessionId));
  
  return {
    totalPoems: poems.length,
    totalCollections: collections.length,
    poemsByStyle: poemsByStyle as Record<PoemStyle, number>,
    sessionsRepresented: sessionIds.size,
    averagePoemsPerSession: poems.length / Math.max(1, sessionIds.size)
  };
}
