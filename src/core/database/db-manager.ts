import Database from 'better-sqlite3';
import * as fs from 'fs/promises';
import * as path from 'path';

import { wpath } from '../common/context';
import { BaseDBError } from '../common/exceptions';

/**
 * Database Manager using better-sqlite3
 * Provides synchronous database operations
 */
export class DBManager {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    const testDbPath = process.env.TEST_QMIN_DB;
    if (testDbPath) {
      this.dbPath = testDbPath;
    } else {
      this.dbPath = dbPath || wpath.qminDatabase;
    }

    // Create database if it doesn't exist
    this.createDbIfNotExists();

    // Connect to database
    try {
      this.db = new Database(this.dbPath, { fileMustExist: false });
      this.db.pragma('journal_mode = WAL');
    } catch (err) {
      throw new BaseDBError(`Error connecting to database: ${err}`);
    }
  }

  /**
   * Execute a query and return results
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Array of result rows
   */
  query<T = any>(sql: string, params?: any[]): T[] {
    try {
      const stmt = this.db.prepare(sql);
      return params ? (stmt.all(...params) as T[]) : (stmt.all() as T[]);
    } catch (err) {
      throw new BaseDBError(`Error executing query: ${err}`);
    }
  }

  /**
   * Execute a statement and return number of changes
   * @param sql - SQL statement
   * @param params - Statement parameters
   * @returns Number of rows affected
   */
  execute(sql: string, params?: any[]): number {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return result.changes;
    } catch (err) {
      throw new BaseDBError(`Error executing statement: ${err}`);
    }
  }

  /**
   * Execute an insert statement and return last rowid and changes
   * @param sql - SQL insert statement
   * @param params - Insert parameters
   * @returns Object with lastRowid and changes
   */
  insert(sql: string, params?: any[]): { lastRowid: number; changes: number } {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return {
        lastRowid: result.lastInsertRowid as number,
        changes: result.changes,
      };
    } catch (err) {
      throw new BaseDBError(`Error executing statement: ${err}`);
    }
  }

  /**
   * Get a single row from query
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Single row or undefined
   */
  get<T = any>(sql: string, params?: any[]): T | undefined {
    try {
      const stmt = this.db.prepare(sql);
      return params ? (stmt.get(...params) as T | undefined) : (stmt.get() as T | undefined);
    } catch (err) {
      throw new BaseDBError(`Error executing get: ${err}`);
    }
  }

  /**
   * Begin a transaction
   */
  beginTransaction(): Database.Transaction {
    return this.db.transaction(() => {});
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Create database from SQL file if it doesn't exist
   */
  private async createDbIfNotExists(): Promise<void> {
    try {
      await fs.access(this.dbPath);
      return; // Database exists
    } catch {
      // Database doesn't exist, create it
    }

    try {
      const sqlFile = wpath.getSqlFile();
      const sqlScript = await fs.readFile(sqlFile, 'utf-8');

      // Create temporary database for initialization
      const tempDb = new Database(this.dbPath);

      // Split and execute SQL statements
      const statements = sqlScript.split(';');
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          tempDb.exec(trimmed);
        }
      }

      // Insert default category
      const { mix } = await import('../utils/crypto');
      const { currentTimeObjToStr } = await import('../utils/common');
      tempDb
        .prepare("INSERT INTO doc_category ('name', 'space', 'create_time') VALUES (?, ?, ?)")
        .run(mix('默认'), 0, currentTimeObjToStr());

      tempDb.close();
    } catch (err) {
      throw new BaseDBError(`Error creating database: ${err}`);
    }
  }
}
