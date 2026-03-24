/**
 * SQLifier - Natural Language Data Query System
 * 
 * A flexible data system that stores structured data (tasks, observations, disciplines, registry)
 * and allows querying via natural language. Falls back to JSON file storage if SQLite unavailable.
 */

import * as path from "path";
import * as fs from "node:fs/promises";
import { execSync } from "child_process";

export interface SqlifierResult {
  success: boolean;
  sql?: string;
  results?: any[];
  error?: string;
}

interface TableData {
  disciplines: any[];
  tasks: any[];
  observations: any[];
  registry: Record<string, string>;
}

export class Sqlifier {
  private dbPath: string;
  private dataPath: string;
  private sqliteAvailable: boolean | null = null;
  private data: TableData;
  private dataModified: boolean = false;

  constructor(
    dbPath: string = "/home/bootstrap-v15/.ant_volume/system.db",
    dataPath: string = "/home/bootstrap-v15/.ant_volume/system_data.json"
  ) {
    this.dbPath = dbPath;
    this.dataPath = dataPath;
    this.data = {
      disciplines: [],
      tasks: [],
      observations: [],
      registry: {}
    };
  }

  private async checkSqlite(): Promise<boolean> {
    if (this.sqliteAvailable !== null) {
      return this.sqliteAvailable;
    }
    try {
      execSync("which sqlite3", { stdio: "pipe" });
      this.sqliteAvailable = true;
    } catch {
      this.sqliteAvailable = false;
    }
    return this.sqliteAvailable;
  }

  async initDatabase(): Promise<boolean> {
    const isSqlite = await this.checkSqlite();
    
    if (isSqlite) {
      return this.initSQLite();
    } else {
      return this.initJsonStore();
    }
  }

