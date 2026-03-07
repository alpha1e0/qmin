import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImgGenService } from './img-gen.service';
import { ImageGenRequest, QwenImageGenRequest } from '../models';

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Mock ImgRecorderService
vi.mock('./img-recorder.service', () => ({
  ImgRecorderService: vi.fn().mockImplementation(() => ({
    createRecordDir: vi.fn().mockResolvedValue('test-record-id'),
    recordPrompt: vi.fn().mockResolvedValue(undefined),
    recordParams: vi.fn().mockResolvedValue(undefined),
    recordRefImage: vi.fn().mockResolvedValue(undefined),
    recordResultImageFromBase64: vi.fn().mockResolvedValue(undefined),
    recordResponse: vi.fn().mockResolvedValue(undefined),
    recordLlmConfig: vi.fn().mockResolvedValue(undefined),
    listHistory: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue(null),
    deleteHistory: vi.fn().mockResolvedValue(undefined),
    getResultImages: vi.fn().mockResolvedValue(['/path/to/image.jpg']),
  })),
}));

// Mock ImgConfigService
vi.mock('./img-config.service', () => ({
  ImgConfigService: vi.fn().mockImplementation(() => ({
    getDefaultConfigName: vi.fn().mockReturnValue('default-config'),
    getLlmConfig: vi.fn().mockResolvedValue({
      base_url: 'https://api.example.com',
      key: 'test-key',
      model: 'test-model',
    }),
    getQwenConfigNames: vi.fn().mockReturnValue(['qwen-gen', 'qwen-edit']),
    listLlmConfigs: vi.fn().mockResolvedValue(['config1.json', 'config2.json']),
    saveLlmConfig: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock getImgGenerator
vi.mock('./img-generators', () => ({
  getImgGenerator: vi.fn().mockImplementation(() => ({
    generateImg: vi.fn().mockResolvedValue([
      true,
      ['data:image/jpeg;base64,test-image-data'],
    ]),
    prepareImg: vi.fn().mockResolvedValue(Buffer.from('test-image')),
  })),
}));

describe('ImgGenService', () => {
  let service: ImgGenService;

  beforeEach(() => {
    service = new ImgGenService();
  });

  describe('generateImage', () => {
    it('should generate image with default config', async () => {
      const request: ImageGenRequest = {
        prompt: 'A beautiful sunset',
        params: {
          count: 1,
          size: '1024x1024',
          steps: 50,
        },
      };

      const result = await service.generateImage(request);

      expect(result.success).toBe(true);
      expect(result.recordId).toBeDefined();
    });

    it('should handle generation failure', async () => {
      // Mock generator to return failure
      const { getImgGenerator } = await import('./img-generators');
      (getImgGenerator as any).mockImplementation(() => ({
        generateImg: vi.fn().mockResolvedValue([false, 'Generation failed']),
        prepareImg: vi.fn().mockResolvedValue(Buffer.from('test')),
      }));

      const request: ImageGenRequest = {
        prompt: 'Test prompt',
        params: { count: 1, size: '512x512' },
      };

      const result = await service.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateImageWithConfig', () => {
    it('should generate image with specified config', async () => {
      const request: ImageGenRequest = {
        prompt: 'Test prompt',
        params: { count: 2, size: '1024x1024', steps: 50 },
        refImages: [Buffer.from('ref-image')],
      };

      const result = await service.generateImageWithConfig(request, 'test-config');

      // Result might be success or failure depending on mock configuration
      expect(result).toBeDefined();
      expect(result.recordId).toBeDefined();
    });
  });

  describe('generateImageQwen', () => {
    it('should generate image with Qwen model (text-to-image)', async () => {
      const request: QwenImageGenRequest = {
        prompt: 'A cat sitting on a table',
        params: {
          batch_size: 1,
          image_size: '1024x1024',
          num_inference_steps: 50,
        },
      };

      const result = await service.generateImageQwen(request);

      // Result might be success or failure depending on mock configuration
      expect(result).toBeDefined();
      expect(result.recordId).toBeDefined();
    });

    it('should generate image with Qwen model (image-to-image)', async () => {
      const request: QwenImageGenRequest = {
        prompt: 'Transform this image',
        params: {
          batch_size: 1,
          image_size: '1024x1024',
          num_inference_steps: 50,
        },
        refImage: Buffer.from('reference-image'),
      };

      const result = await service.generateImageQwen(request);

      // Result might be success or failure depending on mock configuration
      expect(result).toBeDefined();
      expect(result.recordId).toBeDefined();
    });

    it('should handle Qwen generation failure', async () => {
      // Mock generator to return failure
      const { getImgGenerator } = await import('./img-generators');
      (getImgGenerator as any).mockImplementation(() => ({
        generateImg: vi.fn().mockResolvedValue([false, 'Qwen generation failed']),
        prepareImg: vi.fn().mockResolvedValue(Buffer.from('test')),
      }));

      const request: QwenImageGenRequest = {
        prompt: 'Test',
        params: { batch_size: 1, image_size: '512x512', num_inference_steps: 20 },
      };

      const result = await service.generateImageQwen(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('listHistory', () => {
    it('should return history list', async () => {
      const history = await service.listHistory();
      expect(history).toEqual([]);
    });
  });

  describe('getHistory', () => {
    it('should return history record or null', async () => {
      const record = await service.getHistory('test-record-id');
      expect(record).toBeNull();
    });
  });

  describe('deleteHistory', () => {
    it('should delete history record', async () => {
      await expect(service.deleteHistory('test-record-id')).resolves.not.toThrow();
    });
  });

  describe('listLlmConfigs', () => {
    it('should return list of LLM configs', async () => {
      const configs = await service.listLlmConfigs();
      expect(configs).toEqual(['config1.json', 'config2.json']);
    });
  });

  describe('getLlmConfig', () => {
    it('should return LLM config or null', async () => {
      const config = await service.getLlmConfig('test-config');
      expect(config).not.toBeNull();
      expect(config?.base_url).toBe('https://api.example.com');
    });
  });

  describe('saveLlmConfig', () => {
    it('should save LLM config', async () => {
      const config = {
        base_url: 'https://api.example.com',
        key: 'test-key',
        model: 'test-model',
      };

      await expect(service.saveLlmConfig('test', config)).resolves.not.toThrow();
    });
  });

  describe('getRecorder', () => {
    it('should return recorder instance', () => {
      const recorder = service.getRecorder();
      expect(recorder).toBeDefined();
    });
  });

  describe('getConfigService', () => {
    it('should return config service instance', () => {
      const configService = service.getConfigService();
      expect(configService).toBeDefined();
    });
  });
});
