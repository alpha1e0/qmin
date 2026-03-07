/**
 * Image Helper Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getImageTypeFromBytes,
  encodeImageToBase64,
  createDataUrl,
  extractBase64FromDataUrl,
} from './image-helper';

describe('ImageHelper', () => {
  describe('getImageTypeFromBytes', () => {
    it('should detect JPEG format', () => {
      // JPEG magic number: FF D8 FF
      const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
      expect(getImageTypeFromBytes(jpegBytes)).toBe('jpeg');
    });

    it('should detect PNG format', () => {
      // PNG magic number: 89 50 4E 47
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(getImageTypeFromBytes(pngBytes)).toBe('png');
    });

    it('should detect GIF format', () => {
      // GIF magic number: 47 49 46 38 ("GIF8")
      const gifBytes = Buffer.from([0x47, 0x49, 0x46, 0x38]);
      expect(getImageTypeFromBytes(gifBytes)).toBe('gif');
    });

    it('should detect unknown format', () => {
      const unknownBytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(getImageTypeFromBytes(unknownBytes)).toBe('unknown');
    });

    it('should handle empty buffer', () => {
      const emptyBytes = Buffer.from([]);
      expect(getImageTypeFromBytes(emptyBytes)).toBe('unknown');
    });
  });

  describe('encodeImageToBase64', () => {
    it('should encode buffer to base64', () => {
      const bytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const base64 = encodeImageToBase64(bytes);
      expect(base64).toBe('AAECAw==');
    });
  });

  describe('createDataUrl', () => {
    it('should create data URL with default MIME type', () => {
      const bytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const dataUrl = createDataUrl(bytes);
      expect(dataUrl).toBe('data:image/jpeg;base64,AAECAw==');
    });

    it('should create data URL with custom MIME type', () => {
      const bytes = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const dataUrl = createDataUrl(bytes, 'image/png');
      expect(dataUrl).toBe('data:image/png;base64,AAECAw==');
    });
  });

  describe('extractBase64FromDataUrl', () => {
    it('should extract base64 from data URL', () => {
      const dataUrl = 'data:image/jpeg;base64,AAECAw==';
      const base64 = extractBase64FromDataUrl(dataUrl);
      expect(base64).toBe('AAECAw==');
    });

    it('should return original string if not a data URL', () => {
      const str = 'AAECAw==';
      const result = extractBase64FromDataUrl(str);
      expect(result).toBe('AAECAw==');
    });
  });
});
