import * as path from 'path';
import * as fs from 'fs/promises';

import { wpath, config } from '@/core/common/context';
import { createLogger } from '@/core/utils/logger';

const logger = createLogger('MdEditorService');
import { MdEditorDBOpError, MdEditorOpNotAllowed, MdEditorImgOpError } from '@/core/common/exceptions';
import { IMG_SAVE_TO_DB, MIME_MAP } from '@/core/common/constants';
import { DBManager } from '@/core/database/db-manager';
import { currentTimeObjToStr, getFileSizeMB } from '@/core/utils/common';
import { mix, unmix } from '@/core/utils/crypto';
import { isImage } from '@/core/utils/path';
import {
  DocCategory,
  Doc,
  Image as ImageModel,
  DocListItem,
  DocCreate,
  DocUpdate,
  CategoryCreate,
  CategoryUpdate,
} from '@/core/models';
import { encrypt, decrypt, md5sum } from '@/core/utils/crypto';

/**
 * Markdown Editor Service
 */
export class MdEditorService {
  private dbm: DBManager;

  constructor() {
    this.dbm = new DBManager();
  }

  getDbManager(): DBManager {
    return this.dbm;
  }

  /**
   * Get all category list
   * @returns List of [id, name, create_time]
   */
  async getCategoryListAll(): Promise<Array<[number, string, string]>> {
    const result = this.dbm.query<[number, string, string]>(
      'SELECT id, name, create_time FROM doc_category'
    );

    return result.map((item) => [item[0], unmix(item[1]), item[2]]);
  }

  /**
   * Get category list for a specific space
   * @param space - Space ID
   * @returns List of [id, name, create_time]
   */
  async getCategoryList(space: number = 0): Promise<Array<[number, string, string]>> {
    const result = this.dbm.query<[number, string, string]>(
      'SELECT id, name, create_time FROM doc_category WHERE space=?',
      [space]
    );

    return result.map((item) => [item[0], unmix(item[1]), item[2]]);
  }

  /**
   * Get category by ID
   * @param id - Category ID
   * @returns [id, name, space, create_time]
   */
  async getCategoryById(id: number): Promise<[number, string, number, string]> {
    const result = this.dbm.get<[number, string, number, string]>(
      'SELECT id, name, space, create_time FROM doc_category WHERE id=?',
      [id]
    );

    if (!result) {
      throw new MdEditorDBOpError(`DB category ${id} not exists`);
    }

    return [result[0], unmix(result[1]), result[2], result[3]];
  }

  /**
   * Create a category
   * @param name - Category name
   * @param space - Space ID
   * @returns New category ID
   */
  async createCategory(name: string, space: number = 0): Promise<number> {
    const sql = "INSERT INTO doc_category ('name', 'space', 'create_time') VALUES (?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [mix(name), space, currentTimeObjToStr()]);

    if (lastRowid > 0) {
      return lastRowid;
    }

    throw new MdEditorDBOpError('DB add category to database failed');
  }

  /**
   * Update a category
   * @param id - Category ID
   * @param params - Update parameters
   */
  async updateCategory(id: number, params: CategoryUpdate): Promise<void> {
    if (id === 1) {
      throw new MdEditorOpNotAllowed('Default category cannot be modified');
    }

    const updateParts: string[] = [];
    const values: any[] = [];

    if (params.name !== undefined) {
      updateParts.push('name=?');
      values.push(mix(params.name));
    }

    if (params.space !== undefined) {
      updateParts.push('space=?');
      values.push(params.space);
    }

    if (updateParts.length === 0) {
      return;
    }

    values.push(id);

    const sql = `UPDATE doc_category SET ${updateParts.join(', ')} WHERE id=?`;
    const changes = this.dbm.execute(sql, values);

    if (changes < 1) {
      throw new MdEditorDBOpError(`DB update category ${id} failed`);
    }
  }

  /**
   * Delete a category
   * @param id - Category ID
   */
  async deleteCategory(id: number): Promise<void> {
    if (id === 1) {
      throw new MdEditorOpNotAllowed('Default category cannot be deleted');
    }

    const changes = this.dbm.execute('DELETE FROM doc_category WHERE id=?', [id]);

    if (changes < 1) {
      throw new MdEditorDBOpError(`DB delete category ${id} failed`);
    }
  }

