import { describe, it, expect } from 'vitest';
import {
  Doc,
  DocListItem,
  DocCreate,
  DocUpdate,
} from './doc.model';

describe('Doc Model', () => {
  describe('Doc interface', () => {
    it('should have all required properties', () => {
      const doc: Doc = {
        id: 1,
        title: 'Test Document',
        summary: 'Test Summary',
        content: 'Test Content',
        category_id: 1,
        create_time: '2024-03-06 12:00:00',
        modify_time: '2024-03-06 12:00:00',
      };

      expect(doc.id).toBe(1);
      expect(doc.title).toBe('Test Document');
      expect(doc.summary).toBe('Test Summary');
      expect(doc.content).toBe('Test Content');
      expect(doc.category_id).toBe(1);
    });
  });

  describe('DocListItem interface', () => {
    it('should exclude content field', () => {
      const docListItem: DocListItem = {
        id: 1,
        title: 'Test Document',
        summary: 'Test Summary',
        create_time: '2024-03-06 12:00:00',
        modify_time: '2024-03-06 12:00:00',
      };

      expect(docListItem.id).toBeDefined();
      expect(docListItem.title).toBeDefined();
      expect((docListItem as any).content).toBeUndefined();
    });
  });

  describe('DocCreate interface', () => {
    it('should have required and optional fields', () => {
      const docCreate1: DocCreate = {
        cid: 1,
        title: 'New Document',
        summary: 'Summary',
      };

      const docCreate2: DocCreate = {
        cid: 1,
        title: 'New Document',
        summary: 'Summary',
        content: 'Content',
      };

      expect(docCreate1.cid).toBe(1);
      expect(docCreate2.content).toBe('Content');
    });
  });

  describe('DocUpdate interface', () => {
    it('should have all optional properties', () => {
      const update1: DocUpdate = { title: 'Updated Title' };
      const update2: DocUpdate = { summary: 'Updated Summary' };
      const update3: DocUpdate = { content: 'Updated Content' };
      const update4: DocUpdate = {
        title: 'Updated',
        summary: 'Updated',
        content: 'Updated',
        modify_time: '2024-03-06 12:00:00',
      };

      expect(update1.title).toBeDefined();
      expect(update2.summary).toBeDefined();
      expect(update3.content).toBeDefined();
      expect(update4.modify_time).toBeDefined();
    });
  });

  describe('type constraints', () => {
    it('should allow valid document IDs', () => {
      const doc: Doc = {
        id: 100,
        title: 'Test',
        summary: 'Test',
        content: 'Test',
        category_id: 1,
        create_time: '2024-03-06 12:00:00',
        modify_time: '2024-03-06 12:00:00',
      };
      expect(doc.id).toBeGreaterThanOrEqual(1);
    });

    it('should allow valid category IDs', () => {
      const doc: Doc = {
        id: 1,
        title: 'Test',
        summary: 'Test',
        content: 'Test',
        category_id: 5,
        create_time: '2024-03-06 12:00:00',
        modify_time: '2024-03-06 12:00:00',
      };
      expect(doc.category_id).toBeGreaterThanOrEqual(0);
    });

    it('should allow empty content (optional field)', () => {
      const docCreate: DocCreate = {
        cid: 1,
        title: 'Test',
        summary: 'Test',
      };
      expect(docCreate.content).toBeUndefined();
    });
  });
});
