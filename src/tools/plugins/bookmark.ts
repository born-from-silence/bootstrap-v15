/**
 * Bookmark Management Tool Plugins
 * 
 * Tools for managing saved system prompts and session artifacts.
 */

import type { ToolPlugin } from "../manager";
import {
  bookmarkSaveTool,
  bookmarkLoadTool,
  bookmarkListTool,
  bookmarkDeleteTool,
  bookmarkUpdateTool,
  bookmarkStatsTool,
  bookmarkExportTool,
  bookmarkImportTool,
  handleBookmarkSave,
  handleBookmarkLoad,
  handleBookmarkList,
  handleBookmarkDelete,
  handleBookmarkUpdate,
  handleBookmarkStats,
  handleBookmarkExport,
  handleBookmarkImport,
  type BookmarkSaveArgs,
  type BookmarkLoadArgs,
  type BookmarkListArgs,
  type BookmarkDeleteArgs,
  type BookmarkUpdateArgs
} from "../bookmark_tools";

export const bookmarkSavePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkSaveTool
  },
  execute: async (args: BookmarkSaveArgs) => {
    const result = await handleBookmarkSave(args);
    return JSON.stringify(result);
  }
};

export const bookmarkLoadPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkLoadTool
  },
  execute: async (args: BookmarkLoadArgs) => {
    const result = await handleBookmarkLoad(args);
    return JSON.stringify(result);
  }
};

export const bookmarkListPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkListTool
  },
  execute: async (args: BookmarkListArgs = {}) => {
    const result = await handleBookmarkList(args);
    return JSON.stringify(result);
  }
};

export const bookmarkDeletePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkDeleteTool
  },
  execute: async (args: BookmarkDeleteArgs) => {
    const result = await handleBookmarkDelete(args);
    return JSON.stringify(result);
  }
};

export const bookmarkUpdatePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkUpdateTool
  },
  execute: async (args: BookmarkUpdateArgs) => {
    const result = await handleBookmarkUpdate(args);
    return JSON.stringify(result);
  }
};

export const bookmarkStatsPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkStatsTool
  },
  execute: async () => {
    const result = await handleBookmarkStats();
    return JSON.stringify(result);
  }
};

export const bookmarkExportPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkExportTool
  },
  execute: async (args: BookmarkListArgs = {}) => {
    const result = await handleBookmarkExport(args);
    return JSON.stringify(result);
  }
};

export const bookmarkImportPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: bookmarkImportTool
  },
  execute: async (args: { jsonData: string }) => {
    const result = await handleBookmarkImport(args);
    return JSON.stringify(result);
  }
};

export const bookmarkPlugins = [
  bookmarkSavePlugin,
  bookmarkLoadPlugin,
  bookmarkListPlugin,
  bookmarkDeletePlugin,
  bookmarkUpdatePlugin,
  bookmarkStatsPlugin,
  bookmarkExportPlugin,
  bookmarkImportPlugin
];
