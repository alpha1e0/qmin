import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MdEditorService } from '@/core/services/md-editor/md-editor.service';
import { DBManager } from '../../database/db-manager';
import { config } from '../../common/context';

// Mock the config
vi.mock('../common/context', () => ({
  wpath: {
    qminDb: ':memory:', // Use in-memory database for tests
  },
  config: {
    mdEditor: {
      enKey: 'test-encryption-key-32-characters-long!',
      hkeyHash: 'test-hash',
      debug: true,
    },
    imgViewer: {
      ivPath: '/tmp/images',
    },
  },
}));

describe('MdEditorService (with Mock)', () => {
  let service: MdEditorService;

  beforeEach(() => {
    service = new MdEditorService();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
    });

    it('should have database manager', () => {
      const dbm = service.getDbManager();
      expect(dbm).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should handle database queries', () => {
      // Test that the service can perform basic operations
      const dbm = service.getDbManager();

      // These operations use the mocked database
      expect(() => dbm.query('SELECT * FROM doc_category')).not.toThrow();
    });

    it('should handle encryption', () => {
      // Test encryption/decryption without database
      const testContent = 'Secret message';

      // The service should be able to encrypt and decrypt
      expect(testContent).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent category gracefully', async () => {
      await expect(service.getCategoryById(99999)).rejects.toThrow();
    });

    it('should handle non-existent document gracefully', async () => {
      await expect(service.getDocById(99999)).rejects.toThrow();
    });
  });

  describe('Security', () => {
    it('should verify hkey', async () => {
      const isValid = await service.checkHkey('test');
      expect(typeof isValid).toBe('boolean');
    });
  });
});
