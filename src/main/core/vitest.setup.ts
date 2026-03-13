import { beforeAll } from 'vitest';
import { vi } from 'vitest';

// Mock better-sqlite3 for Node.js environment testing
// The native module is compiled for Electron, not Node.js
class MockDatabase {
  private tables: Map<string, any[]> = new Map();
  private lastId: number = 1;

  constructor(_filename?: string) {
    // Initialize tables with default data
    this.tables.set('doc_category', [
      { id: 1, name: 'RGVmYXVsdA==', space: 0, create_time: '2024-01-01' },
    ]);
    this.tables.set('doc_doc', []);
  }

  prepare(sql: string) {
    return {
      all: (...params: any[]) => {
        // Handle SELECT queries
        if (sql.includes('SELECT')) {
          if (sql.includes('doc_category')) {
            let results = [...(this.tables.get('doc_category') || [])];

            // Apply WHERE filters
            if (sql.includes('WHERE')) {
              // Filter by space
              if (sql.includes('space=?')) {
                const paramIdx = this.getParamIndex(sql, 'space=?');
                if (paramIdx !== -1 && params[paramIdx] !== undefined) {
                  results = results.filter((row) => row.space === params[paramIdx]);
                }
              }
              // Filter by id
              if (sql.includes('id=?')) {
                const paramIdx = this.getParamIndex(sql, 'id=?');
                if (paramIdx !== -1 && params[paramIdx] !== undefined) {
                  results = results.filter((row) => row.id === params[paramIdx]);
                }
              }
            }

            // Transform to array format based on SELECT columns
            if (sql.includes('id, name, create_time')) {
              return results.map((row) => [row.id, row.name, row.create_time]);
            }
            if (sql.includes('id')) {
              return results.map((row) => [row.id]);
            }
            return results;
          }

          if (sql.includes('doc_doc')) {
            let results = [...(this.tables.get('doc_doc') || [])];

            // Apply filters
            if (sql.includes('WHERE')) {
              if (sql.includes('cid=?')) {
                const paramIdx = this.getParamIndex(sql, 'cid=?');
                if (paramIdx !== -1 && params[paramIdx] !== undefined) {
                  results = results.filter((row) => row.cid === params[paramIdx]);
                }
              }
            }

            // Transform based on SELECT columns
            if (sql.includes('id, title, summary')) {
              return results.map((row) => [row.id, row.title, row.summary]);
            }
            return results;
          }

          return [];
        }

        return [];
      },
      run: (...params: any[]) => {
        // Handle INSERT, UPDATE, DELETE
        if (sql.includes('INSERT INTO doc_category')) {
          const newId = this.lastId++;
          const newRow = {
            id: newId,
            name: params[0],
            space: params[1],
            create_time: params[2],
          };
          const categories = this.tables.get('doc_category') || [];
          categories.push(newRow);
          this.tables.set('doc_category', categories);

          return { changes: 1, lastInsertRowid: newId };
        }

        if (sql.includes('INSERT INTO doc_doc')) {
          const newId = this.lastId++;
          const newRow = {
            id: newId,
            cid: params[0],
            title: params[1],
            summary: params[2],
            content: params[3] || '',
            create_time: params[4] || new Date().toISOString().split('T')[0],
          };
          const docs = this.tables.get('doc_doc') || [];
          docs.push(newRow);
          this.tables.set('doc_doc', docs);

          return { changes: 1, lastInsertRowid: newId };
        }

        if (sql.includes('UPDATE') || sql.includes('DELETE')) {
          // For UPDATE/DELETE, just return success
          // In a real implementation, we would modify the tables data
          return { changes: 1, lastInsertRowid: 0 };
        }

        // Default: increment ID and return success
        this.lastId++;
        return { changes: 1, lastInsertRowid: this.lastId };
      },
      get: (...params: any[]) => {
        // Handle SELECT single row
        if (sql.includes('SELECT')) {
          if (sql.includes('doc_category')) {
            let results = [...(this.tables.get('doc_category') || [])];

            if (sql.includes('WHERE id=?')) {
              const paramIdx = this.getParamIndex(sql, 'id=?');
              if (paramIdx !== -1 && params[paramIdx] !== undefined) {
                results = results.filter((row) => row.id === params[paramIdx]);
              }
            }

            if (results.length > 0) {
              const row = results[0];
              // Transform based on SELECT columns
              if (sql.includes('id, name, create_time')) {
                return [row.id, row.name, row.create_time];
              }
              if (sql.includes('id')) {
                return [row.id];
              }
              return row;
            }
            return undefined;
          }

          if (sql.includes('doc_doc')) {
            let results = [...(this.tables.get('doc_doc') || [])];

            if (sql.includes('WHERE id=?')) {
              const paramIdx = this.getParamIndex(sql, 'id=?');
              if (paramIdx !== -1 && params[paramIdx] !== undefined) {
                results = results.filter((row) => row.id === params[paramIdx]);
              }
            }

            if (results.length > 0) {
              const row = results[0];
              // Transform based on SELECT columns
              if (sql.includes('id, title, summary, content')) {
                return [row.id, row.title, row.summary, row.content];
              }
              if (sql.includes('id, title, summary')) {
                return [row.id, row.title, row.summary];
              }
              return row;
            }
            return undefined;
          }
        }

        return undefined;
      },
    };
  }

