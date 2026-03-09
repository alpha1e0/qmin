import * as fs from 'fs/promises';
import * as path from 'path';

import { wpath } from '../common/context';
import { createLogger } from '../utils/logger';
import { RoleplayLLMConfig } from '../common/config';

const logger = createLogger('RoleplayConfigService');

/**
 * LLM Configuration Manager Service
 * Manages LLM model configurations for roleplay
 */
export class RoleplayConfigService {
  /**
   * List all LLM configurations
   * @returns Array of config filenames
   */
  async listConfigs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(wpath.roleplayLlmConfigsDir);
      return entries
        .filter((file) => file.endsWith('.json'))
        .sort();
    } catch (err) {
      logger.error('Failed to list LLM configs', err);
      return [];
    }
  }

  /**
   * Get LLM configuration
   * @param name - Config filename
   * @returns LLM config data
   */
  async getConfig(name: string): Promise<RoleplayLLMConfig> {
    this.validateConfigName(name);

    const configPath = path.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );

    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(data) as RoleplayLLMConfig;

      // Load API key from environment if not in config
      if (!config.key) {
        config.key = process.env.OPENAI_API_KEY || '';
      }

      return config;
    } catch (err) {
      logger.error(`Failed to get config ${name}`, err);
      throw new Error(`Config '${name}' not found`);
    }
  }

  /**
   * Save LLM configuration
   * @param name - Config filename
   * @param data - LLM config data
   */
  async saveConfig(name: string, data: RoleplayLLMConfig): Promise<void> {
    this.validateConfigName(name);

    const configPath = path.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );

    try {
      await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
      logger.info(`Config '${name}' saved`);
    } catch (err) {
      logger.error(`Failed to save config ${name}`, err);
      throw new Error(`Failed to save config '${name}': ${err}`);
    }
  }

  /**
   * Delete LLM configuration
   * @param name - Config filename
   */
  async deleteConfig(name: string): Promise<void> {
    this.validateConfigName(name);

    const configPath = path.join(
      wpath.roleplayLlmConfigsDir,
      this.ensureJsonExtension(name)
    );

    try {
      await fs.unlink(configPath);
      logger.info(`Config '${name}' deleted`);
    } catch (err) {
      logger.error(`Failed to delete config ${name}`, err);
      throw new Error(`Failed to delete config '${name}': ${err}`);
    }
  }

  /**
   * Get default LLM configuration
   * @returns Default LLM config
   */
  async getDefaultConfig(): Promise<RoleplayLLMConfig> {
    const { config } = await import('../common/context');
    const defaultConfigName = config.roleplay.defaultLlmConfig;

    try {
      return await this.getConfig(defaultConfigName);
    } catch (err) {
      // Return default config if file doesn't exist
      logger.warn('Default config not found, using fallback');
      return {
        base_url: 'https://openrouter.ai/api/v1/',
        model: 'google/gemini-2.5-flash',
        key: process.env.OPENAI_API_KEY || '',
        temperature: 0.9,
        max_tokens: 16000,
      };
    }
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
   * Validate config name to prevent path traversal
   * @param name - Config name
   */
  private validateConfigName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Config name cannot be empty');
    }

    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error('Invalid config name');
    }
  }
}
