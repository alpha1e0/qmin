import * as fs from 'fs/promises';
import * as path from 'path';

import { wpath } from '@/main/core/common/context';
import { createLogger } from '@/main/core/utils/logger';
import { RoleplayChatHistory } from '@/main/core/common/config';

const logger = createLogger('RoleplayHistoryService');

/**
 * Chat History Manager Service
 * Manages roleplay chat history for scenarios
 */
export class RoleplayHistoryService {
  /**
   * List all chat histories for a scenario
   * @param scenarioName - Scenario name
   * @returns Array of history filenames
   */
  async listHistories(scenarioName: string): Promise<string[]> {
    this.validateScenarioName(scenarioName);

    const historyDir = path.join(wpath.roleplayScenarioDir, scenarioName, 'history');

    try {
      const entries = await fs.readdir(historyDir);
      return entries
        .filter((file) => file.endsWith('.json'))
        .sort();
    } catch (err) {
      // History directory doesn't exist yet
      return [];
    }
  }

  /**
   * Get chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @returns Chat history data
   */
  async getHistory(scenarioName: string, historyName: string): Promise<RoleplayChatHistory> {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);

    const historyPath = this.getHistoryPath(scenarioName, historyName);

    try {
      const data = await fs.readFile(historyPath, 'utf-8');
      return JSON.parse(data) as RoleplayChatHistory;
    } catch (err) {
      logger.error(`Failed to get history ${historyName}`, err);
      throw new Error(`History '${historyName}' not found`);
    }
  }

  /**
   * Create new chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @param data - Chat history data
   */
  async createHistory(
    scenarioName: string,
    historyName: string,
    data: RoleplayChatHistory
  ): Promise<void> {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);

    const historyDir = path.join(wpath.roleplayScenarioDir, scenarioName, 'history');
    const historyPath = path.join(historyDir, this.ensureJsonExtension(historyName));

    try {
      await fs.mkdir(historyDir, { recursive: true, mode: 0o755 });
      await fs.writeFile(historyPath, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`History '${historyName}' created for scenario '${scenarioName}'`);
    } catch (err) {
      logger.error(`Failed to create history ${historyName}`, err);
      throw new Error(`Failed to create history '${historyName}': ${err}`);
    }
  }

  /**
   * Save chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @param data - Chat history data
   */
  async saveHistory(
    scenarioName: string,
    historyName: string,
    data: RoleplayChatHistory
  ): Promise<void> {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);

    const historyPath = this.getHistoryPath(scenarioName, historyName);

    try {
      await fs.writeFile(historyPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`Failed to save history ${historyName}`, err);
      throw new Error(`Failed to save history '${historyName}': ${err}`);
    }
  }

  /**
   * Delete chat history
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   */
  async deleteHistory(scenarioName: string, historyName: string): Promise<void> {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);

    const historyPath = this.getHistoryPath(scenarioName, historyName);

    try {
      await fs.unlink(historyPath);
      logger.info(`History '${historyName}' deleted for scenario '${scenarioName}'`);
    } catch (err) {
      logger.error(`Failed to delete history ${historyName}`, err);
      throw new Error(`Failed to delete history '${historyName}': ${err}`);
    }
  }

  /**
   * Check if history exists
   * @param scenarioName - Scenario name
   * @param historyName - History filename
   * @returns True if history exists
   */
  async historyExists(scenarioName: string, historyName: string): Promise<boolean> {
    this.validateScenarioName(scenarioName);
    this.validateHistoryName(historyName);

    const historyPath = this.getHistoryPath(scenarioName, historyName);

    try {
      await fs.access(historyPath);
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
  private getHistoryPath(scenarioName: string, historyName: string): string {
    return path.join(
      wpath.roleplayScenarioDir,
      scenarioName,
      'history',
      this.ensureJsonExtension(historyName)
    );
  }

  /**
   * Ensure filename has .json extension
   * @param filename - Filename
   * @returns Filename with .json extension
   */
  private ensureJsonExtension(filename: string): string {
    return filename.endsWith('.json') ? filename : `${filename}.json`;
  }

  /**
   * Validate scenario name to prevent path traversal
   * @param name - Scenario name
   */
  private validateScenarioName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Scenario name cannot be empty');
    }

    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error('Invalid scenario name');
    }
  }

  /**
   * Validate history name to prevent path traversal
   * @param name - History name
   */
  private validateHistoryName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('History name cannot be empty');
    }

    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error('Invalid history name');
    }
  }
}
