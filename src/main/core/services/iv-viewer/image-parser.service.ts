import {
  generateThumbnail,
  generateThumbnailOfDir,
  getImageSize,
  getImageMetadata,
} from '@/core/utils/image';

/**
 * Image Parser Service - wraps image utility functions
 * This service provides image processing capabilities
 */
export class ImageParserService {
  /**
   * Generate a thumbnail for a single image
   */
  async generateThumbnail(imgPath: string, dstPath: string): Promise<void> {
    await generateThumbnail(imgPath, dstPath);
  }

  /**
   * Generate thumbnails for all images in a directory
   */
  async generateThumbnailOfDir(imgDir: string): Promise<number> {
    return await generateThumbnailOfDir(imgDir);
  }

  /**
   * Get image dimensions
   */
  async getImageSize(imgPath: string): Promise<{ width: number; height: number }> {
    return await getImageSize(imgPath);
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imgPath: string): Promise<any> {
    return await getImageMetadata(imgPath);
  }
}
