import { describe, it, expect, vi } from 'vitest';
import { FluxImgGenerator } from '@/main/core/services/img-gen/generators/flux-generator';
import { LLMConfig } from '../../../models';

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

describe('FluxImgGenerator', () => {
  const mockConfig: LLMConfig = {
    base_url: 'https://api.example.com',
    key: 'test-api-key',
    model: 'flux-model',
  };

  describe('constructor', () => {
    it('should initialize with config', () => {
      const generator = new FluxImgGenerator(mockConfig);
      expect(generator).toBeDefined();
    });
  });

  describe('prepareImg', () => {
    it('should be defined', async () => {
      const generator = new FluxImgGenerator(mockConfig);
      expect(generator.prepareImg).toBeDefined();
    });
  });

  describe('generateImg', () => {
    it('should be defined', async () => {
      const generator = new FluxImgGenerator(mockConfig);
      expect(generator.generateImg).toBeDefined();
    });
  });
});
