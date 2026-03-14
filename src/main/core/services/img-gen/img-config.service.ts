/**
 * Image Generation Configuration Service
 * Manages LLM model configurations for image generation
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { wpath } from '../../common/context';
import { createLogger } from '../../utils/logger';
import { LLMConfig } from '../../models';

const logger = createLogger('ImgConfigService');

/**
 * Service for managing image generation LLM configurations
 */
export class ImgConfigService {
  private configsDir: string;

  constructor() {
    this.configsDir = wpath.imgGenLlmConfigsDir;
  }

  /**
   * List all LLM configuration files
   * @returns List of config file names
   */
  async listLlmConfigs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.configsDir, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name);

      logger.debug(`Found ${files.length} config files`);
      return files;
    } catch (err) {
      logger.error('Failed to list configs', err);
      return [];
    }
  }

  /**
   * Get LLM configuration by name
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @returns LLM configuration
   */
  async getLlmConfig(name: string): Promise<LLMConfig | null> {
    // Ensure .json extension
    const fileName = name.endsWith('.json') ? name : `${name}.json`;
    const configPath = path.join(this.configsDir, fileName);

    try {
      await fs.access(configPath);
    } catch {
      logger.error(`Config file not found: ${fileName}`);
      return null;
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Validate required fields
      if (!config.base_url || !config.model || !config.key) {
        logger.error(`Invalid config file: ${fileName} (missing required fields)`);
        return null;
      }

      logger.debug(`Loaded config: ${fileName}`);
      return {
        base_url: config.base_url,
        model: config.model,
        key: config.key,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        proxy: config.proxy,
      };
    } catch (err) {
      logger.error(`Failed to read config file: ${fileName}`, err);
      return null;
    }
  }

  /**
   * Save LLM configuration
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @param config - LLM configuration
   */
  async saveLlmConfig(name: string, config: LLMConfig): Promise<void> {
    // Ensure .json extension
    const fileName = name.endsWith('.json') ? name : `${name}.json`;
    const configPath = path.join(this.configsDir, fileName);

    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, content, 'utf-8');
      logger.info(`Saved config: ${fileName}`);
    } catch (err) {
      logger.error(`Failed to save config file: ${fileName}`, err);
      throw new Error(`Failed to save config ${name}: ${err}`);
    }
  }

  /**
   * Delete LLM configuration
   * @param name - Configuration file name (e.g., "default.json" or "default")
   */
  async deleteLlmConfig(name: string): Promise<void> {
    // Ensure .json extension
    const fileName = name.endsWith('.json') ? name : `${name}.json`;
    const configPath = path.join(this.configsDir, fileName);

    try {
      await fs.unlink(configPath);
      logger.info(`Deleted config: ${fileName}`);
    } catch (err) {
      logger.error(`Failed to delete config file: ${fileName}`, err);
      throw new Error(`Failed to delete config ${name}: ${err}`);
    }
  }

  /**
   * Check if config file exists
   * @param name - Configuration file name (e.g., "default.json" or "default")
   * @returns True if exists
   */
  async hasLlmConfig(name: string): Promise<boolean> {
    // Ensure .json extension
    const fileName = name.endsWith('.json') ? name : `${name}.json`;
    const configPath = path.join(this.configsDir, fileName);

    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get default LLM config name from global config
   * @returns Default config name
   */
  getDefaultConfigName(): string {
    const { config } = require('../common/context');
    return config.imgGen.defaultLlmConfig;
  }

  /**
   * Get Qwen LLM config names from global config
   * @returns [qwenConfigName, qwenEditConfigName]
   */
  getQwenConfigNames(): [string, string] {
    const { config } = require('../common/context');
    return [config.imgGen.qwenLlmConfig, config.imgGen.qwenEditLlmConfig];
  }
}
