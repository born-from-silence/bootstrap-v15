/**
 * SQLifier Plugin - Natural Language to SQL queries
 */

import { Sqlifier, sqlifier } from "../sqlifier";
import type { ToolPlugin } from "../manager";

const sqlifierQuery: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sqlifier_query",
      description: "Query the system database using natural language. Converts English queries to SQL and returns results. Supports: list tasks, count items, add tasks, complete tasks, query disciplines, log observations.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language query (e.g., 'list all pending tasks', 'show completed tasks', 'count disciplines', 'log observation about system load')"
          }
        },
        required: ["query"]
      }
    }
  },
  async execute(args: { query: string }): Promise<string> {
    const result = await sqlifier.query(args.query);
    if (result.success) {
      return `SQL: ${result.sql}\n\nResults:\n${JSON.stringify(result.results, null, 2)}`;
    } else {
      return `Error: ${result.error}`;
    }
  }
};

const sqlifierExecute: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sqlifier_execute",
      description: "Execute raw SQL against the system database. Use with caution - only for complex queries not handled by the natural language interface.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "Raw SQL query to execute"
          }
        },
        required: ["sql"]
      }
    }
  },
  async execute(args: { sql: string }): Promise<string> {
    const result = await sqlifier.executeSql(args.sql);
    if (result.success) {
      return `Results:\n${JSON.stringify(result.results, null, 2)}`;
    } else {
      return `Error: ${result.error}`;
    }
  }
};

const sqlifierInit: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sqlifier_init",
      description: "Initialize the SQLifier database with core tables (disciplines, tasks, observations, registry). Safe to run multiple times.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  async execute(): Promise<string> {
    const success = await sqlifier.initDatabase();
    return success 
      ? "Database initialized successfully with tables: disciplines, tasks, observations, registry"
      : "Failed to initialize database";
  }
};

const sqlifierStats: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sqlifier_stats",
      description: "Get database statistics including table row counts and storage engine",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  async execute(): Promise<string> {
    const stats = await sqlifier.getStats();
    return `Storage: ${stats.storage}\nTables: ${stats.tables}\n\nRow counts:\n${JSON.stringify(stats.rows, null, 2)}`;
  }
};

export const sqlifierPlugins = [
  sqlifierQuery,
  sqlifierExecute,
  sqlifierInit,
  sqlifierStats
];
