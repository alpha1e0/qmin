/**
 * Flux Image Generator
 * Supports Flux.2 model (image-only modality)
 */

import { createLogger } from '@/main/core/utils/logger';
import { GeminiImgGenerator } from '@/main/core/services/img-gen/generators/gemini-generator';
import { LLMConfig } from '@/main/core/models';

const logger = createLogger('FluxImgGenerator');

/**
 * Image generator for Flux.2 model
 * Extends GeminiImgGenerator but uses image-only modality
 */
export class FluxImgGenerator extends GeminiImgGenerator {
  protected modalities: string[] = ['image'];

  constructor(llmConfig: LLMConfig) {
    super(llmConfig);
    logger.info('Flux generator initialized with image-only modality');
  }
}
