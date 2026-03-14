/**
 * Image Generation Recorder Service
 * Manages recording of image generation history
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { wpath } from '../../common/context';
import { createLogger } from '../../utils/logger';
import {
  ImageGenParams,
  QwenImageGenParams,
  ImageGenRecord,
  HistoryListItem,
} from '../../models';

const logger = createLogger('ImgRecorderService');

/**
 * Service for recording image generation history
 */
export class ImgRecorderService {
  private historyDir: string;

  constructor() {
    this.historyDir = wpath.imgGenHistoryDir;
  }

  /**
   * Create a new record directory with timestamp
   * @returns Record ID (timestamp directory name)
   */
  async createRecordDir(): Promise<string> {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const recordId = timestamp.replace('T', '_');

    const recordPath = path.join(this.historyDir, recordId);
    await fs.mkdir(recordPath, { recursive: true });

    logger.info(`Created record directory: ${recordId}`);
    return recordId;
  }

  /**
   * Get record directory path
   * @param recordId - Record ID
   * @returns Full path to record directory
   */
  getRecordPath(recordId: string): string {
    return path.join(this.historyDir, recordId);
  }

  /**
   * Record prompt to file
   * @param recordId - Record ID
   * @param prompt - Prompt text
   */
  async recordPrompt(recordId: string, prompt: string): Promise<void> {
    const recordPath = this.getRecordPath(recordId);
    const promptPath = path.join(recordPath, 'prompt.txt');

    await fs.writeFile(promptPath, prompt, 'utf-8');
    logger.debug(`Recorded prompt for ${recordId}`);
  }

  /**
   * Record generation parameters to JSON file
   * @param recordId - Record ID
   * @param params - Generation parameters
   */
  async recordParams(
    recordId: string,
    params: ImageGenParams | QwenImageGenParams
  ): Promise<void> {
    const recordPath = this.getRecordPath(recordId);
    const paramsPath = path.join(recordPath, 'params.json');

    await fs.writeFile(paramsPath, JSON.stringify(params, null, 2), 'utf-8');
    logger.debug(`Recorded params for ${recordId}`);
  }

  /**
   * Record image to file
   * @param recordId - Record ID
   * @param imgBytes - Image bytes
   * @param fileName - File name
   */
  async recordImage(recordId: string, imgBytes: Buffer, fileName: string): Promise<void> {
    const recordPath = this.getRecordPath(recordId);
    const filePath = path.join(recordPath, fileName);

    await fs.writeFile(filePath, imgBytes);
    logger.debug(`Recorded image ${fileName} for ${recordId}`);
  }

  /**
   * Record reference image
   * @param recordId - Record ID
   * @param imgBytes - Image bytes
   * @param index - Image index
   */
  async recordRefImage(recordId: string, imgBytes: Buffer, index: number): Promise<void> {
    const fileName = `ref_${index}.jpg`;
    await this.recordImage(recordId, imgBytes, fileName);
  }

  /**
   * Record result image from base64
   * @param recordId - Record ID
   * @param base64OrUrl - Base64 data URL or image URL
   * @param index - Image index
   */
  async recordResultImageFromBase64(
    recordId: string,
    base64OrUrl: string,
    index: number
  ): Promise<void> {
    const fileName = `output_${index}.jpg`;

    // Check if it's a base64 data URL
    if (base64OrUrl.startsWith('data:')) {
      const { extractBase64FromDataUrl } = await import('../utils/image-helper');
      const base64 = extractBase64FromDataUrl(base64OrUrl);
      const imgBytes = Buffer.from(base64, 'base64');
      await this.recordImage(recordId, imgBytes, fileName);
    } else {
      // It's a URL, download the image
      const { downloadImageFromUrl } = await import('../utils/image-helper');
      const imgBytes = await downloadImageFromUrl(base64OrUrl);
      await this.recordImage(recordId, imgBytes, fileName);
    }
  }

  /**
   * Record model response to JSON file
   * @param recordId - Record ID
   * @param response - Response object
   */
  async recordResponse(recordId: string, response: any): Promise<void> {
    const recordPath = this.getRecordPath(recordId);
    const responsePath = path.join(recordPath, 'response.json');

    await fs.writeFile(responsePath, JSON.stringify(response, null, 2), 'utf-8');
    logger.debug(`Recorded response for ${recordId}`);
  }

  /**
   * Record LLM config name
   * @param recordId - Record ID
   * @param llmConfigName - LLM config name
   */
  async recordLlmConfig(recordId: string, llmConfigName: string): Promise<void> {
    const recordPath = this.getRecordPath(recordId);
    const configPath = path.join(recordPath, 'llm_config.txt');

    await fs.writeFile(configPath, llmConfigName, 'utf-8');
    logger.debug(`Recorded LLM config for ${recordId}`);
  }

