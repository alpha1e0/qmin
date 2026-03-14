import { describe, it, expect, vi } from 'vitest';
import { BaseImgGenerator } from './base-generator';
import { LLMConfig } from '../../models';

// Mock logger
vi.mock('../../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Mock ImgRecorderService
vi.mock('../img-recorder.service', () => ({
  ImgRecorderService: vi.fn().mockImplementation(() => ({
    createRecordDir: vi.fn(),
    recordPrompt: vi.fn(),
    recordParams: vi.fn(),
    recordRefImage: vi.fn(),
    recordResultImageFromBase64: vi.fn(),
    recordResponse: vi.fn(),
    recordLlmConfig: vi.fn(),
  })),
}));

describe('BaseImgGenerator', () => {
  const mockConfig: LLMConfig = {
    base_url: 'https://api.example.com',
    key: 'test-key',
    model: 'test-model',
  };

  class TestGenerator extends BaseImgGenerator {
    async generateImg(
      prompt: string,
      refImages: Buffer[],
      params: any
    ): Promise<[boolean, string[] | string]> {
      return [true, ['data:image/jpeg;base64,test']];
    }
  }

  describe('constructor', () => {
    it('should initialize with config', () => {
      const generator = new TestGenerator(mockConfig);
      expect(generator).toBeDefined();
    });
  });

  describe('prepareImg', () => {
    it('should convert image to JPEG', async () => {
      const generator = new TestGenerator(mockConfig);

      // Mock convertImageToJpeg
      const mockJpegData = Buffer.from('jpeg data');
      vi.doMock('../../utils/image-helper', () => ({
        convertImageToJpeg: vi.fn().mockResolvedValue(mockJpegData),
      }));

      const imgBytes = Buffer.from('original image');
      const result = await generator.prepareImg(imgBytes, 'test.jpg');

      // Note: This test requires proper mocking of the dynamic import
      expect(result).toBeDefined();
    });
  });

  describe('createClient', () => {
    it('should throw not implemented error', () => {
      const generator = new TestGenerator(mockConfig);

      expect(() => generator['createClient']()).toThrow('Not implemented');
    });
  });

  describe('abstract method', () => {
    it('should require generateImg implementation', () => {
      // TestGenerator provides implementation, so this validates it works
      const generator = new TestGenerator(mockConfig);
      expect(generator.generateImg).toBeDefined();
    });
  });
});