  /**
   * Get document count for a category
   * @param cId - Category ID
   * @returns Document count
   */
  async getDocCount(cId: number): Promise<number> {
    const result = this.dbm.get<{ count: number }>(
      'SELECT COUNT(id) AS count FROM doc WHERE category_id=?',
      [cId]
    );

    return result?.count || 0;
  }

  /**
   * Get document list for a category
   * @param cId - Category ID
   * @returns List of [id, title, summary, create_time, modify_time]
   */
  async getDocList(cId: number): Promise<Array<[number, string, string, string, string]>> {
    // Check if category exists
    await this.getCategoryById(cId);

    const result = this.dbm.query<[number, string, string, string, string]>(
      'SELECT id, title, summary, create_time, modify_time FROM doc WHERE category_id=?',
      [cId]
    );

    return result.map((item) => [item[0], unmix(item[1]), unmix(item[2]), item[3], item[4]]);
  }

  /**
   * Get document by ID
   * @param id - Document ID
   * @returns [id, title, summary, content, create_time, modify_time]
   */
  async getDocById(id: number): Promise<[number, string, string, string, string, string]> {
    const result = this.dbm.get<[number, string, string, string, string, string]>(
      'SELECT id, title, summary, content, create_time, modify_time FROM doc WHERE id=?',
      [id]
    );

    if (!result) {
      throw new MdEditorDBOpError(`DB get doc ${id} failed`);
    }

    const doc: [number, string, string, string, string, string] = [
      result[0],
      unmix(result[1]),
      unmix(result[2]),
      '',
      result[4],
      result[5],
    ];

    if (result[3] !== '') {
      doc[3] = this.decryptContent(result[3]);
    }

    return doc;
  }

  /**
   * Create a document
   * @param cid - Category ID
   * @param title - Document title
   * @param summary - Document summary
   * @returns New document ID
   */
  async createDoc(cid: number, title: string, summary: string): Promise<number> {
    const sql =
      "INSERT INTO doc ('title', 'summary', 'category_id', 'content', 'create_time', 'modify_time') VALUES (?, ?, ?, ?, ?, ?)";
    const initialContent = this.encryptContent(`# ${title}\n`);
    const now = currentTimeObjToStr();

    const { lastRowid } = this.dbm.insert(sql, [
      mix(title),
      mix(summary),
      cid,
      initialContent,
      now,
      now,
    ]);

    if (lastRowid > 0) {
      return lastRowid;
    }

    throw new MdEditorDBOpError('DB create doc failed');
  }

  /**
   * Update a document
   * @param id - Document ID
   * @param docParams - Update parameters
   */
  async updateDoc(id: number, docParams: DocUpdate): Promise<void> {
    const updateParts: string[] = [];
    const values: any[] = [];

    if (docParams.content !== undefined && docParams.content !== null) {
      const encryptedDoc = this.encryptContent(docParams.content);
      updateParts.push('content=?');
      values.push(encryptedDoc);
    }

    if (docParams.title !== undefined && docParams.title !== null) {
      updateParts.push('title=?');
      values.push(mix(docParams.title));
    }

    if (docParams.summary !== undefined && docParams.summary !== null) {
      updateParts.push('summary=?');
      values.push(mix(docParams.summary));
    }

    updateParts.push('modify_time=?');
    values.push(currentTimeObjToStr());

    values.push(id);

    const sql = `UPDATE doc SET ${updateParts.join(', ')} WHERE id=?`;
    const changes = this.dbm.execute(sql, values);

    if (changes < 1) {
      throw new MdEditorDBOpError(`DB update doc ${id} failed`);
    }
  }

  /**
   * Delete a document
   * @param id - Document ID
   */
  async deleteDoc(id: number): Promise<void> {
    const changes = this.dbm.execute('DELETE FROM doc WHERE id=?', [id]);

    if (changes < 1) {
      throw new MdEditorDBOpError(`DB delete doc ${id} failed`);
    }
  }

