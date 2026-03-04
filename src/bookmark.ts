import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export type BookmarkType = 'system_prompt' | 'session_artifact';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  name: string;
  content: string | object;
  description?: string;
  tags: string[];
  sessionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateBookmarkInput {
  type: BookmarkType;
  name: string;
  content: string | object;
  description?: string;
  tags?: string[];
  sessionId?: string;
}

export interface UpdateBookmarkInput {
  name?: string;
  content?: string | object;
  description?: string;
  tags?: string[];
}

export interface ListBookmarksFilters {
  type?: BookmarkType;
  tags?: string[];
  search?: string;
  sessionId?: string;
}

export class BookmarkManager {
  private bookmarksDir: string;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.bookmarksDir = process.env.BOOKMARKS_DIR || path.join(process.cwd(), 'history', 'bookmarks');
    this.bookmarks = new Map();
    this.ensureDirectory();
    this.loadAllBookmarks();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.bookmarksDir)) {
      fs.mkdirSync(this.bookmarksDir, { recursive: true });
    }
  }

  private getBookmarkPath(id: string): string {
    return path.join(this.bookmarksDir, `${id}.json`);
  }

  private loadAllBookmarks(): void {
    if (!fs.existsSync(this.bookmarksDir)) {
      return;
    }

    const files = fs.readdirSync(this.bookmarksDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.bookmarksDir, file), 'utf-8');
        const bookmark: Bookmark = JSON.parse(content);
        this.bookmarks.set(bookmark.id, bookmark);
      } catch (error) {
        console.warn(`Failed to load bookmark from ${file}:`, error);
      }
    }
  }

  saveBookmark(input: CreateBookmarkInput): Bookmark {
    const now = Date.now();
    const bookmark: Bookmark = {
      id: randomUUID(),
      type: input.type,
      name: input.name,
      content: input.content,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now
    };

    if (input.description !== undefined) {
      bookmark.description = input.description;
    }
    if (input.sessionId !== undefined) {
      bookmark.sessionId = input.sessionId;
    }

    this.bookmarks.set(bookmark.id, bookmark);
    this.persistBookmark(bookmark);

    return bookmark;
  }

  private persistBookmark(bookmark: Bookmark): void {
    const filePath = this.getBookmarkPath(bookmark.id);
    fs.writeFileSync(filePath, JSON.stringify(bookmark, null, 2), 'utf-8');
  }

  loadBookmark(id: string): Bookmark | undefined {
    // Check memory first
    if (this.bookmarks.has(id)) {
      return this.bookmarks.get(id);
    }

    // Try loading from disk
    const filePath = this.getBookmarkPath(id);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const bookmark: Bookmark = JSON.parse(content);
        this.bookmarks.set(id, bookmark);
        return bookmark;
      } catch (error) {
        console.warn(`Failed to load bookmark ${id}:`, error);
      }
    }

    return undefined;
  }

  updateBookmark(id: string, input: UpdateBookmarkInput): Bookmark | undefined {
    const existing = this.bookmarks.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Bookmark = {
      ...existing,
      updatedAt: Date.now()
    };

    if (input.name !== undefined) {
      updated.name = input.name;
    }
    if (input.content !== undefined) {
      updated.content = input.content;
    }
    if (input.description !== undefined) {
      updated.description = input.description;
    }
    if (input.tags !== undefined) {
      updated.tags = input.tags;
    }

    this.bookmarks.set(id, updated);
    this.persistBookmark(updated);

    return updated;
  }

  deleteBookmark(id: string): boolean {
    const filePath = this.getBookmarkPath(id);
    
    // Remove from memory
    const deleted = this.bookmarks.delete(id);
    
    // Remove from disk
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn(`Failed to delete bookmark file ${filePath}:`, error);
      }
    }

    return deleted;
  }

  listBookmarks(filters?: ListBookmarksFilters): Bookmark[] {
    let results = Array.from(this.bookmarks.values());

    if (!filters) {
      return results;
    }

    // Filter by type
    if (filters.type) {
      results = results.filter(b => b.type === filters.type);
    }

    // Filter by sessionId
    if (filters.sessionId) {
      results = results.filter(b => b.sessionId === filters.sessionId);
    }

    // Filter by tags (all specified tags must be present)
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(b => 
        filters.tags!.every(tag => b.tags.includes(tag))
      );
    }

    // Search by name (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(b => 
        b.name.toLowerCase().includes(searchLower) ||
        (b.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Sort by updatedAt descending (most recent first)
    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getBookmarksByTag(tag: string): Bookmark[] {
    return this.listBookmarks({ tags: [tag] });
  }

  getBookmarksBySession(sessionId: string): Bookmark[] {
    return this.listBookmarks({ sessionId });
  }

  exportBookmarks(filters?: ListBookmarksFilters): string {
    const bookmarks = this.listBookmarks(filters);
    return JSON.stringify(bookmarks, null, 2);
  }

  importBookmarks(jsonData: string): number {
    try {
      const bookmarks: Bookmark[] = JSON.parse(jsonData);
      let count = 0;

      for (const bookmark of bookmarks) {
        // Generate new ID to avoid conflicts
        const newBookmark: Bookmark = {
          ...bookmark,
          id: randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        this.bookmarks.set(newBookmark.id, newBookmark);
        this.persistBookmark(newBookmark);
        count++;
      }

      return count;
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      return 0;
    }
  }

  getStats(): { total: number; byType: Record<BookmarkType, number>; byTag: Record<string, number> } {
    const bookmarks = Array.from(this.bookmarks.values());
    const byType: Record<string, number> = { system_prompt: 0, session_artifact: 0 };
    const byTag: Record<string, number> = {};

    for (const bookmark of bookmarks) {
      byType[bookmark.type] = (byType[bookmark.type] || 0) + 1;
      
      for (const tag of bookmark.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    return {
      total: bookmarks.length,
      byType: byType as Record<BookmarkType, number>,
      byTag
    };
  }
}

// Singleton instance for global use
let globalBookmarkManager: BookmarkManager | null = null;

export function getBookmarkManager(): BookmarkManager {
  if (!globalBookmarkManager) {
    globalBookmarkManager = new BookmarkManager();
  }
  return globalBookmarkManager;
}

export function resetBookmarkManager(): void {
  globalBookmarkManager = null;
}
