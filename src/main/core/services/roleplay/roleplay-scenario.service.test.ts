import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RoleplayScenarioService } from '@/core/services/roleplay/roleplay-scenario.service';
import { RoleplayScenario } from '../../common/config';

// Mock wpath
vi.mock('../common/context', () => ({
  wpath: {
    roleplayScenarioDir: '/tmp/test-roleplay-scenarios',
  },
}));

describe('RoleplayScenarioService', () => {
  const service = new RoleplayScenarioService();
  const testScenarioDir = '/tmp/test-roleplay-scenarios';

  const mockScenario: RoleplayScenario = {
    assistant_name: 'AI Assistant',
    user_name: 'User',
    system_prompt: 'You are a helpful assistant',
    start: [
      { role: 'system', content: 'Hello' },
      { role: 'user', content: 'Hi' },
    ],
  };

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testScenarioDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testScenarioDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('listScenarios', () => {
    it('should return empty array when no scenarios exist', async () => {
      const scenarios = await service.listScenarios();
      expect(scenarios).toEqual([]);
    });

    it('should return sorted list of scenario names', async () => {
      // Create test scenarios
      const scenarioNames = ['zebra', 'alpha', 'bravo'];
      for (const name of scenarioNames) {
        const scenarioDir = path.join(testScenarioDir, name);
        await fs.mkdir(scenarioDir, { recursive: true });
        await fs.writeFile(
          path.join(scenarioDir, 'scene.json'),
          JSON.stringify(mockScenario),
          'utf-8'
        );
      }

      // Create directory without scene.json (should be skipped)
      const invalidDir = path.join(testScenarioDir, 'invalid');
      await fs.mkdir(invalidDir, { recursive: true });

      const scenarios = await service.listScenarios();
      expect(scenarios).toEqual(['alpha', 'bravo', 'zebra']);
    });

    it('should skip directories without scene.json', async () => {
      const scenarioDir = path.join(testScenarioDir, 'valid-scenario');
      await fs.mkdir(scenarioDir, { recursive: true });
      await fs.writeFile(
        path.join(scenarioDir, 'scene.json'),
        JSON.stringify(mockScenario),
        'utf-8'
      );

      const invalidDir = path.join(testScenarioDir, 'invalid-scenario');
      await fs.mkdir(invalidDir, { recursive: true });

      const scenarios = await service.listScenarios();
      expect(scenarios).toEqual(['valid-scenario']);
    });
  });

  describe('getScenario', () => {
    it('should return scenario data', async () => {
      const scenarioName = 'test-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });
      await fs.writeFile(
        path.join(scenarioDir, 'scene.json'),
        JSON.stringify(mockScenario),
        'utf-8'
      );

      const scenario = await service.getScenario(scenarioName);
      expect(scenario).toEqual(mockScenario);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.getScenario('')).rejects.toThrow('Scenario name cannot be empty');
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.getScenario('../etc/passwd')).rejects.toThrow('Invalid scenario name');
    });

    it('should throw error for non-existent scenario', async () => {
      await expect(service.getScenario('non-existent')).rejects.toThrow("Scenario 'non-existent' not found");
    });
  });

  describe('createScenario', () => {
    it('should create new scenario with history directory', async () => {
      const scenarioName = 'new-scenario';
      await service.createScenario(scenarioName, mockScenario);

      // Verify scenario directory and files created
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      const sceneJsonPath = path.join(scenarioDir, 'scene.json');
      const historyDir = path.join(scenarioDir, 'history');

      const sceneData = await fs.readFile(sceneJsonPath, 'utf-8');
      expect(JSON.parse(sceneData)).toEqual(mockScenario);

      await expect(fs.access(historyDir)).resolves.toBeUndefined();
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.createScenario('', mockScenario)).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.createScenario('../etc/passwd', mockScenario)).rejects.toThrow(
        'Invalid scenario name'
      );
    });

    it('should throw error when scenario already exists', async () => {
      const scenarioName = 'existing-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });

      await expect(service.createScenario(scenarioName, mockScenario)).rejects.toThrow(
        `Scenario '${scenarioName}' already exists`
      );
    });
  });

  describe('updateScenario', () => {
    it('should update existing scenario', async () => {
      const scenarioName = 'update-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });
      await fs.writeFile(
        path.join(scenarioDir, 'scene.json'),
        JSON.stringify(mockScenario),
        'utf-8'
      );

      const updatedScenario: RoleplayScenario = {
        ...mockScenario,
        assistant_name: 'Updated Assistant',
      };

      await service.updateScenario(scenarioName, updatedScenario);

      const sceneData = await fs.readFile(path.join(scenarioDir, 'scene.json'), 'utf-8');
      expect(JSON.parse(sceneData)).toEqual(updatedScenario);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.updateScenario('', mockScenario)).rejects.toThrow(
        'Scenario name cannot be empty'
      );
    });
  });

  describe('deleteScenario', () => {
    it('should delete existing scenario', async () => {
      const scenarioName = 'delete-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });
      await fs.writeFile(
        path.join(scenarioDir, 'scene.json'),
        JSON.stringify(mockScenario),
        'utf-8'
      );

      await service.deleteScenario(scenarioName);

      // Verify scenario directory deleted
      await expect(fs.access(scenarioDir)).rejects.toThrow();
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.deleteScenario('')).rejects.toThrow('Scenario name cannot be empty');
    });

    it('should handle deletion of non-existent scenario gracefully', async () => {
      // Should not throw, recursive: true handles this
      await service.deleteScenario('non-existent');
    });
  });

  describe('scenarioExists', () => {
    it('should return true for existing scenario', async () => {
      const scenarioName = 'existing-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });
      await fs.writeFile(
        path.join(scenarioDir, 'scene.json'),
        JSON.stringify(mockScenario),
        'utf-8'
      );

      const exists = await service.scenarioExists(scenarioName);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent scenario', async () => {
      const exists = await service.scenarioExists('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for directory without scene.json', async () => {
      const scenarioName = 'invalid-scenario';
      const scenarioDir = path.join(testScenarioDir, scenarioName);
      await fs.mkdir(scenarioDir, { recursive: true });

      const exists = await service.scenarioExists(scenarioName);
      expect(exists).toBe(false);
    });

    it('should throw error for empty scenario name', async () => {
      await expect(service.scenarioExists('')).rejects.toThrow('Scenario name cannot be empty');
    });

    it('should throw error for invalid scenario name with path traversal', async () => {
      await expect(service.scenarioExists('../etc/passwd')).rejects.toThrow('Invalid scenario name');
    });
  });
});
