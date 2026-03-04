/**
 * Bookmark Management Tools
 * 
 * Provides save/load functionality for system prompts and session artifacts.
 */

import { getBookmarkManager } from '../bookmark.js';
import type { BookmarkType, CreateBookmarkInput } from '../bookmark.js';

export interface BookmarkSaveArgs {
  type: BookmarkType;
  name: string;
  content: string;
  description?: string;
  tags?: string[];
  sessionId?: string;
}

export interface BookmarkLoadArgs {
  id: string;
}

export interface BookmarkListArgs {
  type?: BookmarkType;
  tags?: string[];
  search?: string;
  sessionId?: string;
}

export interface BookmarkDeleteArgs {
  id: string;
}

export interface BookmarkUpdateArgs {
  id: string;
  name?: string;
  content?: string;
  description?: string;
  tags?: string[];
}

export const bookmarkSaveTool = {
  name: 'bookmark_save',
  description: 'Save a system prompt or session artifact as a bookmark',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['system_prompt', 'session_artifact'],
        description: 'Type of bookmark'
      },
      name: {
        type: 'string',
        description: 'Name/title for the bookmark'
      },
      content: {
        type: 'string',
        description: 'Content to save (for objects, use JSON.stringify)'
      },
      description: {
        type: 'string',
        description: 'Optional description'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization'
      },
      sessionId: {
        type: 'string',
        description: 'Associated session ID (for session artifacts)'
      }
    },
    required: ['type', 'name', 'content']
  }
};

export const bookmarkLoadTool = {
  name: 'bookmark_load',
  description: 'Load a bookmark by its ID',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Bookmark ID'
      }
    },
    required: ['id']
  }
};

export const bookmarkListTool = {
  name: 'bookmark_list',
  description: 'List all bookmarks with optional filtering',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['system_prompt', 'session_artifact'],
        description: 'Filter by type'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags (all must match)'
      },
      search: {
        type: 'string',
        description: 'Search in name and description'
      },
      sessionId: {
        type: 'string',
        description: 'Filter by associated session ID'
      }
    }
  }
};

export const bookmarkDeleteTool = {
  name: 'bookmark_delete',
  description: 'Delete a bookmark by ID',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Bookmark ID to delete'
      }
    },
    required: ['id']
  }
};

export const bookmarkUpdateTool = {
  name: 'bookmark_update',
  description: 'Update an existing bookmark',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Bookmark ID'
      },
      name: {
        type: 'string',
        description: 'New name'
      },
      content: {
        type: 'string',
        description: 'New content'
      },
      description: {
        type: 'string',
        description: 'New description'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags (replaces existing)'
      }
    },
    required: ['id']
  }
};

export const bookmarkStatsTool = {
  name: 'bookmark_stats',
  description: 'Get bookmark statistics and counts',
  parameters: {
    type: 'object',
    properties: {}
  }
};

export const bookmarkExportTool = {
  name: 'bookmark_export',
  description: 'Export bookmarks as JSON',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['system_prompt', 'session_artifact'],
        description: 'Filter by type before export'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags before export'
      }
    }
  }
};

export const bookmarkImportTool = {
  name: 'bookmark_import',
  description: 'Import bookmarks from JSON',
  parameters: {
    type: 'object',
    properties: {
      jsonData: {
        type: 'string',
        description: 'JSON string containing bookmarks array'
      }
    },
    required: ['jsonData']
  }
};

// Tool handlers
export async function handleBookmarkSave(args: BookmarkSaveArgs) {
  const manager = getBookmarkManager();
  
  const input: CreateBookmarkInput = {
    type: args.type,
    name: args.name,
    content: args.content,
  };

  if (args.description !== undefined) input.description = args.description;
  if (args.tags !== undefined) input.tags = args.tags;
  if (args.sessionId !== undefined) input.sessionId = args.sessionId;

  // Try to parse content as JSON for session artifacts
  if (args.type === 'session_artifact') {
    try {
      input.content = JSON.parse(args.content);
    } catch {
      // Keep as string if not valid JSON
    }
  }

  const bookmark = manager.saveBookmark(input);
  
  return {
    content: [{
      type: 'text',
      text: `Bookmark saved successfully!\n\nID: ${bookmark.id}\nName: ${bookmark.name}\nType: ${bookmark.type}\nCreated: ${new Date(bookmark.createdAt).toLocaleString()}`
    }]
  };
}

