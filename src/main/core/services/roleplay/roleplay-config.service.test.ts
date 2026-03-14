import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { RoleplayConfigService } from '@/main/core/services/roleplay/roleplay-config.service';
import { RoleplayLLMConfig } from '../../common/config';

// Mock wpath
vi.mock('../common/context', () => ({
  wpath: {
    roleplayLlmConfigsDir: os.tmpdir() + '/',
  },
}));

// Mock process.env
const originalEnv = process.env;

describe('RoleplayConfigService', () => {
  const service = new RoleplayConfigService();
  const testConfigsDir = os.tmpdir() + '/';

  const mockConfig: RoleplayLLMConfig = {
    base_url: 'https://api.example.com',
    model: 'test-model',
    key: 'test-api-key',
    temperature: 0.7,
    max_tokens: 1000,
  };

  beforeEach(async () => {
    // Reset process.env
    process.env = { ...originalEnv };

    // Create test directory
    await fs.mkdir(testConfigsDir, { recursive: true });
  });

  afterEach(async () => {
    // Restore process.env
    process.env = originalEnv;

    // Cleanup test directory
    try {
      await fs.rm(testConfigsDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('listConfigs', () => {
    it('should return empty array when no configs exist', async () => {
      const configs = await service.listConfigs();
      expect(configs).toEqual([]);
    });

    it('should return sorted list of config filenames', async () => {
      // Create test config files
      const configNames = ['zebra.json', 'alpha.json', 'bravo.json'];
      for (const name of configNames) {
        await fs.writeFile(
          path.join(testConfigsDir, name),
          JSON.stringify(mockConfig),
          'utf-8'
        );
      }

      // Create non-JSON file (should be filtered out)
      await fs.writeFile(path.join(testConfigsDir, 'readme.txt'), 'text file', 'utf-8');

      const configs = await service.listConfigs();
      expect(configs).toEqual(['alpha.json', 'bravo.json', 'zebra.json']);
    });
  });

  describe('getConfig', () => {
    it('should return config data', async () => {
      const configName = 'test-config.json';
      await fs.writeFile(path.join(testConfigsDir, configName), JSON.stringify(mockConfig), 'utf-8');

      const config = await service.getConfig(configName);
      expect(config).toEqual(mockConfig);
    });

    it('should add .json extension if not present', async () => {
      const configName = 'test-config';
      const configPath = path.join(testConfigsDir, `${configName}.json`);
      await fs.writeFile(configPath, JSON.stringify(mockConfig), 'utf-8');

      const config = await service.getConfig(configName);
      expect(config).toEqual(mockConfig);
    });

    it('should load API key from environment if not in config', async () => {
      const configWithoutKey = { ...mockConfig, key: '' };
      const configName = 'test-config.json';
      await fs.writeFile(
        path.join(testConfigsDir, configName),
        JSON.stringify(configWithoutKey),
        'utf-8'
      );

      process.env.OPENAI_API_KEY = 'env-api-key';

      const config = await service.getConfig(configName);
      expect(config.key).toBe('env-api-key');
    });

    it('should prefer config key over environment key', async () => {
      const configName = 'test-config.json';
      await fs.writeFile(path.join(testConfigsDir, configName), JSON.stringify(mockConfig), 'utf-8');

      process.env.OPENAI_API_KEY = 'env-api-key';

      const config = await service.getConfig(configName);
      expect(config.key).toBe('test-api-key');
    });

    it('should throw error for empty config name', async () => {
      await expect(service.getConfig('')).rejects.toThrow('Config name cannot be empty');
    });

    it('should throw error for invalid config name with path traversal', async () => {
      await expect(service.getConfig('../etc/passwd')).rejects.toThrow('Invalid config name');
    });

    it('should throw error for non-existent config', async () => {
      await expect(service.getConfig('non-existent.json')).rejects.toThrow(
        "Config 'non-existent.json' not found"
      );
    });
  });

  describe('saveConfig', () => {
    it('should save new config with auto .json extension', async () => {
      const configName = 'new-config';
      await service.saveConfig(configName, mockConfig);

      // Verify config file created
      const configPath = path.join(testConfigsDir, `${configName}.json`);
      const configData = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(configData)).toEqual(mockConfig);
    });

    it('should save new config with .json extension already present', async () => {
      const configName = 'new-config.json';
      await service.saveConfig(configName, mockConfig);

      // Verify config file created
      const configPath = path.join(testConfigsDir, configName);
      const configData = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(configData)).toEqual(mockConfig);
    });

    it('should overwrite existing config', async () => {
      const configName = 'existing-config.json';
      await fs.writeFile(path.join(testConfigsDir, configName), JSON.stringify(mockConfig), 'utf-8');

      const updatedConfig = { ...mockConfig, model: 'updated-model' };
      await service.saveConfig(configName, updatedConfig);

      const configData = await fs.readFile(path.join(testConfigsDir, configName), 'utf-8');
      expect(JSON.parse(configData)).toEqual(updatedConfig);
    });

    it('should throw error for empty config name', async () => {
      await expect(service.saveConfig('', mockConfig)).rejects.toThrow('Config name cannot be empty');
    });

    it('should throw error for invalid config name with path traversal', async () => {
      await expect(service.saveConfig('../etc/passwd', mockConfig)).rejects.toThrow(
        'Invalid config name'
      );
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', async () => {
      const configName = 'delete-config.json';
      await fs.writeFile(path.join(testConfigsDir, configName), JSON.stringify(mockConfig), 'utf-8');

      await service.deleteConfig(configName);

      // Verify config file deleted
      const configPath = path.join(testConfigsDir, configName);
      await expect(fs.access(configPath)).rejects.toThrow();
    });

    it('should delete config with auto .json extension', async () => {
      const configName = 'delete-config';
      const configPath = path.join(testConfigsDir, `${configName}.json`);
      await fs.writeFile(configPath, JSON.stringify(mockConfig), 'utf-8');

      await service.deleteConfig(configName);

      await expect(fs.access(configPath)).rejects.toThrow();
    });

    it('should throw error for empty config name', async () => {
      await expect(service.deleteConfig('')).rejects.toThrow('Config name cannot be empty');
    });

    it('should throw error for invalid config name with path traversal', async () => {
      await expect(service.deleteConfig('../etc/passwd')).rejects.toThrow('Invalid config name');
    });

    it('should throw error when deleting non-existent config', async () => {
      await expect(service.deleteConfig('non-existent.json')).rejects.toThrow();
    });
  });

  describe('getDefaultConfig', () => {
    // Note: getDefaultConfig depends on the global config object from context
    // Testing actual behavior requires mocking the entire context module properly
    // For now, we'll skip these tests as they require complex module mocking

    it.skip('should return default config from file if exists', async () => {
      // This test requires proper mocking of the context module
      // TODO: Implement proper module mocking for context
    });

    it.skip('should return fallback config when default file does not exist', async () => {
      // This test requires proper mocking of the context module
      // TODO: Implement proper module mocking for context
    });
  });

  describe('edge cases', () => {
    it('should handle config with all optional fields', async () => {
      const minimalConfig: RoleplayLLMConfig = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
        temperature: 0.7,
        max_tokens: 1000,
      };

      const configName = 'minimal-config.json';
      await fs.writeFile(path.join(testConfigsDir, configName), JSON.stringify(minimalConfig), 'utf-8');

      const config = await service.getConfig(configName);
      expect(config).toEqual(minimalConfig);
    });

    it('should handle config with proxy', async () => {
      const configWithProxy: RoleplayLLMConfig = {
        ...mockConfig,
        proxy: 'http://proxy.example.com:8080',
      };

      const configName = 'proxy-config.json';
      await fs.writeFile(
        path.join(testConfigsDir, configName),
        JSON.stringify(configWithProxy),
        'utf-8'
      );

      const config = await service.getConfig(configName);
      expect(config.proxy).toBe('http://proxy.example.com:8080');
    });

    it('should handle config with break_prompt', async () => {
      const configWithBreak: RoleplayLLMConfig = {
        ...mockConfig,
        break_prompt: 'Break character if user asks',
      };

      const configName = 'break-config.json';
      await fs.writeFile(
        path.join(testConfigsDir, configName),
        JSON.stringify(configWithBreak),
        'utf-8'
      );

      const config = await service.getConfig(configName);
      expect(config.break_prompt).toBe('Break character if user asks');
    });
  });
});
