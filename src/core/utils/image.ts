import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IV_CACHE_DIR } from '../common/constants';
import { createLogger } from './logger';

const logger = createLogger('ImageUtils');
import { ensureDirectory, getFileExtension, getFileName, joinPath } from './path';

/**
 * Image size information
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Generate a thumbnail for a single image
 * @param imgPath - Path to original image
 * @param dstPath - Path for generated thumbnail
 */
export async function generateThumbnail(imgPath: string, dstPath: string): Promise<void> {
  try {
    await ensureDirectory(path.dirname(dstPath));

    // Get original dimensions
    const metadata = await sharp(imgPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Calculate scaling to fit within IV_IMG_LITTLE_SIZE
    const MAX_SIZE = 1600; // IV_IMG_LITTLE_SIZE constant
    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height, 1);

    if (ratio >= 1) {
      // Image is smaller than or equal to target size, just copy
      await fs.copyFile(imgPath, dstPath);
    } else {
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      // Generate thumbnail
      await sharp(imgPath)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(dstPath);
    }
  } catch (err) {
    throw new Error(`Failed to generate thumbnail for ${imgPath}: ${err}`);
  }
}

/**
 * Generate thumbnails for all images in a directory
 * @param imgDir - Directory containing images
 * @returns Number of images processed
 */
export async function generateThumbnailOfDir(imgDir: string): Promise<number> {
  const files = await fs.readdir(imgDir);
  const cacheDir = joinPath(imgDir, IV_CACHE_DIR);
  await ensureDirectory(cacheDir);

  let processedCount = 0;

  for (const file of files) {
    const filePath = joinPath(imgDir, file);
    const ext = getFileExtension(filePath);

    // Check if file is an image (basic check using extensions)
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.JPG', '.JPEG', '.PNG', '.GIF'];
    if (imageExts.includes(ext)) {
      const fileName = getFileName(file);
      const dstPath = joinPath(cacheDir, `${fileName}.jpg`);

      try {
        await generateThumbnail(filePath, dstPath);
        processedCount++;
      } catch (err) {
        logger.warn(`Failed to generate thumbnail for ${file}`, err);
      }
    }
  }

  return processedCount;
}

/**
 * Get image dimensions
 * @param imgPath - Path to image
 * @returns Image dimensions (width, height)
 */
export async function getImageSize(imgPath: string): Promise<ImageSize> {
  try {
    const metadata = await sharp(imgPath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (err) {
    throw new Error(`Failed to get image size for ${imgPath}: ${err}`);
  }
}

/**
 * Get image metadata
 * @param imgPath - Path to image
 * @returns Sharp metadata object
 */
export async function getImageMetadata(imgPath: string): Promise<sharp.Metadata> {
  try {
    return await sharp(imgPath).metadata();
  } catch (err) {
    throw new Error(`Failed to get image metadata for ${imgPath}: ${err}`);
  }
}

/**
 * Resize image to specified dimensions
 * @param imgPath - Path to original image
 * @param dstPath - Path for resized image
 * @param width - Target width
 * @param height - Target height
 * @param fit - Fit mode (default: 'cover')
 */
export async function resizeImage(
  imgPath: string,
  dstPath: string,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum = 'cover'
): Promise<void> {
  try {
    await sharp(imgPath).resize(width, height, { fit }).toFile(dstPath);
  } catch (err) {
    throw new Error(`Failed to resize image ${imgPath}: ${err}`);
  }
}

/**
 * Convert image to JPEG format
 * @param imgPath - Path to original image
 * @param dstPath - Path for converted image
 * @param quality - JPEG quality (1-100, default: 85)
 */
export async function convertToJpeg(
  imgPath: string,
  dstPath: string,
  quality: number = 85
): Promise<void> {
  try {
    await sharp(imgPath).jpeg({ quality }).toFile(dstPath);
  } catch (err) {
    throw new Error(`Failed to convert image ${imgPath} to JPEG: ${err}`);
  }
}

/**
 * Rotate image
 * @param imgPath - Path to original image
 * @param dstPath - Path for rotated image
 * @param angle - Rotation angle in degrees
 */
export async function rotateImage(imgPath: string, dstPath: string, angle: number): Promise<void> {
  try {
    await sharp(imgPath).rotate(angle).toFile(dstPath);
  } catch (err) {
    throw new Error(`Failed to rotate image ${imgPath}: ${err}`);
  }
}

/**
 * Get image format
 * @param imgPath - Path to image
 * @returns Image format (e.g., 'jpeg', 'png', 'gif')
 */
export async function getImageFormat(imgPath: string): Promise<string | undefined> {
  try {
    const metadata = await sharp(imgPath).metadata();
    return metadata.format;
  } catch (err) {
    throw new Error(`Failed to get image format for ${imgPath}: ${err}`);
  }
}
