/**
 * Base Image Generator
 * Abstract base class for all image generators
 */

import { createLogger } from '../../utils/logger';
import { LLMConfig, ImageGenParams } from '../../models';
import { ImgRecorderService } from '../img-recorder.service';

const logger = createLogger('BaseImgGenerator');

/**
 * Abstract base class for image generators
 */
export abstract class BaseImgGenerator {
  protected llmConfig: LLMConfig;
  protected recorder: ImgRecorderService;

  constructor(llmConfig: LLMConfig) {
    this.llmConfig = llmConfig;
    this.recorder = new ImgRecorderService();
  }

  /**
   * Generate image(s) based on prompt and optional reference images
   * @param prompt - Text prompt
   * @param refImages - Reference image bytes (optional)
   * @param params - Generation parameters
   * @returns [success, images|error] - images are base64 data URLs or URLs
   */
  abstract generateImg(
    prompt: string,
    refImages: Buffer[],
    params: ImageGenParams
  ): Promise<[boolean, string[] | string]>;

  /**
   * Prepare image: convert to JPEG and record
   * @param imgBytes - Original image bytes
   * @param fileName - File name
   * @returns Processed image bytes
   */
  async prepareImg(imgBytes: Buffer, fileName: string): Promise<Buffer> {
    const { convertImageToJpeg } = await import('../../utils/image-helper');
    const newImgBytes = await convertImageToJpeg(imgBytes);
    // Recording will be done by the caller
    return newImgBytes;
  }

  /**
   * Create HTTP client with proxy support
   * @returns HTTP client (OpenAI or axios)
   */
  protected createClient() {
    // Override in subclasses
    throw new Error('Not implemented');
  }
}