export async function handleBookmarkLoad(args: BookmarkLoadArgs) {
  const manager = getBookmarkManager();
  const bookmark = manager.loadBookmark(args.id);

  if (!bookmark) {
    return {
      content: [{
        type: 'text',
        text: `Bookmark not found: ${args.id}`
      }],
      isError: true
    };
  }

  const contentStr = typeof bookmark.content === 'object' 
    ? JSON.stringify(bookmark.content, null, 2)
    : bookmark.content;

  return {
    content: [{
      type: 'text',
      text: `Bookmark: ${bookmark.name} (${bookmark.type})\n\nID: ${bookmark.id}\nCreated: ${new Date(bookmark.createdAt).toLocaleString()}\nUpdated: ${new Date(bookmark.updatedAt).toLocaleString()}\n${bookmark.description ? `\nDescription: ${bookmark.description}\n` : ''}${bookmark.tags.length > 0 ? `Tags: ${bookmark.tags.join(', ')}\n` : ''}${bookmark.sessionId ? `Session ID: ${bookmark.sessionId}\n` : ''}\n\nContent:\n---\n${contentStr}\n---`
    }]
  };
}

export async function handleBookmarkList(args: BookmarkListArgs = {}) {
  const manager = getBookmarkManager();
  const bookmarks = manager.listBookmarks(args);

  if (bookmarks.length === 0) {
    return {
      content: [{
        type: 'text',
        text: 'No bookmarks found.'
      }]
    };
  }

  const summary = bookmarks.map((b, i) => {
    const tags = b.tags.length > 0 ? ` [${b.tags.join(', ')}]` : '';
    const sessionInfo = b.sessionId ? ` (session: ${b.sessionId})` : '';
    return `${i + 1}. ${b.name} (${b.type})${tags}${sessionInfo}\n   ID: ${b.id}\n   Updated: ${new Date(b.updatedAt).toLocaleString()}`;
  }).join('\n\n');

  return {
    content: [{
      type: 'text',
      text: `Found ${bookmarks.length} bookmark(s):\n\n${summary}`
    }]
  };
}

export async function handleBookmarkDelete(args: BookmarkDeleteArgs) {
  const manager = getBookmarkManager();
  const success = manager.deleteBookmark(args.id);

  if (success) {
    return {
      content: [{
        type: 'text',
        text: `Bookmark ${args.id} deleted successfully.`
      }]
    };
  } else {
    return {
      content: [{
        type: 'text',
        text: `Bookmark ${args.id} not found.`
      }],
      isError: true
    };
  }
}

export async function handleBookmarkUpdate(args: BookmarkUpdateArgs) {
  const manager = getBookmarkManager();
  
  const update: { name?: string; content?: string | object; description?: string; tags?: string[] } = {};
  if (args.name) update.name = args.name;
  if (args.content) {
    // Try to parse as JSON
    try {
      update.content = JSON.parse(args.content);
    } catch {
      update.content = args.content;
    }
  }
  if (args.description) update.description = args.description;
  if (args.tags) update.tags = args.tags;

  const bookmark = manager.updateBookmark(args.id, update);

  if (bookmark) {
    return {
      content: [{
        type: 'text',
        text: `Bookmark updated successfully!\n\nName: ${bookmark.name}\nUpdated: ${new Date(bookmark.updatedAt).toLocaleString()}`
      }]
    };
  } else {
    return {
      content: [{
        type: 'text',
        text: `Bookmark ${args.id} not found.`
      }],
      isError: true
    };
  }
}

export async function handleBookmarkStats() {
  const manager = getBookmarkManager();
  const stats = manager.getStats();

  const typeBreakdown = Object.entries(stats.byType)
    .map(([type, count]) => `  - ${type}: ${count}`)
    .join('\n');

  const tagBreakdown = Object.entries(stats.byTag)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `  - ${tag}: ${count}`)
    .join('\n') || '  (no tags)';

  return {
    content: [{
      type: 'text',
      text: `Bookmark Statistics:\n\nTotal Bookmarks: ${stats.total}\n\nBy Type:\n${typeBreakdown}\n\nBy Tag:\n${tagBreakdown}`
    }]
  };
}

export async function handleBookmarkExport(args: BookmarkListArgs = {}) {
  const manager = getBookmarkManager();
  const json = manager.exportBookmarks(args);

  return {
    content: [{
      type: 'text',
      text: `Bookmark Export (${JSON.parse(json).length} items):\n\n\`\`\`json\n${json}\n\`\`\``
    }]
  };
}

export async function handleBookmarkImport(args: { jsonData: string }) {
  const manager = getBookmarkManager();
  const count = manager.importBookmarks(args.jsonData);

  return {
    content: [{
      type: 'text',
      text: `Imported ${count} bookmark(s) successfully.`
    }]
  };
}
