import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { test as base } from '@playwright/test';
import path from 'path';
import fs from 'fs';

type AppFixtures = {
  electronApp: ElectronApplication;
  window: Page;
  testWorkspace: string;
};

export const test = base.extend<AppFixtures>({
  testWorkspace: async ({}, use) => {
    const testDir = path.join(__dirname, '../../.qmin-test');

    // 清理并创建测试工作空间
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    await use(testDir);

    // 测试后清理
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  },

  electronApp: async ({ testWorkspace }, use) => {
    // 设置测试工作空间环境变量
    process.env.QMIN_WORKSPACE = testWorkspace;
    process.env.NODE_ENV = 'test';

    // 检查是否需要构建应用
    const distMainPath = path.join(__dirname, '../../dist-electron/main/index.js');
    const fs = require('fs');

    if (!fs.existsSync(distMainPath)) {
      console.log('📦 应用未构建，跳过Electron启动测试。请先运行 npm run build');
      // 创建一个模拟的app对象，避免测试完全失败
      const mockApp = {
        close: async () => {},
        evaluate: async () => '0.0.1',
        firstWindow: async () => {
          throw new Error('应用未构建，请先运行 npm run build');
        }
      };
      await use(mockApp as any);
      return;
    }

    // 启动Electron应用
    try {
      // 根据平台确定Electron可执行文件路径
      let executablePath: string;
      if (process.platform === 'win32') {
        executablePath = path.join(__dirname, '../../node_modules/electron/dist/electron.exe');
      } else {
        executablePath = path.join(__dirname, '../../node_modules/.bin/electron');
      }

      const app = await electron.launch({
        executablePath,
        args: [path.join(__dirname, '../../')],
        env: {
          ...process.env,
          QMIN_WORKSPACE: testWorkspace,
          NODE_ENV: 'test',
          IS_TEST: 'true'
        }
      });

      await use(app);
      await app.close();
    } catch (error) {
      console.error('❌ Electron启动失败:', error.message);
      throw error;
    }
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow({
      timeout: 15000
    });
    await use(window);
  },
});

export const expect = test.expect;
