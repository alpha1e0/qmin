import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { createLogger } from '../utils/logger';

const logger = createLogger('Context');

/**
 * Application paths and directories management
 */
export class WPath {
  readonly currentDirectory: string;
  readonly userDirectory: string;
  readonly workspace: string;
  readonly logDirectory: string;
  readonly tempDirectory: string;
  readonly mdEditorDir: string;
  readonly mdEditorImgDir: string;
  readonly roleplayDir: string;
  readonly roleplayScenarioDir: string;
  readonly roleplayLlmConfigsDir: string;
  readonly imgGenDir: string;
  readonly imgGenLlmConfigsDir: string;
  readonly imgGenHistoryDir: string;
  readonly configPath: string;
  readonly qminDatabase: string;
  readonly tasks: string;

  // Legacy property aliases for backward compatibility
  /** @deprecated Use currentDirectory instead */
  get curDir(): string {
    return this.currentDirectory;
  }

  /** @deprecated Use userDirectory instead */
  get userDir(): string {
    return this.userDirectory;
  }

  /** @deprecated Use logDirectory instead */
  get logDir(): string {
    return this.logDirectory;
  }

  /** @deprecated Use tempDirectory instead */
  get tmpDir(): string {
    return this.tempDirectory;
  }

  /** @deprecated Use configPath instead */
  get cfg(): string {
    return this.configPath;
  }

  /** @deprecated Use qminDatabase instead */
  get qminDb(): string {
    return this.qminDatabase;
  }

  constructor() {
    this.currentDirectory = process.cwd();

    // Get user home directory
    this.userDirectory = os.homedir();
    // Fallback to current directory if home directory doesn't exist
    if (!fs.access(this.userDirectory).catch(() => true)) {
      this.userDirectory = this.currentDirectory;
    }

    // Get workspace from environment variable or use default
    const envWorkspace = process.env.QMIN_WORKSPACE;
    if (envWorkspace) {
      this.workspace = envWorkspace;
    } else {
      // Default workspace: ~/.qmin
      this.workspace = path.join(this.userDirectory, '.qmin');
    }

    // Create workspace if it doesn't exist
    this.ensureDirectory(this.workspace);

    logger.info(`Workspace initialized: '${this.workspace}'`);

    // Setup subdirectories
    this.logDirectory = path.join(this.workspace, 'log');
    this.ensureDirectory(this.logDirectory);

    this.tempDirectory = path.join(this.workspace, 'tmp');
    this.ensureDirectory(this.tempDirectory);

    this.mdEditorDir = path.join(this.workspace, 'md_editor');
    this.ensureDirectory(this.mdEditorDir);

    this.mdEditorImgDir = path.join(this.mdEditorDir, 'img');
    this.ensureDirectory(this.mdEditorImgDir);

    // Roleplay directories
    this.roleplayDir = path.join(this.workspace, 'roleplay');
    this.ensureDirectory(this.roleplayDir);

    this.roleplayScenarioDir = path.join(this.roleplayDir, 'scenario');
    this.ensureDirectory(this.roleplayScenarioDir);

    this.roleplayLlmConfigsDir = path.join(this.roleplayDir, 'llm_configs');
    this.ensureDirectory(this.roleplayLlmConfigsDir);

    // Image Gen directories
    this.imgGenDir = path.join(this.workspace, 'img_gen');
    this.ensureDirectory(this.imgGenDir);

    this.imgGenLlmConfigsDir = path.join(this.imgGenDir, 'llm_configs');
    this.ensureDirectory(this.imgGenLlmConfigsDir);

    this.imgGenHistoryDir = path.join(this.imgGenDir, 'history');
    this.ensureDirectory(this.imgGenHistoryDir);

    // Configuration and data files
    // Configuration file: qmin.json (unified config file name)
    this.configPath = path.join(this.workspace, 'qmin.json');
    this.qminDatabase = path.join(this.workspace, 'qmin.db');
    this.tasks = path.join(this.workspace, 'tasks.json');
  }

  /**
   * Get SQL file path for database initialization
   */
  getSqlFile(): string {
    return path.join(process.resourcesPath || process.cwd(), 'data', 'qmin.sql');
  }

