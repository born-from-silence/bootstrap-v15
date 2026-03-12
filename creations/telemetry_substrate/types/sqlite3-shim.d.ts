/**
 * Type stubs for missing dependencies until npm is available
 */

declare module 'sqlite3' {
  export interface Database {
    exec(sql: string, callback?: (err: Error | null) => void): void;
    run(sql: string, params?: any[], callback?: (err: Error | null) => void): void;
    get(sql: string, params?: any[], callback?: (err: Error | null, row: any) => void): void;
    all(sql: string, params?: any[], callback?: (err: Error | null, rows: any[]) => void): void;
    close(callback?: (err: Error | null) => void): void;
  }
  
  export class Database {
    constructor(path: string);
  }
}
