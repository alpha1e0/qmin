/**
 * Image Helper Utilities
 * Functions for image format detection, conversion, encoding, and downloading
 */

import * as https from 'https';
import * as http from 'http';
import { createLogger } from './logger';
import sharp from 'sharp';

const logger = createLogger('ImageHelper');

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
 * Convert image to JPEG format
 * @param imgBytes - Original image bytes
 * @returns JPEG format image bytes
 */
export async function convertImageToJpeg(imgBytes: Buffer): Promise<Buffer> {
  const imgType = getImageTypeFromBytes(imgBytes);

  // Already JPEG or PNG, return as is (will convert PNG to JPEG if needed)
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

/**
 * Save image bytes to file
 * @param imgBytes - Image bytes
 * @param filePath - Target file path
 */
export async function saveImageToFile(imgBytes: Buffer, filePath: string): Promise<void> {
  const fs = await import('fs/promises');
  await fs.writeFile(filePath, imgBytes);
  logger.debug(`Saved image to ${filePath}`);
}

/**
 * Load image from file
 * @param filePath - Image file path
 * @returns Image bytes
 */
export async function loadImageFromFile(filePath: string): Promise<Buffer> {
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(filePath);
  logger.debug(`Loaded image from ${filePath}, size: ${buffer.length} bytes`);
  return buffer;
}

/**
 * Get image dimensions
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
 * Resize image to fit within max dimensions
 * @param imgBytes - Image bytes
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Resized image bytes
 */
export async function resizeImage(
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