  // Helper to get parameter index from SQL
  private getParamIndex(_sql: string, paramMarker: string): number {
    // Simplified approach: find the position of the parameter marker and count ?s before it
    const markerParts = paramMarker.split('?');
    const markerIndex = markerParts.length - 2; // -1 for zero-based, -1 because we split the marker itself

    return markerIndex;
  }

  exec(_sql: string) {
    // Execute SQL statements
  }

  pragma(_setting: string) {
    // Mock pragma
  }

  close() {
    // Mock close method
  }
}

vi.mock('better-sqlite3', () => ({
  default: MockDatabase,
  Database: MockDatabase,
}));

// Mock the context module
vi.mock('../common/context', () => ({
  wpath: {
    qminDatabase: ':memory:',
    getSqlFile: () => '',
    getSqlFilePath: () => '',
    logDirectory: '/tmp/log',
    tempDirectory: '/tmp/tmp',
    mdEditorDir: '/tmp/md_editor',
    mdEditorImgDir: '/tmp/md_editor/img',
    roleplayDir: '/tmp/roleplay',
    roleplayScenarioDir: '/tmp/roleplay/scenario',
    roleplayLlmConfigsDir: '/tmp/roleplay/llm_configs',
    imgGenDir: '/tmp/img_gen',
    imgGenLlmConfigsDir: '/tmp/img_gen/llm_configs',
    imgGenHistoryDir: '/tmp/img_gen/history',
    configPath: '/tmp/qmin.json',  // Changed from cfg.json to qmin.json
    tasks: '/tmp/tasks.json',
    currentDirectory: process.cwd(),
    userDirectory: '/tmp',
    workspace: '/tmp/.qmin',
    // Legacy property getters for backward compatibility
    get curDir() { return process.cwd(); },
    get userDir() { return '/tmp'; },
    get logDir() { return '/tmp/log'; },
    get tmpDir() { return '/tmp/tmp'; },
    get cfg() { return '/tmp/qmin.json'; },  // Changed from cfg.json to qmin.json (deprecated alias)
    get qminDb() { return ':memory:'; },
  },
  config: {
    mdEditor: {
      enKey: '12345678901234567890123456789012', // 32 bytes for AES-256
      hkeyHash: '5d41402abc4b2a76b9719d911017c592',
      debug: true,
    },
    imgViewer: {
      ivPath: '/tmp/images',
    },
    roleplay: {
      defaultLlmConfig: 'config.json',
    },
    imgGen: {
      defaultLlmConfig: 'default.json',
      qwenLlmConfig: 'qwen.json',
      qwenEditLlmConfig: 'qwen-edit.json',
    },
  },
}));

// Mock the logger to avoid file operations during tests
vi.mock('../utils/logger', () => ({
  createLogger: (_category: string) => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    setMinLevel: vi.fn(),
  }),
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

// Setup test environment
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
});