  /**
   * Save an image
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  async saveImage(filePath: string): Promise<[number, string]> {
    if (IMG_SAVE_TO_DB) {
      return await this.saveImageToDb(filePath);
    } else {
      return await this.saveImageToFile(filePath);
    }
  }

  /**
   * Save image to database
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  private async saveImageToDb(filePath: string): Promise<[number, string]> {
    const name = path.basename(filePath);
    const ext = path.extname(filePath);

    const content = await fs.readFile(filePath);

    const sql = "INSERT INTO image ('name', 'content', 'ext', 'create_time') VALUES (?, ?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [name, content, ext, currentTimeObjToStr()]);

    if (lastRowid > 0) {
      return [lastRowid, name];
    }

    throw new MdEditorImgOpError('DB save image failed');
  }

  /**
   * Save image metadata to database and copy file to upload directory
   * @param filePath - Path to image file
   * @returns [imageId, imageName]
   */
  private async saveImageToFile(filePath: string): Promise<[number, string]> {
    const name = path.basename(filePath);
    const ext = path.extname(filePath);

    const sql = "INSERT INTO image ('name', 'content', 'ext', 'create_time') VALUES (?, ?, ?, ?)";
    const { lastRowid } = this.dbm.insert(sql, [name, Buffer.alloc(0), ext, currentTimeObjToStr()]);

    if (lastRowid < 1) {
      throw new MdEditorImgOpError('DB save image meta failed');
    }

    const newPath = path.join(wpath.mdEditorImgDir, `${lastRowid}${ext}`);
    await fs.copyFile(filePath, newPath);

    const changes = this.dbm.execute('UPDATE image SET save_path=? WHERE id=?', [
      newPath,
      lastRowid,
    ]);

    if (changes < 1) {
      throw new MdEditorImgOpError('DB update image path failed');
    }

    return [lastRowid, name];
  }

  /**
   * Get image by ID
   * @param id - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  async getImage(id: number): Promise<[string, Buffer, string]> {
    if (IMG_SAVE_TO_DB) {
      return await this.getImageFromDb(id);
    } else {
      return await this.getImageFromFile(id);
    }
  }

  /**
   * Get image from database
   * @param imgId - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  private async getImageFromDb(imgId: number): Promise<[string, Buffer, string]> {
    const result = this.dbm.get<[string, Buffer, string]>(
      'SELECT name, content, ext FROM image WHERE id=?',
      [imgId]
    );

    if (!result) {
      logger.error(`Get image from DB with id=${imgId} failed`);
      throw new MdEditorImgOpError(`Get image from DB with ${imgId} failed`);
    }

    return [result[0], result[1], this.getMimeType(result[2])];
  }

  /**
   * Get image from file
   * @param imgId - Image ID
   * @returns [imageName, imageContent, mimeType]
   */
  private async getImageFromFile(imgId: number): Promise<[string, Buffer, string]> {
    const result = this.dbm.get<[string, string | null, string]>(
      'SELECT name, save_path, ext FROM image WHERE id=?',
      [imgId]
    );

    if (!result) {
      logger.error(`Get image from DB with id=${imgId} failed`);
      throw new MdEditorImgOpError(`Get image from DB with ${imgId} failed`);
    }

    const [, savePath, ext] = result;

    if (!savePath) {
      throw new MdEditorImgOpError('Missing image save path');
    }

    try {
      await fs.access(savePath);
    } catch {
      logger.error(`Cannot find img ${savePath}`);
      throw new MdEditorImgOpError(`Cannot find image from '${savePath}'`);
    }

    const content = await fs.readFile(savePath);
    return [result[0], content, this.getMimeType(ext)];
  }

  /**
   * Get MIME type from file extension
   * @param ext - File extension
   * @returns MIME type
   */
  private getMimeType(ext: string): string {
    return MIME_MAP[ext.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Check if hkey is valid
   * @param content - Content to verify
   * @returns True if valid
   */
  async checkHkey(content: string): Promise<boolean> {
    return md5sum(content) === config.mdEditor.hkeyHash;
  }

  /**
   * Encrypt content using AES-256-GCM
   * @param content - Content to encrypt
   * @returns Encrypted content (base64)
   */
  private encryptContent(content: string): string {
    const key = Buffer.from(config.mdEditor.enKey, 'utf8');
    return encrypt(content, key);
  }

  /**
   * Decrypt content using AES-256-GCM
   * @param content - Encrypted content (base64)
   * @returns Decrypted content
   */
  private decryptContent(content: string): string {
    const key = Buffer.from(config.mdEditor.enKey, 'utf8');
    return decrypt(content, key);
  }
}
