import * as fs from 'fs/promises';
import * as path from 'path';

import { wpath } from '@/core/common/context';
import { createLogger } from '@/core/utils/logger';
import { RoleplayScenario } from '@/core/common/config';

const logger = createLogger('RoleplayScenarioService');

/**
 * Scenario Manager Service
 * Manages roleplay scenario CRUD operations
 */
export class RoleplayScenarioService {
  /**
   * List all scenarios
   * @returns Array of scenario names
   */
  async listScenarios(): Promise<string[]> {
    try {
      const entries = await fs.readdir(wpath.roleplayScenarioDir, { withFileTypes: true });
      const scenarios: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sceneJsonPath = path.join(wpath.roleplayScenarioDir, entry.name, 'scene.json');
          try {
            await fs.access(sceneJsonPath);
            scenarios.push(entry.name);
          } catch {
            // Skip if scene.json doesn't exist
          }
        }
      }

      return scenarios.sort();
    } catch (err) {
      logger.error('Failed to list scenarios', err);
      throw new Error(`Failed to list scenarios: ${err}`);
    }
  }

  /**
   * Get scenario details
   * @param name - Scenario name
   * @returns Scenario data
   */
  async getScenario(name: string): Promise<RoleplayScenario> {
    this.validateScenarioName(name);

    const sceneJsonPath = path.join(wpath.roleplayScenarioDir, name, 'scene.json');

    try {
      const data = await fs.readFile(sceneJsonPath, 'utf-8');
      return JSON.parse(data) as RoleplayScenario;
    } catch (err) {
      logger.error(`Failed to get scenario ${name}`, err);
      throw new Error(`Scenario '${name}' not found`);
    }
  }

  /**
   * Create new scenario
   * @param name - Scenario name
   * @param data - Scenario data
   */
  async createScenario(name: string, data: RoleplayScenario): Promise<void> {
    this.validateScenarioName(name);

    const scenarioDir = path.join(wpath.roleplayScenarioDir, name);

    // Check if scenario already exists
    let scenarioExists = false;
    try {
      await fs.access(scenarioDir);
      scenarioExists = true;
    } catch {
      // Directory doesn't exist, continue
    }

    if (scenarioExists) {
      throw new Error(`Scenario '${name}' already exists`);
    }

    try {
      // Create scenario directory
      await fs.mkdir(scenarioDir, { recursive: true, mode: 0o755 });

      // Create scene.json
      const sceneJsonPath = path.join(scenarioDir, 'scene.json');
      await fs.writeFile(sceneJsonPath, JSON.stringify(data, null, 2), 'utf-8');

      // Create history directory
      const historyDir = path.join(scenarioDir, 'history');
      await fs.mkdir(historyDir, { recursive: true, mode: 0o755 });

      logger.info(`Scenario '${name}' created`);
    } catch (err) {
      logger.error(`Failed to create scenario ${name}`, err);
      throw new Error(`Failed to create scenario '${name}': ${err}`);
    }
  }

  /**
   * Update scenario
   * @param name - Scenario name
   * @param data - New scenario data
   */
  async updateScenario(name: string, data: RoleplayScenario): Promise<void> {
    this.validateScenarioName(name);

    const sceneJsonPath = path.join(wpath.roleplayScenarioDir, name, 'scene.json');

    try {
      await fs.writeFile(sceneJsonPath, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`Scenario '${name}' updated`);
    } catch (err) {
      logger.error(`Failed to update scenario ${name}`, err);
      throw new Error(`Failed to update scenario '${name}': ${err}`);
    }
  }

  /**
   * Delete scenario
   * @param name - Scenario name
   */
  async deleteScenario(name: string): Promise<void> {
    this.validateScenarioName(name);

    const scenarioDir = path.join(wpath.roleplayScenarioDir, name);

    try {
      await fs.rm(scenarioDir, { recursive: true, force: true });
      logger.info(`Scenario '${name}' deleted`);
    } catch (err) {
      logger.error(`Failed to delete scenario ${name}`, err);
      throw new Error(`Failed to delete scenario '${name}': ${err}`);
    }
  }

  /**
   * Check if scenario exists
   * @param name - Scenario name
   * @returns True if scenario exists
   */
  async scenarioExists(name: string): Promise<boolean> {
    this.validateScenarioName(name);

    const sceneJsonPath = path.join(wpath.roleplayScenarioDir, name, 'scene.json');

    try {
      await fs.access(sceneJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate scenario name to prevent path traversal
   * @param name - Scenario name
   */
  private validateScenarioName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Scenario name cannot be empty');
    }

    // Prevent path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error('Invalid scenario name');
    }
  }
}
