import { describe, it, expect, vi } from 'vitest';
import { QwenImgGenerator } from './qwen-generator';
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
  ImgRecorderService: vi.fn().mockImplementation(() => ({})),
}));

describe('QwenImgGenerator', () => {
  const mockConfig: LLMConfig = {
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    key: 'test-api-key',
    model: 'qwen-model',
  };

  describe('constructor', () => {
    it('should initialize with config', () => {
      const generator = new QwenImgGenerator(mockConfig, mockConfig);
      expect(generator).toBeDefined();
    });
  });

  describe('prepareImg', () => {
    it('should be defined', async () => {
      const generator = new QwenImgGenerator(mockConfig, mockConfig);
      expect(generator.prepareImg).toBeDefined();
    });
  });

  describe('generateImg', () => {
    it('should be defined', async () => {
      const generator = new QwenImgGenerator(mockConfig, mockConfig);
      expect(generator.generateImg).toBeDefined();
    });
  });
});
