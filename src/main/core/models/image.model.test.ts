import { describe, it, expect } from 'vitest';
import {
  Image,
  ImageListItem,
  ImageCreate,
  ImageResponse,
} from './image.model';

describe('Image Model', () => {
  describe('Image interface', () => {
    it('should have all required properties', () => {
      const image: Image = {
        id: 1,
        name: 'test.jpg',
        content: Buffer.from('test image data'),
        ext: '.jpg',
        create_time: '2024-03-06 12:00:00',
      };

      expect(image.id).toBe(1);
      expect(image.name).toBe('test.jpg');
      expect(image.content).toBeInstanceOf(Buffer);
      expect(image.ext).toBe('.jpg');
    });

    it('should have optional save_path', () => {
      const imageWithPath: Image = {
        id: 1,
        name: 'test.jpg',
        content: Buffer.from('test'),
        ext: '.jpg',
        save_path: '/path/to/image.jpg',
        create_time: '2024-03-06 12:00:00',
      };

      const imageWithoutPath: Image = {
        id: 2,
        name: 'test2.jpg',
        content: Buffer.from('test'),
        ext: '.jpg',
        create_time: '2024-03-06 12:00:00',
      };

      expect(imageWithPath.save_path).toBeDefined();
      expect(imageWithoutPath.save_path).toBeUndefined();
    });
  });

  describe('ImageListItem interface', () => {
    it('should exclude content field', () => {
      const imageListItem: ImageListItem = {
        id: 1,
        name: 'test.jpg',
        ext: '.jpg',
        create_time: '2024-03-06 12:00:00',
      };

      expect(imageListItem.id).toBeDefined();
      expect((imageListItem as any).content).toBeUndefined();
    });
  });

  describe('ImageCreate interface', () => {
    it('should have required fields and optional save_path', () => {
      const imageCreate: ImageCreate = {
        name: 'new-image.jpg',
        content: Buffer.from('new image'),
        ext: '.jpg',
      };

      const imageWithPath: ImageCreate = {
        name: 'new-image.jpg',
        content: Buffer.from('new image'),
        ext: '.jpg',
        save_path: '/path/to/save.jpg',
      };

      expect(imageCreate.name).toBeDefined();
      expect(imageCreate.content).toBeInstanceOf(Buffer);
      expect(imageWithPath.save_path).toBeDefined();
    });
  });

  describe('ImageResponse interface', () => {
    it('should include mime type', () => {
      const imageResponse: ImageResponse = {
        name: 'response.jpg',
        content: Buffer.from('response data'),
        mime: 'image/jpeg',
      };

      expect(imageResponse.mime).toBe('image/jpeg');
      expect(imageResponse.content).toBeInstanceOf(Buffer);
    });
  });

  describe('type constraints', () => {
    it('should allow valid image extensions', () => {
      const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      validExts.forEach((ext) => {
        const image: Image = {
          id: 1,
          name: `test${ext}`,
          content: Buffer.from('test'),
          ext,
          create_time: '2024-03-06 12:00:00',
        };
        expect(image.ext).toBe(ext);
      });
    });

    it('should allow Buffer as content', () => {
      const content = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG signature
      const image: Image = {
        id: 1,
        name: 'test.png',
        content,
        ext: '.png',
        create_time: '2024-03-06 12:00:00',
      };
      expect(image.content).toEqual(content);
    });
  });
});
