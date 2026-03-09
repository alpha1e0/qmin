import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IVViewerService } from './iv-viewer.service';
import { config } from '../common/context';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('IVViewerService', () => {
  let service: IVViewerService;
  let testBasePath: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testBasePath = path.join(process.env.TMP || '/tmp', `test-iv-${Date.now()}`);
    await fs.mkdir(testBasePath, { recursive: true });

    // 设置图片查看器路径
    config.imgViewer.ivPath = testBasePath;

    // 创建服务实例
    service = new IVViewerService();

    // 初始化空数据库文件以避免首次读取错误
    const dirDbPath = path.join(testBasePath, '.qmin_dir.json');
    await fs.writeFile(dirDbPath, JSON.stringify({ version: 1, dirs: [] }, null, 2));
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(testBasePath, { recursive: true, force: true });
    } catch {
      // 目录可能已不存在
    }
  });

  describe('Directory Structure', () => {
    it('should get empty directory structure initially', async () => {
      const dirs = await service.getDirStructure();
      expect(Array.isArray(dirs)).toBe(true);
      expect(dirs.length).toBe(0);
    });

    it('should refresh directory structure', async () => {
      // 创建测试子目录
      await fs.mkdir(path.join(testBasePath, 'test1'), { recursive: true });
      await fs.mkdir(path.join(testBasePath, 'test2'), { recursive: true });

      const dirs = await service.refreshDirStructure();
      expect(dirs.length).toBe(2);
      expect(dirs[0].name).toBeDefined();
      expect(dirs[0].path_id).toBeDefined();
    });

    it('should handle nested directories', async () => {
      await fs.mkdir(path.join(testBasePath, 'parent', 'child'), { recursive: true });

      const dirs = await service.refreshDirStructure();
      expect(dirs.length).toBe(1);
      expect(dirs[0].children).toBeDefined();
      expect(dirs[0].children!.length).toBe(1);
    });

    it('should exclude cache directories from structure', async () => {
      await fs.mkdir(path.join(testBasePath, '.qmin_index'), { recursive: true });
      await fs.mkdir(path.join(testBasePath, '.qmin_op_result'), { recursive: true });
      await fs.mkdir(path.join(testBasePath, '.qmin_restore'), { recursive: true });
      await fs.mkdir(path.join(testBasePath, 'normal'), { recursive: true });

      const dirs = await service.refreshDirStructure();
      expect(dirs.length).toBe(1);
      expect(dirs[0].name).toBe('normal');
    });
  });

  describe('Indexing', () => {
    beforeEach(async () => {
      // 创建测试图片目录和图片文件
      const imgDir = path.join(testBasePath, 'photos');
      await fs.mkdir(imgDir, { recursive: true });

      // 创建假图片文件（实际不需要是真实图片）
      await fs.writeFile(path.join(imgDir, 'img1.jpg'), 'fake image content');
      await fs.writeFile(path.join(imgDir, 'img2.png'), 'fake image content');

      // 刷新目录结构
      await service.refreshDirStructure();
    });

    it('should get directories to index', async () => {
      const toIndex = await service.getDirsToIndex();
      expect(toIndex.length).toBeGreaterThan(0);
      expect(toIndex[0].name).toBeDefined();
      expect(toIndex[0].path_id).toBeDefined();
      expect(toIndex[0].progress).toBe(0);
    });

    it('should check if directory is indexed', async () => {
      const toIndex = await service.getDirsToIndex();
      const pathId = toIndex[0].path_id;

      const isIndexed = await service.hasIndexing(pathId);
      expect(isIndexed).toBe(false);
    });

    it('should index a directory', async () => {
      const toIndex = await service.getDirsToIndex();
      const pathId = toIndex[0].path_id;

      let progress = 0;
      for await (const p of service.indexing(pathId)) {
        progress = p;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      }

      expect(progress).toBe(100);

      // 验证索引已创建
      const isIndexed = await service.hasIndexing(pathId);
      expect(isIndexed).toBe(true);
    });
  });

  describe('Image Operations', () => {
    beforeEach(async () => {
      // 创建测试目录结构
      const imgDir = path.join(testBasePath, 'photos');
      await fs.mkdir(imgDir, { recursive: true });

      // 创建假图片文件
      await fs.writeFile(path.join(imgDir, 'img1.jpg'), 'fake image 1');
      await fs.writeFile(path.join(imgDir, 'img2.jpg'), 'fake image 2');

      // 刷新并索引
      await service.refreshDirStructure();
    });

    it('should get images from indexed directory', async () => {
      const toIndex = await service.getDirsToIndex();
      const pathId = toIndex[0].path_id;

      // 先索引
      for await (const _ of service.indexing(pathId)) {
        // 等待索引完成
      }

      // 获取图片
      const images = await service.getImages(pathId, 0);
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].path_id).toBeDefined();
      expect(images[0].name).toBeDefined();
      expect(images[0].score).toBe(1); // 默认分数
    });

    it('should filter images by score', async () => {
      const toIndex = await service.getDirsToIndex();
      const pathId = toIndex[0].path_id;

      for await (const _ of service.indexing(pathId)) {
        // 等待索引完成
      }

      const allImages = await service.getImages(pathId, 0);
      const highScoreImages = await service.getImages(pathId, 3);

      expect(highScoreImages.length).toBeLessThanOrEqual(allImages.length);
    });

    it('should update image score', async () => {
      const toIndex = await service.getDirsToIndex();
      const pathId = toIndex[0].path_id;

      for await (const _ of service.indexing(pathId)) {
        // 等待索引完成
      }

      const images = await service.getImages(pathId, 0);
      if (images.length > 0) {
        const firstImage = images[0];

        await service.updateScore(firstImage.path_id, 4);

        const updatedImages = await service.getImages(pathId, 4);
        const updated = updatedImages.find((img) => img.path_id === firstImage.path_id);
        expect(updated?.score).toBe(4);
      }
    });
  });

  describe('Metadata', () => {
    it('should get directory metadata', async () => {
      const imgDir = path.join(testBasePath, 'photos');
      await fs.mkdir(imgDir, { recursive: true });
      await fs.writeFile(path.join(imgDir, 'img.jpg'), 'fake image');

      await service.refreshDirStructure();
      const toIndex = await service.getDirsToIndex();

      if (toIndex.length > 0) {
        const pathId = toIndex[0].path_id;

        for await (const _ of service.indexing(pathId)) {
          // 等待索引完成
        }

        const meta = await service.getMeta(pathId);
        expect(meta.name).toBeDefined();
        expect(meta.create_time).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw when base path not configured', async () => {
      config.imgViewer.ivPath = 'dir_not_exists';

      expect(() => new IVViewerService()).toThrow();
    });

    it('should throw when getting images from non-indexed directory', async () => {
      const imgDir = path.join(testBasePath, 'photos');
      await fs.mkdir(imgDir, { recursive: true });
      await fs.writeFile(path.join(imgDir, 'img.jpg'), 'fake image');

      await service.refreshDirStructure();
      const toIndex = await service.getDirsToIndex();

      if (toIndex.length > 0) {
        const pathId = toIndex[0].path_id;

        await expect(service.getImages(pathId, 0)).rejects.toThrow('Image cache not exists');
      }
    });
  });
});
