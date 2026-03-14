/**
 * Gemini Image Generator
 * Supports Gemini series models using OpenAI-compatible API
 */

import OpenAI from 'openai';
import { createLogger } from '@/core/utils/logger';
import { BaseImgGenerator } from '@/core/services/img-gen/generators/base-generator';
import { LLMConfig, ImageGenParams } from '@/core/models';

const logger = createLogger('GeminiImgGenerator');

/**
 * Image generator for Gemini series models
 */
export class GeminiImgGenerator extends BaseImgGenerator {
  private client: OpenAI;
  protected modalities: string[] = ['text', 'image'];

  constructor(llmConfig: LLMConfig) {
    super(llmConfig);

    // Create OpenAI client
    const clientConfig: any = {
      baseURL: llmConfig.base_url,
      apiKey: llmConfig.key,
    };

    // Add proxy if configured
    if (llmConfig.proxy) {
      // Note: OpenAI SDK may need additional configuration for proxy
      logger.warn(`Proxy configured but not implemented: ${llmConfig.proxy}`);
    }

    this.client = new OpenAI(clientConfig);
  }

  /**
   * Generate image(s) using Gemini API
   * @param prompt - Text prompt
   * @param refImages - Reference image bytes (optional)
   * @param params - Generation parameters
   * @returns [success, images|error]
   */
  async generateImg(
    prompt: string,
    refImages: Buffer[],
    params: ImageGenParams
  ): Promise<[boolean, string[] | string]> {
    try {
      // Build message content
      const query: any[] = [
        {
          type: 'text',
          text: `Generate ${params.count} images based on this description:\n${prompt}`,
        },
      ];

      // Add reference images
      const { createDataUrl } = await import('@/core/utils/image');
      for (const imgContent of refImages) {
        const imgUrl = createDataUrl(imgContent);
        query.push({
          type: 'image_url',
          image_url: {
            url: imgUrl,
          },
        });
      }

      // Build image config
      const imgConfig: Record<string, string> = {
        size: params.size,
      };

      if (params.ratio) {
        imgConfig.aspect_ratio = params.ratio;
      }

      if (params.quality) {
        imgConfig.quality = params.quality;
      }

      // API request parameters
      const requestParams: any = {
        model: this.llmConfig.model,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        n: params.count,
        extra_body: {
          modalities: this.modalities,
          image_config: imgConfig,
        },
      };

      logger.info(`Generating ${params.count} images with ${this.llmConfig.model}`);

      // Call API
      const response = await this.client.chat.completions.create(requestParams);

      // Extract images from response
      const images = this.extractImages(response);

      if (images.length === 0) {
        const errorMsg = response.choices[0]?.message?.content || 'No images generated';
        logger.error('No images in response', { errorMsg });
        return [false, errorMsg];
      }

      logger.info(`Generated ${images.length} images successfully`);
      return [true, images];
    } catch (err) {
      logger.error('Failed to generate images', err);
      return [false, err instanceof Error ? err.message : String(err)];
    }
  }

  /**
   * Extract images from API response
   * @param response - OpenAI API response
   * @returns Array of image data URLs or URLs
   */
  private extractImages(response: any): string[] {
    const result: string[] = [];

    for (const choice of response.choices) {
      const message = choice.message;

      if (message.images && Array.isArray(message.images)) {
        for (const img of message.images) {
          if (img.image_url && img.image_url.url) {
            result.push(img.image_url.url);
          }
        }
      }
    }

    return result;
  }
}
