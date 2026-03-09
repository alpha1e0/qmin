import { describe, it, expect, vi } from 'vitest';
import { GeminiImgGenerator } from './gemini-generator';
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

describe('GeminiImgGenerator', () => {
  const mockConfig: LLMConfig = {
    base_url: 'https://generativelanguage.googleapis.com',
    key: 'test-api-key',
    model: 'gemini-2.0-flash-exp',
  };

  describe('constructor', () => {
    it('should initialize with config', () => {
      const generator = new GeminiImgGenerator(mockConfig);
      expect(generator).toBeDefined();
    });
  });

  describe('prepareImg', () => {
    it('should be defined', async () => {
      const generator = new GeminiImgGenerator(mockConfig);
      expect(generator.prepareImg).toBeDefined();
    });
  });

  describe('generateImg', () => {
    it('should be defined', async () => {
      const generator = new GeminiImgGenerator(mockConfig);
      expect(generator.generateImg).toBeDefined();
    });
  });

  // Note: Full integration tests require mocking OpenAI client and HTTP requests
  // These would be better suited for end-to-end tests
});
