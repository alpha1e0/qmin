/**
 * Image Generator Factory
 * Factory function to create appropriate image generator based on LLM config
 */

import { createLogger } from '../../utils/logger';
import { LLMConfig } from '../../models';
import { BaseImgGenerator } from './base-generator';
import { GeminiImgGenerator } from './gemini-generator';
import { FluxImgGenerator } from './flux-generator';
import { QwenImgGenerator } from './qwen-generator';

const logger = createLogger('ImgGeneratorFactory');

/**
 * Create appropriate image generator based on LLM config
 * @param llmConfig - LLM configuration
 * @param llmConfigEdit - LLM configuration for image editing (Qwen only, optional)
 * @returns Image generator instance
 */
export function getImgGenerator(
  llmConfig: LLMConfig,
  llmConfigEdit?: LLMConfig
): BaseImgGenerator {
  const model = llmConfig.model.toLowerCase();

  // Qwen model (special handling)
  if (model.includes('qwen')) {
    if (!llmConfigEdit) {
      logger.warn('Qwen model requires two configs, using same config for both');
      return new QwenImgGenerator(llmConfig, llmConfig);
    }
    return new QwenImgGenerator(llmConfig, llmConfigEdit);
  }

  // Flux model
  if (model.includes('flux')) {
    return new FluxImgGenerator(llmConfig);
  }

  // SeeDream model
  if (model.includes('seedream')) {
    return new GeminiImgGenerator(llmConfig);
  }

  // Default: Gemini generator
  if (model.includes('gemini')) {
    return new GeminiImgGenerator(llmConfig);
  }

  // Fallback to Gemini generator for unknown models
  logger.warn(`Unknown model type: ${llmConfig.model}, using Gemini generator`);
  return new GeminiImgGenerator(llmConfig);
}

// Export all generators
export { BaseImgGenerator } from './base-generator';
export { GeminiImgGenerator } from './gemini-generator';
export { FluxImgGenerator } from './flux-generator';
export { QwenImgGenerator } from './qwen-generator';