  private async initSQLite(): Promise<boolean> {
    const initSql = `
      CREATE TABLE IF NOT EXISTS disciplines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        discipline_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id)
      );
      
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS registry (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      execSync(`sqlite3 "${this.dbPath}" "${initSql}"`, { encoding: "utf-8", timeout: 5000 });
      
      const defaultData = `
        INSERT OR IGNORE INTO disciplines (id, name, path, type, required) VALUES
          ('core', 'Core Discipline', '/home/bootstrap-v15/bootstrap', 'primary', 1),
          ('creations', 'Creations', '/home/bootstrap-v15/creations', 'project', 0);
      `;
      execSync(`sqlite3 "${this.dbPath}" "${defaultData}"`, { encoding: "utf-8", timeout: 5000 });
      
      return true;
    } catch (error) {
      console.error("Failed to initialize SQLite database:", error);
      return false;
    }
  }

  private async initJsonStore(): Promise<boolean> {
    try {
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });
      
      try {
        const existingData = await fs.readFile(this.dataPath, "utf-8");
        this.data = JSON.parse(existingData) as TableData;
        return true;
      } catch {
        // Initialize fresh
      }

      this.data.disciplines = [
        { id: "core", name: "Core Discipline", path: "/home/bootstrap-v15/bootstrap", type: "primary", required: 1, created_at: new Date().toISOString() },
        { id: "creations", name: "Creations", path: "/home/bootstrap-v15/creations", type: "project", required: 0, created_at: new Date().toISOString() }
      ];
      this.data.tasks = [];
      this.data.observations = [];
      this.data.registry = {
        version: "1.0.0",
        last_updated: new Date().toISOString()
      };
      
      await this.saveJsonData();
      return true;
    } catch (error) {
      console.error("Failed to initialize JSON store:", error);
      return false;
    }
  }

  private async saveJsonData(): Promise<void> {
    if (this.dataModified) {
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2), "utf-8");
      this.dataModified = false;
    }
  }

  async query(naturalLanguage: string): Promise<SqlifierResult> {
    await this.ensureDataLoaded();
    
    const isSqlite = await this.checkSqlite();
    
    if (isSqlite) {
      const sql = this.parseToSql(naturalLanguage);
      if (!sql) {
        return { success: false, error: `Could not understand query: "${naturalLanguage}"` };
      }
      return this.executeSQLite(sql);
    } else {
      return this.executeJsonQuery(naturalLanguage);
    }
  }

  private async ensureDataLoaded(): Promise<void> {
    const isSqlite = await this.checkSqlite();
    if (!isSqlite && !this.data.tasks) {
      try {
        const content = await fs.readFile(this.dataPath, "utf-8");
        this.data = JSON.parse(content) as TableData;
      } catch {
        // Will be initialized
      }
    }
  }

  private async executeJsonQuery(input: string): Promise<SqlifierResult> {
    const lower = input.toLowerCase().trim();
    const results: any[] = [];
    let operation: string = "SELECT";

    // SELECT / LIST / GET / SHOW
    if (/^(list|show|get|select|what|find)/i.test(lower)) {
      if (/(task|tasks|todo)/i.test(lower)) {
        const tasks: any[] = this.data.tasks || [];
        let filteredTasks: any[] = [...tasks];
        
        if (/pending|uncompleted|not done|active/i.test(lower)) {
          filteredTasks = filteredTasks.filter((t: any) => t.status === "pending");
        } else if (/completed|done/i.test(lower)) {
          filteredTasks = filteredTasks.filter((t: any) => t.status === "completed");
        }
        
        if (/high priority|urgent|important/i.test(lower)) {
          filteredTasks = filteredTasks.filter((t: any) => t.priority === "high");
        } else if (/low priority/i.test(lower)) {
          filteredTasks = filteredTasks.filter((t: any) => t.priority === "low");
        }
        
        if (/recent|latest|newest|last|order by created/i.test(lower)) {
          filteredTasks.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        }
        
        const limitMatch = lower.match(/(\d+|top\s*\d+)/i);
        if (limitMatch && limitMatch[1]) {
          const num = parseInt(limitMatch[1].replace(/top\s*/i, ""));
          filteredTasks = filteredTasks.slice(0, num);
        }
        
        results.push(...filteredTasks);
      } else if (/(discipline|disciplines|project|projects)/i.test(lower)) {
        const disciplines: any[] = this.data.disciplines || [];
        let filteredDisciplines: any[] = [...disciplines];
        
        if (/required|mandatory|essential/i.test(lower)) {
          filteredDisciplines = filteredDisciplines.filter((d: any) => d.required === 1 || d.required === true);
        }
        if (/primary|main|core/i.test(lower)) {
          filteredDisciplines = filteredDisciplines.filter((d: any) => d.type === "primary");
        }
        
        results.push(...filteredDisciplines);
      } else if (/(observation|observations|log|record)/i.test(lower)) {
        const observations: any[] = this.data.observations || [];
        let obs: any[] = observations.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        
        if (/system|error|status|event/i.test(lower)) {
          const categoryMatch = lower.match(/\b(system|error|status|event)\b/);
          const category = categoryMatch ? categoryMatch[1] : null;
          if (category) {
            obs = obs.filter((o: any) => o.category === category);
          }
        }
        
        results.push(...obs.slice(0, 50));
      } else if (/(registry|config|setting|version)/i.test(lower)) {
        results.push(this.data.registry || {});
      } else {
        // Show all data overview
        results.push({
          tables: Object.keys(this.data),
          counts: {
            disciplines: (this.data.disciplines || []).length,
            tasks: (this.data.tasks || []).length,
            observations: (this.data.observations || []).length
          }
        });
      }
    }

    // INSERT / ADD / CREATE
    else if (/^(add|create|new).*(task|item)/i.test(lower)) {
      const titleMatch = lower.match(/(?:task|item)\s+(?:called\s+)?["']?([^"']+?)["']?(?:\s+(?:with|described|about|that)|$)/i);
      const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "New Task";
      
      const maxId = (this.data.tasks || []).length > 0 
        ? Math.max(...this.data.tasks.map((t: any) => t.id || 0)) 
        : 0;
      const taskId = maxId + 1;
      
      const newTask = {
        id: taskId,
        title: title.replace(/'/g, "''"),
        status: "pending",
        priority: "normal",
        description: "",
        created_at: new Date().toISOString()
      };
      
      if (/high priority|urgent|important/i.test(lower)) {
        newTask.priority = "high";
      } else if (/low priority/i.test(lower)) {
        newTask.priority = "low";
      }
      
      if (!this.data.tasks) this.data.tasks = [];
      this.data.tasks.push(newTask);
      this.dataModified = true;
      operation = "INSERT";
      results.push(newTask);
    }

    // LOG / NOTE
    else if (/^(log|record).*(observation|note)/i.test(lower)) {
      const categoryMatch = lower.match(/\b(system|error|status|event|info)\b/);
      const category = categoryMatch && categoryMatch[1] ? categoryMatch[1] : "info";
      const contentMatch = lower.match(/(?:about|that|saying|note)\s+(.+)$/i);
      const logContent = contentMatch && contentMatch[1] ? contentMatch[1] : lower;
      
      const maxId = (this.data.observations || []).length > 0 
        ? Math.max(...this.data.observations.map((o: any) => o.id || 0)) 
        : 0;
      const obsId = maxId + 1;
      
      const newObs = {
        id: obsId,
        category,
        content: logContent.replace(/'/g, "''"),
        context: "",
        created_at: new Date().toISOString()
      };
      
      if (!this.data.observations) this.data.observations = [];
      this.data.observations.push(newObs);
      this.dataModified = true;
      operation = "INSERT";
      results.push(newObs);
    }

    // COUNT
    else if (/^(count|how many)/i.test(lower)) {
      if (/(task|tasks)/i.test(lower)) {
        let count = (this.data.tasks || []).length;
        if (/pending|active/i.test(lower)) {
          count = (this.data.tasks || []).filter((t: any) => t.status === "pending").length;
        } else if (/completed/i.test(lower)) {
          count = (this.data.tasks || []).filter((t: any) => t.status === "completed").length;
        }
        results.push({ count });
      } else if (/(discipline|project)/i.test(lower)) {
        results.push({ count: (this.data.disciplines || []).length });
      } else {
        results.push({
          disciplines: (this.data.disciplines || []).length,
          tasks: (this.data.tasks || []).length,
          observations: (this.data.observations || []).length
        });
      }
    }

    // UPDATE / MARK / COMPLETE
    else if (/^(mark|set|update|complete|finish).*(task|tasks)/i.test(lower)) {
      const taskIdMatch = lower.match(/(?:task|#)\s*(\d+)/);
      
      if (taskIdMatch && taskIdMatch[1]) {
        const taskId = parseInt(taskIdMatch[1]);
        const taskIndex = (this.data.tasks || []).findIndex((t: any) => t.id === taskId);
        
        if (taskIndex >= 0) {
          const task = this.data.tasks[taskIndex];
          
          if (/complete|finish|done/i.test(lower)) {
            task.status = "completed";
            task.completed_at = new Date().toISOString();
          } else if (/pending|active|uncomplete/i.test(lower)) {
            task.status = "pending";
            delete task.completed_at;
          }
          
          this.dataModified = true;
          operation = "UPDATE";
          results.push(task);
        } else {
          return { success: false, error: `Task ${taskId} not found` };
        }
      } else {
        // Mark first pending task as complete
        const pendingTask = (this.data.tasks || []).find((t: any) => t.status === "pending");
        if (pendingTask) {
          pendingTask.status = "completed";
          pendingTask.completed_at = new Date().toISOString();
          this.dataModified = true;
          operation = "UPDATE";
          results.push(pendingTask);
        } else {
          return { success: false, error: "No pending tasks found" };
        }
      }
    }

    // DELETE / REMOVE
    else if (/^(remove|delete|clear).*(task|tasks)/i.test(lower)) {
      const taskIdMatch = lower.match(/(?:task|#)\s*(\d+)/);
      
      if (taskIdMatch && taskIdMatch[1]) {
        const taskId = parseInt(taskIdMatch[1]);
        const initialLength = (this.data.tasks || []).length;
        this.data.tasks = (this.data.tasks || []).filter((t: any) => t.id !== taskId);
        
        if ((this.data.tasks || []).length < initialLength) {
          this.dataModified = true;
          operation = "DELETE";
          results.push({ deleted: true, task_id: taskId });
        } else {
          return { success: false, error: `Task ${taskId} not found` };
        }
      } else {
        // Delete completed tasks
        const initialLength = (this.data.tasks || []).length;
        this.data.tasks = (this.data.tasks || []).filter((t: any) => t.status !== "completed");
        const deleted = initialLength - (this.data.tasks || []).length;
        
        if (deleted > 0) {
          this.dataModified = true;
        }
        operation = "DELETE";
        results.push({ deleted: deleted, message: `Removed ${deleted} completed tasks` });
      }
    }

    else {
      return { success: false, error: `Could not understand query: "${input}"` };
    }

    await this.saveJsonData();
    return { success: true, sql: `JSON [${operation}]`, results };
  }

  private executeSQLite(sql: string): Promise<SqlifierResult> {
    return new Promise((resolve) => {
      try {
        const output = execSync(
          `sqlite3 "${this.dbPath}" "${sql.replace(/"/g, '\"')}" -json`,
          { encoding: "utf-8", timeout: 5000 }
        );
        
        resolve({
          success: true,
          sql,
          results: output ? JSON.parse(output) : []
        });
      } catch (error) {
        resolve({
          success: false,
          sql,
          error: `SQL execution error: ${error}`
        });
      }
    });
  }

  private parseToSql(input: string): string | null {
    const lower = input.toLowerCase().trim();
    
    // SELECT patterns
    if (/^(show|list|get|select|what|find).*(task|tasks|todo)/i.test(lower)) {
      let sql = "SELECT * FROM tasks";
      
      if (/pending|uncompleted|not done|active/i.test(lower)) {
        sql += " WHERE status = 'pending'";
      } else if (/completed|done/i.test(lower)) {
        sql += " WHERE status = 'completed'";
      }
      
      sql += " ORDER BY created_at DESC";
      
      const limitMatch = lower.match(/(\d+)\s*(task|item|row)/);
      if (limitMatch) {
        sql += ` LIMIT ${limitMatch[1]}`;
      }
      
      return sql;
    }
    
    // Discipline queries
    if (/disciplines?|projects?/i.test(lower)) {
      let sql = "SELECT * FROM disciplines";
      
      if (/required|mandatory|essential/i.test(lower)) {
        sql += " WHERE required = 1";
      }
      
      return sql;
    }
    
    // Observation queries
    if (/observations?|logs?|records?/i.test(lower)) {
      let sql = "SELECT * FROM observations ORDER BY created_at DESC LIMIT 50";
      
      if (/system|error|status|event/i.test(lower)) {
        const categoryMatch = lower.match(/\b(system|error|status|event)\b/);
        const category = categoryMatch ? categoryMatch[1] : null;
        if (category) {
          sql = `SELECT * FROM observations WHERE category = '${category}' ORDER BY created_at DESC LIMIT 50`;
        }
      }
      
      return sql;
    }
    
    // Registry queries
    if (/registry|config|settings?|version/i.test(lower)) {
      return "SELECT * FROM registry";
    }
    
    // Count queries
    if (/^(count|how many)/i.test(lower)) {
      if (/(task|tasks)/i.test(lower)) {
        let sql = "SELECT COUNT(*) as count FROM tasks";
        if (/pending|active/i.test(lower)) sql += " WHERE status = 'pending'";
        if (/completed/i.test(lower)) sql += " WHERE status = 'completed'";
        return sql;
      }
      if (/(discipline|project)/i.test(lower)) {
        return "SELECT COUNT(*) as count FROM disciplines";
      }
    }
    
    // INSERT patterns
    if (/^(add|create|new).*(task|item)/i.test(lower)) {
      const titleMatch = lower.match(/(?:task|item)\s+(?:called\s+)?["']?([^"']+?)["']?(?:\s+(?:with|described|about|that)|$)/i);
      const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "New Task";
      
      let priority = "normal";
      if (/high priority|urgent|important/i.test(lower)) priority = "high";
      else if (/low priority/i.test(lower)) priority = "low";
      
      return `INSERT INTO tasks (title, priority, status) VALUES ('${title.replace(/'/g, "''")}', '${priority}', 'pending')`;
    }
    
    // Log observation
    if (/^(log|record)/i.test(lower)) {
      const categoryMatch = lower.match(/\b(system|error|status|event|info)\b/);
      const category = categoryMatch ? categoryMatch[1] : "info";
      const contentMatch = lower.match(/(?:about|that|saying|note)\s+(.+)$/i);
      const logContent = contentMatch && contentMatch[1] ? contentMatch[1] : lower;
      return `INSERT INTO observations (category, content) VALUES ('${category}', '${logContent.replace(/'/g, "''")}')`;
    }
    
    // UPDATE patterns
    if (/^(mark|set|update|complete|finish)/i.test(lower)) {
      const taskIdMatch = lower.match(/(?:task|#)\s*(\d+)/);
      if (taskIdMatch && taskIdMatch[1]) {
        const taskId = taskIdMatch[1];
        if (/complete|finish|done/i.test(lower)) {
          return `UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ${taskId}`;
        }
        if (/pending|active/i.test(lower)) {
          return `UPDATE tasks SET status = 'pending', completed_at = NULL WHERE id = ${taskId}`;
        }
      }
    }
    
    // DELETE patterns
    if (/^(remove|delete|clear)/i.test(lower)) {
      const taskIdMatch = lower.match(/(?:task|#)\s*(\d+)/);
      if (taskIdMatch && taskIdMatch[1]) {
        return `DELETE FROM tasks WHERE id = ${taskIdMatch[1]}`;
      }
    }

    return null;
  }

  async getStats(): Promise<{ storage: string; tables: string; rows: Record<string, number> }> {
    await this.ensureDataLoaded();
    
    const isSqlite = await this.checkSqlite();
    const tables = ["disciplines", "tasks", "observations", "registry"];
    const rowCounts: Record<string, number> = {};
    
    if (isSqlite) {
      for (const table of tables) {
        try {
          const output = execSync(
            `sqlite3 "${this.dbPath}" "SELECT COUNT(*) FROM ${table}"`,
            { encoding: "utf-8", timeout: 5000 }
          );
          rowCounts[table] = parseInt(output.trim()) || 0;
        } catch {
          rowCounts[table] = 0;
        }
      }
      return { storage: "SQLite", tables: tables.join(", "), rows: rowCounts };
    } else {
      return { 
        storage: "JSON File", 
        tables: Object.keys(this.data).join(", "), 
        rows: {
          disciplines: (this.data.disciplines || []).length,
          tasks: (this.data.tasks || []).length,
          observations: (this.data.observations || []).length,
          registry: Object.keys(this.data.registry || {}).length
        }
      };
    }
  }

  async executeSql(sql: string): Promise<SqlifierResult> {
    await this.ensureDataLoaded();
    
    const isSqlite = await this.checkSqlite();
    
    if (isSqlite) {
      return this.executeSQLite(sql);
    } else {
      return this.executeJsonQuery(sql);
    }
  }
}

export const sqlifier = new Sqlifier();
