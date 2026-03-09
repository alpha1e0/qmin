/**
 * Image Generation Service
 * Main service for AI image generation functionality
 */

import { createLogger } from '../utils/logger';
import { ImgRecorderService } from './img-recorder.service';
import { ImgConfigService } from './img-config.service';
import { getImgGenerator } from './img-generators';
import {
  ImageGenRequest,
  QwenImageGenRequest,
  ImageGenResult,
  HistoryListItem,
  ImageGenRecord,
  LLMConfig,
} from '../models';

const logger = createLogger('ImgGenService');

/**
 * Main service for image generation
 */
export class ImgGenService {
  private recorder: ImgRecorderService;
  private configService: ImgConfigService;

  constructor() {
    this.recorder = new ImgRecorderService();
    this.configService = new ImgConfigService();
  }

  /**
   * Generate image(s) using standard models
   * @param request - Image generation request
   * @returns Generation result
   */
  async generateImage(request: ImageGenRequest): Promise<ImageGenResult> {
    const configName = this.configService.getDefaultConfigName();
    return await this.generateImageWithConfig(request, configName);
  }

  /**
   * Generate image(s) using specified config
   * @param request - Image generation request
   * @param configName - LLM config name
   * @returns Generation result
   */
  async generateImageWithConfig(
    request: ImageGenRequest,
    configName: string
  ): Promise<ImageGenResult> {
    try {
      // Load LLM config
      const llmConfig = await this.configService.getLlmConfig(configName);
      if (!llmConfig) {
        return {
          success: false,
          error: `LLM config not found: ${configName}`,
        };
      }

      // Create generator
      const generator = getImgGenerator(llmConfig);

      // Create record
      const recordId = await this.recorder.createRecordDir();

      // Record prompt
      await this.recorder.recordPrompt(recordId, request.prompt);

      // Record params
      await this.recorder.recordParams(recordId, request.params);

      // Record LLM config
      await this.recorder.recordLlmConfig(recordId, configName);

      // Process reference images
      const refImages = request.refImages || [];
      for (let i = 0; i < refImages.length; i++) {
        const processedImg = await generator.prepareImg(refImages[i], `ref_${i}.jpg`);
        await this.recorder.recordRefImage(recordId, processedImg, i);
      }

      logger.info(
        `Generating ${request.params.count} images with config: ${configName}`
      );

      // Generate images
      const [success, imagesOrError] = await generator.generateImg(
        request.prompt,
        refImages,
        request.params
      );

      // Record response
      await this.recorder.recordResponse(recordId, {
        success,
        error: success ? undefined : imagesOrError,
      });

      if (!success) {
        return {
          success: false,
          recordId,
          error: imagesOrError as string,
        };
      }

      const images = imagesOrError as string[];

      // Save result images
      for (let i = 0; i < images.length; i++) {
        await this.recorder.recordResultImageFromBase64(recordId, images[i], i);
      }

      logger.info(`Successfully generated ${images.length} images, record: ${recordId}`);

      // Get result image paths
      const resultImages = await this.recorder.getResultImages(recordId);

      return {
        success: true,
        recordId,
        resultImages,
      };
    } catch (err) {
      logger.error('Failed to generate image', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Generate image(s) using Qwen model
   * @param request - Qwen image generation request
   * @returns Generation result
   */
  async generateImageQwen(request: QwenImageGenRequest): Promise<ImageGenResult> {
    try {
      // Get Qwen configs
      const [qwenConfigName, qwenEditConfigName] =
        this.configService.getQwenConfigNames();

      // Load configs
      const qwenConfig = await this.configService.getLlmConfig(qwenConfigName);
      const qwenEditConfig = await this.configService.getLlmConfig(qwenEditConfigName);

      if (!qwenConfig || !qwenEditConfig) {
        return {
          success: false,
          error: `Qwen LLM configs not found: ${qwenConfigName}, ${qwenEditConfigName}`,
        };
      }

      // Create generator
      const generator = getImgGenerator(qwenConfig, qwenEditConfig);

      // Create record
      const recordId = await this.recorder.createRecordDir();

      // Record prompt
      await this.recorder.recordPrompt(recordId, request.prompt);

      // Record params
      await this.recorder.recordParams(recordId, request.params);

      // Record LLM config (use edit config if has ref image, else gen config)
      const configName = request.refImage ? qwenEditConfigName : qwenConfigName;
      await this.recorder.recordLlmConfig(recordId, configName);

      // Process reference image if provided
      const refImages: Buffer[] = [];
      if (request.refImage) {
        const processedImg = await generator.prepareImg(request.refImage, 'ref_0.jpg');
        refImages.push(processedImg);
        await this.recorder.recordRefImage(recordId, processedImg, 0);
      }

      logger.info(
        `Generating ${request.params.batch_size} images with Qwen (${request.refImage ? 'image-to-image' : 'text-to-image'})`
      );

      // Generate images
      const [success, imagesOrError] = await generator.generateImg(
        request.prompt,
        refImages,
        {
          count: request.params.batch_size,
          size: request.params.image_size,
          steps: request.params.num_inference_steps,
        }
      );

      // Record response
      await this.recorder.recordResponse(recordId, {
        success,
        error: success ? undefined : imagesOrError,
      });

      if (!success) {
        return {
          success: false,
          recordId,
          error: imagesOrError as string,
        };
      }

      const images = imagesOrError as string[];

      // Save result images
      for (let i = 0; i < images.length; i++) {
        await this.recorder.recordResultImageFromBase64(recordId, images[i], i);
      }

      logger.info(`Successfully generated ${images.length} images with Qwen, record: ${recordId}`);

      // Get result image paths
      const resultImages = await this.recorder.getResultImages(recordId);

      return {
        success: true,
        recordId,
        resultImages,
      };
    } catch (err) {
      logger.error('Failed to generate image with Qwen', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * List all generation history
   * @returns List of history items
   */
  async listHistory(): Promise<HistoryListItem[]> {
    return await this.recorder.listHistory();
  }

  /**
   * Get detailed history record
   * @param recordId - Record ID
   * @returns Complete record or null
   */
  async getHistory(recordId: string): Promise<ImageGenRecord | null> {
    return await this.recorder.getHistory(recordId);
  }

  /**
   * Delete history record
   * @param recordId - Record ID
   */
  async deleteHistory(recordId: string): Promise<void> {
    await this.recorder.deleteHistory(recordId);
  }

  /**
   * List all LLM configs
   * @returns List of config file names
   */
  async listLlmConfigs(): Promise<string[]> {
    return await this.configService.listLlmConfigs();
  }

  /**
   * Get LLM config
   * @param name - Config name
   * @returns LLM config or null
   */
  async getLlmConfig(name: string): Promise<LLMConfig | null> {
    return await this.configService.getLlmConfig(name);
  }

  /**
   * Save LLM config
   * @param name - Config name
   * @param config - LLM config
   */
  async saveLlmConfig(name: string, config: LLMConfig): Promise<void> {
    await this.configService.saveLlmConfig(name, config);
  }

  /**
   * Get recorder instance (for direct access if needed)
   * @returns Recorder service
   */
  getRecorder(): ImgRecorderService {
    return this.recorder;
  }

  /**
   * Get config service instance (for direct access if needed)
   * @returns Config service
   */
  getConfigService(): ImgConfigService {
    return this.configService;
  }
}
