/**
 * Image Configuration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImgConfigService } from './img-config.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
vi.mock('fs/promises');
vi.mock('../common/context', () => ({
  wpath: {
    imgGenLlmConfigsDir: '/mock/configs',
  },
}));

describe('ImgConfigService', () => {
  let configService: ImgConfigService;

  beforeEach(() => {
    configService = new ImgConfigService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listLlmConfigs', () => {
    it('should return list of JSON config files', async () => {
      const mockEntries = [
        { name: 'default.json', isFile: () => true },
        { name: 'gemini.json', isFile: () => true },
        { name: 'readme.txt', isFile: () => true },
      ] as any;

      vi.mocked(fs.readdir).mockResolvedValue(mockEntries);

      const configs = await configService.listLlmConfigs();
      expect(configs).toEqual(['default.json', 'gemini.json']);
      expect(fs.readdir).toHaveBeenCalledWith('/mock/configs', { withFileTypes: true });
    });

    it('should return empty array on error', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Read error'));

      const configs = await configService.listLlmConfigs();
      expect(configs).toEqual([]);
    });
  });

  describe('getLlmConfig', () => {
    it('should load and parse LLM config', async () => {
      const mockConfig = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
        temperature: 0.7,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configService.getLlmConfig('default.json');
      expect(config).toEqual(mockConfig);
    });

    it('should add .json extension if missing', async () => {
      const mockConfig = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      await configService.getLlmConfig('default');
      expect(fs.readFile).toHaveBeenCalledWith(path.join('/mock/configs', 'default.json'), 'utf-8');
    });

    it('should return null if file not found', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const config = await configService.getLlmConfig('nonexistent.json');
      expect(config).toBeNull();
    });

    it('should return null for invalid config', async () => {
      const invalidConfig = {
        base_url: 'https://api.example.com',
        // Missing required fields
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const config = await configService.getLlmConfig('invalid.json');
      expect(config).toBeNull();
    });
  });

  describe('saveLlmConfig', () => {
    it('should save LLM config to file', async () => {
      const config = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
      };

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await configService.saveLlmConfig('test.json', config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/mock/configs', 'test.json'),
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    });

    it('should add .json extension if missing', async () => {
      const config = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
      };

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await configService.saveLlmConfig('test', config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/mock/configs', 'test.json'),
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('hasLlmConfig', () => {
    it('should return true if config exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const exists = await configService.hasLlmConfig('default.json');
      expect(exists).toBe(true);
    });

    it('should return false if config does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));

      const exists = await configService.hasLlmConfig('nonexistent.json');
      expect(exists).toBe(false);
    });
  });
});
