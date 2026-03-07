/**
 * Main process entry point for Qmin application
 */

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';

import { registerAllHandlers } from './ipc/handlers';
import { config } from './common/context';
import { VERSION } from './common/constants';
import { createLogger, LogLevel } from './utils/logger';

const logger = createLogger('background', LogLevel.INFO);

const isDevelopment = process.env.NODE_ENV !== 'production';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

let mainWindow: BrowserWindow | null = null;

/**
 * Create the browser window
 */
async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION === 'true',
      contextIsolation: process.env.ELECTRON_NODE_INTEGRATION !== 'true',
      webSecurity: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    // Load the index.html when not in development
    const indexPath = path.join(__dirname, '../../dist/index.html');
    mainWindow.loadFile(indexPath);
  }
}

/**
 * Get current working directory
 */
function getCwd(): string {
  // return path.dirname(process.execPath);
  return process.cwd();
}

/**
 * Show message dialog
 */
function showMsg(title: string, msg: string): void {
  dialog.showMessageBoxSync({
    type: 'info',
    buttons: ['OK'],
    defaultId: 0,
    title: title,
    message: msg,
  });
}

/**
 * Show error dialog
 */
function error(title: string, msg: string): void {
  dialog.showErrorBox(title, msg);
}

/**
 * Create application menu
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '功能',
      submenu: [
        {
          label: '首页',
          click: () => {
            mainWindow?.webContents.send('switch-to-homepage');
          },
        },
        {
          label: 'MD编辑器',
          click: () => {
            mainWindow?.webContents.send('switch-to-mdeditor');
          },
        },
        {
          label: 'IMG查看',
          click: () => {
            mainWindow?.webContents.send('switch-to-ivviewer');
          },
        },
        {
          label: 'AI角色扮演',
          click: () => {
            mainWindow?.webContents.send('switch-to-roleplay');
          },
        },
        {
          label: 'AI生图',
          click: () => {
            mainWindow?.webContents.send('switch-to-imggen');
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            showMsg('关于', `Qmin v${VERSION}`);
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Read configuration file
 */
async function readConfig(): Promise<void> {
  const configPath = path.join(getCwd(), 'qmin.json');

  try {
    await config.initConfig(configPath);
    logger.info('Config loaded successfully');
  } catch (err) {
    logger.error('Failed to load qmin.json', err);
    error('错误', '读取qmin.json配置文件失败，将使用默认配置加载！😂');
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  logger.info(`Qmin v${VERSION} starting...`);

  // Register IPC handlers
  registerAllHandlers();

  if (isDevelopment && !process.env.IS_TEST) {
    // Vue Devtools installation skipped to avoid webpack bundling issues
    logger.info('Vue Devtools installation skipped (development mode)');
  }

  // Read configuration
  readConfig();

  // Create window
  createWindow();

  // Create menu
  createMenu();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data: string) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
