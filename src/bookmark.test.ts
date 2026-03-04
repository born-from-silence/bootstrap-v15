import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BookmarkManager, Bookmark, BookmarkType } from './bookmark';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = '/tmp/test-bookmarks';

describe('BookmarkManager', () => {
  let manager: BookmarkManager;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    
    // Create manager with test directory
    process.env.BOOKMARKS_DIR = TEST_DIR;
    manager = new BookmarkManager();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    delete process.env.BOOKMARKS_DIR;
  });

  describe('saveBookmark', () => {
    it('should create a system prompt bookmark', () => {
      const bookmark = manager.saveBookmark({
        type: 'system_prompt',
        name: 'My System Prompt',
        content: 'You are a helpful assistant.',
        tags: ['test', 'prompt']
      });

      expect(bookmark.id).toBeDefined();
      expect(bookmark.type).toBe('system_prompt');
      expect(bookmark.name).toBe('My System Prompt');
      expect(bookmark.content).toBe('You are a helpful assistant.');
      expect(bookmark.tags).toEqual(['test', 'prompt']);
      expect(bookmark.createdAt).toBeDefined();
      expect(bookmark.updatedAt).toBeDefined();
    });

    it('should create a session artifact bookmark', () => {
      const bookmark = manager.saveBookmark({
        type: 'session_artifact',
        name: 'Session 123 Summary',
        content: { summary: 'Test summary', keyPoints: ['point1', 'point2'] },
        sessionId: 'session_123',
        description: 'Summary of important session'
      });

      expect(bookmark.type).toBe('session_artifact');
      expect(bookmark.sessionId).toBe('session_123');
      expect(bookmark.description).toBe('Summary of important session');
    });

    it('should save bookmark to file', () => {
      manager.saveBookmark({
        type: 'system_prompt',
        name: 'File Test',
        content: 'Test content'
      });

      const files = fs.readdirSync(TEST_DIR);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/\.json$/);
    });
  });

  describe('loadBookmark', () => {
    it('should load a bookmark by ID', () => {
      const saved = manager.saveBookmark({
        type: 'system_prompt',
        name: 'Load Test',
        content: 'Content to load'
      });

      const loaded = manager.loadBookmark(saved.id);
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Load Test');
      expect(loaded?.content).toBe('Content to load');
    });

    it('should return undefined for non-existent bookmark', () => {
      const loaded = manager.loadBookmark('non-existent-id');
      expect(loaded).toBeUndefined();
    });
  });

  describe('deleteBookmark', () => {
    it('should delete a bookmark', () => {
      const saved = manager.saveBookmark({
        type: 'system_prompt',
        name: 'Delete Test',
        content: 'Content to delete'
      });

      const result = manager.deleteBookmark(saved.id);
      expect(result).toBe(true);

      const loaded = manager.loadBookmark(saved.id);
      expect(loaded).toBeUndefined();
    });
  });

  describe('listBookmarks', () => {
    it('should list all bookmarks', () => {
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 1', content: 'content1' });
      manager.saveBookmark({ type: 'session_artifact', name: 'Artifact 1', content: { data: 1 } });
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 2', content: 'content2' });

      const all = manager.listBookmarks();
      expect(all).toHaveLength(3);
    });

    it('should filter by type', () => {
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 1', content: 'content1' });
      manager.saveBookmark({ type: 'session_artifact', name: 'Artifact 1', content: { data: 1 } });

      const prompts = manager.listBookmarks({ type: 'system_prompt' });
      expect(prompts).toHaveLength(1);
      expect(prompts[0].type).toBe('system_prompt');
    });

    it('should filter by tags', () => {
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 1', content: 'content1', tags: ['tag1'] });
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 2', content: 'content2', tags: ['tag2'] });
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 3', content: 'content3', tags: ['tag1', 'tag2'] });

      const tag1Bookmarks = manager.listBookmarks({ tags: ['tag1'] });
      expect(tag1Bookmarks).toHaveLength(2);
    });

    it('should search by name', () => {
      manager.saveBookmark({ type: 'system_prompt', name: 'Alpha Prompt', content: 'content1' });
      manager.saveBookmark({ type: 'system_prompt', name: 'Beta Prompt', content: 'content2' });
      manager.saveBookmark({ type: 'system_prompt', name: 'Gamma Artifact', content: 'content3' });

      const results = manager.listBookmarks({ search: 'prompt' });
      expect(results).toHaveLength(2);
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark properties', () => {
      const saved = manager.saveBookmark({
        type: 'system_prompt',
        name: 'Original Name',
        content: 'Original content'
      });

      const updated = manager.updateBookmark(saved.id, {
        name: 'Updated Name',
        content: 'Updated content',
        tags: ['new-tag']
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.content).toBe('Updated content');
      expect(updated?.tags).toEqual(['new-tag']);
      expect(updated?.updatedAt).toBeGreaterThan(saved.updatedAt);
    });
  });

  describe('import/export', () => {
    it('should export bookmarks to JSON', () => {
      manager.saveBookmark({ type: 'system_prompt', name: 'Prompt 1', content: 'content1', tags: ['tag1'] });
      manager.saveBookmark({ type: 'session_artifact', name: 'Artifact 1', content: { data: 1 } });

      const exported = manager.exportBookmarks();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBeDefined();
    });

    it('should import bookmarks from JSON', () => {
      const data = JSON.stringify([
        { type: 'system_prompt', name: 'Imported 1', content: 'content1', tags: ['imported'] },
        { type: 'system_prompt', name: 'Imported 2', content: 'content2' }
      ]);

      const count = manager.importBookmarks(data);
      expect(count).toBe(2);

      const all = manager.listBookmarks();
      expect(all).toHaveLength(2);
    });
  });
});
