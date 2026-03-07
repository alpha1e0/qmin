import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RoleplayHistoryService } from './roleplay-history.service';
import { RoleplayChatHistory } from '../common/config';

// Mock wpath
vi.mock('../common/context', () => ({
  wpath: {
    roleplayScenarioDir: '/tmp/test-roleplay-histories',
  },
}));

describe('RoleplayHistoryService', () => {
  const service = new RoleplayHistoryService();
  const testBaseDir = '/tmp/test-roleplay-histories';

  const mockHistory: RoleplayChatHistory = {
    assistant_name: 'AI Assistant',
    user_name: 'User',
    system_prompt: 'You are a helpful assistant',
    messages: [
      { role: 'system', content: 'Hello' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'How can I help?' },
    ],
  };

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(testBaseDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('listHistories', () => {
    it('should return empty array when history directory does not exist', async () => {
      const histories = await service.listHistories('non-existent-scenario');
      expect(histories).toEqual([]);
    });

    it('should return sorted list of history filenames', async () => {
      const scenarioName = 'test-scenario';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');
      await fs.mkdir(historyDir, { recursive: true });

      // Create test history files
      const historyNames = ['charlie.json', 'alpha.json', 'bravo.json'];
      for (const name of historyNames) {
        await fs.writeFile(path.join(historyDir, name), JSON.stringify(mockHistory), 'utf-8');
      }

      // Create non-JSON file (should be filtered out)
      await fs.writeFile(path.join(historyDir, 'readme.txt'), 'text file', 'utf-8');

      const histories = await service.listHistories(scenarioName);
      expect(histories).toEqual(['alpha.json', 'bravo.json', 'charlie.json']);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.listHistories('')).rejects.toThrow('Scenario name cannot be empty');
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.listHistories('../etc/passwd')).rejects.toThrow('Invalid scenario name');
    });
  });

  describe('getHistory', () => {
    it('should return history data', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'test-history.json';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');
      await fs.mkdir(historyDir, { recursive: true });
      await fs.writeFile(path.join(historyDir, historyName), JSON.stringify(mockHistory), 'utf-8');

      const history = await service.getHistory(scenarioName, historyName);
      expect(history).toEqual(mockHistory);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.getHistory('', 'test.json')).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for empty history name', async () => {
      await expect(service.getHistory('test-scenario', '')).rejects.toThrow(
        'History name cannot be empty'
      );
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.getHistory('../etc/passwd', 'test.json')).rejects.toThrow(
        'Invalid scenario name'
      );
    });

    it('should throw error for invalid history name with path traversal', async () => {
      await expect(service.getHistory('test-scenario', '../etc/passwd')).rejects.toThrow(
        'Invalid history name'
      );
    });

    it('should throw error for non-existent history', async () => {
      await expect(service.getHistory('test-scenario', 'non-existent.json')).rejects.toThrow(
        "History 'non-existent.json' not found"
      );
    });
  });

  describe('createHistory', () => {
    it('should create new history with auto .json extension', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'new-history';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');

      await service.createHistory(scenarioName, historyName, mockHistory);

      // Verify history file created
      const historyPath = path.join(historyDir, `${historyName}.json`);
      const historyData = await fs.readFile(historyPath, 'utf-8');
      expect(JSON.parse(historyData)).toEqual(mockHistory);
    });

    it('should create new history with .json extension already present', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'new-history.json';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');

      await service.createHistory(scenarioName, historyName, mockHistory);

      // Verify history file created
      const historyPath = path.join(historyDir, historyName);
      const historyData = await fs.readFile(historyPath, 'utf-8');
      expect(JSON.parse(historyData)).toEqual(mockHistory);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.createHistory('', 'test.json', mockHistory)).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for empty history name', async () => {
      await expect(service.createHistory('test-scenario', '', mockHistory)).rejects.toThrow(
        'History name cannot be empty'
      );
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.createHistory('../etc/passwd', 'test.json', mockHistory)).rejects.toThrow(
        'Invalid scenario name'
      );
    });

    it('should throw error for invalid history name with path traversal', async () => {
      await expect(
        service.createHistory('test-scenario', '../etc/passwd', mockHistory)
      ).rejects.toThrow('Invalid history name');
    });
  });

  describe('saveHistory', () => {
    it('should save existing history', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'save-history.json';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');
      await fs.mkdir(historyDir, { recursive: true });
      await fs.writeFile(path.join(historyDir, historyName), JSON.stringify(mockHistory), 'utf-8');

      const updatedHistory: RoleplayChatHistory = {
        ...mockHistory,
        messages: [...mockHistory.messages, { role: 'user', content: 'New message' }],
      };

      await service.saveHistory(scenarioName, historyName, updatedHistory);

      const historyData = await fs.readFile(path.join(historyDir, historyName), 'utf-8');
      expect(JSON.parse(historyData)).toEqual(updatedHistory);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.saveHistory('', 'test.json', mockHistory)).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for empty history name', async () => {
      await expect(service.saveHistory('test-scenario', '', mockHistory)).rejects.toThrow(
        'History name cannot be empty'
      );
    });
  });

  describe('deleteHistory', () => {
    it('should delete existing history', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'delete-history.json';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');
      await fs.mkdir(historyDir, { recursive: true });
      await fs.writeFile(path.join(historyDir, historyName), JSON.stringify(mockHistory), 'utf-8');

      await service.deleteHistory(scenarioName, historyName);

      // Verify history file deleted
      const historyPath = path.join(historyDir, historyName);
      await expect(fs.access(historyPath)).rejects.toThrow();
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.deleteHistory('', 'test.json')).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for empty history name', async () => {
      await expect(service.deleteHistory('test-scenario', '')).rejects.toThrow(
        'History name cannot be empty'
      );
    });

    it('should throw error when deleting non-existent history', async () => {
      await expect(
        service.deleteHistory('test-scenario', 'non-existent.json')
      ).rejects.toThrow();
    });
  });

  describe('historyExists', () => {
    it('should return true for existing history', async () => {
      const scenarioName = 'test-scenario';
      const historyName = 'existing-history.json';
      const historyDir = path.join(testBaseDir, scenarioName, 'history');
      await fs.mkdir(historyDir, { recursive: true });
      await fs.writeFile(path.join(historyDir, historyName), JSON.stringify(mockHistory), 'utf-8');

      const exists = await service.historyExists(scenarioName, historyName);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent history', async () => {
      const exists = await service.historyExists('test-scenario', 'non-existent.json');
      expect(exists).toBe(false);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.historyExists('', 'test.json')).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for empty history name', async () => {
      await expect(service.historyExists('test-scenario', '')).rejects.toThrow(
        'History name cannot be empty'
      );
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.historyExists('../etc/passwd', 'test.json')).rejects.toThrow(
        'Invalid scenario name'
      );
    });

    it('should throw error for invalid history name with path traversal', async () => {
      await expect(service.historyExists('test-scenario', '../etc/passwd')).rejects.toThrow(
        'Invalid history name'
      );
    });
  });
});
