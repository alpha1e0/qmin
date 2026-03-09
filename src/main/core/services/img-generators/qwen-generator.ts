/**
 * Qwen Image Generator
 * Supports Qwen model with separate endpoints for text-to-image and image-to-image
 */

import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../utils/logger';
import { BaseImgGenerator } from './base-generator';
import { LLMConfig, ImageGenParams, QwenImageGenParams } from '../../models';
import { createDataUrl } from '../../utils/image-helper';

const logger = createLogger('QwenImgGenerator');

/**
 * Image generator for Qwen model
 * Note: Qwen uses different models for text-to-image and image-to-image
 */
export class QwenImgGenerator extends BaseImgGenerator {
  private llmConfigGen: LLMConfig; // For text-to-image
  private llmConfigEdit: LLMConfig; // For image-to-image
  private client: AxiosInstance;
  private clientEditor: AxiosInstance;

  constructor(llmConfigGen: LLMConfig, llmConfigEdit: LLMConfig) {
    super(llmConfigGen);

    this.llmConfigGen = llmConfigGen;
    this.llmConfigEdit = llmConfigEdit;

    // Create HTTP clients
    this.client = this.createAxiosClient(llmConfigGen);
    this.clientEditor = this.createAxiosClient(llmConfigEdit);

    logger.info('Qwen generator initialized');
  }

  /**
   * Create axios instance with proxy support
   * @param config - LLM config
   * @returns Axios instance
   */
  private createAxiosClient(config: LLMConfig): AxiosInstance {
    const clientConfig: any = {
      baseURL: config.base_url,
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    };

    // Add proxy if configured
    if (config.proxy) {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        clientConfig.httpsAgent = new HttpsProxyAgent(config.proxy);
        clientConfig.httpAgent = new HttpsProxyAgent(config.proxy);
        logger.debug(`Using proxy: ${config.proxy}`);
      } catch (err) {
        logger.warn('Failed to create proxy agent, continuing without proxy', err);
      }
    }

    return axios.create(clientConfig);
  }

  /**
   * Generate image(s) using Qwen API
   * @param prompt - Text prompt
   * @param refImages - Reference image bytes (optional, max 1 for Qwen)
   * @param params - Generation parameters
   * @returns [success, images|error]
   */
  async generateImg(
    prompt: string,
    refImages: Buffer[],
    params: ImageGenParams
  ): Promise<[boolean, string[] | string]> {
    try {
      const qwenParams: QwenImageGenParams = {
        image_size: params.size,
        batch_size: params.count,
        num_inference_steps: params.steps || 20,
      };

      let result;

      // Text-to-image: use qwen-image model
      if (refImages.length === 0) {
        result = await this.generateTextToImage(prompt, qwenParams);
      }
      // Image-to-image: use qwen-image-edit model
      else {
        if (refImages.length > 1) {
          logger.warn('Qwen only supports 1 reference image, using the first one');
        }
        result = await this.generateImageToImage(prompt, refImages[0], qwenParams);
      }

      return result;
    } catch (err) {
      logger.error('Failed to generate images with Qwen', err);
      return [false, err instanceof Error ? err.message : String(err)];
    }
  }

  /**
   * Generate image from text (text-to-image)
   * @param prompt - Text prompt
   * @param params - Qwen generation parameters
   * @returns [success, images|error]
   */
  private async generateTextToImage(
    prompt: string,
    params: QwenImageGenParams
  ): Promise<[boolean, string[] | string]> {
    try {
      logger.info(`Generating ${params.batch_size} images (text-to-image) with ${this.llmConfigGen.model}`);

      const requestData = {
        model: this.llmConfigGen.model,
        prompt: prompt,
        image_size: params.image_size,
        batch_size: params.batch_size,
        num_inference_steps: params.num_inference_steps,
      };

      const response = await this.clientEditor.post('/images/generations', requestData);

      if (response.status !== 200 || !response.data.images) {
        logger.error('Invalid response from Qwen API', {
          status: response.status,
          data: response.data,
        });
        return [false, response.data.error || 'Invalid response from API'];
      }

      const images = response.data.images.map((img: any) => img.url);
      logger.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger.error('Qwen API error', {
          status: err.response?.status,
          data: err.response?.data,
        });
        return [false, err.response?.data?.error || err.message || 'Unknown error'];
      }
      const error = err as Error;
      return [false, error.message || String(err)];
    }
  }

  /**
   * Generate image from reference image (image-to-image)
   * @param prompt - Text prompt
   * @param refImage - Reference image bytes
   * @param params - Qwen generation parameters
   * @returns [success, images|error]
   */
  private async generateImageToImage(
    prompt: string,
    refImage: Buffer,
    params: QwenImageGenParams
  ): Promise<[boolean, string[] | string]> {
    try {
      logger.info(`Generating ${params.batch_size} images (image-to-image) with ${this.llmConfigEdit.model}`);

      // Convert reference image to base64
      const imgUrl = createDataUrl(refImage);

      const requestData = {
        model: this.llmConfigEdit.model,
        prompt: prompt,
        image: imgUrl,
        image_size: params.image_size,
        batch_size: params.batch_size,
        num_inference_steps: params.num_inference_steps,
      };

      const response = await this.clientEditor.post('/images/generations', requestData);

      if (response.status !== 200 || !response.data.images) {
        logger.error('Invalid response from Qwen API', {
          status: response.status,
          data: response.data,
        });
        return [false, response.data.error || 'Invalid response from API'];
      }

      const images = response.data.images.map((img: any) => img.url);
      logger.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger.error('Qwen API error', {
          status: err.response?.status,
          data: err.response?.data,
        });
        return [false, err.response?.data?.error || err.message || 'Unknown error'];
      }
      const error = err as Error;
      return [false, error.message || String(err)];
    }
  }
}
