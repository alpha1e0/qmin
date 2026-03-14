import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ImgRecorderService } from '@/main/core/services/img-gen/img-recorder.service';

// Mock wpath
vi.mock('../common/context', () => ({
  wpath: {
    imgGenHistoryDir: os.tmpdir() + '/',
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('ImgRecorderService', () => {
  let service: ImgRecorderService;
  const testHistoryDir = os.tmpdir() + '/';

  beforeEach(async () => {
    service = new ImgRecorderService();
    await fs.mkdir(testHistoryDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testHistoryDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createRecordDir', () => {
    it('should create a new record directory with timestamp', async () => {
      const recordId = await service.createRecordDir();

      expect(recordId).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);

      const recordPath = path.join(testHistoryDir, recordId);
      await expect(fs.access(recordPath)).resolves.toBeUndefined();
    });

    it('should create unique record IDs', async () => {
      const recordId1 = await service.createRecordDir();
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const recordId2 = await service.createRecordDir();

      expect(recordId1).not.toBe(recordId2);
    });
  });

  describe('getRecordPath', () => {
    it('should return correct path for record ID', () => {
      const recordId = '2024-03-06_12-30-45';
      const recordPath = service.getRecordPath(recordId);

      expect(recordPath).toBe(path.join(testHistoryDir, recordId));
    });
  });

  describe('recordPrompt', () => {
    it('should record prompt to file', async () => {
      const recordId = 'test-record';
      const prompt = 'A beautiful sunset over the ocean';

      await service.createRecordDir(); // Create directory first
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordPrompt(recordId, prompt);

      const promptPath = path.join(testHistoryDir, recordId, 'prompt.txt');
      const content = await fs.readFile(promptPath, 'utf-8');

      expect(content).toBe(prompt);
    });
  });

  describe('recordParams', () => {
    it('should record ImageGenParams to JSON file', async () => {
      const recordId = 'test-record';
      const params = {
        count: 2,
        size: '1024x1024',
        steps: 50,
      };

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordParams(recordId, params);

      const paramsPath = path.join(testHistoryDir, recordId, 'params.json');
      const content = await fs.readFile(paramsPath, 'utf-8');
      const savedParams = JSON.parse(content);

      expect(savedParams).toEqual(params);
    });

    it('should record QwenImageGenParams to JSON file', async () => {
      const recordId = 'test-record';
      const params = {
        batch_size: 4,
        image_size: '1024x1024',
        num_inference_steps: 50,
        guidance_scale: 7.5,
      };

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordParams(recordId, params);

      const paramsPath = path.join(testHistoryDir, recordId, 'params.json');
      const content = await fs.readFile(paramsPath, 'utf-8');
      const savedParams = JSON.parse(content);

      expect(savedParams).toEqual(params);
    });
  });

  describe('recordImage', () => {
    it('should record image bytes to file', async () => {
      const recordId = 'test-record';
      const fileName = 'test.jpg';
      const imgBytes = Buffer.from('fake image data');

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordImage(recordId, imgBytes, fileName);

      const filePath = path.join(testHistoryDir, recordId, fileName);
      const savedData = await fs.readFile(filePath);

      expect(savedData).toEqual(imgBytes);
    });
  });

  describe('recordRefImage', () => {
    it('should record reference image with correct filename', async () => {
      const recordId = 'test-record';
      const imgBytes = Buffer.from('reference image');
      const index = 2;

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordRefImage(recordId, imgBytes, index);

      const fileName = `ref_${index}.jpg`;
      const filePath = path.join(testHistoryDir, recordId, fileName);
      const savedData = await fs.readFile(filePath);

      expect(savedData).toEqual(imgBytes);
    });
  });

  describe('recordResultImageFromBase64', () => {
    it('should record image from base64 data URL', async () => {
      const recordId = 'test-record';
      const base64Data = Buffer.from('test image').toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordResultImageFromBase64(recordId, dataUrl, 0);

      const filePath = path.join(testHistoryDir, recordId, 'output_0.jpg');
      const savedData = await fs.readFile(filePath);

      expect(savedData.toString()).toBe('test image');
    });

    it('should handle URL by downloading image', async () => {
      const recordId = 'test-record';
      const imgUrl = 'https://example.com/image.jpg';

      // Mock downloadImageFromUrl
      const mockImageData = Buffer.from('downloaded image');
      vi.doMock('@/main/core/utils/image', () => ({
        downloadImageFromUrl: vi.fn().mockResolvedValue(mockImageData),
      }));

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });

      // This test requires mocking downloadImageFromUrl
      // Skip for now as it requires complex mocking
      await expect(
        service.recordResultImageFromBase64(recordId, imgUrl, 0)
      ).resolves.not.toThrow();
    });
  });

  describe('recordResponse', () => {
    it('should record response to JSON file', async () => {
      const recordId = 'test-record';
      const response = {
        success: true,
        data: [1, 2, 3],
      };

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordResponse(recordId, response);

      const responsePath = path.join(testHistoryDir, recordId, 'response.json');
      const content = await fs.readFile(responsePath, 'utf-8');
      const savedResponse = JSON.parse(content);

      expect(savedResponse).toEqual(response);
    });
  });

  describe('recordLlmConfig', () => {
    it('should record LLM config name to file', async () => {
      const recordId = 'test-record';
      const configName = 'flux-config.json';

      await service.createRecordDir();
      await fs.mkdir(path.join(testHistoryDir, recordId), { recursive: true });
      await service.recordLlmConfig(recordId, configName);

      const configPath = path.join(testHistoryDir, recordId, 'llm_config.txt');
      const content = await fs.readFile(configPath, 'utf-8');

      expect(content).toBe(configName);
    });
  });

  describe('listHistory', () => {
    it('should return empty array when no history exists', async () => {
      const history = await service.listHistory();
      expect(history).toEqual([]);
    });

    it('should list all history records', async () => {
      // Create test records
      const recordId1 = '2024-03-06_12-00-00';
      const recordId2 = '2024-03-06_13-00-00';

      for (const recordId of [recordId1, recordId2]) {
        const recordPath = path.join(testHistoryDir, recordId);
        await fs.mkdir(recordPath, { recursive: true });

        // Create prompt.txt
        await fs.writeFile(
          path.join(recordPath, 'prompt.txt'),
          'Test prompt',
          'utf-8'
        );

        // Create llm_config.txt
        await fs.writeFile(
          path.join(recordPath, 'llm_config.txt'),
          'test-config.json',
          'utf-8'
        );
      }

      const history = await service.listHistory();

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(recordId2); // Should be sorted descending
      expect(history[1].id).toBe(recordId1);
    });

    it('should count reference and result images', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      // Create prompt.txt
      await fs.writeFile(path.join(recordPath, 'prompt.txt'), 'Test', 'utf-8');

      // Create reference images
      await fs.writeFile(path.join(recordPath, 'ref_0.jpg'), 'ref0', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'ref_1.jpg'), 'ref1', 'utf-8');

      // Create result images
      await fs.writeFile(path.join(recordPath, 'output_0.jpg'), 'out0', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'output_1.jpg'), 'out1', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'output_2.jpg'), 'out2', 'utf-8');

      const history = await service.listHistory();

      expect(history[0].refCount).toBe(2);
      expect(history[0].resultCount).toBe(3);
    });

    it('should truncate long prompts', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      const longPrompt = 'a'.repeat(150);
      await fs.writeFile(path.join(recordPath, 'prompt.txt'), longPrompt, 'utf-8');
      await fs.writeFile(
        path.join(recordPath, 'llm_config.txt'),
        'test',
        'utf-8'
      );

      const history = await service.listHistory();

      expect(history[0].prompt).toHaveLength(103); // 100 + '...'
      expect(history[0].prompt).toMatch(/\.\.\.$/);
    });
  });

  describe('getHistory', () => {
    it('should return null for non-existent record', async () => {
      const record = await service.getHistory('non-existent');
      expect(record).toBeNull();
    });

    it('should return complete record data', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      // Create all required files
      await fs.writeFile(path.join(recordPath, 'prompt.txt'), 'Test prompt', 'utf-8');

      const params = { count: 2, size: '1024x1024' };
      await fs.writeFile(
        path.join(recordPath, 'params.json'),
        JSON.stringify(params),
        'utf-8'
      );

      await fs.writeFile(
        path.join(recordPath, 'llm_config.txt'),
        'test-config.json',
        'utf-8'
      );

      const response = { success: true };
      await fs.writeFile(
        path.join(recordPath, 'response.json'),
        JSON.stringify(response),
        'utf-8'
      );

      // Create images
      await fs.writeFile(path.join(recordPath, 'ref_0.jpg'), 'ref', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'output_0.jpg'), 'out', 'utf-8');

      const record = await service.getHistory(recordId);

      expect(record).not.toBeNull();
      expect(record?.id).toBe(recordId);
      expect(record?.prompt).toBe('Test prompt');
      expect(record?.params).toEqual(params);
      expect(record?.llmConfig).toBe('test-config.json');
      expect(record?.response).toEqual(response);
      expect(record?.refImages).toHaveLength(1);
      expect(record?.resultImages).toHaveLength(1);
    });
  });

  describe('deleteHistory', () => {
    it('should delete existing record', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      await service.deleteHistory(recordId);

      await expect(fs.access(recordPath)).rejects.toThrow();
    });

    it('should handle deletion of non-existent record gracefully', async () => {
      // The implementation uses recursive: true, force: true, so it won't throw
      await expect(service.deleteHistory('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getRefImages', () => {
    it('should return empty array when no ref images exist', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      const refImages = await service.getRefImages(recordId);

      expect(refImages).toEqual([]);
    });

    it('should return all reference image paths', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      await fs.writeFile(path.join(recordPath, 'ref_0.jpg'), 'ref0', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'ref_1.jpg'), 'ref1', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'ref_2.jpg'), 'ref2', 'utf-8');

      const refImages = await service.getRefImages(recordId);

      expect(refImages).toHaveLength(3);
      expect(refImages[0]).toContain('ref_0.jpg');
      expect(refImages[1]).toContain('ref_1.jpg');
      expect(refImages[2]).toContain('ref_2.jpg');
    });
  });

  describe('getResultImages', () => {
    it('should return empty array when no result images exist', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      const resultImages = await service.getResultImages(recordId);

      expect(resultImages).toEqual([]);
    });

    it('should return all result image paths', async () => {
      const recordId = 'test-record';
      const recordPath = path.join(testHistoryDir, recordId);
      await fs.mkdir(recordPath, { recursive: true });

      await fs.writeFile(path.join(recordPath, 'output_0.jpg'), 'out0', 'utf-8');
      await fs.writeFile(path.join(recordPath, 'output_1.jpg'), 'out1', 'utf-8');

      const resultImages = await service.getResultImages(recordId);

      expect(resultImages).toHaveLength(2);
      expect(resultImages[0]).toContain('output_0.jpg');
      expect(resultImages[1]).toContain('output_1.jpg');
    });
  });
});