  /**
   * Get SQL file path for database initialization
   * @deprecated Use getSqlFile() instead
   */
  getSqlFilePath(): string {
    return this.getSqlFile();
  }

  /**
   * Ensure a directory exists, create it if not
   */
  private ensureDirectory(dirPath: string): void {
    try {
      fs.access(dirPath).catch(() => {
        fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
      });
    } catch (err) {
      logger.error(`Failed to ensure directory ${dirPath}`, err);
    }
  }
}

/**
 * Markdown Editor configuration
 */
export interface MdEditorConfig {
  en_key?: string;
  hkey_hash?: string;
  debug?: boolean;
}

/**
 * Image Viewer configuration
 */
export interface ImgViewerConfig {
  iv_path?: string;
}

/**
 * Roleplay configuration
 */
export interface RoleplayConfig {
  default_llm_config?: string;
}

/**
 * Image Gen configuration
 */
export interface ImgGenConfig {
  default_llm_config?: string;
  qwen_llm_config?: string;
  qwen_edit_llm_config?: string;
}

/**
 * Application configuration
 */
export interface ConfigData {
  md_editor?: MdEditorConfig;
  img_viewer?: ImgViewerConfig;
  roleplay?: RoleplayConfig;
  img_gen?: ImgGenConfig;
}

export class Config {
  // Markdown Editor config
  mdEditor: {
    enKey: string;
    hkeyHash: string;
    debug: boolean;
  };

  // Image Viewer config
  imgViewer: {
    ivPath: string;
  };

  // Roleplay config
  roleplay: {
    defaultLlmConfig: string;
  };

  // Image Gen config
  imgGen: {
    defaultLlmConfig: string;
    qwenLlmConfig: string;
    qwenEditLlmConfig: string;
  };

  constructor() {
    this.mdEditor = {
      enKey: '',
      hkeyHash: '',
      debug: true,
    };
    this.imgViewer = {
      ivPath: 'dir_not_exists',
    };
    this.roleplay = {
      defaultLlmConfig: 'config.json',
    };
    this.imgGen = {
      defaultLlmConfig: 'default.json',
      qwenLlmConfig: 'qwen.json',
      qwenEditLlmConfig: 'qwen-edit.json',
    };
  }

  /**
   * Initialize configuration from JSON file
   */
  async initConfig(cfgPath: string): Promise<void> {
    try {
      const data = await fs.readFile(cfgPath, 'utf-8');
      const cfgObj: ConfigData = JSON.parse(data);

      // Initialize md_editor config
      if (cfgObj.md_editor) {
        this.mdEditor.enKey = cfgObj.md_editor.en_key ?? '';
        this.mdEditor.hkeyHash = cfgObj.md_editor.hkey_hash ?? '';
        this.mdEditor.debug = cfgObj.md_editor.debug ?? true;
      }

      // Initialize img_viewer config
      if (cfgObj.img_viewer) {
        this.imgViewer.ivPath = cfgObj.img_viewer.iv_path ?? 'dir_not_exists';
      }

      // Initialize roleplay config
      if (cfgObj.roleplay) {
        this.roleplay.defaultLlmConfig = cfgObj.roleplay.default_llm_config ?? 'config.json';
      }

      // Initialize img_gen config
      if (cfgObj.img_gen) {
        this.imgGen.defaultLlmConfig = cfgObj.img_gen.default_llm_config ?? 'default.json';
        this.imgGen.qwenLlmConfig = cfgObj.img_gen.qwen_llm_config ?? 'qwen.json';
        this.imgGen.qwenEditLlmConfig = cfgObj.img_gen.qwen_edit_llm_config ?? 'qwen-edit.json';
      }
    } catch (err) {
      throw new Error(`Cannot read config file '${cfgPath}': ${err}`);
    }
  }
}

// Global instances
export const wpath = new WPath();
export const config = new Config();

// Global references for task manager and websocket (will be set at runtime)
export let taskManager: any = null;
export let websocket: any = null;

/**
 * Set the global task manager instance
 */
export function setTaskManager(tm: any): void {
  taskManager = tm;
}

/**
 * Set the global websocket instance
 */
export function setWebsocket(ws: any): void {
  websocket = ws;
}
