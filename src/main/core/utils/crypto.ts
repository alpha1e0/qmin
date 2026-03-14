import * as crypto from 'crypto';
import { ENABLE_MIX } from '@/main/core/common/constants';

/**
 * Encrypt content using AES-256-GCM
 * @param content - Content to encrypt
 * @param key - Encryption key (32 bytes for AES-256)
 * @returns Base64 encoded encrypted content
 */
export function encrypt(content: string, key: Buffer): string {
  const iv = crypto.randomBytes(12); // GCM recommended IV length
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(content, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted content
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'binary')]);
  return combined.toString('base64');
}

/**
 * Decrypt content using AES-256-GCM
 * @param content - Base64 encoded encrypted content
 * @param key - Decryption key (32 bytes for AES-256)
 * @returns Decrypted string
 */
export function decrypt(content: string, key: Buffer): string {
  const combinedBuffer = Buffer.from(content, 'base64');

  // Extract iv (first 12 bytes), authTag (next 16 bytes), and encrypted content
  const iv = combinedBuffer.subarray(0, 12);
  const authTag = combinedBuffer.subarray(12, 28);
  const encrypted = combinedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Base64 encode content
 * @param content - Content to encode
 * @returns Base64 encoded string
 */
export function b64Encode(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64');
}

/**
 * Base64 decode content
 * @param content - Base64 encoded content
 * @returns Decoded string
 */
export function b64Decode(content: string): string {
  return Buffer.from(content, 'base64').toString('utf8');
}

/**
 * URL-safe base64 encode
 * @param content - Content to encode
 * @returns URL-safe base64 encoded string
 */
export function urlSafeB64Encode(content: string): string {
  return b64Encode(content).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * URL-safe base64 decode
 * @param content - URL-safe base64 encoded content
 * @returns Decoded string
 */
export function urlSafeB64Decode(content: string): string {
  let str = content.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (str.length % 4) {
    str += '=';
  }
  return b64Decode(str);
}

/**
 * Mix content (base64 encode if enabled)
 * @param content - Content to mix
 * @returns Mixed content
 */
export function mix(content: string): string {
  if (ENABLE_MIX) {
    return b64Encode(content);
  }
  return content;
}

/**
 * Unmix content (base64 decode if enabled)
 * @param content - Mixed content
 * @returns Unmixed content
 */
export function unmix(content: string): string {
  if (ENABLE_MIX) {
    return b64Decode(content);
  }
  return content;
}

/**
 * Calculate MD5 hash of content
 * @param content - Content to hash
 * @returns MD5 hash string
 */
export function md5sum(content: string): string {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex');
}
