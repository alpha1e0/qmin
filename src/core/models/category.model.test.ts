import { describe, it, expect } from 'vitest';
import {
  DocCategory,
  DocCategoryWithCount,
  CategoryCreate,
  CategoryUpdate,
} from './category.model';

describe('Category Model', () => {
  describe('DocCategory interface', () => {
    it('should have correct properties', () => {
      const category: DocCategory = {
        id: 1,
        name: 'Test Category',
        space: 0,
        create_time: '2024-03-06 12:00:00',
      };

      expect(category.id).toBe(1);
      expect(category.name).toBe('Test Category');
      expect(category.space).toBe(0);
      expect(category.create_time).toBeDefined();
    });
  });

  describe('DocCategoryWithCount interface', () => {
    it('should extend DocCategory with doc_count', () => {
      const categoryWithCount: DocCategoryWithCount = {
        id: 1,
        name: 'Test Category',
        space: 0,
        create_time: '2024-03-06 12:00:00',
        doc_count: 5,
      };

      expect(categoryWithCount.doc_count).toBe(5);
      expect(categoryWithCount.id).toBeDefined();
      expect(categoryWithCount.name).toBeDefined();
    });
  });

  describe('CategoryCreate interface', () => {
    it('should have required name and optional space', () => {
      const categoryCreate1: CategoryCreate = {
        name: 'New Category',
      };

      const categoryCreate2: CategoryCreate = {
        name: 'New Category',
        space: 1,
      };

      expect(categoryCreate1.name).toBeDefined();
      expect(categoryCreate2.space).toBe(1);
    });
  });

  describe('CategoryUpdate interface', () => {
    it('should have all optional properties', () => {
      const categoryUpdate1: CategoryUpdate = {
        name: 'Updated Name',
      };

      const categoryUpdate2: CategoryUpdate = {
        space: 2,
      };

      const categoryUpdate3: CategoryUpdate = {
        name: 'Updated Name',
        space: 2,
      };

      expect(categoryUpdate1.name).toBeDefined();
      expect(categoryUpdate2.space).toBeDefined();
      expect(categoryUpdate3.name).toBeDefined();
      expect(categoryUpdate3.space).toBeDefined();
    });
  });

  describe('type constraints', () => {
    it('should allow valid space values', () => {
      const validSpaces = [0, 1, 2, 3];
      validSpaces.forEach((space) => {
        const category: DocCategory = {
          id: 1,
          name: 'Test',
          space,
          create_time: '2024-03-06 12:00:00',
        };
        expect(category.space).toBe(space);
      });
    });

    it('should allow valid category names', () => {
      const validNames = ['Work', 'Personal', 'ideas', '笔记'];
      validNames.forEach((name) => {
        const category: DocCategory = {
          id: 1,
          name,
          space: 0,
          create_time: '2024-03-06 12:00:00',
        };
        expect(category.name).toBe(name);
      });
    });
  });
});
