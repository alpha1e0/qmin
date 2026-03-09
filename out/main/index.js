"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const Database = require("better-sqlite3");
const uuid = require("uuid");
const crypto$1 = require("crypto");
const sharp = require("sharp");
const OpenAI = require("openai");
const axios = require("axios");
const https = require("https");
const http = require("http");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const crypto__namespace = /* @__PURE__ */ _interopNamespaceDefault(crypto$1);
const https__namespace = /* @__PURE__ */ _interopNamespaceDefault(https);
const http__namespace = /* @__PURE__ */ _interopNamespaceDefault(http);
const IPC_CHANNELS = {
  // Common channels
  GET_VERSION: "qmin:get-version",
  GET_CONFIG: "qmin:get-config",
  READ_CONFIG: "qmin:read-config",
  // Markdown Editor channels
  MD_GET_CATEGORY_LIST: "qmin:md:get-category-list",
  MD_GET_CATEGORY_BY_ID: "qmin:md:get-category-by-id",
  MD_CREATE_CATEGORY: "qmin:md:create-category",
  MD_UPDATE_CATEGORY: "qmin:md:update-category",
  MD_DELETE_CATEGORY: "qmin:md:delete-category",
  MD_GET_DOC_LIST: "qmin:md:get-doc-list",
  MD_GET_DOC_BY_ID: "qmin:md:get-doc-by-id",
  MD_CREATE_DOC: "qmin:md:create-doc",
  MD_UPDATE_DOC: "qmin:md:update-doc",
  MD_DELETE_DOC: "qmin:md:delete-doc",
  MD_SAVE_IMAGE: "qmin:md:save-image",
  MD_GET_IMAGE: "qmin:md:get-image",
  MD_VERIFY_HKEY: "qmin:md:verify-hkey",
  // Image Viewer channels
  IV_GET_DIRECTORIES: "qmin:iv:get-directories",
  IV_REFRESH_DIRECTORIES: "qmin:iv:refresh-directories",
  IV_GET_DIRS_TO_INDEX: "qmin:iv:get-dirs-to-index",
  IV_HAS_INDEXING: "qmin:iv:has-indexing",
  IV_START_INDEX: "qmin:iv:start-index",
  IV_GET_IMAGES: "qmin:iv:get-images",
  IV_GET_IMAGE: "qmin:iv:get-image",
  IV_GET_IMAGE_INFO: "qmin:iv:get-image-info",
  IV_GET_META: "qmin:iv:get-meta",
  IV_UPDATE_SCORE: "qmin:iv:update-score",
  IV_CLASSIFY: "qmin:iv:classify",
  IV_IS_CLASSIFIED: "qmin:iv:is-classified",
  IV_REMOVE_DIR: "qmin:iv:remove-dir",
  IV_REMOVE_INDEX: "qmin:iv:remove-index",
  // Indexing progress events (one-way communication from main to renderer)
  IV_INDEX_PROGRESS: "qmin:iv:index-progress",
  IV_ALL_INDEX_PROGRESS: "qmin:iv:all-index-progress",
  // Task Manager channels
  TM_GET_ALL_TASKS: "qmin:tm:get-all-tasks",
  TM_GET_TASK: "qmin:tm:get-task",
  TM_CREATE_TASK: "qmin:tm:create-task",
  TM_REMOVE_TASK: "qmin:tm:remove-task",
  // Roleplay channels
  RP_LIST_SCENARIOS: "qmin:rp:list-scenarios",
  RP_GET_SCENARIO: "qmin:rp:get-scenario",
  RP_CREATE_SCENARIO: "qmin:rp:create-scenario",
  RP_UPDATE_SCENARIO: "qmin:rp:update-scenario",
  RP_DELETE_SCENARIO: "qmin:rp:delete-scenario",
  RP_LIST_HISTORIES: "qmin:rp:list-histories",
  RP_GET_HISTORY: "qmin:rp:get-history",
  RP_CREATE_HISTORY: "qmin:rp:create-history",
  RP_SAVE_HISTORY: "qmin:rp:save-history",
  RP_DELETE_HISTORY: "qmin:rp:delete-history",
  RP_LIST_LLM_CONFIGS: "qmin:rp:list-llm-configs",
  RP_GET_LLM_CONFIG: "qmin:rp:get-llm-config",
  RP_SAVE_LLM_CONFIG: "qmin:rp:save-llm-config",
  // Image Generation channels
  IMG_GENERATE: "qmin:img:generate",
  IMG_GENERATE_QWEN: "qmin:img:generate-qwen",
  IMG_LIST_HISTORY: "qmin:img:list-history",
  IMG_GET_HISTORY: "qmin:img:get-history",
  IMG_DELETE_HISTORY: "qmin:img:delete-history",
  IMG_LIST_LLM_CONFIGS: "qmin:img:list-llm-configs",
  IMG_GET_LLM_CONFIG: "qmin:img:get-llm-config",
  IMG_SAVE_LLM_CONFIG: "qmin:img:save-llm-config"
};
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  LogLevel2[LogLevel2["FATAL"] = 4] = "FATAL";
  return LogLevel2;
})(LogLevel || {});
const DEFAULT_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,
  // 10MB
  maxFiles: 30,
  retentionDays: 30
};
class Logger {
  constructor(category, minLevel = 1, logToFile = true, config2) {
    this.currentFileSize = /* @__PURE__ */ new Map();
    this.cleanupScheduled = false;
    this.category = category;
    this.minLevel = minLevel;
    this.logToFile = logToFile;
    this.config = { ...DEFAULT_CONFIG, ...config2 };
    if (this.logToFile) {
      this.scheduleCleanup();
    }
  }
  /**
   * Log debug message
   * @param message - Log message
   * @param data - Optional data to include
   */
  debug(message, data) {
    this.log(0, message, data);
  }
  /**
   * Log info message
   * @param message - Log message
   * @param data - Optional data to include
   */
  info(message, data) {
    this.log(1, message, data);
  }
  /**
   * Log warning message
   * @param message - Log message
   * @param data - Optional data to include
   */
  warn(message, data) {
    this.log(2, message, data);
  }
  /**
   * Log error message
   * @param message - Log message
   * @param error - Optional error object
   * @param data - Optional additional data
   */
  error(message, error2, data) {
    this.log(3, message, data, error2);
  }
  /**
   * Log fatal error message
   * @param message - Log message
   * @param error - Optional error object
   * @param data - Optional additional data
   */
  fatal(message, error2, data) {
    this.log(4, message, data, error2);
  }
  /**
   * Core logging method
   */
  log(level, message, data, error2) {
    if (level < this.minLevel) {
      return;
    }
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: LogLevel[level],
      category: this.category,
      message,
      data
    };
    if (error2) {
      entry.error = this.extractErrorInfo(error2);
    }
    this.logToConsole(entry);
    if (this.logToFile) {
      this.logToFileAsync(entry).catch((err) => {
        console.error("Failed to write log to file:", err);
      });
    }
  }
  /**
   * Log to console with appropriate formatting
   */
  logToConsole(entry) {
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;
    switch (entry.level) {
      case "DEBUG":
        console.debug(message, entry.data || "");
        break;
      case "INFO":
        console.info(message, entry.data || "");
        break;
      case "WARN":
        console.warn(message, entry.data || "");
        break;
      case "ERROR":
      case "FATAL":
        console.error(message, entry.data || "", entry.error || "");
        break;
    }
  }
  /**
   * Log to file asynchronously with rotation
   */
  async logToFileAsync(entry) {
    try {
      const logLine = JSON.stringify(entry) + "\n";
      const logFileName = this.getLogFileName();
      const logFile = path__namespace.join(wpath.logDirectory, logFileName);
      await this.rotateIfNeeded(logFile, logLine.length);
      await fs__namespace.appendFile(logFile, logLine, "utf-8");
    } catch (err) {
    }
  }
  /**
   * Rotate log file if it exceeds max size
   */
  async rotateIfNeeded(logFile, newEntrySize) {
    try {
      const currentSize = this.currentFileSize.get(logFile) || await this.getFileSize(logFile);
      if (currentSize + newEntrySize > this.config.maxFileSize) {
        await this.rotateLogFile(logFile);
        this.currentFileSize.set(logFile, 0);
      } else {
        this.currentFileSize.set(logFile, currentSize + newEntrySize);
      }
    } catch (err) {
    }
  }
  /**
   * Get file size
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs__namespace.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
  /**
   * Rotate log file by renaming with timestamp
   */
  async rotateLogFile(logFile) {
    try {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const rotatedFile = logFile.replace(".log", `.${timestamp}.log`);
      await fs__namespace.rename(logFile, rotatedFile);
      await this.cleanOldRotatedFiles(logFile);
    } catch (err) {
    }
  }
  /**
   * Clean up old rotated log files
   */
  async cleanOldRotatedFiles(baseLogFile) {
    try {
      const logDir = path__namespace.dirname(baseLogFile);
      const baseName = path__namespace.basename(baseLogFile, ".log");
      const files = await fs__namespace.readdir(logDir);
      const rotatedFiles = files.filter((f) => f.startsWith(`${baseName}.`) && f.endsWith(".log")).map((f) => path__namespace.join(logDir, f));
      const fileStats = await Promise.all(
        rotatedFiles.map(async (f) => ({
          path: f,
          mtime: (await fs__namespace.stat(f)).mtime.getTime()
        }))
      );
      fileStats.sort((a, b) => a.mtime - b.mtime);
      while (fileStats.length > this.config.maxFiles) {
        const toRemove = fileStats.shift();
        if (toRemove) {
          await fs__namespace.unlink(toRemove.path).catch(() => {
          });
        }
      }
    } catch (err) {
    }
  }
  /**
   * Schedule periodic cleanup of old log files
   */
  scheduleCleanup() {
    if (this.cleanupScheduled) return;
    this.cleanupScheduled = true;
    setInterval(
      () => {
        this.cleanOldLogs().catch((err) => {
        });
      },
      60 * 60 * 1e3
    );
    setTimeout(() => {
      this.cleanOldLogs().catch(() => {
      });
    }, 5e3);
  }
  /**
   * Clean up logs older than retention period
   */
  async cleanOldLogs() {
    try {
      const logDir = wpath.logDirectory;
      const files = await fs__namespace.readdir(logDir);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1e3;
      for (const file of files) {
        if (!file.endsWith(".log")) continue;
        const filePath = path__namespace.join(logDir, file);
        const stats = await fs__namespace.stat(filePath);
        const age = now - stats.mtime.getTime();
        if (age > retentionMs) {
          await fs__namespace.unlink(filePath).catch(() => {
          });
        }
      }
    } catch (err) {
    }
  }
  /**
   * Get log file name based on date
   */
  getLogFileName() {
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return `qmin-${date}.log`;
  }
  /**
   * Extract error information from Error object or unknown type
   */
  extractErrorInfo(error2) {
    if (error2 instanceof Error) {
      return {
        name: error2.name,
        message: error2.message,
        stack: error2.stack
      };
    }
    return {
      name: "UnknownError",
      message: String(error2)
    };
  }
  /**
   * Set minimum log level
   */
  setMinLevel(level) {
    this.minLevel = level;
  }
  /**
   * Update logger configuration
   */
  updateConfig(config2) {
    this.config = { ...this.config, ...config2 };
  }
}
function createLogger(category, minLevel = 1, config2) {
  return new Logger(category, minLevel, true, config2);
}
new Logger(
  "qmin",
  1
  /* INFO */
);
const logger$k = createLogger("Context");
class WPath {
  // Legacy property aliases for backward compatibility
  /** @deprecated Use currentDirectory instead */
  get curDir() {
    return this.currentDirectory;
  }
  /** @deprecated Use userDirectory instead */
  get userDir() {
    return this.userDirectory;
  }
  /** @deprecated Use logDirectory instead */
  get logDir() {
    return this.logDirectory;
  }
  /** @deprecated Use tempDirectory instead */
  get tmpDir() {
    return this.tempDirectory;
  }
  /** @deprecated Use configPath instead */
  get cfg() {
    return this.configPath;
  }
  /** @deprecated Use qminDatabase instead */
  get qminDb() {
    return this.qminDatabase;
  }
  constructor() {
    this.currentDirectory = process.cwd();
    this.userDirectory = os__namespace.homedir();
    if (!fs__namespace.access(this.userDirectory).catch(() => true)) {
      this.userDirectory = this.currentDirectory;
    }
    const envWorkspace = process.env.QMIN_WORKSPACE;
    if (envWorkspace) {
      this.workspace = envWorkspace;
    } else {
      this.workspace = path__namespace.join(this.userDirectory, ".qmin");
    }
    this.ensureDirectory(this.workspace);
    logger$k.info(`Workspace initialized: '${this.workspace}'`);
    this.logDirectory = path__namespace.join(this.workspace, "log");
    this.ensureDirectory(this.logDirectory);
    this.tempDirectory = path__namespace.join(this.workspace, "tmp");
    this.ensureDirectory(this.tempDirectory);
    this.mdEditorDir = path__namespace.join(this.workspace, "md_editor");
    this.ensureDirectory(this.mdEditorDir);
    this.mdEditorImgDir = path__namespace.join(this.mdEditorDir, "img");
    this.ensureDirectory(this.mdEditorImgDir);
    this.roleplayDir = path__namespace.join(this.workspace, "roleplay");
    this.ensureDirectory(this.roleplayDir);
    this.roleplayScenarioDir = path__namespace.join(this.roleplayDir, "scenario");
    this.ensureDirectory(this.roleplayScenarioDir);
    this.roleplayLlmConfigsDir = path__namespace.join(this.roleplayDir, "llm_configs");
    this.ensureDirectory(this.roleplayLlmConfigsDir);
    this.imgGenDir = path__namespace.join(this.workspace, "img_gen");
    this.ensureDirectory(this.imgGenDir);
    this.imgGenLlmConfigsDir = path__namespace.join(this.imgGenDir, "llm_configs");
    this.ensureDirectory(this.imgGenLlmConfigsDir);
    this.imgGenHistoryDir = path__namespace.join(this.imgGenDir, "history");
    this.ensureDirectory(this.imgGenHistoryDir);
    this.configPath = path__namespace.join(this.workspace, "cfg.json");
    this.qminDatabase = path__namespace.join(this.workspace, "qmin.db");
    this.tasks = path__namespace.join(this.workspace, "tasks.json");
  }
  /**
   * Get SQL file path for database initialization
   */
  getSqlFile() {
    return path__namespace.join(process.resourcesPath || process.cwd(), "data", "qmin.sql");
  }
  /**
   * Get SQL file path for database initialization
   * @deprecated Use getSqlFile() instead
   */
  getSqlFilePath() {
    return this.getSqlFile();
  }
  /**
   * Ensure a directory exists, create it if not
   */
  ensureDirectory(dirPath) {
    try {
      fs__namespace.access(dirPath).catch(() => {
        fs__namespace.mkdir(dirPath, { recursive: true, mode: 448 });
      });
    } catch (err) {
      logger$k.error(`Failed to ensure directory ${dirPath}`, err);
    }
  }
}
class Config {
  constructor() {
    this.mdEditor = {
      enKey: "",
      hkeyHash: "",
      debug: true
    };
    this.imgViewer = {
      ivPath: "dir_not_exists"
    };
    this.roleplay = {
      defaultLlmConfig: "config.json"
    };
    this.imgGen = {
      defaultLlmConfig: "default.json",
      qwenLlmConfig: "qwen.json",
      qwenEditLlmConfig: "qwen-edit.json"
    };
  }
  /**
   * Initialize configuration from JSON file
   */
  async initConfig(cfgPath) {
    try {
      const data = await fs__namespace.readFile(cfgPath, "utf-8");
      const cfgObj = JSON.parse(data);
      if (cfgObj.md_editor) {
        this.mdEditor.enKey = cfgObj.md_editor.en_key ?? "";
        this.mdEditor.hkeyHash = cfgObj.md_editor.hkey_hash ?? "";
        this.mdEditor.debug = cfgObj.md_editor.debug ?? true;
      }
      if (cfgObj.img_viewer) {
        this.imgViewer.ivPath = cfgObj.img_viewer.iv_path ?? "dir_not_exists";
      }
      if (cfgObj.roleplay) {
        this.roleplay.defaultLlmConfig = cfgObj.roleplay.default_llm_config ?? "config.json";
      }
      if (cfgObj.img_gen) {
        this.imgGen.defaultLlmConfig = cfgObj.img_gen.default_llm_config ?? "default.json";
        this.imgGen.qwenLlmConfig = cfgObj.img_gen.qwen_llm_config ?? "qwen.json";
        this.imgGen.qwenEditLlmConfig = cfgObj.img_gen.qwen_edit_llm_config ?? "qwen-edit.json";
      }
    } catch (err) {
      throw new Error(`Cannot read config file '${cfgPath}': ${err}`);
    }
  }
}
const wpath = new WPath();
const config = new Config();
const context = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Config,
  WPath,
  config,
  wpath
}, Symbol.toStringTag, { value: "Module" }));
const VERSION = "1.0.0";
const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".JPG": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".JPEG": "image/jpeg",
  ".png": "image/png",
  ".PNG": "image/png",
  ".gif": "image/gif",
  ".GIF": "image/gif"
};
const IV_CACHE_DIR = ".qmin_index";
const IV_OP_RESULT_DIR = ".qmin_op_result";
const IV_RESTORE_DIR = ".qmin_restore";
const IV_OP_DB_FILE = "op.json";
const IV_DIR_DB_FILE = ".qmin_dir.json";
const logger$j = createLogger("IPC:Common");
function registerCommonHandlers() {
  electron.ipcMain.handle(IPC_CHANNELS.GET_VERSION, async () => {
    logger$j.debug("Get application version");
    return VERSION;
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_CONFIG, async () => {
    logger$j.debug("Get current config");
    return {
      mdEditor: {
        debug: config.mdEditor.debug
      },
      imgViewer: {
        ivPath: config.imgViewer.ivPath
      }
    };
  });
  electron.ipcMain.handle(IPC_CHANNELS.READ_CONFIG, async () => {
    logger$j.debug("Read config from file");
    const fs2 = await import("fs/promises");
    const configPath = require("path").join(process.cwd(), "qmin.json");
    try {
      const data = await fs2.readFile(configPath, "utf-8");
      logger$j.info("Config file read successfully");
      return JSON.parse(data);
    } catch (err) {
      logger$j.error("Failed to read config file", err);
      throw new Error("Failed to read config file");
    }
  });
}
class QminException extends Error {
  constructor(msg, errCode = "B_001") {
    super(msg);
    this.name = this.constructor.name;
    this.errorCode = errCode;
    Object.setPrototypeOf(this, QminException.prototype);
  }
  toString() {
    return `${this.name} [${this.errorCode}] ${this.message}`;
  }
  toJSON() {
    return {
      success: false,
      err_code: this.errorCode,
      err_msg: this.message
    };
  }
}
class BaseDBError extends QminException {
  constructor(msg) {
    super(msg, "BASE_001");
  }
}
class MdEditorDBOpError extends QminException {
  constructor(msg) {
    super(msg, "ME_001");
  }
}
class MdEditorOpNotAllowed extends QminException {
  constructor(msg) {
    super(msg, "ME_002");
  }
}
class MdEditorImgOpError extends QminException {
  constructor(msg) {
    super(msg, "ME_003");
  }
}
class ImageBasePathNotExists extends QminException {
  constructor(msg) {
    super(msg, "IV_001");
  }
}
class ImagePathNotExists extends QminException {
  constructor(msg) {
    super(msg, "IV_002");
  }
}
class ImageCacheNotExists extends QminException {
  constructor(msg) {
    super(msg, "IV_003");
  }
}
class ImageDirRemoveError extends QminException {
  constructor(msg) {
    super(msg, "IV_005");
  }
}
class DBManager {
  constructor(dbPath) {
    const testDbPath = process.env.TEST_QMIN_DB;
    if (testDbPath) {
      this.dbPath = testDbPath;
    } else {
      this.dbPath = dbPath || wpath.qminDatabase;
    }
    this.createDbIfNotExists();
    try {
      this.db = new Database(this.dbPath, { fileMustExist: false });
      this.db.pragma("journal_mode = WAL");
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
  query(sql, params) {
    try {
      const stmt = this.db.prepare(sql);
      return params ? stmt.all(...params) : stmt.all();
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
  execute(sql, params) {
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
  insert(sql, params) {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return {
        lastRowid: result.lastInsertRowid,
        changes: result.changes
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
  get(sql, params) {
    try {
      const stmt = this.db.prepare(sql);
      return params ? stmt.get(...params) : stmt.get();
    } catch (err) {
      throw new BaseDBError(`Error executing get: ${err}`);
    }
  }
  /**
   * Begin a transaction
   */
  beginTransaction() {
    return this.db.transaction(() => {
    });
  }
  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
  /**
   * Create database from SQL file if it doesn't exist
   */
  async createDbIfNotExists() {
    try {
      await fs__namespace.access(this.dbPath);
      return;
    } catch {
    }
    try {
      const sqlFile = wpath.getSqlFile();
      const sqlScript = await fs__namespace.readFile(sqlFile, "utf-8");
      const tempDb = new Database(this.dbPath);
      const statements = sqlScript.split(";");
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          tempDb.exec(trimmed);
        }
      }
      const { mix: mix2 } = await Promise.resolve().then(() => crypto);
      const { currentTimeObjToStr: currentTimeObjToStr2 } = await Promise.resolve().then(() => common);
      tempDb.prepare("INSERT INTO doc_category ('name', 'space', 'create_time') VALUES (?, ?, ?)").run(mix2("默认"), 0, currentTimeObjToStr2());
      tempDb.close();
    } catch (err) {
      throw new BaseDBError(`Error creating database: ${err}`);
    }
  }
}
function currentTimeObjToStr() {
  const now = /* @__PURE__ */ new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
function timeStrToObj(strTime) {
  const [datePart, timePart] = strTime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
function generateRandomString(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function generateUniqueId() {
  return uuid.v4();
}
function getFileSizeMB(filePath) {
  const stats = require("fs").statSync(filePath);
  return Math.round(stats.size / 1024 / 1024 * 1e3) / 1e3;
}
function getFileSizeBytes(filePath) {
  const stats = require("fs").statSync(filePath);
  return stats.size;
}
async function fileExists(filePath) {
  try {
    await fs__namespace.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function directoryExists(dirPath) {
  try {
    const stats = await fs__namespace.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function readJsonFile(filePath) {
  const content = await fs__namespace.readFile(filePath, "utf-8");
  return JSON.parse(content);
}
async function writeJsonFile(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  await fs__namespace.writeFile(filePath, content, "utf-8");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isDevelopment$1() {
  return process.env.NODE_ENV !== "production";
}
function isWindows() {
  return process.platform === "win32";
}
function isMacOS() {
  return process.platform === "darwin";
}
function isLinux() {
  return process.platform === "linux";
}
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function truncateString(str, maxLength, suffix = "...") {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
const common = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  currentTimeObjToStr,
  debounce,
  directoryExists,
  fileExists,
  formatNumber,
  generateRandomString,
  generateUniqueId,
  getFileSizeBytes,
  getFileSizeMB,
  isDevelopment: isDevelopment$1,
  isLinux,
  isMacOS,
  isWindows,
  readJsonFile,
  sleep,
  throttle,
  timeStrToObj,
  truncateString,
  writeJsonFile
}, Symbol.toStringTag, { value: "Module" }));
function encrypt(content, key) {
  const iv = crypto__namespace.randomBytes(12);
  const cipher = crypto__namespace.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(content, "utf8", "binary");
  encrypted += cipher.final("binary");
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "binary")]);
  return combined.toString("base64");
}
function decrypt(content, key) {
  const combinedBuffer = Buffer.from(content, "base64");
  const iv = combinedBuffer.subarray(0, 12);
  const authTag = combinedBuffer.subarray(12, 28);
  const encrypted = combinedBuffer.subarray(28);
  const decipher = crypto__namespace.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, void 0, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function b64Encode(content) {
  return Buffer.from(content, "utf8").toString("base64");
}
function b64Decode(content) {
  return Buffer.from(content, "base64").toString("utf8");
}
function urlSafeB64Encode(content) {
  return b64Encode(content).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function urlSafeB64Decode(content) {
  let str = content.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return b64Decode(str);
}
function mix(content) {
  {
    return b64Encode(content);
  }
}
function unmix(content) {
  {
    return b64Decode(content);
  }
}
function md5sum(content) {
  return crypto__namespace.createHash("md5").update(content, "utf8").digest("hex");
}
const crypto = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  b64Decode,
  b64Encode,
  decrypt,
  encrypt,
  md5sum,
  mix,
  unmix,
  urlSafeB64Decode,
  urlSafeB64Encode
}, Symbol.toStringTag, { value: "Module" }));
const logger$i = createLogger("MdEditorService");
class MdEditorService {
  constructor() {
    this.dbm = new DBManager();
  }
  getDbManager() {
    return this.dbm;
  }
  /**
   * Get all category list
   * @returns List of [id, name, create_time]
   */
  async getCategoryListAll() {
    const result = this.dbm.query(
      "SELECT id, name, create_time FROM doc_category"
    );
    return result.map((item) => [item[0], unmix(item[1]), item[2]]);
  }
  /**
   * Get category list for a specific space
   * @param space - Space ID
   * @returns List of [id, name, create_time]
   */
  async getCategoryList(space = 0) {
    const result = this.dbm.query(
      "SELECT id, name, create_time FROM doc_category WHERE space=?",
      [space]
    );
    return result.map((item) => [item[0], unmix(item[1]), item[2]]);
  }
  /**
   * Get category by ID
   * @param id - Category ID
   * @returns [id, name, space, create_time]
   */
  async getCategoryById(id) {
    const result = this.dbm.get(
      "SELECT id, name, space, create_time FROM doc_category WHERE id=?",
      [id]
    );
    if (!result) {
      throw new MdEditorDBOpError(`DB category ${id} not exists`);
    }
    return [result[0], unmix(result[1]), result[2], result[3]];
  }
  /**
   * Create a category
   * @param name - Category name
   * @param space - Space ID
   * @returns New category ID
   */
  async createCategory(name, space = 0) {
    const sql = "INSERT INTO doc_category ('name', 'space', 'create_time') VALUES (?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [mix(name), space, currentTimeObjToStr()]);
    if (lastRowid > 0) {
      return lastRowid;
    }
    throw new MdEditorDBOpError("DB add category to database failed");
  }
  /**
   * Update a category
   * @param id - Category ID
   * @param params - Update parameters
   */
  async updateCategory(id, params) {
    if (id === 1) {
      throw new MdEditorOpNotAllowed("Default category cannot be modified");
    }
    const updateParts = [];
    const values = [];
    if (params.name !== void 0) {
      updateParts.push("name=?");
      values.push(mix(params.name));
    }
    if (params.space !== void 0) {
      updateParts.push("space=?");
      values.push(params.space);
    }
    if (updateParts.length === 0) {
      return;
    }
    values.push(id);
    const sql = `UPDATE doc_category SET ${updateParts.join(", ")} WHERE id=?`;
    const changes = this.dbm.execute(sql, values);
    if (changes < 1) {
      throw new MdEditorDBOpError(`DB update category ${id} failed`);
    }
  }
  /**
   * Delete a category
   * @param id - Category ID
   */
  async deleteCategory(id) {
    if (id === 1) {
      throw new MdEditorOpNotAllowed("Default category cannot be deleted");
    }
    const changes = this.dbm.execute("DELETE FROM doc_category WHERE id=?", [id]);
    if (changes < 1) {
      throw new MdEditorDBOpError(`DB delete category ${id} failed`);
    }
  }
  /**
   * Get document count for a category
   * @param cId - Category ID
   * @returns Document count
   */
  async getDocCount(cId) {
    const result = this.dbm.get(
      "SELECT COUNT(id) AS count FROM doc WHERE category_id=?",
      [cId]
    );
    return result?.count || 0;
  }
  /**
   * Get document list for a category
   * @param cId - Category ID
   * @returns List of [id, title, summary, create_time, modify_time]
   */
  async getDocList(cId) {
    await this.getCategoryById(cId);
    const result = this.dbm.query(
      "SELECT id, title, summary, create_time, modify_time FROM doc WHERE category_id=?",
      [cId]
    );
    return result.map((item) => [item[0], unmix(item[1]), unmix(item[2]), item[3], item[4]]);
  }
  /**
   * Get document by ID
   * @param id - Document ID
   * @returns [id, title, summary, content, create_time, modify_time]
   */
  async getDocById(id) {
    const result = this.dbm.get(
      "SELECT id, title, summary, content, create_time, modify_time FROM doc WHERE id=?",
      [id]
    );
    if (!result) {
      throw new MdEditorDBOpError(`DB get doc ${id} failed`);
    }
    const doc = [
      result[0],
      unmix(result[1]),
      unmix(result[2]),
      "",
      result[4],
      result[5]
    ];
    if (result[3] !== "") {
      doc[3] = this.decryptContent(result[3]);
    }
    return doc;
  }
  /**
   * Create a document
   * @param cid - Category ID
   * @param title - Document title
   * @param summary - Document summary
   * @returns New document ID
   */
  async createDoc(cid, title, summary) {
    const sql = "INSERT INTO doc ('title', 'summary', 'category_id', 'content', 'create_time', 'modify_time') VALUES (?, ?, ?, ?, ?, ?)";
    const initialContent = this.encryptContent(`# ${title}
`);
    const now = currentTimeObjToStr();
    const { lastRowid } = this.dbm.insert(sql, [
      mix(title),
      mix(summary),
      cid,
      initialContent,
      now,
      now
    ]);
    if (lastRowid > 0) {
      return lastRowid;
    }
    throw new MdEditorDBOpError("DB create doc failed");
  }
  /**
   * Update a document
   * @param id - Document ID
   * @param docParams - Update parameters
   */
  async updateDoc(id, docParams) {
    const updateParts = [];
    const values = [];
    if (docParams.content !== void 0 && docParams.content !== null) {
      const encryptedDoc = this.encryptContent(docParams.content);
      updateParts.push("content=?");
      values.push(encryptedDoc);
    }
    if (docParams.title !== void 0 && docParams.title !== null) {
      updateParts.push("title=?");
      values.push(mix(docParams.title));
    }
    if (docParams.summary !== void 0 && docParams.summary !== null) {
      updateParts.push("summary=?");
      values.push(mix(docParams.summary));
    }
    updateParts.push("modify_time=?");
    values.push(currentTimeObjToStr());
    values.push(id);
    const sql = `UPDATE doc SET ${updateParts.join(", ")} WHERE id=?`;
    const changes = this.dbm.execute(sql, values);
    if (changes < 1) {
      throw new MdEditorDBOpError(`DB update doc ${id} failed`);
    }
  }
  /**
   * Delete a document
   * @param id - Document ID
   */
  async deleteDoc(id) {
    const changes = this.dbm.execute("DELETE FROM doc WHERE id=?", [id]);
    if (changes < 1) {
      throw new MdEditorDBOpError(`DB delete doc ${id} failed`);
    }
  }
  /**
   * Save an image
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  async saveImage(filePath) {
    {
      return await this.saveImageToFile(filePath);
    }
  }
  /**
   * Save image to database
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  async saveImageToDb(filePath) {
    const name = path__namespace.basename(filePath);
    const ext = path__namespace.extname(filePath);
    const content = await fs__namespace.readFile(filePath);
    const sql = "INSERT INTO image ('name', 'content', 'ext', 'create_time') VALUES (?, ?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [name, content, ext, currentTimeObjToStr()]);
    if (lastRowid > 0) {
      return [lastRowid, name];
    }
    throw new MdEditorImgOpError("DB save image failed");
  }
  /**
   * Save image metadata to database and copy file to upload directory
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  async saveImageToFile(filePath) {
    const name = path__namespace.basename(filePath);
    const ext = path__namespace.extname(filePath);
    const sql = "INSERT INTO image ('name', 'content', 'ext', 'create_time') VALUES (?, ?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [name, Buffer.alloc(0), ext, currentTimeObjToStr()]);
    if (lastRowid < 1) {
      throw new MdEditorImgOpError("DB save image meta failed");
    }
    const newPath = path__namespace.join(wpath.mdEditorImgDir, `${lastRowid}${ext}`);
    await fs__namespace.copyFile(filePath, newPath);
    const changes = this.dbm.execute("UPDATE image SET save_path=? WHERE id=?", [
      newPath,
      lastRowid
    ]);
    if (changes < 1) {
      throw new MdEditorImgOpError("DB update image path failed");
    }
    return [lastRowid, name];
  }
  /**
   * Get image by ID
   * @param id - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  async getImage(id) {
    {
      return await this.getImageFromFile(id);
    }
  }
  /**
   * Get image from database
   * @param imgId - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  async getImageFromDb(imgId) {
    const result = this.dbm.get(
      "SELECT name, content, ext FROM image WHERE id=?",
      [imgId]
    );
    if (!result) {
      logger$i.error(`Get image from DB with id=${imgId} failed`);
      throw new MdEditorImgOpError(`Get image from DB with ${imgId} failed`);
    }
    return [result[0], result[1], this.getMimeType(result[2])];
  }
  /**
   * Get image from file
   * @param imgId - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  async getImageFromFile(imgId) {
    const result = this.dbm.get(
      "SELECT name, save_path, ext FROM image WHERE id=?",
      [imgId]
    );
    if (!result) {
      logger$i.error(`Get image from DB with id=${imgId} failed`);
      throw new MdEditorImgOpError(`Get image from DB with ${imgId} failed`);
    }
    const [, savePath, ext] = result;
    if (!savePath) {
      throw new MdEditorImgOpError("Missing image save path");
    }
    try {
      await fs__namespace.access(savePath);
    } catch {
      logger$i.error(`Cannot find img ${savePath}`);
      throw new MdEditorImgOpError(`Cannot find image from '${savePath}'`);
    }
    const content = await fs__namespace.readFile(savePath);
    return [result[0], content, this.getMimeType(ext)];
  }
  /**
   * Get MIME type from file extension
   * @param ext - File extension
   * @returns MIME type
   */
  getMimeType(ext) {
    return MIME_MAP[ext.toLowerCase()] || "image/jpeg";
  }
  /**
   * Check if hkey is valid
   * @param content - Content to verify
   * @returns True if valid
   */
  async checkHkey(content) {
    return md5sum(content) === config.mdEditor.hkeyHash;
  }
  /**
   * Encrypt content using AES-256-GCM
   * @param content - Content to encrypt
   * @returns Encrypted content (base64)
   */
  encryptContent(content) {
    const key = Buffer.from(config.mdEditor.enKey, "utf8");
    return encrypt(content, key);
  }
  /**
   * Decrypt content using AES-256-GCM
   * @param content - Encrypted content (base64)
   * @returns Decrypted content
   */
  decryptContent(content) {
    const key = Buffer.from(config.mdEditor.enKey, "utf8");
    return decrypt(content, key);
  }
}
const logger$h = createLogger("IPC:MdEditor");
function registerMdEditorHandlers() {
  const mdEditorService = new MdEditorService();
  electron.ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_LIST, async (event, space = 0) => {
    logger$h.debug(`Get category list for space ${space}`);
    return await mdEditorService.getCategoryList(space);
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_BY_ID, async (event, id) => {
    logger$h.debug(`Get category by ID ${id}`);
    return await mdEditorService.getCategoryById(id);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_CATEGORY,
    async (event, name, space = 0) => {
      logger$h.info(`Create category '${name}' in space ${space}`);
      return await mdEditorService.createCategory(name, space);
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.MD_UPDATE_CATEGORY, async (event, id, params) => {
    logger$h.info(`Update category ${id}`);
    await mdEditorService.updateCategory(id, params);
    return { success: true };
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_DELETE_CATEGORY, async (event, id) => {
    logger$h.info(`Delete category ${id}`);
    await mdEditorService.deleteCategory(id);
    return { success: true };
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_LIST, async (event, cId) => {
    logger$h.debug(`Get document list for category ${cId}`);
    return await mdEditorService.getDocList(cId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_BY_ID, async (event, id) => {
    logger$h.debug(`Get document by ID ${id}`);
    return await mdEditorService.getDocById(id);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_DOC,
    async (event, cid, title, summary) => {
      logger$h.info(`Create document '${title}' in category ${cid}`);
      return await mdEditorService.createDoc(cid, title, summary);
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.MD_UPDATE_DOC, async (event, id, params) => {
    logger$h.info(`Update document ${id}`);
    await mdEditorService.updateDoc(id, params);
    return { success: true };
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_DELETE_DOC, async (event, id) => {
    logger$h.info(`Delete document ${id}`);
    await mdEditorService.deleteDoc(id);
    return { success: true };
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_SAVE_IMAGE, async (event, filePath) => {
    logger$h.info(`Save image from ${filePath}`);
    return await mdEditorService.saveImage(filePath);
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_GET_IMAGE, async (event, id) => {
    logger$h.debug(`Get image by ID ${id}`);
    return await mdEditorService.getImage(id);
  });
  electron.ipcMain.handle(IPC_CHANNELS.MD_VERIFY_HKEY, async (event, content) => {
    logger$h.debug("Verify hkey");
    return await mdEditorService.checkHkey(content);
  });
}
function isImage(filePath) {
  let ext;
  if (typeof filePath === "string") {
    ext = path__namespace.extname(filePath);
  } else {
    ext = filePath.ext;
  }
  return ext in MIME_MAP;
}
async function ensureDirectory(dirPath) {
  const fs2 = await import("fs/promises");
  try {
    await fs2.access(dirPath);
  } catch {
    await fs2.mkdir(dirPath, { recursive: true, mode: 448 });
  }
}
createLogger("ImageUtils");
async function generateThumbnail(imgPath, dstPath) {
  try {
    await ensureDirectory(path__namespace.dirname(dstPath));
    const metadata = await sharp(imgPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const MAX_SIZE = 1600;
    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height, 1);
    if (ratio >= 1) {
      await fs__namespace.copyFile(imgPath, dstPath);
    } else {
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);
      await sharp(imgPath).resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: true
      }).toFile(dstPath);
    }
  } catch (err) {
    throw new Error(`Failed to generate thumbnail for ${imgPath}: ${err}`);
  }
}
async function getImageSize(imgPath) {
  try {
    const metadata = await sharp(imgPath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (err) {
    throw new Error(`Failed to get image size for ${imgPath}: ${err}`);
  }
}
const logger$g = createLogger("IVViewerService");
class IVViewerService {
  constructor() {
    this.dirDbTable = "dirs";
    const ivPath = config.imgViewer.ivPath;
    if (!ivPath || ivPath === "dir_not_exists") {
      throw new ImageBasePathNotExists("Image base path not configured");
    }
    this.basePath = ivPath;
    this.dirDbPath = path__namespace.join(this.basePath, IV_DIR_DB_FILE);
    this.initDirStructureDb();
  }
  /**
   * Get directory structure recursively
   */
  async getDirStructure() {
    let result = await this.getDirStructureFromDb();
    if (!result || result.length === 0) {
      result = [];
      await this.buildDirStructure(this.basePath, "", result);
      await this.updateDirStructureToDb(result);
    }
    return result;
  }
  /**
   * Get directories that need indexing
   */
  async getDirsToIndex() {
    const dirStructure = await this.getDirStructure();
    const toIndex = this.extractDirsFromStructure(dirStructure);
    const result = [];
    for (const item of toIndex) {
      if (!await this.hasIndexing(item.path_id)) {
        result.push(item);
      }
    }
    return result;
  }
  /**
   * Refresh directory structure from filesystem
   */
  async refreshDirStructure() {
    const result = [];
    await this.buildDirStructure(this.basePath, "", result);
    await this.updateDirStructureToDb(result);
    return result;
  }
  /**
   * Check if directory has been indexed
   */
  async hasIndexing(pathId) {
    const imgPath = this.getRealPath(pathId);
    const indexPath = path__namespace.join(imgPath, IV_CACHE_DIR);
    try {
      await fs__namespace.access(indexPath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Generate thumbnails for a directory
   * @returns Async generator yielding progress percentage
   */
  async *indexing(pathId) {
    const imgPath = this.getRealPath(pathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    await fs__namespace.mkdir(indexDir, { recursive: true, mode: 493 });
    const entries = await fs__namespace.readdir(imgPath, { withFileTypes: true });
    const toParse = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path__namespace.join(imgPath, entry.name);
      if (isImage(filePath)) {
        toParse.push(filePath);
      }
    }
    if (toParse.length === 0) {
      await this.saveOpInfo(pathId, []);
      yield 100;
      return;
    }
    const step = 100 / toParse.length;
    const tImages = [];
    for (let i = 0; i < toParse.length; i++) {
      const rawImg = toParse[i];
      const thumbnailImg = path__namespace.join(indexDir, path__namespace.basename(rawImg));
      try {
        await generateThumbnail(rawImg, thumbnailImg);
      } catch (err) {
        logger$g.warn(`Generate thumbnail for '${rawImg}' failed, using original file`, err);
        await fs__namespace.copyFile(rawImg, thumbnailImg);
      }
      tImages.push(path__namespace.basename(rawImg));
      yield Math.trunc(i * step);
    }
    await this.saveOpInfo(pathId, tImages);
    yield 100;
  }
  /**
   * Remove index directory (thumbnails)
   */
  async removeIndexDir(imgDirPathId) {
    const imgDirPath = this.getRealPath(imgDirPathId);
    const indexPath = path__namespace.join(imgDirPath, IV_CACHE_DIR);
    try {
      await fs__namespace.access(indexPath);
      if (indexPath.startsWith(this.basePath)) {
        await fs__namespace.rm(indexPath, { recursive: true, force: true });
      }
    } catch {
    }
  }
  /**
   * Get images with score filter
   */
  async getImages(imgDirPathId, score = 0) {
    const realPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(realPath, IV_CACHE_DIR);
    try {
      const entries = await fs__namespace.readdir(realPath);
      if (entries.length === 0) {
        return [];
      }
    } catch {
      return [];
    }
    try {
      await fs__namespace.access(indexDir);
    } catch {
      throw new ImageCacheNotExists("Image cache not exists");
    }
    const ok = await this.checkThumbnailConsistency(imgDirPathId);
    if (!ok) {
      await this.removeIndexDir(imgDirPathId);
      throw new ImageCacheNotExists("Image cache not exists");
    }
    return await this.getThumbImages(indexDir, score);
  }
  /**
   * Get image file
   */
  async getImage(pathId) {
    const realPath = this.getRealPath(pathId);
    const ext = path__namespace.extname(realPath);
    const mime = MIME_MAP[ext] || "image/jpeg";
    const name = path__namespace.basename(realPath);
    const content = await fs__namespace.readFile(realPath);
    return { content, mime, name };
  }
  /**
   * Get image info (dimensions, size)
   */
  async getImageInfo(pathId) {
    const rawImgPath = this.getRawImgPathFromThumbnailPathId(pathId);
    const size = await getImageSize(rawImgPath);
    const sizeMb = getFileSizeMB(rawImgPath);
    return {
      width: size.width,
      height: size.height,
      size: sizeMb
    };
  }
  /**
   * Get image directory metadata
   */
  async getMeta(pathId) {
    return await this.getMetaFromDb(pathId);
  }
  /**
   * Update image score
   */
  async updateScore(imgPathId, newScore) {
    const imgPath = this.getRealPath(imgPathId);
    const indexDir = path__namespace.dirname(imgPath);
    const opDb = await this.loadOpDb(indexDir);
    const imgIndex = opDb.images.findIndex((img) => img.path_id === imgPathId);
    if (imgIndex === -1) {
      throw new ImagePathNotExists(`Image path id ${imgPathId} not in op db`);
    }
    opDb.images[imgIndex].score = newScore;
    await this.saveOpDb(indexDir, opDb);
    return 1;
  }
  /**
   * Classify images by score
   */
  async classify(imgDirPathId, classificationName) {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    const opResultPath = path__namespace.join(this.basePath, IV_OP_RESULT_DIR);
    await fs__namespace.mkdir(opResultPath, { recursive: true, mode: 493 });
    let claNameSeed;
    if (!classificationName) {
      claNameSeed = await this.getClaName(imgDirPathId);
    } else {
      const seed = generateRandomString();
      claNameSeed = `${classificationName}_${seed}`;
    }
    await this.updateClaName(imgDirPathId, claNameSeed);
    const claDetail = await this.getClaDetail(indexDir);
    const count2 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 2, claDetail);
    const count3 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 3, claDetail);
    const count4 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 4, claDetail);
    await this.undoClassify(opResultPath, claDetail);
    await this.updateClaDetail(imgDirPathId, claDetail);
    await this.updateClaTime(imgDirPathId);
    return { s2: count2, s3: count3, s4: count4 };
  }
  /**
   * Check if directory is classified
   */
  async isClassified(imgDirPathId) {
    const claName = await this.getClaName(imgDirPathId);
    return !!claName;
  }
  /**
   * Remove directory
   */
  async removeDir(imgDirPathId) {
    const restorePath = path__namespace.join(this.basePath, IV_RESTORE_DIR);
    await fs__namespace.mkdir(restorePath, { recursive: true, mode: 493 });
    const imgDir = this.getRealPath(imgDirPathId);
    try {
      await fs__namespace.access(imgDir);
      await fs__namespace.rename(imgDir, path__namespace.join(restorePath, path__namespace.basename(imgDir)));
    } catch (err) {
      throw new ImageDirRemoveError(`Failed to remove directory: ${err}`);
    }
    const dirStructure = await this.getDirStructureFromDb();
    if (!dirStructure || dirStructure.length === 0) {
      return;
    }
    const newDirStructure = this.removeDirFromStructure(imgDirPathId, dirStructure);
    await this.updateDirStructureToDb(newDirStructure);
  }
  // ========================================================================
  // Private methods
  // ========================================================================
  async initDirStructureDb() {
    const dirDb = {
      id: this.dirDbTable,
      dirs: []
    };
    try {
      await fs__namespace.access(this.dirDbPath);
    } catch {
      await fs__namespace.writeFile(this.dirDbPath, JSON.stringify(dirDb, null, 2));
    }
  }
  async loadDirDb() {
    const content = await fs__namespace.readFile(this.dirDbPath, "utf-8");
    return JSON.parse(content);
  }
  async saveDirDb(data) {
    await fs__namespace.writeFile(this.dirDbPath, JSON.stringify(data, null, 2));
  }
  async getDirStructureFromDb() {
    const db = await this.loadDirDb();
    return db.dirs;
  }
  async updateDirStructureToDb(dirStructure) {
    const db = await this.loadDirDb();
    db.dirs = dirStructure;
    await this.saveDirDb(db);
  }
  async buildDirStructure(rootPath, pathPrefix, result) {
    const entries = await fs__namespace.readdir(rootPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === IV_CACHE_DIR || entry.name === IV_OP_RESULT_DIR || entry.name === IV_RESTORE_DIR) {
        continue;
      }
      const subPath = pathPrefix ? path__namespace.join(pathPrefix, entry.name) : entry.name;
      const subPathId = this.encodePath(subPath);
      const children = [];
      await this.buildDirStructure(path__namespace.join(rootPath, entry.name), subPath, children);
      result.push({
        path_id: subPathId,
        name: entry.name,
        create_time: "",
        children: children.length > 0 ? children : void 0
      });
    }
  }
  extractDirsFromStructure(dirStructure) {
    const result = [];
    for (const dir of dirStructure) {
      result.push({
        name: dir.name,
        path_id: dir.path_id,
        progress: 0
      });
      if (dir.children) {
        result.push(...this.extractDirsFromStructure(dir.children));
      }
    }
    return result;
  }
  removeDirFromStructure(pathId, dirStructure) {
    const result = [];
    for (const item of dirStructure) {
      if (item.path_id === pathId) {
        continue;
      } else {
        const children = item.children ? this.removeDirFromStructure(pathId, item.children) : [];
        if (children.length > 0 || item.path_id !== pathId) {
          result.push({
            ...item,
            children: children.length > 0 ? children : void 0
          });
        }
      }
    }
    return result;
  }
  async checkThumbnailConsistency(imgDirPathId) {
    const imgDirPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgDirPath, IV_CACHE_DIR);
    const srcImages = [];
    const tImages = [];
    try {
      const srcEntries = await fs__namespace.readdir(imgDirPath, { withFileTypes: true });
      for (const entry of srcEntries) {
        if (entry.isFile() && entry.name in MIME_MAP) {
          srcImages.push(entry.name);
        }
      }
      const tEntries = await fs__namespace.readdir(indexDir, { withFileTypes: true });
      for (const entry of tEntries) {
        if (entry.isFile() && entry.name in MIME_MAP) {
          tImages.push(entry.name);
        }
      }
    } catch {
      return false;
    }
    if (srcImages.length !== tImages.length) {
      return false;
    }
    for (const s of srcImages) {
      if (!tImages.includes(s)) {
        return false;
      }
    }
    return true;
  }
  async loadOpDb(indexDir) {
    const opDbPath = path__namespace.join(indexDir, IV_OP_DB_FILE);
    const content = await fs__namespace.readFile(opDbPath, "utf-8");
    return JSON.parse(content);
  }
  async saveOpDb(indexDir, opDb) {
    const opDbPath = path__namespace.join(indexDir, IV_OP_DB_FILE);
    await fs__namespace.writeFile(opDbPath, JSON.stringify(opDb, null, 2));
  }
  async saveOpInfo(imgDirPathId, tImages) {
    const realPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(realPath, IV_CACHE_DIR);
    const meta = {
      name: path__namespace.basename(realPath),
      create_time: currentTimeObjToStr(),
      cla_name: "",
      cla_time: ""
    };
    const relPath = this.decodePath(imgDirPathId);
    const images = tImages.map((name) => ({
      path_id: this.encodePath(path__namespace.join(relPath, IV_CACHE_DIR, name)),
      name,
      score: 1,
      cla: {}
    }));
    await this.saveOpDb(indexDir, {
      meta,
      images
    });
  }
  async getThumbImages(indexDir, score) {
    const opDb = await this.loadOpDb(indexDir);
    const filtered = opDb.images.filter((img) => img.score >= score);
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered.map((img) => ({
      path_id: img.path_id,
      name: img.name,
      score: img.score
    }));
  }
  async getMetaFromDb(imgDirPathId) {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    return opDb.meta;
  }
  async getClaName(imgDirPathId) {
    const meta = await this.getMetaFromDb(imgDirPathId);
    return meta.cla_name || "";
  }
  async updateClaName(imgDirPathId, claName) {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    opDb.meta.cla_name = claName;
    await this.saveOpDb(indexDir, opDb);
  }
  async getClaTime(imgDirPathId) {
    const meta = await this.getMetaFromDb(imgDirPathId);
    return meta.cla_time || "";
  }
  async updateClaTime(imgDirPathId) {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    opDb.meta.cla_time = currentTimeObjToStr();
    await this.saveOpDb(indexDir, opDb);
  }
  async getClaDetail(indexDir) {
    const opDb = await this.loadOpDb(indexDir);
    const result = {};
    for (const img of opDb.images) {
      result[img.path_id] = img.cla;
    }
    return result;
  }
  async updateClaDetail(imgDirPathId, claDetail) {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path__namespace.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    for (const k of Object.keys(claDetail)) {
      const img = opDb.images.find((img2) => img2.path_id === k);
      if (img) {
        img.cla = claDetail[k];
      }
    }
    await this.saveOpDb(indexDir, opDb);
  }
  async classifyFiles(indexDir, opResultPath, classificationName, score, claDetail) {
    const tImgList = await this.getThumbImages(indexDir, score);
    const scoreResultPath = path__namespace.join(opResultPath, score.toString());
    await fs__namespace.mkdir(scoreResultPath, { recursive: true, mode: 493 });
    let count = 0;
    for (let idx = 0; idx < tImgList.length; idx++) {
      const tImg = tImgList[idx];
      const tImgPathId = tImg.path_id;
      const srcImgPath = this.getRawImgPathFromThumbnailPathId(tImgPathId);
      const ext = path__namespace.extname(srcImgPath);
      const dstImgName = `${classificationName}_${idx}${ext}`;
      const dstImgPath = path__namespace.join(scoreResultPath, dstImgName);
      if (!(tImgPathId in claDetail)) {
        claDetail[tImgPathId] = {};
      }
      if (!(score.toString() in claDetail[tImgPathId])) {
        await this.parseImage(srcImgPath, dstImgPath);
        count++;
      }
      claDetail[tImgPathId][score.toString()] = dstImgName;
    }
    return count;
  }
  async undoClassify(opResultPath, claDetail) {
    for (const [tImgPathId, detail] of Object.entries(claDetail)) {
      const score = await this.getImageScoreFromOpDb(tImgPathId);
      for (let s = score + 1; s <= 4; s++) {
        const sStr = s.toString();
        if (sStr in detail) {
          const dstImgName = detail[sStr];
          delete detail[sStr];
          const dstImgPath = path__namespace.join(opResultPath, sStr, dstImgName);
          try {
            await fs__namespace.unlink(dstImgPath);
          } catch {
          }
        }
      }
    }
  }
  async parseImage(srcImg, dstImg) {
    await fs__namespace.copyFile(srcImg, dstImg);
  }
  async getImageScoreFromOpDb(pathId) {
    const parts = pathId.split(path__namespace.sep);
    const cacheIndex = parts.indexOf(IV_CACHE_DIR);
    if (cacheIndex === -1) {
      return 1;
    }
    const indexDir = path__namespace.join(this.basePath, ...parts.slice(0, cacheIndex + 1));
    const opDb = await this.loadOpDb(indexDir);
    const img = opDb.images.find((img2) => img2.path_id === pathId);
    return img?.score || 1;
  }
  getRealPath(pathId) {
    const relPath = this.decodePath(pathId);
    return path__namespace.join(this.basePath, relPath);
  }
  getRawImgPathFromThumbnailPathId(pathId) {
    const pathIdRawPath = this.decodePath(pathId);
    const parts = pathIdRawPath.split(path__namespace.sep);
    const newParts = [];
    for (const p of parts) {
      if (p === IV_CACHE_DIR) continue;
      newParts.push(p);
    }
    const rPath = path__namespace.join(...newParts);
    return path__namespace.join(this.basePath, rPath);
  }
  encodePath(rawPath) {
    if (Array.isArray(rawPath)) {
      rawPath = rawPath.join(path__namespace.sep);
    }
    return urlSafeB64Encode(rawPath);
  }
  decodePath(pathId) {
    return urlSafeB64Decode(pathId);
  }
  /**
   * Public helper method to get the cache directory for a path_id
   */
  getCacheDir(pathId) {
    const realPath = this.getRealPath(pathId);
    return path__namespace.join(realPath, IV_CACHE_DIR);
  }
}
const logger$f = createLogger("IVViewerHandler");
const indexingTasks = /* @__PURE__ */ new Map();
function registerIvViewerHandlers() {
  const ivViewerService = new IVViewerService();
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_DIRECTORIES, async () => {
    logger$f.debug("Get directory structure");
    return await ivViewerService.getDirStructure();
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_REFRESH_DIRECTORIES, async () => {
    logger$f.info("Refresh directory structure");
    return await ivViewerService.refreshDirStructure();
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_DIRS_TO_INDEX, async () => {
    logger$f.debug("Get directories to index");
    return await ivViewerService.getDirsToIndex();
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_HAS_INDEXING, async (event, pathId) => {
    logger$f.debug(`Check if directory indexed: ${pathId}`);
    return await ivViewerService.hasIndexing(pathId);
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.IV_START_INDEX,
    async (event, pathId, allIndexing = false) => {
      logger$f.info(`Start indexing ${pathId} (all: ${allIndexing})`);
      const taskId = allIndexing ? `all-${pathId}` : pathId;
      if (indexingTasks.has(taskId)) {
        logger$f.warn(`Already indexing ${taskId}`);
        return { success: false, message: "Already indexing" };
      }
      indexingTasks.set(taskId, {
        pathId,
        events: [],
        allIndexing,
        progress: 0
      });
      startIndexing(ivViewerService, taskId, pathId);
      return { success: true };
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGES, async (event, pathId, score = 0) => {
    logger$f.debug(`Get images from ${pathId} with score >= ${score}`);
    const images = await ivViewerService.getImages(pathId, score);
    const idxCacheDir = path__namespace.join(ivViewerService.getCacheDir(pathId));
    return images.map((img) => ({
      ...img,
      thumbnail_path: `file://${path__namespace.join(idxCacheDir, img.name)}`
    }));
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGE, async (event, pathId) => {
    logger$f.debug(`Get image ${pathId}`);
    return await ivViewerService.getImage(pathId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGE_INFO, async (event, pathId) => {
    logger$f.debug(`Get image info for ${pathId}`);
    return await ivViewerService.getImageInfo(pathId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_GET_META, async (event, pathId) => {
    logger$f.debug(`Get metadata for ${pathId}`);
    return await ivViewerService.getMeta(pathId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_UPDATE_SCORE, async (event, pathId, score) => {
    logger$f.info(`Update score for ${pathId} to ${score}`);
    await ivViewerService.updateScore(pathId, score);
    return { success: true };
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.IV_CLASSIFY,
    async (event, pathId, classificationName) => {
      logger$f.info(`Classify ${pathId} as '${classificationName}'`);
      return await ivViewerService.classify(pathId, classificationName);
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.IV_IS_CLASSIFIED, async (event, pathId) => {
    logger$f.debug(`Check if ${pathId} is classified`);
    return await ivViewerService.isClassified(pathId);
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_REMOVE_DIR, async (event, pathId) => {
    logger$f.info(`Remove directory ${pathId}`);
    await ivViewerService.removeDir(pathId);
    return { success: true };
  });
  electron.ipcMain.handle(IPC_CHANNELS.IV_REMOVE_INDEX, async (event, pathId) => {
    logger$f.info(`Remove index for ${pathId}`);
    await ivViewerService.removeIndexDir(pathId);
    return { success: true };
  });
}
async function startIndexing(ivViewerService, taskId, pathId, allIndexing) {
  const task = indexingTasks.get(taskId);
  if (!task) return;
  try {
    for await (const progress of ivViewerService.indexing(pathId)) {
      task.progress = progress;
      electron.webContents.getAllWebContents().forEach((wc) => {
        if (!wc.isDestroyed()) {
          wc.send(IPC_CHANNELS.IV_INDEX_PROGRESS, {
            pathId,
            progress
          });
        }
      });
    }
    electron.webContents.getAllWebContents().forEach((wc) => {
      if (!wc.isDestroyed()) {
        wc.send(IPC_CHANNELS.IV_INDEX_PROGRESS, {
          pathId,
          progress: 100
        });
      }
    });
  } catch (error2) {
    logger$f.error(`Indexing failed for ${pathId}`, error2);
  } finally {
    indexingTasks.delete(taskId);
  }
}
const logger$e = createLogger("RoleplayScenarioService");
class RoleplayScenarioService {
  /**
   * List all scenarios
   * @returns Array of scenario names
   */
  async listScenarios() {
    try {
      const entries = await fs__namespace.readdir(wpath.roleplayScenarioDir, { withFileTypes: true });
      const scenarios = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sceneJsonPath = path__namespace.join(wpath.roleplayScenarioDir, entry.name, "scene.json");
          try {
            await fs__namespace.access(sceneJsonPath);
            scenarios.push(entry.name);
          } catch {
          }
        }
      }
      return scenarios.sort();
    } catch (err) {
      logger$e.error("Failed to list scenarios", err);
      throw new Error(`Failed to list scenarios: ${err}`);
    }
  }
  /**
   * Get scenario details
   * @param name - Scenario name
   * @returns Scenario data
   */
  async getScenario(name) {
    this.validateScenarioName(name);
    const sceneJsonPath = path__namespace.join(wpath.roleplayScenarioDir, name, "scene.json");
    try {
      const data = await fs__namespace.readFile(sceneJsonPath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      logger$e.error(`Failed to get scenario ${name}`, err);
      throw new Error(`Scenario '${name}' not found`);
    }
  }
  /**
   * Create new scenario
   * @param name - Scenario name
   * @param data - Scenario data
   */
  async createScenario(name, data) {
    this.validateScenarioName(name);
    const scenarioDir = path__namespace.join(wpath.roleplayScenarioDir, name);
    let scenarioExists = false;
    try {
      await fs__namespace.access(scenarioDir);
      scenarioExists = true;
    } catch {
    }
    if (scenarioExists) {
      throw new Error(`Scenario '${name}' already exists`);
    }
    try {
      await fs__namespace.mkdir(scenarioDir, { recursive: true, mode: 493 });
      const sceneJsonPath = path__namespace.join(scenarioDir, "scene.json");
      await fs__namespace.writeFile(sceneJsonPath, JSON.stringify(data, null, 2), "utf-8");
      const historyDir = path__namespace.join(scenarioDir, "history");
      await fs__namespace.mkdir(historyDir, { recursive: true, mode: 493 });
      logger$e.info(`Scenario '${name}' created`);
    } catch (err) {
      logger$e.error(`Failed to create scenario ${name}`, err);
      throw new Error(`Failed to create scenario '${name}': ${err}`);
    }
  }
  /**
   * Update scenario
   * @param name - Scenario name
   * @param data - New scenario data
   */
  async updateScenario(name, data) {
    this.validateScenarioName(name);
    const sceneJsonPath = path__namespace.join(wpath.roleplayScenarioDir, name, "scene.json");
    try {
      await fs__namespace.writeFile(sceneJsonPath, JSON.stringify(data, null, 2), "utf-8");
      logger$e.info(`Scenario '${name}' updated`);
    } catch (err) {
      logger$e.error(`Failed to update scenario ${name}`, err);
      throw new Error(`Failed to update scenario '${name}': ${err}`);
    }
  }
  /**
   * Delete scenario
   * @param name - Scenario name
   */
  async deleteScenario(name) {
    this.validateScenarioName(name);
    const scenarioDir = path__namespace.join(wpath.roleplayScenarioDir, name);
    try {
      await fs__namespace.rm(scenarioDir, { recursive: true, force: true });
      logger$e.info(`Scenario '${name}' deleted`);
    } catch (err) {
      logger$e.error(`Failed to delete scenario ${name}`, err);
      throw new Error(`Failed to delete scenario '${name}': ${err}`);
    }
  }
  /**
   * Check if scenario exists
   * @param name - Scenario name
   * @returns True if scenario exists
   */
  async scenarioExists(name) {
    this.validateScenarioName(name);
    const sceneJsonPath = path__namespace.join(wpath.roleplayScenarioDir, name, "scene.json");
    try {
      await fs__namespace.access(sceneJsonPath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Validate scenario name to prevent path traversal
   * @param name - Scenario name
   */
  validateScenarioName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Scenario name cannot be empty");
    }
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error("Invalid scenario name");
    }
  }
}
const logger$d = createLogger("RoleplayHistoryService");
class RoleplayHistoryService {
  /**
   * List all chat histories for a scenario
   * @param scenarioName - Scenario name
   * @returns Array of history filenames
   */
  async listHistories(scenarioName) {
    this.validateScenarioName(scenarioName);
    const historyDir = path__namespace.join(wpath.roleplayScenarioDir, scenarioName, "history");
    try {
      const entries = await fs__namespace.readdir(historyDir);
      return entries.filter((file) => file.endsWith(".json")).sort();
    } catch (err) {
      return [];
    }
  }
  /**
   * Get chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @returns Chat history data
   */
  async getHistory(scenarioName, historyName) {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);
    const historyPath = this.getHistoryPath(scenarioName, historyName);
    try {
      const data = await fs__namespace.readFile(historyPath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      logger$d.error(`Failed to get history ${historyName}`, err);
      throw new Error(`History '${historyName}' not found`);
    }
  }
  /**
   * Create new chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @param data - Chat history data
   */
  async createHistory(scenarioName, historyName, data) {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);
    const historyDir = path__namespace.join(wpath.roleplayScenarioDir, scenarioName, "history");
    const historyPath = path__namespace.join(historyDir, this.ensureJsonExtension(historyName));
    try {
      await fs__namespace.mkdir(historyDir, { recursive: true, mode: 493 });
      await fs__namespace.writeFile(historyPath, JSON.stringify(data, null, 2), "utf-8");
      logger$d.info(`History '${historyName}' created for scenario '${scenarioName}'`);
    } catch (err) {
      logger$d.error(`Failed to create history ${historyName}`, err);
      throw new Error(`Failed to create history '${historyName}': ${err}`);
    }
  }
  /**
   * Save chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @param data - Chat history data
   */
  async saveHistory(scenarioName, historyName, data) {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);
    const historyPath = this.getHistoryPath(scenarioName, historyName);
    try {
      await fs__namespace.writeFile(historyPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      logger$d.error(`Failed to save history ${historyName}`, err);
      throw new Error(`Failed to save history '${historyName}': ${err}`);
    }
  }
  /**
   * Delete chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   */
  async deleteHistory(scenarioName, historyName) {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);
    const historyPath = this.getHistoryPath(scenarioName, historyName);
    try {
      await fs__namespace.unlink(historyPath);
      logger$d.info(`History '${historyName}' deleted for scenario '${scenarioName}'`);
    } catch (err) {
      logger$d.error(`Failed to delete history ${historyName}`, err);
      throw new Error(`Failed to delete history '${historyName}': ${err}`);
    }
  }
  /**
   * Check if history exists
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @returns True if history exists
   */
  async historyExists(scenarioName, historyName) {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);
    const historyPath = this.getHistoryPath(scenarioName, historyName);
    try {
      await fs__namespace.access(historyPath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get history file path
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @returns Full path to history file
   */
  getHistoryPath(scenarioName, historyName) {
    return path__namespace.join(
      wpath.roleplayScenarioDir,
      scenarioName,
      "history",
      this.ensureJsonExtension(historyName)
    );
  }
  /**
   * Ensure filename has .json extension
   * @param filename - Filename
   * @returns Filename with .json extension
   */
  ensureJsonExtension(filename) {
    return filename.endsWith(".json") ? filename : `${filename}.json`;
  }
  /**
   * Validate scenario name to prevent path traversal
   * @param name - Scenario name
   */
  validateScenarioName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Scenario name cannot be empty");
    }
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error("Invalid scenario name");
    }
  }
  /**
   * Validate history name to prevent path traversal
   * @param name - History name
   */
  validateHistoryName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("History name cannot be empty");
    }
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error("Invalid history name");
    }
  }
}
const logger$c = createLogger("RoleplayConfigService");
class RoleplayConfigService {
  /**
   * List all LLM configurations
   * @returns Array of config filenames
   */
  async listConfigs() {
    try {
      const entries = await fs__namespace.readdir(wpath.roleplayLlmConfigsDir);
      return entries.filter((file) => file.endsWith(".json")).sort();
    } catch (err) {
      logger$c.error("Failed to list LLM configs", err);
      return [];
    }
  }
  /**
   * Get LLM configuration
   * @param name - Config filename
   * @returns LLM config data
   */
  async getConfig(name) {
    this.validateConfigName(name);
    const configPath = path__namespace.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );
    try {
      const data = await fs__namespace.readFile(configPath, "utf-8");
      const config2 = JSON.parse(data);
      if (!config2.key) {
        config2.key = process.env.OPENAI_API_KEY || "";
      }
      return config2;
    } catch (err) {
      logger$c.error(`Failed to get config ${name}`, err);
      throw new Error(`Config '${name}' not found`);
    }
  }
  /**
   * Save LLM configuration
   * @param name - Config filename
   * @param data - LLM config data
   */
  async saveConfig(name, data) {
    this.validateConfigName(name);
    const configPath = path__namespace.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );
    try {
      await fs__namespace.writeFile(configPath, JSON.stringify(data, null, 2), "utf-8");
      logger$c.info(`Config '${name}' saved`);
    } catch (err) {
      logger$c.error(`Failed to save config ${name}`, err);
      throw new Error(`Failed to save config '${name}': ${err}`);
    }
  }
  /**
   * Delete LLM configuration
   * @param name - Config filename
   */
  async deleteConfig(name) {
    this.validateConfigName(name);
    const configPath = path__namespace.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );
    try {
      await fs__namespace.unlink(configPath);
      logger$c.info(`Config '${name}' deleted`);
    } catch (err) {
      logger$c.error(`Failed to delete config ${name}`, err);
      throw new Error(`Failed to delete config '${name}': ${err}`);
    }
  }
  /**
   * Get default LLM configuration
   * @returns Default LLM config
   */
  async getDefaultConfig() {
    const { config: config2 } = await Promise.resolve().then(() => context);
    const defaultConfigName = config2.roleplay.defaultLlmConfig;
    try {
      return await this.getConfig(defaultConfigName);
    } catch (err) {
      logger$c.warn("Default config not found, using fallback");
      return {
        base_url: "https://openrouter.ai/api/v1/",
        model: "google/gemini-2.5-flash",
        key: process.env.OPENAI_API_KEY || "",
        temperature: 0.9,
        max_tokens: 16e3
      };
    }
  }
  /**
   * Ensure filename has .json extension
   * @param filename - Filename
   * @returns Filename with .json extension
   */
  ensureJsonExtension(filename) {
    return filename.endsWith(".json") ? filename : `${filename}.json`;
  }
  /**
   * Validate config name to prevent path traversal
   * @param name - Config name
   */
  validateConfigName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Config name cannot be empty");
    }
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error("Invalid config name");
    }
  }
}
const logger$b = createLogger("RoleplayChatService");
class RoleplayChatService {
  constructor(config2, scenario) {
    this.client = null;
    this.messages = [];
    this.config = config2;
    this.scenario = scenario;
    this.initClient();
    this.initMessages();
  }
  /**
   * Initialize OpenAI client
   */
  initClient() {
    const clientConfig = {
      baseURL: this.config.base_url,
      apiKey: this.config.key || "dummy-key"
    };
    if (this.config.proxy) {
      clientConfig.httpAgent = require("https-proxy-agent")(this.config.proxy);
      clientConfig.httpsAgent = require("https-proxy-agent")(this.config.proxy);
    }
    this.client = new OpenAI(clientConfig);
  }
  /**
   * Initialize chat messages from scenario
   */
  initMessages() {
    this.messages = [];
    if (this.config.break_prompt) {
      this.messages.push({
        role: "system",
        content: this.config.break_prompt
      });
    }
    if (this.scenario.system_prompt) {
      this.messages.push({
        role: "system",
        content: this.scenario.system_prompt
      });
    }
    this.messages.push(...this.scenario.start);
  }
  /**
   * Reset chat session
   */
  reset() {
    this.initMessages();
    logger$b.info("Chat session reset");
  }
  /**
   * Load history messages
   * @param messages - Messages from history
   */
  loadHistory(messages) {
    this.messages = messages;
    logger$b.info(`Loaded ${messages.length} messages from history`);
  }
  /**
   * Get current messages
   * @returns Current messages
   */
  getMessages() {
    return this.messages;
  }
  /**
   * Get current messages for saving
   * @returns Chat history data
   */
  getHistoryData() {
    return {
      assistant_name: this.scenario.assistant_name,
      user_name: this.scenario.user_name,
      system_prompt: this.scenario.system_prompt,
      messages: this.messages
    };
  }
  /**
   * Send message and get streaming response
   * @param userInput - User input message
   * @param systemPrompt - Additional system prompt
   * @returns Async generator yielding response chunks
   */
  async *chat(userInput, systemPrompt = "") {
    if (userInput.trim()) {
      this.messages.push({
        role: "user",
        content: `${this.scenario.user_name}: ${userInput}`,
        name: this.scenario.user_name
      });
    }
    if (systemPrompt.trim()) {
      this.messages.push({
        role: "system",
        content: systemPrompt,
        name: "system"
      });
    }
    try {
      if (!this.client) {
        throw new Error("OpenAI client not initialized");
      }
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens
      });
      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          yield content;
        }
      }
      const trimmedResponse = fullResponse.trim();
      const formattedResponse = trimmedResponse.startsWith(`${this.scenario.assistant_name}:`) ? trimmedResponse : `${this.scenario.assistant_name}: ${trimmedResponse}`;
      this.messages.push({
        role: "assistant",
        content: formattedResponse,
        name: this.scenario.assistant_name
      });
      logger$b.info("Chat message sent and response received");
    } catch (err) {
      logger$b.error("Chat failed", err);
      yield `Error: ${err.message}`;
    }
  }
  /**
   * Regenerate last assistant message
   * @returns Async generator yielding response chunks
   */
  async *regenerate() {
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      this.messages.pop();
    }
    yield* this.chat("", "");
  }
  /**
   * Pop last message
   * @returns True if message was popped
   */
  popMessage() {
    if (this.messages.length > 0) {
      this.messages.pop();
      logger$b.info("Last message popped");
      return true;
    }
    return false;
  }
  /**
   * Update scenario
   * @param scenario - New scenario data
   */
  updateScenario(scenario) {
    this.scenario = scenario;
    this.initMessages();
    logger$b.info("Scenario updated");
  }
}
const logger$a = createLogger("RoleplayHandler");
const activeChats = /* @__PURE__ */ new Map();
function getChatKey(scenarioName, historyName) {
  return `${scenarioName}:${historyName}`;
}
function registerRoleplayHandlers() {
  const scenarioService = new RoleplayScenarioService();
  const historyService = new RoleplayHistoryService();
  const configService = new RoleplayConfigService();
  electron.ipcMain.handle(IPC_CHANNELS.RP_LIST_SCENARIOS, async () => {
    logger$a.debug("List scenarios");
    try {
      return await scenarioService.listScenarios();
    } catch (err) {
      logger$a.error("Failed to list scenarios", err);
      throw err;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.RP_GET_SCENARIO, async (_event, name) => {
    logger$a.debug(`Get scenario ${name}`);
    try {
      return await scenarioService.getScenario(name);
    } catch (err) {
      logger$a.error(`Failed to get scenario ${name}`, err);
      throw err;
    }
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_CREATE_SCENARIO,
    async (_event, name, data) => {
      logger$a.info(`Create scenario ${name}`);
      try {
        await scenarioService.createScenario(name, data);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to create scenario ${name}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_UPDATE_SCENARIO,
    async (_event, name, data) => {
      logger$a.info(`Update scenario ${name}`);
      try {
        await scenarioService.updateScenario(name, data);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to update scenario ${name}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.RP_DELETE_SCENARIO, async (_event, name) => {
    logger$a.info(`Delete scenario ${name}`);
    try {
      await scenarioService.deleteScenario(name);
      return { success: true };
    } catch (err) {
      logger$a.error(`Failed to delete scenario ${name}`, err);
      throw err;
    }
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_LIST_HISTORIES,
    async (_event, scenarioName) => {
      try {
        return await historyService.listHistories(scenarioName);
      } catch (err) {
        logger$a.error(`Failed to list histories for ${scenarioName}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_GET_HISTORY,
    async (_event, scenarioName, historyName) => {
      try {
        return await historyService.getHistory(scenarioName, historyName);
      } catch (err) {
        logger$a.error(`Failed to get history ${historyName}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_CREATE_HISTORY,
    async (_event, scenarioName, historyName, data) => {
      try {
        await historyService.createHistory(scenarioName, historyName, data);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to create history ${historyName}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_SAVE_HISTORY,
    async (_event, scenarioName, historyName, data) => {
      try {
        await historyService.saveHistory(scenarioName, historyName, data);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to save history ${historyName}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_DELETE_HISTORY,
    async (_event, scenarioName, historyName) => {
      try {
        await historyService.deleteHistory(scenarioName, historyName);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to delete history ${historyName}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(IPC_CHANNELS.RP_LIST_LLM_CONFIGS, async () => {
    try {
      return await configService.listConfigs();
    } catch (err) {
      logger$a.error("Failed to list LLM configs", err);
      throw err;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.RP_GET_LLM_CONFIG, async (_event, name) => {
    try {
      return await configService.getConfig(name);
    } catch (err) {
      logger$a.error(`Failed to get LLM config ${name}`, err);
      throw err;
    }
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.RP_SAVE_LLM_CONFIG,
    async (_event, name, data) => {
      try {
        await configService.saveConfig(name, data);
        return { success: true };
      } catch (err) {
        logger$a.error(`Failed to save LLM config ${name}`, err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    "qmin:rp:init-chat",
    async (_event, scenarioName, historyName, configName) => {
      try {
        const scenario = await scenarioService.getScenario(scenarioName);
        const llmConfig = configName ? await configService.getConfig(configName) : await configService.getDefaultConfig();
        const chatService = new RoleplayChatService(llmConfig, scenario);
        const historyExists = await historyService.historyExists(
          scenarioName,
          historyName
        );
        if (historyExists) {
          const history = await historyService.getHistory(
            scenarioName,
            historyName
          );
          chatService.loadHistory(history.messages);
        }
        const key = getChatKey(scenarioName, historyName);
        activeChats.set(key, chatService);
        return { success: true };
      } catch (err) {
        logger$a.error("Failed to initialize chat", err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    "qmin:rp:chat-message",
    async (event, scenarioName, historyName, message) => {
      logger$a.info(`Chat message: ${scenarioName}/${historyName}`);
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);
        if (!chatService) {
          throw new Error("Chat session not initialized");
        }
        for await (const chunk of chatService.chat(message)) {
          event.sender.send("qmin:rp:chat-chunk", { chunk });
        }
        event.sender.send("qmin:rp:chat-complete", {
          messages: chatService.getMessages()
        });
        const historyData = chatService.getHistoryData();
        await historyService.saveHistory(scenarioName, historyName, historyData);
        return { success: true };
      } catch (err) {
        logger$a.error("Chat failed", err);
        event.sender.send("qmin:rp:chat-error", { error: err.message });
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    "qmin:rp:regenerate",
    async (event, scenarioName, historyName) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);
        if (!chatService) {
          throw new Error("Chat session not initialized");
        }
        for await (const chunk of chatService.regenerate()) {
          event.sender.send("qmin:rp:chat-chunk", { chunk });
        }
        event.sender.send("qmin:rp:chat-complete", {
          messages: chatService.getMessages()
        });
        const historyData = chatService.getHistoryData();
        await historyService.saveHistory(scenarioName, historyName, historyData);
        return { success: true };
      } catch (err) {
        logger$a.error("Regenerate failed", err);
        event.sender.send("qmin:rp:chat-error", { error: err.message });
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    "qmin:rp:pop-message",
    async (_event, scenarioName, historyName) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);
        if (!chatService) {
          throw new Error("Chat session not initialized");
        }
        const popped = chatService.popMessage();
        if (popped) {
          const historyData = chatService.getHistoryData();
          await historyService.saveHistory(scenarioName, historyName, historyData);
        }
        return { success: true, popped };
      } catch (err) {
        logger$a.error("Pop message failed", err);
        throw err;
      }
    }
  );
  electron.ipcMain.handle(
    "qmin:rp:get-messages",
    async (_event, scenarioName, historyName) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);
        if (!chatService) {
          throw new Error("Chat session not initialized");
        }
        return chatService.getMessages();
      } catch (err) {
        logger$a.error("Failed to get messages", err);
        throw err;
      }
    }
  );
  logger$a.info("Roleplay IPC handlers registered");
}
const logger$9 = createLogger("ImgRecorderService");
class ImgRecorderService {
  constructor() {
    this.historyDir = wpath.imgGenHistoryDir;
  }
  /**
   * Create a new record directory with timestamp
   * @returns Record ID (timestamp directory name)
   */
  async createRecordDir() {
    const now = /* @__PURE__ */ new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const recordId = timestamp.replace("T", "_");
    const recordPath = path__namespace.join(this.historyDir, recordId);
    await fs__namespace.mkdir(recordPath, { recursive: true });
    logger$9.info(`Created record directory: ${recordId}`);
    return recordId;
  }
  /**
   * Get record directory path
   * @param recordId - Record ID
   * @returns Full path to record directory
   */
  getRecordPath(recordId) {
    return path__namespace.join(this.historyDir, recordId);
  }
  /**
   * Record prompt to file
   * @param recordId - Record ID
   * @param prompt - Prompt text
   */
  async recordPrompt(recordId, prompt) {
    const recordPath = this.getRecordPath(recordId);
    const promptPath = path__namespace.join(recordPath, "prompt.txt");
    await fs__namespace.writeFile(promptPath, prompt, "utf-8");
    logger$9.debug(`Recorded prompt for ${recordId}`);
  }
  /**
   * Record generation parameters to JSON file
   * @param recordId - Record ID
   * @param params - Generation parameters
   */
  async recordParams(recordId, params) {
    const recordPath = this.getRecordPath(recordId);
    const paramsPath = path__namespace.join(recordPath, "params.json");
    await fs__namespace.writeFile(paramsPath, JSON.stringify(params, null, 2), "utf-8");
    logger$9.debug(`Recorded params for ${recordId}`);
  }
  /**
   * Record image to file
   * @param recordId - Record ID
   * @param imgBytes - Image bytes
   * @param fileName - File name
   */
  async recordImage(recordId, imgBytes, fileName) {
    const recordPath = this.getRecordPath(recordId);
    const filePath = path__namespace.join(recordPath, fileName);
    await fs__namespace.writeFile(filePath, imgBytes);
    logger$9.debug(`Recorded image ${fileName} for ${recordId}`);
  }
  /**
   * Record reference image
   * @param recordId - Record ID
   * @param imgBytes - Image bytes
   * @param index - Image index
   */
  async recordRefImage(recordId, imgBytes, index) {
    const fileName = `ref_${index}.jpg`;
    await this.recordImage(recordId, imgBytes, fileName);
  }
  /**
   * Record result image from base64
   * @param recordId - Record ID
   * @param base64OrUrl - Base64 data URL or image URL
   * @param index - Image index
   */
  async recordResultImageFromBase64(recordId, base64OrUrl, index) {
    const fileName = `output_${index}.jpg`;
    if (base64OrUrl.startsWith("data:")) {
      const { extractBase64FromDataUrl: extractBase64FromDataUrl2 } = await Promise.resolve().then(() => imageHelper);
      const base64 = extractBase64FromDataUrl2(base64OrUrl);
      const imgBytes = Buffer.from(base64, "base64");
      await this.recordImage(recordId, imgBytes, fileName);
    } else {
      const { downloadImageFromUrl: downloadImageFromUrl2 } = await Promise.resolve().then(() => imageHelper);
      const imgBytes = await downloadImageFromUrl2(base64OrUrl);
      await this.recordImage(recordId, imgBytes, fileName);
    }
  }
  /**
   * Record model response to JSON file
   * @param recordId - Record ID
   * @param response - Response object
   */
  async recordResponse(recordId, response) {
    const recordPath = this.getRecordPath(recordId);
    const responsePath = path__namespace.join(recordPath, "response.json");
    await fs__namespace.writeFile(responsePath, JSON.stringify(response, null, 2), "utf-8");
    logger$9.debug(`Recorded response for ${recordId}`);
  }
  /**
   * Record LLM config name
   * @param recordId - Record ID
   * @param llmConfigName - LLM config name
   */
  async recordLlmConfig(recordId, llmConfigName) {
    const recordPath = this.getRecordPath(recordId);
    const configPath = path__namespace.join(recordPath, "llm_config.txt");
    await fs__namespace.writeFile(configPath, llmConfigName, "utf-8");
    logger$9.debug(`Recorded LLM config for ${recordId}`);
  }
  /**
   * List all history records
   * @returns List of history record items
   */
  async listHistory() {
    try {
      const entries = await fs__namespace.readdir(this.historyDir, { withFileTypes: true });
      const dirs = entries.filter((entry) => entry.isDirectory());
      const records = [];
      for (const dir of dirs) {
        const recordId = dir.name;
        const recordPath = path__namespace.join(this.historyDir, recordId);
        try {
          const promptPath = path__namespace.join(recordPath, "prompt.txt");
          let prompt = "";
          try {
            prompt = await fs__namespace.readFile(promptPath, "utf-8");
          } catch {
          }
          let refCount = 0;
          for (let i = 0; i < 10; i++) {
            const refPath = path__namespace.join(recordPath, `ref_${i}.jpg`);
            try {
              await fs__namespace.access(refPath);
              refCount++;
            } catch {
              break;
            }
          }
          let resultCount = 0;
          for (let i = 0; i < 10; i++) {
            const outPath = path__namespace.join(recordPath, `output_${i}.jpg`);
            try {
              await fs__namespace.access(outPath);
              resultCount++;
            } catch {
              break;
            }
          }
          const configPath = path__namespace.join(recordPath, "llm_config.txt");
          let llmConfig = "unknown";
          try {
            llmConfig = await fs__namespace.readFile(configPath, "utf-8");
          } catch {
          }
          const timestamp = recordId.replace("_", "T");
          records.push({
            id: recordId,
            timestamp,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
            refCount,
            resultCount,
            llmConfig
          });
        } catch (err) {
          logger$9.error(`Failed to read record ${recordId}`, err);
        }
      }
      records.sort((a, b) => b.id.localeCompare(a.id));
      return records;
    } catch (err) {
      logger$9.error("Failed to list history", err);
      return [];
    }
  }
  /**
   * Get detailed record information
   * @param recordId - Record ID
   * @returns Complete record
   */
  async getHistory(recordId) {
    const recordPath = this.getRecordPath(recordId);
    try {
      await fs__namespace.access(recordPath);
    } catch {
      logger$9.error(`Record ${recordId} not found`);
      return null;
    }
    try {
      const prompt = await fs__namespace.readFile(path__namespace.join(recordPath, "prompt.txt"), "utf-8");
      const paramsContent = await fs__namespace.readFile(
        path__namespace.join(recordPath, "params.json"),
        "utf-8"
      );
      const params = JSON.parse(paramsContent);
      const llmConfig = await fs__namespace.readFile(
        path__namespace.join(recordPath, "llm_config.txt"),
        "utf-8"
      );
      const responseContent = await fs__namespace.readFile(
        path__namespace.join(recordPath, "response.json"),
        "utf-8"
      );
      const response = JSON.parse(responseContent);
      const refImages = [];
      for (let i = 0; i < 10; i++) {
        const refPath = path__namespace.join(recordPath, `ref_${i}.jpg`);
        try {
          await fs__namespace.access(refPath);
          refImages.push(refPath);
        } catch {
          break;
        }
      }
      const resultImages = [];
      for (let i = 0; i < 10; i++) {
        const outPath = path__namespace.join(recordPath, `output_${i}.jpg`);
        try {
          await fs__namespace.access(outPath);
          resultImages.push(outPath);
        } catch {
          break;
        }
      }
      const timestamp = recordId.replace("_", "T");
      return {
        id: recordId,
        timestamp,
        prompt,
        params,
        refImages,
        resultImages,
        llmConfig,
        response
      };
    } catch (err) {
      logger$9.error(`Failed to read record ${recordId}`, err);
      return null;
    }
  }
  /**
   * Delete a history record
   * @param recordId - Record ID
   */
  async deleteHistory(recordId) {
    const recordPath = this.getRecordPath(recordId);
    try {
      await fs__namespace.rm(recordPath, { recursive: true, force: true });
      logger$9.info(`Deleted record ${recordId}`);
    } catch (err) {
      logger$9.error(`Failed to delete record ${recordId}`, err);
      throw new Error(`Failed to delete record ${recordId}: ${err}`);
    }
  }
  /**
   * Get all reference image paths for a record
   * @param recordId - Record ID
   * @returns Array of image paths
   */
  async getRefImages(recordId) {
    const recordPath = this.getRecordPath(recordId);
    const refImages = [];
    for (let i = 0; i < 10; i++) {
      const refPath = path__namespace.join(recordPath, `ref_${i}.jpg`);
      try {
        await fs__namespace.access(refPath);
        refImages.push(refPath);
      } catch {
        break;
      }
    }
    return refImages;
  }
  /**
   * Get all result image paths for a record
   * @param recordId - Record ID
   * @returns Array of image paths
   */
  async getResultImages(recordId) {
    const recordPath = this.getRecordPath(recordId);
    const resultImages = [];
    for (let i = 0; i < 10; i++) {
      const outPath = path__namespace.join(recordPath, `output_${i}.jpg`);
      try {
        await fs__namespace.access(outPath);
        resultImages.push(outPath);
      } catch {
        break;
      }
    }
    return resultImages;
  }
}
const logger$8 = createLogger("ImgConfigService");
class ImgConfigService {
  constructor() {
    this.configsDir = wpath.imgGenLlmConfigsDir;
  }
  /**
   * List all LLM configuration files
   * @returns List of config file names
   */
  async listLlmConfigs() {
    try {
      const entries = await fs__namespace.readdir(this.configsDir, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name);
      logger$8.debug(`Found ${files.length} config files`);
      return files;
    } catch (err) {
      logger$8.error("Failed to list configs", err);
      return [];
    }
  }
  /**
   * Get LLM configuration by name
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @returns LLM configuration
   */
  async getLlmConfig(name) {
    const fileName = name.endsWith(".json") ? name : `${name}.json`;
    const configPath = path__namespace.join(this.configsDir, fileName);
    try {
      await fs__namespace.access(configPath);
    } catch {
      logger$8.error(`Config file not found: ${fileName}`);
      return null;
    }
    try {
      const content = await fs__namespace.readFile(configPath, "utf-8");
      const config2 = JSON.parse(content);
      if (!config2.base_url || !config2.model || !config2.key) {
        logger$8.error(`Invalid config file: ${fileName} (missing required fields)`);
        return null;
      }
      logger$8.debug(`Loaded config: ${fileName}`);
      return {
        base_url: config2.base_url,
        model: config2.model,
        key: config2.key,
        temperature: config2.temperature,
        max_tokens: config2.max_tokens,
        proxy: config2.proxy
      };
    } catch (err) {
      logger$8.error(`Failed to read config file: ${fileName}`, err);
      return null;
    }
  }
  /**
   * Save LLM configuration
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @param config - LLM configuration
   */
  async saveLlmConfig(name, config2) {
    const fileName = name.endsWith(".json") ? name : `${name}.json`;
    const configPath = path__namespace.join(this.configsDir, fileName);
    try {
      const content = JSON.stringify(config2, null, 2);
      await fs__namespace.writeFile(configPath, content, "utf-8");
      logger$8.info(`Saved config: ${fileName}`);
    } catch (err) {
      logger$8.error(`Failed to save config file: ${fileName}`, err);
      throw new Error(`Failed to save config ${name}: ${err}`);
    }
  }
  /**
   * Delete LLM configuration
   * @param name - Configuration file name (e.g., "default.json" or "default")
   */
  async deleteLlmConfig(name) {
    const fileName = name.endsWith(".json") ? name : `${name}.json`;
    const configPath = path__namespace.join(this.configsDir, fileName);
    try {
      await fs__namespace.unlink(configPath);
      logger$8.info(`Deleted config: ${fileName}`);
    } catch (err) {
      logger$8.error(`Failed to delete config file: ${fileName}`, err);
      throw new Error(`Failed to delete config ${name}: ${err}`);
    }
  }
  /**
   * Check if config file exists
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @returns True if exists
   */
  async hasLlmConfig(name) {
    const fileName = name.endsWith(".json") ? name : `${name}.json`;
    const configPath = path__namespace.join(this.configsDir, fileName);
    try {
      await fs__namespace.access(configPath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get default LLM config name from global config
   * @returns Default config name
   */
  getDefaultConfigName() {
    const { config: config2 } = require("../common/context");
    return config2.imgGen.defaultLlmConfig;
  }
  /**
   * Get Qwen LLM config names from global config
   * @returns [qwenConfigName, qwenEditConfigName]
   */
  getQwenConfigNames() {
    const { config: config2 } = require("../common/context");
    return [config2.imgGen.qwenLlmConfig, config2.imgGen.qwenEditLlmConfig];
  }
}
createLogger("BaseImgGenerator");
class BaseImgGenerator {
  constructor(llmConfig) {
    this.llmConfig = llmConfig;
    this.recorder = new ImgRecorderService();
  }
  /**
   * Prepare image: convert to JPEG and record
   * @param imgBytes - Original image bytes
   * @param fileName - File name
   * @returns Processed image bytes
   */
  async prepareImg(imgBytes, fileName) {
    const { convertImageToJpeg: convertImageToJpeg2 } = await Promise.resolve().then(() => imageHelper);
    const newImgBytes = await convertImageToJpeg2(imgBytes);
    return newImgBytes;
  }
  /**
   * Create HTTP client with proxy support
   * @returns HTTP client (OpenAI or axios)
   */
  createClient() {
    throw new Error("Not implemented");
  }
}
const logger$7 = createLogger("GeminiImgGenerator");
class GeminiImgGenerator extends BaseImgGenerator {
  constructor(llmConfig) {
    super(llmConfig);
    this.modalities = ["text", "image"];
    const clientConfig = {
      baseURL: llmConfig.base_url,
      apiKey: llmConfig.key
    };
    if (llmConfig.proxy) {
      logger$7.warn(`Proxy configured but not implemented: ${llmConfig.proxy}`);
    }
    this.client = new OpenAI(clientConfig);
  }
  /**
   * Generate image(s) using Gemini API
   * @param prompt - Text prompt
   * @param refImages - Reference image bytes (optional)
   * @param params - Generation parameters
   * @returns [success, images|error]
   */
  async generateImg(prompt, refImages, params) {
    try {
      const query = [
        {
          type: "text",
          text: `Generate ${params.count} images based on this description:
${prompt}`
        }
      ];
      const { createDataUrl: createDataUrl2 } = await Promise.resolve().then(() => imageHelper);
      for (const imgContent of refImages) {
        const imgUrl = createDataUrl2(imgContent);
        query.push({
          type: "image_url",
          image_url: {
            url: imgUrl
          }
        });
      }
      const imgConfig = {
        size: params.size
      };
      if (params.ratio) {
        imgConfig.aspect_ratio = params.ratio;
      }
      if (params.quality) {
        imgConfig.quality = params.quality;
      }
      const requestParams = {
        model: this.llmConfig.model,
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        n: params.count,
        extra_body: {
          modalities: this.modalities,
          image_config: imgConfig
        }
      };
      logger$7.info(`Generating ${params.count} images with ${this.llmConfig.model}`);
      const response = await this.client.chat.completions.create(requestParams);
      const images = this.extractImages(response);
      if (images.length === 0) {
        const errorMsg = response.choices[0]?.message?.content || "No images generated";
        logger$7.error("No images in response", { errorMsg });
        return [false, errorMsg];
      }
      logger$7.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      logger$7.error("Failed to generate images", err);
      return [false, err instanceof Error ? err.message : String(err)];
    }
  }
  /**
   * Extract images from API response
   * @param response - OpenAI API response
   * @returns Array of image data URLs or URLs
   */
  extractImages(response) {
    const result = [];
    for (const choice of response.choices) {
      const message = choice.message;
      if (message.images && Array.isArray(message.images)) {
        for (const img of message.images) {
          if (img.image_url && img.image_url.url) {
            result.push(img.image_url.url);
          }
        }
      }
    }
    return result;
  }
}
const logger$6 = createLogger("FluxImgGenerator");
class FluxImgGenerator extends GeminiImgGenerator {
  constructor(llmConfig) {
    super(llmConfig);
    this.modalities = ["image"];
    logger$6.info("Flux generator initialized with image-only modality");
  }
}
const logger$5 = createLogger("ImageHelper");
function getImageTypeFromBytes(imgBytes) {
  if (imgBytes.length < 4) {
    return "unknown";
  }
  if (imgBytes[0] === 255 && imgBytes[1] === 216 && imgBytes[2] === 255) {
    return "jpeg";
  }
  if (imgBytes[0] === 137 && imgBytes[1] === 80 && imgBytes[2] === 78 && imgBytes[3] === 71) {
    return "png";
  }
  if (imgBytes[0] === 71 && imgBytes[1] === 73 && imgBytes[2] === 70 && imgBytes[3] === 56) {
    return "gif";
  }
  if (imgBytes[0] === 82 && imgBytes[1] === 73 && imgBytes[2] === 70 && imgBytes[3] === 70 && imgBytes.length > 12 && imgBytes[8] === 87 && imgBytes[9] === 69 && imgBytes[10] === 66 && imgBytes[11] === 80) {
    return "webp";
  }
  return "unknown";
}
async function convertImageToJpeg(imgBytes) {
  const imgType = getImageTypeFromBytes(imgBytes);
  if (imgType === "jpeg") {
    return imgBytes;
  }
  try {
    const converted = await sharp(imgBytes).jpeg({ quality: 95 }).toBuffer();
    logger$5.debug(`Converted ${imgType} to JPEG, size: ${converted.length} bytes`);
    return converted;
  } catch (err) {
    logger$5.error("Failed to convert image to JPEG", err);
    throw new Error(`Image conversion failed: ${err}`);
  }
}
function encodeImageToBase64(imgBytes) {
  return imgBytes.toString("base64");
}
function createDataUrl(imgBytes, mimeType = "image/jpeg") {
  const base64 = encodeImageToBase64(imgBytes);
  return `data:${mimeType};base64,${base64}`;
}
function extractBase64FromDataUrl(dataUrl) {
  if (dataUrl.startsWith("data:")) {
    return dataUrl.split(",", 2)[1];
  }
  return dataUrl;
}
async function downloadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https__namespace : http__namespace;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        logger$5.debug(`Downloaded image from ${url}, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      response.on("error", (err) => {
        logger$5.error(`Error downloading image from ${url}`, err);
        reject(err);
      });
    }).on("error", (err) => {
      logger$5.error(`Failed to connect to ${url}`, err);
      reject(err);
    });
  });
}
async function saveImageToFile(imgBytes, filePath) {
  const fs2 = await import("fs/promises");
  await fs2.writeFile(filePath, imgBytes);
  logger$5.debug(`Saved image to ${filePath}`);
}
async function loadImageFromFile(filePath) {
  const fs2 = await import("fs/promises");
  const buffer = await fs2.readFile(filePath);
  logger$5.debug(`Loaded image from ${filePath}, size: ${buffer.length} bytes`);
  return buffer;
}
async function getImageDimensions(imgBytes) {
  try {
    const metadata = await sharp(imgBytes).metadata();
    return [metadata.width || 0, metadata.height || 0];
  } catch (err) {
    logger$5.error("Failed to get image dimensions", err);
    return [0, 0];
  }
}
async function resizeImage(imgBytes, maxWidth, maxHeight) {
  try {
    const resized = await sharp(imgBytes).resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true
    }).jpeg({ quality: 95 }).toBuffer();
    logger$5.debug(`Resized image to ${resized.length} bytes`);
    return resized;
  } catch (err) {
    logger$5.error("Failed to resize image", err);
    throw new Error(`Image resize failed: ${err}`);
  }
}
const imageHelper = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  convertImageToJpeg,
  createDataUrl,
  downloadImageFromUrl,
  encodeImageToBase64,
  extractBase64FromDataUrl,
  getImageDimensions,
  getImageTypeFromBytes,
  loadImageFromFile,
  resizeImage,
  saveImageToFile
}, Symbol.toStringTag, { value: "Module" }));
const logger$4 = createLogger("QwenImgGenerator");
class QwenImgGenerator extends BaseImgGenerator {
  constructor(llmConfigGen, llmConfigEdit) {
    super(llmConfigGen);
    this.llmConfigGen = llmConfigGen;
    this.llmConfigEdit = llmConfigEdit;
    this.client = this.createAxiosClient(llmConfigGen);
    this.clientEditor = this.createAxiosClient(llmConfigEdit);
    logger$4.info("Qwen generator initialized");
  }
  /**
   * Create axios instance with proxy support
   * @param config - LLM config
   * @returns Axios instance
   */
  createAxiosClient(config2) {
    const clientConfig = {
      baseURL: config2.base_url,
      headers: {
        "Authorization": `Bearer ${config2.key}`,
        "Content-Type": "application/json"
      }
    };
    if (config2.proxy) {
      try {
        const { HttpsProxyAgent } = require("https-proxy-agent");
        clientConfig.httpsAgent = new HttpsProxyAgent(config2.proxy);
        clientConfig.httpAgent = new HttpsProxyAgent(config2.proxy);
        logger$4.debug(`Using proxy: ${config2.proxy}`);
      } catch (err) {
        logger$4.warn("Failed to create proxy agent, continuing without proxy", err);
      }
    }
    return axios.create(clientConfig);
  }
  /**
   * Generate image(s) using Qwen API
   * @param prompt - Text prompt
   * @param refImages - Reference image bytes (optional, max 1 for Qwen)
   * @param params - Generation parameters
   * @returns [success, images|error]
   */
  async generateImg(prompt, refImages, params) {
    try {
      const qwenParams = {
        image_size: params.size,
        batch_size: params.count,
        num_inference_steps: params.steps || 20
      };
      let result;
      if (refImages.length === 0) {
        result = await this.generateTextToImage(prompt, qwenParams);
      } else {
        if (refImages.length > 1) {
          logger$4.warn("Qwen only supports 1 reference image, using the first one");
        }
        result = await this.generateImageToImage(prompt, refImages[0], qwenParams);
      }
      return result;
    } catch (err) {
      logger$4.error("Failed to generate images with Qwen", err);
      return [false, err instanceof Error ? err.message : String(err)];
    }
  }
  /**
   * Generate image from text (text-to-image)
   * @param prompt - Text prompt
   * @param params - Qwen generation parameters
   * @returns [success, images|error]
   */
  async generateTextToImage(prompt, params) {
    try {
      logger$4.info(`Generating ${params.batch_size} images (text-to-image) with ${this.llmConfigGen.model}`);
      const requestData = {
        model: this.llmConfigGen.model,
        prompt,
        image_size: params.image_size,
        batch_size: params.batch_size,
        num_inference_steps: params.num_inference_steps
      };
      const response = await this.clientEditor.post("/images/generations", requestData);
      if (response.status !== 200 || !response.data.images) {
        logger$4.error("Invalid response from Qwen API", {
          status: response.status,
          data: response.data
        });
        return [false, response.data.error || "Invalid response from API"];
      }
      const images = response.data.images.map((img) => img.url);
      logger$4.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger$4.error("Qwen API error", {
          status: err.response?.status,
          data: err.response?.data
        });
        return [false, err.response?.data?.error || err.message || "Unknown error"];
      }
      const error2 = err;
      return [false, error2.message || String(err)];
    }
  }
  /**
   * Generate image from reference image (image-to-image)
   * @param prompt - Text prompt
   * @param refImage - Reference image bytes
   * @param params - Qwen generation parameters
   * @returns [success, images|error]
   */
  async generateImageToImage(prompt, refImage, params) {
    try {
      logger$4.info(`Generating ${params.batch_size} images (image-to-image) with ${this.llmConfigEdit.model}`);
      const imgUrl = createDataUrl(refImage);
      const requestData = {
        model: this.llmConfigEdit.model,
        prompt,
        image: imgUrl,
        image_size: params.image_size,
        batch_size: params.batch_size,
        num_inference_steps: params.num_inference_steps
      };
      const response = await this.clientEditor.post("/images/generations", requestData);
      if (response.status !== 200 || !response.data.images) {
        logger$4.error("Invalid response from Qwen API", {
          status: response.status,
          data: response.data
        });
        return [false, response.data.error || "Invalid response from API"];
      }
      const images = response.data.images.map((img) => img.url);
      logger$4.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger$4.error("Qwen API error", {
          status: err.response?.status,
          data: err.response?.data
        });
        return [false, err.response?.data?.error || err.message || "Unknown error"];
      }
      const error2 = err;
      return [false, error2.message || String(err)];
    }
  }
}
const logger$3 = createLogger("ImgGeneratorFactory");
function getImgGenerator(llmConfig, llmConfigEdit) {
  const model = llmConfig.model.toLowerCase();
  if (model.includes("qwen")) {
    if (!llmConfigEdit) {
      logger$3.warn("Qwen model requires two configs, using same config for both");
      return new QwenImgGenerator(llmConfig, llmConfig);
    }
    return new QwenImgGenerator(llmConfig, llmConfigEdit);
  }
  if (model.includes("flux")) {
    return new FluxImgGenerator(llmConfig);
  }
  if (model.includes("seedream")) {
    return new GeminiImgGenerator(llmConfig);
  }
  if (model.includes("gemini")) {
    return new GeminiImgGenerator(llmConfig);
  }
  logger$3.warn(`Unknown model type: ${llmConfig.model}, using Gemini generator`);
  return new GeminiImgGenerator(llmConfig);
}
const logger$2 = createLogger("ImgGenService");
class ImgGenService {
  constructor() {
    this.recorder = new ImgRecorderService();
    this.configService = new ImgConfigService();
  }
  /**
   * Generate image(s) using standard models
   * @param request - Image generation request
   * @returns Generation result
   */
  async generateImage(request) {
    const configName = this.configService.getDefaultConfigName();
    return await this.generateImageWithConfig(request, configName);
  }
  /**
   * Generate image(s) using specified config
   * @param request - Image generation request
   * @param configName - LLM config name
   * @returns Generation result
   */
  async generateImageWithConfig(request, configName) {
    try {
      const llmConfig = await this.configService.getLlmConfig(configName);
      if (!llmConfig) {
        return {
          success: false,
          error: `LLM config not found: ${configName}`
        };
      }
      const generator = getImgGenerator(llmConfig);
      const recordId = await this.recorder.createRecordDir();
      await this.recorder.recordPrompt(recordId, request.prompt);
      await this.recorder.recordParams(recordId, request.params);
      await this.recorder.recordLlmConfig(recordId, configName);
      const refImages = request.refImages || [];
      for (let i = 0; i < refImages.length; i++) {
        const processedImg = await generator.prepareImg(refImages[i], `ref_${i}.jpg`);
        await this.recorder.recordRefImage(recordId, processedImg, i);
      }
      logger$2.info(
        `Generating ${request.params.count} images with config: ${configName}`
      );
      const [success, imagesOrError] = await generator.generateImg(
        request.prompt,
        refImages,
        request.params
      );
      await this.recorder.recordResponse(recordId, {
        success,
        error: success ? void 0 : imagesOrError
      });
      if (!success) {
        return {
          success: false,
          recordId,
          error: imagesOrError
        };
      }
      const images = imagesOrError;
      for (let i = 0; i < images.length; i++) {
        await this.recorder.recordResultImageFromBase64(recordId, images[i], i);
      }
      logger$2.info(`Successfully generated ${images.length} images, record: ${recordId}`);
      const resultImages = await this.recorder.getResultImages(recordId);
      return {
        success: true,
        recordId,
        resultImages
      };
    } catch (err) {
      logger$2.error("Failed to generate image", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
  /**
   * Generate image(s) using Qwen model
   * @param request - Qwen image generation request
   * @returns Generation result
   */
  async generateImageQwen(request) {
    try {
      const [qwenConfigName, qwenEditConfigName] = this.configService.getQwenConfigNames();
      const qwenConfig = await this.configService.getLlmConfig(qwenConfigName);
      const qwenEditConfig = await this.configService.getLlmConfig(qwenEditConfigName);
      if (!qwenConfig || !qwenEditConfig) {
        return {
          success: false,
          error: `Qwen LLM configs not found: ${qwenConfigName}, ${qwenEditConfigName}`
        };
      }
      const generator = getImgGenerator(qwenConfig, qwenEditConfig);
      const recordId = await this.recorder.createRecordDir();
      await this.recorder.recordPrompt(recordId, request.prompt);
      await this.recorder.recordParams(recordId, request.params);
      const configName = request.refImage ? qwenEditConfigName : qwenConfigName;
      await this.recorder.recordLlmConfig(recordId, configName);
      const refImages = [];
      if (request.refImage) {
        const processedImg = await generator.prepareImg(request.refImage, "ref_0.jpg");
        refImages.push(processedImg);
        await this.recorder.recordRefImage(recordId, processedImg, 0);
      }
      logger$2.info(
        `Generating ${request.params.batch_size} images with Qwen (${request.refImage ? "image-to-image" : "text-to-image"})`
      );
      const [success, imagesOrError] = await generator.generateImg(
        request.prompt,
        refImages,
        {
          count: request.params.batch_size,
          size: request.params.image_size,
          steps: request.params.num_inference_steps
        }
      );
      await this.recorder.recordResponse(recordId, {
        success,
        error: success ? void 0 : imagesOrError
      });
      if (!success) {
        return {
          success: false,
          recordId,
          error: imagesOrError
        };
      }
      const images = imagesOrError;
      for (let i = 0; i < images.length; i++) {
        await this.recorder.recordResultImageFromBase64(recordId, images[i], i);
      }
      logger$2.info(`Successfully generated ${images.length} images with Qwen, record: ${recordId}`);
      const resultImages = await this.recorder.getResultImages(recordId);
      return {
        success: true,
        recordId,
        resultImages
      };
    } catch (err) {
      logger$2.error("Failed to generate image with Qwen", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
  /**
   * List all generation history
   * @returns List of history items
   */
  async listHistory() {
    return await this.recorder.listHistory();
  }
  /**
   * Get detailed history record
   * @param recordId - Record ID
   * @returns Complete record or null
   */
  async getHistory(recordId) {
    return await this.recorder.getHistory(recordId);
  }
  /**
   * Delete history record
   * @param recordId - Record ID
   */
  async deleteHistory(recordId) {
    await this.recorder.deleteHistory(recordId);
  }
  /**
   * List all LLM configs
   * @returns List of config file names
   */
  async listLlmConfigs() {
    return await this.configService.listLlmConfigs();
  }
  /**
   * Get LLM config
   * @param name - Config name
   * @returns LLM config or null
   */
  async getLlmConfig(name) {
    return await this.configService.getLlmConfig(name);
  }
  /**
   * Save LLM config
   * @param name - Config name
   * @param config - LLM config
   */
  async saveLlmConfig(name, config2) {
    await this.configService.saveLlmConfig(name, config2);
  }
  /**
   * Get recorder instance (for direct access if needed)
   * @returns Recorder service
   */
  getRecorder() {
    return this.recorder;
  }
  /**
   * Get config service instance (for direct access if needed)
   * @returns Config service
   */
  getConfigService() {
    return this.configService;
  }
}
const logger$1 = createLogger("ImgGenHandler");
function registerImgGenHandlers() {
  const imgGenService = new ImgGenService();
  electron.ipcMain.handle(IPC_CHANNELS.IMG_GENERATE, async (event, request) => {
    try {
      logger$1.info("IMG_GENERATE called", { prompt: request.prompt.substring(0, 50) });
      const result = await imgGenService.generateImage(request);
      return result;
    } catch (err) {
      logger$1.error("IMG_GENERATE error", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_GENERATE_QWEN, async (event, request) => {
    try {
      logger$1.info("IMG_GENERATE_QWEN called", { prompt: request.prompt.substring(0, 50) });
      const result = await imgGenService.generateImageQwen(request);
      return result;
    } catch (err) {
      logger$1.error("IMG_GENERATE_QWEN error", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_LIST_HISTORY, async () => {
    try {
      const history = await imgGenService.listHistory();
      return history;
    } catch (err) {
      logger$1.error("IMG_LIST_HISTORY error", err);
      return [];
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_GET_HISTORY, async (event, recordId) => {
    try {
      const record = await imgGenService.getHistory(recordId);
      return record;
    } catch (err) {
      logger$1.error("IMG_GET_HISTORY error", err);
      return null;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_DELETE_HISTORY, async (event, recordId) => {
    try {
      await imgGenService.deleteHistory(recordId);
      return { success: true };
    } catch (err) {
      logger$1.error("IMG_DELETE_HISTORY error", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_LIST_LLM_CONFIGS, async () => {
    try {
      const configs = await imgGenService.listLlmConfigs();
      return configs;
    } catch (err) {
      logger$1.error("IMG_LIST_LLM_CONFIGS error", err);
      return [];
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.IMG_GET_LLM_CONFIG, async (event, name) => {
    try {
      const config2 = await imgGenService.getLlmConfig(name);
      return config2;
    } catch (err) {
      logger$1.error("IMG_GET_LLM_CONFIG error", err);
      return null;
    }
  });
  electron.ipcMain.handle(
    IPC_CHANNELS.IMG_SAVE_LLM_CONFIG,
    async (event, name, config2) => {
      try {
        await imgGenService.saveLlmConfig(name, config2);
        return { success: true };
      } catch (err) {
        logger$1.error("IMG_SAVE_LLM_CONFIG error", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
  );
  logger$1.info("Image Generation IPC handlers registered");
}
function registerAllHandlers() {
  registerCommonHandlers();
  registerMdEditorHandlers();
  registerIvViewerHandlers();
  registerRoleplayHandlers();
  registerImgGenHandlers();
}
const logger = createLogger("background", LogLevel.INFO);
const isDevelopment = process.env.NODE_ENV !== "production";
electron.protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);
let mainWindow = null;
async function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path__namespace.join(__dirname, "../preload/index.js"),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION === "true",
      contextIsolation: process.env.ELECTRON_NODE_INTEGRATION !== "true",
      webSecurity: false
    }
  });
  if (isDevelopment && process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path__namespace.join(__dirname, "../renderer/index.html");
    mainWindow.loadFile(indexPath);
  }
}
function getCwd() {
  return process.cwd();
}
function showMsg(title, msg) {
  electron.dialog.showMessageBoxSync({
    type: "info",
    buttons: ["OK"],
    defaultId: 0,
    title,
    message: msg
  });
}
function error(title, msg) {
  electron.dialog.showErrorBox(title, msg);
}
function createMenu() {
  const template = [
    {
      label: "功能",
      submenu: [
        {
          label: "首页",
          click: () => {
            mainWindow?.webContents.send("switch-to-homepage");
          }
        },
        {
          label: "MD编辑器",
          click: () => {
            mainWindow?.webContents.send("switch-to-mdeditor");
          }
        },
        {
          label: "IMG查看",
          click: () => {
            mainWindow?.webContents.send("switch-to-ivviewer");
          }
        },
        {
          label: "AI角色扮演",
          click: () => {
            mainWindow?.webContents.send("switch-to-roleplay");
          }
        },
        {
          label: "AI生图",
          click: () => {
            mainWindow?.webContents.send("switch-to-imggen");
          }
        }
      ]
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于",
          click: () => {
            showMsg("关于", `Qmin v${VERSION}`);
          }
        }
      ]
    }
  ];
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
async function readConfig() {
  const configPath = path__namespace.join(getCwd(), "qmin.json");
  try {
    await config.initConfig(configPath);
    logger.info("Config loaded successfully");
  } catch (err) {
    logger.error("Failed to load qmin.json", err);
    error("错误", "读取qmin.json配置文件失败，将使用默认配置加载！😂");
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.on("ready", async () => {
  logger.info(`Qmin v${VERSION} starting...`);
  registerAllHandlers();
  if (isDevelopment && !process.env.IS_TEST) {
    logger.info("Development mode - Vue Devtools available");
  }
  readConfig();
  createWindow();
  createMenu();
});
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        electron.app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      electron.app.quit();
    });
  }
}
