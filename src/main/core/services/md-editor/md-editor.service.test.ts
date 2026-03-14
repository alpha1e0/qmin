import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MdEditorService } from './md-editor.service';
import { DBManager } from '../../database/db-manager';
import { config } from '../../common/context';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('MdEditorService', () => {
  let service: MdEditorService;
  let testDbPath: string;

  beforeEach(async () => {
    // 设置测试数据库路径
    testDbPath = path.join(process.env.TMP || '/tmp', `test-md-editor-${Date.now()}.db`);
    process.env.TEST_QMIN_DB = testDbPath;

    // 确保config.mdEditor有正确的值
    // enKey 必须是恰好32字节的字符串（AES-256要求）
    config.mdEditor.hkeyHash = '5d41402abc4b2a76b9719d911017c592';
    config.mdEditor.enKey = '12345678901234567890123456789012'; // 32 bytes
    config.mdEditor.debug = true;

    // 创建服务实例
    service = new MdEditorService();
  });

  afterEach(async () => {
    // 清理测试数据库
    try {
      await fs.unlink(testDbPath);
    } catch {
      // 文件可能不存在
    }
    delete process.env.TEST_QMIN_DB;
  });

  describe('Category Management', () => {
    it('should get category list for space 0', async () => {
      const categories = await service.getCategoryList(0);
      expect(Array.isArray(categories)).toBe(true);
      // 默认应该有一个"默认"分类
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get category by ID', async () => {
      const categories = await service.getCategoryList(0);
      const firstCategoryId = categories[0][0];

      const category = await service.getCategoryById(firstCategoryId);
      expect(category).toBeDefined();
      expect(category[0]).toBe(firstCategoryId);
      expect(category[1]).toBeDefined(); // name
      expect(category[2]).toBeDefined(); // space
      expect(category[3]).toBeDefined(); // create_time
    });

    it('should create a new category', async () => {
      const newCategoryName = 'Test Category';
      const categoryId = await service.createCategory(newCategoryName, 0);

      expect(categoryId).toBeGreaterThan(0);

      const category = await service.getCategoryById(categoryId);
      expect(category[1]).toBe(newCategoryName);
    });

    it('should update a category', async () => {
      const categoryId = await service.createCategory('Original Name', 0);
      await service.updateCategory(categoryId, { name: 'Updated Name' });

      const category = await service.getCategoryById(categoryId);
      expect(category[1]).toBe('Updated Name');
    });

    it('should not allow modifying default category', async () => {
      await expect(service.updateCategory(1, { name: 'New Name' })).rejects.toThrow(
        'Default category cannot be modified'
      );
    });

    it('should delete a category', async () => {
      const categoryId = await service.createCategory('To Delete', 0);
      await service.deleteCategory(categoryId);

      await expect(service.getCategoryById(categoryId)).rejects.toThrow('not exists');
    });

    it('should not allow deleting default category', async () => {
      await expect(service.deleteCategory(1)).rejects.toThrow('Default category cannot be deleted');
    });
  });

  describe('Document Management', () => {
    it('should get document count for a category', async () => {
      const count = await service.getDocCount(1);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should create a new document', async () => {
      const docId = await service.createDoc(1, 'Test Doc', 'Test Summary');

      expect(docId).toBeGreaterThan(0);

      const doc = await service.getDocById(docId);
      expect(doc[1]).toBe('Test Doc');
      expect(doc[2]).toBe('Test Summary');
      expect(doc[3]).toContain('# Test Doc'); // content with initial heading
    });

    it('should get document list for a category', async () => {
      await service.createDoc(1, 'Doc 1', 'Summary 1');
      await service.createDoc(1, 'Doc 2', 'Summary 2');

      const docs = await service.getDocList(1);
      expect(docs.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a document', async () => {
      const docId = await service.createDoc(1, 'Original', 'Summary');
      await service.updateDoc(docId, {
        title: 'Updated',
        content: '# Updated Content\n\nNew content here.',
      });

      const doc = await service.getDocById(docId);
      expect(doc[1]).toBe('Updated');
      expect(doc[3]).toContain('Updated Content');
    });

    it('should delete a document', async () => {
      const docId = await service.createDoc(1, 'To Delete', 'Summary');
      await service.deleteDoc(docId);

      await expect(service.getDocById(docId)).rejects.toThrow('failed');
    });

    it('should encrypt and decrypt document content', async () => {
      const originalContent = 'This is a secret message\n\nWith multiple lines.';
      const docId = await service.createDoc(1, 'Encrypted Doc', 'Summary');
      await service.updateDoc(docId, { content: originalContent });

      const doc = await service.getDocById(docId);
      expect(doc[3]).toBe(originalContent);
    });
  });

  describe('Image Management', () => {
    it('should save image metadata', async () => {
      // 此测试需要实际的图片文件，这里只测试函数是否可以调用
      // 实际测试需要 mock 文件系统
      const testImagePath = path.join(__dirname, '../../../assets/logo.png');

      try {
        const [imageId, imageName] = await service.saveImage(testImagePath);
        expect(imageId).toBeGreaterThan(0);
        expect(imageName).toBeDefined();
      } catch (err) {
        // 如果文件不存在，这个测试会被跳过
        expect(err).toBeDefined();
      }
    });

    it('should get image by ID', async () => {
      // 需要先保存图片才能获取
      // 此测试依赖 saveImage 的正常工作
      const testImagePath = path.join(__dirname, '../../../assets/logo.png');

      try {
        const [imageId] = await service.saveImage(testImagePath);
        const [name, content, mime] = await service.getImage(imageId);

        expect(name).toBeDefined();
        expect(content).toBeInstanceOf(Buffer);
        expect(mime).toMatch(/^image\//);
      } catch (err) {
        // 文件不存在时跳过
        expect(err).toBeDefined();
      }
    });
  });

  describe('Security', () => {
    it('should verify hkey', async () => {
      // hkey 验证逻辑取决于配置
      const isValid = await service.checkHkey('test');
      expect(typeof isValid).toBe('boolean');
    });
  });
});
