/**
 * Image Utilities
 * Comprehensive image processing utilities including format detection, conversion,
 * thumbnail generation, and image manipulation using Sharp library
 */

import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import { IV_CACHE_DIR } from '../common/constants';
import { createLogger } from './logger';
import { ensureDirectory, getFileExtension, getFileName, joinPath } from './path';

const logger = createLogger('ImageUtils');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Image size information
 */
export interface ImageSize {
  width: number;
  height: number;
}

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detect image format from bytes
 * @param imgBytes - Image bytes
 * @returns Image format ('jpeg', 'png', 'gif', 'webp', 'unknown')
 */
export function getImageTypeFromBytes(imgBytes: Buffer): string {
  if (imgBytes.length < 4) {
    return 'unknown';
  }

  // JPEG: FF D8 FF
  if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8 && imgBytes[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 (0x89PNG)
  if (
    imgBytes[0] === 0x89 &&
    imgBytes[1] === 0x50 &&
    imgBytes[2] === 0x4e &&
    imgBytes[3] === 0x47
  ) {
    return 'png';
  }

  // GIF: 47 49 46 38 ("GIF8")
  if (
    imgBytes[0] === 0x47 &&
    imgBytes[1] === 0x49 &&
    imgBytes[2] === 0x46 &&
    imgBytes[3] === 0x38
  ) {
    return 'gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 ("RIFF....WEBP")
  if (
    imgBytes[0] === 0x52 &&
    imgBytes[1] === 0x49 &&
    imgBytes[2] === 0x46 &&
    imgBytes[3] === 0x46 &&
    imgBytes.length > 12 &&
    imgBytes[8] === 0x57 &&
    imgBytes[9] === 0x45 &&
    imgBytes[10] === 0x42 &&
    imgBytes[11] === 0x50
  ) {
    return 'webp';
  }

  return 'unknown';
}

/**
 * Get image format from file
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

// ============================================================================
// Image Metadata
// ============================================================================

/**
 * Get image dimensions from buffer
 * @param imgBytes - Image bytes
 * @returns [width, height]
 */
export async function getImageDimensions(imgBytes: Buffer): Promise<[number, number]> {
  try {
    const metadata = await sharp(imgBytes).metadata();
    return [metadata.width || 0, metadata.height || 0];
  } catch (err) {
    logger.error('Failed to get image dimensions', err);
    return [0, 0];
  }
}

/**
 * Get image dimensions from file path
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

// ============================================================================
// Image Conversion
// ============================================================================

/**
 * Convert image buffer to JPEG format
 * @param imgBytes - Original image bytes
 * @returns JPEG format image bytes
 */
export async function convertImageToJpeg(imgBytes: Buffer): Promise<Buffer> {
  const imgType = getImageTypeFromBytes(imgBytes);

  // Already JPEG, return as is
  if (imgType === 'jpeg') {
    return imgBytes;
  }

  try {
    // Use sharp to convert to JPEG
    const converted = await sharp(imgBytes)
      .jpeg({ quality: 95 })
      .toBuffer();

    logger.debug(`Converted ${imgType} to JPEG, size: ${converted.length} bytes`);
    return converted;
  } catch (err) {
    logger.error('Failed to convert image to JPEG', err);
    throw new Error(`Image conversion failed: ${err}`);
  }
}

/**
 * Convert image file to JPEG format
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

// ============================================================================
// Image Resizing
// ============================================================================

/**
 * Resize image buffer to fit within max dimensions
 * @param imgBytes - Image bytes
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Resized image bytes
 */
export async function resizeImageFromBuffer(
  imgBytes: Buffer,
  maxWidth: number,
  maxHeight: number
): Promise<Buffer> {
  try {
    const resized = await sharp(imgBytes)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    logger.debug(`Resized image to ${resized.length} bytes`);
    return resized;
  } catch (err) {
    logger.error('Failed to resize image', err);
    throw new Error(`Image resize failed: ${err}`);
  }
}

/**
 * Resize image file to specified dimensions
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

// ============================================================================
// Thumbnail Generation
// ============================================================================

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

// ============================================================================
// Image Transformation
// ============================================================================

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

// ============================================================================
// Base64 Encoding / Data URL
// ============================================================================

/**
 * Encode image bytes to base64 string
 * @param imgBytes - Image bytes
 * @returns Base64 encoded string
 */
export function encodeImageToBase64(imgBytes: Buffer): string {
  return imgBytes.toString('base64');
}

/**
 * Create base64 data URL from image bytes
 * @param imgBytes - Image bytes
 * @param mimeType - MIME type (default: image/jpeg)
 * @returns Data URL string
 */
export function createDataUrl(imgBytes: Buffer, mimeType: string = 'image/jpeg'): string {
  const base64 = encodeImageToBase64(imgBytes);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract base64 from data URL
 * @param dataUrl - Data URL string
 * @returns Base64 string
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',', 2)[1];
  }
  return dataUrl;
}

// ============================================================================
// File I/O Operations
// ============================================================================

/**
 * Save image bytes to file
 * @param imgBytes - Image bytes
 * @param filePath - Target file path
 */
export async function saveImageToFile(imgBytes: Buffer, filePath: string): Promise<void> {
  await fs.writeFile(filePath, imgBytes);
  logger.debug(`Saved image to ${filePath}`);
}

/**
 * Load image from file
 * @param filePath - Image file path
 * @returns Image bytes
 */
export async function loadImageFromFile(filePath: string): Promise<Buffer> {
  const buffer = await fs.readFile(filePath);
  logger.debug(`Loaded image from ${filePath}, size: ${buffer.length} bytes`);
  return buffer;
}

/**
 * Download image from URL
 * @param url - Image URL
 * @returns Image bytes
 */
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          logger.debug(`Downloaded image from ${url}, size: ${buffer.length} bytes`);
          resolve(buffer);
        });

        response.on('error', (err) => {
          logger.error(`Error downloading image from ${url}`, err);
          reject(err);
        });
      })
      .on('error', (err) => {
        logger.error(`Failed to connect to ${url}`, err);
        reject(err);
      });
  });
}
