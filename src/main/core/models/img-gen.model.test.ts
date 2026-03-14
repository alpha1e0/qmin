import { describe, it, expect } from 'vitest';
import {
  LLMConfig,
  ImageGenParams,
  QwenImageGenParams,
  ImageGenRecord,
  ImageGenRequest,
  QwenImageGenRequest,
  ImageGenResult,
  ImageGenResponse,
  HistoryListItem,
  SUPPORTED_SIZES,
  SUPPORTED_RATIOS,
  SUPPORTED_QUALITIES,
  QWEN_STEPS_RANGE,
} from '@/main/core/models/img-gen.model';

describe('Image Generation Model', () => {
  describe('LLMConfig interface', () => {
    it('should have required fields', () => {
      const config: LLMConfig = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
      };

      expect(config.base_url).toBeDefined();
      expect(config.model).toBeDefined();
      expect(config.key).toBeDefined();
    });

    it('should have optional fields', () => {
      const config: LLMConfig = {
        base_url: 'https://api.example.com',
        model: 'test-model',
        key: 'test-key',
        temperature: 0.7,
        max_tokens: 1000,
        proxy: 'http://proxy.example.com',
      };

      expect(config.temperature).toBe(0.7);
      expect(config.max_tokens).toBe(1000);
      expect(config.proxy).toBeDefined();
    });
  });

  describe('ImageGenParams interface', () => {
    it('should have required fields', () => {
      const params: ImageGenParams = {
        count: 2,
        size: '1024x1024',
      };

      expect(params.count).toBe(2);
      expect(params.size).toBe('1024x1024');
    });

    it('should have optional fields', () => {
      const params: ImageGenParams = {
        count: 1,
        size: '512x512',
        ratio: '16:9',
        quality: 'hd',
        steps: 50,
      };

      expect(params.ratio).toBe('16:9');
      expect(params.quality).toBe('hd');
      expect(params.steps).toBe(50);
    });

    it('should allow valid count range (1-4)', () => {
      [1, 2, 3, 4].forEach((count) => {
        const params: ImageGenParams = {
          count,
          size: '1024x1024',
        };
        expect(params.count).toBe(count);
      });
    });
  });

  describe('QwenImageGenParams interface', () => {
    it('should have all required fields', () => {
      const params: QwenImageGenParams = {
        image_size: '1328x1328',
        batch_size: 4,
        num_inference_steps: 20,
      };

      expect(params.image_size).toBe('1328x1328');
      expect(params.batch_size).toBe(4);
      expect(params.num_inference_steps).toBe(20);
    });
  });

  describe('ImageGenRequest interface', () => {
    it('should have required fields', () => {
      const request: ImageGenRequest = {
        prompt: 'A beautiful sunset',
        params: { count: 1, size: '1024x1024' },
      };

      expect(request.prompt).toBeDefined();
      expect(request.params).toBeDefined();
    });

    it('should have optional refImages', () => {
      const requestWithRef: ImageGenRequest = {
        prompt: 'Transform this image',
        params: { count: 1, size: '1024x1024' },
        refImages: [Buffer.from('ref image')],
      };

      const requestWithoutRef: ImageGenRequest = {
        prompt: 'Generate image',
        params: { count: 1, size: '1024x1024' },
      };

      expect(requestWithRef.refImages).toBeDefined();
      expect(requestWithoutRef.refImages).toBeUndefined();
    });
  });

  describe('QwenImageGenRequest interface', () => {
    it('should have required fields', () => {
      const request: QwenImageGenRequest = {
        prompt: 'A cat',
        params: {
          image_size: '1328x1328',
          batch_size: 1,
          num_inference_steps: 20,
        },
      };

      expect(request.prompt).toBeDefined();
      expect(request.params).toBeDefined();
    });

    it('should have optional refImage (single image)', () => {
      const requestWithRef: QwenImageGenRequest = {
        prompt: 'Transform',
        params: {
          image_size: '1328x1328',
          batch_size: 1,
          num_inference_steps: 20,
        },
        refImage: Buffer.from('reference'),
      };

      expect(requestWithRef.refImage).toBeInstanceOf(Buffer);
    });
  });

  describe('ImageGenResult interface', () => {
    it('should represent successful generation', () => {
      const result: ImageGenResult = {
        success: true,
        recordId: '2024-03-06_12-00-00',
        resultImages: ['/path/to/image.jpg'],
      };

      expect(result.success).toBe(true);
      expect(result.recordId).toBeDefined();
      expect(result.resultImages).toBeDefined();
    });

    it('should represent failed generation', () => {
      const result: ImageGenResult = {
        success: false,
        error: 'Generation failed',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('HistoryListItem interface', () => {
    it('should have all required fields', () => {
      const item: HistoryListItem = {
        id: '2024-03-06_12-00-00',
        timestamp: '2024-03-06T12:00:00',
        prompt: 'Test prompt',
        refCount: 1,
        resultCount: 2,
        llmConfig: 'flux-config.json',
      };

      expect(item.id).toBeDefined();
      expect(item.refCount).toBe(1);
      expect(item.resultCount).toBe(2);
    });
  });

  describe('Constants', () => {
    describe('SUPPORTED_SIZES', () => {
      it('should have standard sizes', () => {
        expect(SUPPORTED_SIZES.standard).toContain('512x512');
        expect(SUPPORTED_SIZES.standard).toContain('1024x1024');
      });

      it('should have Qwen sizes', () => {
        expect(SUPPORTED_SIZES.qwen).toContain('1328x1328');
        expect(SUPPORTED_SIZES.qwen.length).toBeGreaterThan(0);
      });
    });

    describe('SUPPORTED_RATIOS', () => {
      it('should contain common ratios', () => {
        expect(SUPPORTED_RATIOS).toContain('1:1');
        expect(SUPPORTED_RATIOS).toContain('16:9');
        expect(SUPPORTED_RATIOS).toContain('9:16');
      });
    });

    describe('SUPPORTED_QUALITIES', () => {
      it('should contain standard qualities', () => {
        expect(SUPPORTED_QUALITIES).toContain('standard');
        expect(SUPPORTED_QUALITIES).toContain('hd');
      });
    });

    describe('QWEN_STEPS_RANGE', () => {
      it('should have min, max, and default values', () => {
        expect(QWEN_STEPS_RANGE.min).toBe(10);
        expect(QWEN_STEPS_RANGE.max).toBe(50);
        expect(QWEN_STEPS_RANGE.default).toBe(20);
      });

      it('should have valid range', () => {
        expect(QWEN_STEPS_RANGE.min).toBeLessThan(QWEN_STEPS_RANGE.max);
        expect(QWEN_STEPS_RANGE.default).toBeGreaterThanOrEqual(QWEN_STEPS_RANGE.min);
        expect(QWEN_STEPS_RANGE.default).toBeLessThanOrEqual(QWEN_STEPS_RANGE.max);
      });
    });
  });

  describe('type constraints', () => {
    it('should allow valid standard sizes', () => {
      SUPPORTED_SIZES.standard.forEach((size) => {
        const params: ImageGenParams = {
          count: 1,
          size,
        };
        expect(params.size).toMatch(/^\d+x\d+$/);
      });
    });

    it('should allow valid Qwen sizes', () => {
      SUPPORTED_SIZES.qwen.forEach((size) => {
        const params: QwenImageGenParams = {
          image_size: size,
          batch_size: 1,
          num_inference_steps: 20,
        };
        expect(params.image_size).toMatch(/^\d+x\d+$/);
      });
    });

    it('should allow valid ratios', () => {
      SUPPORTED_RATIOS.forEach((ratio) => {
        if (ratio) {
          expect(ratio).toMatch(/^\d+:\d+$/);
        }
      });
    });
  });
});