  /**
   * List all history records
   * @returns List of history record items
   */
  async listHistory(): Promise<HistoryListItem[]> {
    try {
      const entries = await fs.readdir(this.historyDir, { withFileTypes: true });
      const dirs = entries.filter((entry) => entry.isDirectory());

      const records: HistoryListItem[] = [];

      for (const dir of dirs) {
        const recordId = dir.name;
        const recordPath = path.join(this.historyDir, recordId);

        try {
          // Read prompt.txt
          const promptPath = path.join(recordPath, 'prompt.txt');
          let prompt = '';
          try {
            prompt = await fs.readFile(promptPath, 'utf-8');
          } catch {
            // Prompt file not found
          }

          // Count reference images
          let refCount = 0;
          for (let i = 0; i < 10; i++) {
            const refPath = path.join(recordPath, `ref_${i}.jpg`);
            try {
              await fs.access(refPath);
              refCount++;
            } catch {
              break;
            }
          }

          // Count result images
          let resultCount = 0;
          for (let i = 0; i < 10; i++) {
            const outPath = path.join(recordPath, `output_${i}.jpg`);
            try {
              await fs.access(outPath);
              resultCount++;
            } catch {
              break;
            }
          }

          // Read LLM config
          const configPath = path.join(recordPath, 'llm_config.txt');
          let llmConfig = 'unknown';
          try {
            llmConfig = await fs.readFile(configPath, 'utf-8');
          } catch {
            // Config file not found
          }

          // Extract timestamp from recordId
          const timestamp = recordId.replace('_', 'T');

          records.push({
            id: recordId,
            timestamp,
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            refCount,
            resultCount,
            llmConfig,
          });
        } catch (err) {
          logger.error(`Failed to read record ${recordId}`, err);
        }
      }

      // Sort by timestamp descending
      records.sort((a, b) => b.id.localeCompare(a.id));

      return records;
    } catch (err) {
      logger.error('Failed to list history', err);
      return [];
    }
  }

  /**
   * Get detailed record information
   * @param recordId - Record ID
   * @returns Complete record
   */
  async getHistory(recordId: string): Promise<ImageGenRecord | null> {
    const recordPath = this.getRecordPath(recordId);

    try {
      await fs.access(recordPath);
    } catch {
      logger.error(`Record ${recordId} not found`);
      return null;
    }

    try {
      // Read prompt
      const prompt = await fs.readFile(path.join(recordPath, 'prompt.txt'), 'utf-8');

      // Read params
      const paramsContent = await fs.readFile(
        path.join(recordPath, 'params.json'),
        'utf-8'
      );
      const params = JSON.parse(paramsContent);

      // Read LLM config
      const llmConfig = await fs.readFile(
        path.join(recordPath, 'llm_config.txt'),
        'utf-8'
      );

      // Read response
      const responseContent = await fs.readFile(
        path.join(recordPath, 'response.json'),
        'utf-8'
      );
      const response = JSON.parse(responseContent);

      // Collect reference images
      const refImages: string[] = [];
      for (let i = 0; i < 10; i++) {
        const refPath = path.join(recordPath, `ref_${i}.jpg`);
        try {
          await fs.access(refPath);
          refImages.push(refPath);
        } catch {
          break;
        }
      }

      // Collect result images
      const resultImages: string[] = [];
      for (let i = 0; i < 10; i++) {
        const outPath = path.join(recordPath, `output_${i}.jpg`);
        try {
          await fs.access(outPath);
          resultImages.push(outPath);
        } catch {
          break;
        }
      }

      // Extract timestamp from recordId
      const timestamp = recordId.replace('_', 'T');

      return {
        id: recordId,
        timestamp,
        prompt,
        params,
        refImages,
        resultImages,
        llmConfig,
        response,
      };
    } catch (err) {
      logger.error(`Failed to read record ${recordId}`, err);
      return null;
    }
  }

  /**
   * Delete a history record
   * @param recordId - Record ID
   */
  async deleteHistory(recordId: string): Promise<void> {
    const recordPath = this.getRecordPath(recordId);

    try {
      await fs.rm(recordPath, { recursive: true, force: true });
      logger.info(`Deleted record ${recordId}`);
    } catch (err) {
      logger.error(`Failed to delete record ${recordId}`, err);
      throw new Error(`Failed to delete record ${recordId}: ${err}`);
    }
  }

  /**
   * Get all reference image paths for a record
   * @param recordId - Record ID
   * @returns Array of image paths
   */
  async getRefImages(recordId: string): Promise<string[]> {
    const recordPath = this.getRecordPath(recordId);
    const refImages: string[] = [];

    for (let i = 0; i < 10; i++) {
      const refPath = path.join(recordPath, `ref_${i}.jpg`);
      try {
        await fs.access(refPath);
        refImages.push(refPath);
      } catch {
        break;
      }
    }

    return refImages;
  }

  /**
   * Get all result image paths for a record
   * @param recordId - Record ID
   * @returns Array of image paths
   */
  async getResultImages(recordId: string): Promise<string[]> {
    const recordPath = this.getRecordPath(recordId);
    const resultImages: string[] = [];

    for (let i = 0; i < 10; i++) {
      const outPath = path.join(recordPath, `output_${i}.jpg`);
      try {
        await fs.access(outPath);
        resultImages.push(outPath);
      } catch {
        break;
      }
    }

    return resultImages;
  }
}
