import * as path from 'path';
import * as fs from 'fs/promises';

import { config, wpath } from '../common/context';
import {
  ImageBasePathNotExists,
  ImagePathNotExists,
  ImageCacheNotExists,
  ImageDirRemoveError,
  ImageClassifyError,
} from '../common/exceptions';
import {
  MIME_MAP,
  IV_CACHE_DIR,
  IV_OP_RESULT_DIR,
  IV_RESTORE_DIR,
  IV_OP_DB_FILE,
  IV_DIR_DB_FILE,
} from '../common/constants';
import { generateThumbnail, getImageSize } from '../utils/image';
import { isImage } from '../utils/path';
import { urlSafeB64Encode, urlSafeB64Decode } from '../utils/crypto';
import { generateRandomString, currentTimeObjToStr, getFileSizeMB } from '../utils/common';
import { IVDirectory, IVMeta, IVImage } from '../common/config';
import { createLogger } from '../utils/logger';

const logger = createLogger('IVViewerService');

/**
 * Directory structure item
 */
interface DirStructureItem {
  path_prefix: string;
  path_id: string;
  name: string;
  children: DirStructureItem[];
}

/**
 * Operation database structure
 */
interface OpDatabase {
  meta: IVMeta;
  images: ImageOpInfo[];
}

/**
 * Image operation info
 */
interface ImageOpInfo {
  path_id: string;
  name: string;
  score: number;
  cla: Record<string, string>;
}

/**
 * Directory database structure
 */
interface DirDatabase {
  id: string;
  dirs: DirStructureItem[];
}

/**
 * Image Viewer Service
 */
export class IVViewerService {
  private basePath: string;
  private dirDbPath: string;
  private dirDbTable = 'dirs';

  constructor() {
    const ivPath = config.imgViewer.ivPath;
    if (!ivPath || ivPath === 'dir_not_exists') {
      throw new ImageBasePathNotExists('Image base path not configured');
    }

    this.basePath = ivPath;
    this.dirDbPath = path.join(this.basePath, IV_DIR_DB_FILE);

    this.initDirStructureDb();
  }

  /**
   * Get directory structure recursively
   */
  async getDirStructure(): Promise<IVDirectory[]> {
    let result = await this.getDirStructureFromDb();

    if (!result || result.length === 0) {
      result = [];
      await this.buildDirStructure(this.basePath, '', result);
      await this.updateDirStructureToDb(result);
    }

    return result;
  }

  /**
   * Get directories that need indexing
   */
  async getDirsToIndex(): Promise<Array<{ name: string; path_id: string; progress: number }>> {
    const dirStructure = await this.getDirStructure();
    const toIndex = this.extractDirsFromStructure(dirStructure);

    const result: Array<{ name: string; path_id: string; progress: number }> = [];

    for (const item of toIndex) {
      if (!(await this.hasIndexing(item.path_id))) {
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Refresh directory structure from filesystem
   */
  async refreshDirStructure(): Promise<IVDirectory[]> {
    const result: IVDirectory[] = [];
    await this.buildDirStructure(this.basePath, '', result);
    await this.updateDirStructureToDb(result);
    return result;
  }

  /**
   * Check if directory has been indexed
   */
  async hasIndexing(pathId: string): Promise<boolean> {
    const imgPath = this.getRealPath(pathId);
    const indexPath = path.join(imgPath, IV_CACHE_DIR);
    try {
      await fs.access(indexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate thumbnails for a directory
   * @returns Async generator yielding progress percentage
   */
  async *indexing(pathId: string): AsyncGenerator<number> {
    const imgPath = this.getRealPath(pathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);

    // Create index directory
    await fs.mkdir(indexDir, { recursive: true, mode: 0o755 });

    // Get all images
    const entries = await fs.readdir(imgPath, { withFileTypes: true });
    const toParse: string[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(imgPath, entry.name);
      if (isImage(filePath)) {
        toParse.push(filePath);
      }
    }

    if (toParse.length === 0) {
      await this.saveOpInfo(pathId, []);
      yield 100;
      return;
    }

    const step = 100 / toParse.length;
    const tImages: string[] = [];

    for (let i = 0; i < toParse.length; i++) {
      const rawImg = toParse[i];
      const thumbnailImg = path.join(indexDir, path.basename(rawImg));

      try {
        await generateThumbnail(rawImg, thumbnailImg);
      } catch (err) {
        logger.warn(`Generate thumbnail for '${rawImg}' failed, using original file`, err);
        // Copy file if thumbnail generation fails
        await fs.copyFile(rawImg, thumbnailImg);
      }

      tImages.push(path.basename(rawImg));
      yield Math.trunc(i * step);
    }

    await this.saveOpInfo(pathId, tImages);
    yield 100;
  }

  /**
   * Remove index directory (thumbnails)
   */
  async removeIndexDir(imgDirPathId: string): Promise<void> {
    const imgDirPath = this.getRealPath(imgDirPathId);
    const indexPath = path.join(imgDirPath, IV_CACHE_DIR);

    try {
      await fs.access(indexPath);
      if (indexPath.startsWith(this.basePath)) {
        // Recursively delete
        await fs.rm(indexPath, { recursive: true, force: true });
      }
    } catch {
      // Directory doesn't exist, nothing to do
    }
  }

  /**
   * Get images with score filter
   */
  async getImages(imgDirPathId: string, score: number = 0): Promise<IVImage[]> {
    const realPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(realPath, IV_CACHE_DIR);

    // Check if directory is empty
    try {
      const entries = await fs.readdir(realPath);
      if (entries.length === 0) {
        return [];
      }
    } catch {
      return [];
    }

    // Check if index exists
    try {
      await fs.access(indexDir);
    } catch {
      throw new ImageCacheNotExists('Image cache not exists');
    }

    // Check thumbnail consistency
    const ok = await this.checkThumbnailConsistency(imgDirPathId);
    if (!ok) {
      await this.removeIndexDir(imgDirPathId);
      throw new ImageCacheNotExists('Image cache not exists');
    }

    return await this.getThumbImages(indexDir, score);
  }

  /**
   * Get image file
   */
  async getImage(pathId: string): Promise<{ content: Buffer; mime: string; name: string }> {
    const realPath = this.getRealPath(pathId);
    const ext = path.extname(realPath);
    const mime = MIME_MAP[ext] || 'image/jpeg';
    const name = path.basename(realPath);
    const content = await fs.readFile(realPath);

    return { content, mime, name };
  }

  /**
   * Get image info (dimensions, size)
   */
  async getImageInfo(pathId: string): Promise<{ width: number; height: number; size: number }> {
    const rawImgPath = this.getRawImgPathFromThumbnailPathId(pathId);
    const size = await getImageSize(rawImgPath);
    const sizeMb = getFileSizeMB(rawImgPath);

    return {
      width: size.width,
      height: size.height,
      size: sizeMb,
    };
  }

  /**
   * Get image directory metadata
   */
  async getMeta(pathId: string): Promise<IVMeta> {
    return await this.getMetaFromDb(pathId);
  }

  /**
   * Update image score
   */
  async updateScore(imgPathId: string, newScore: number): Promise<number> {
    const imgPath = this.getRealPath(imgPathId);
    const indexDir = path.dirname(imgPath);
    const opDb = await this.loadOpDb(indexDir);

    const imgIndex = opDb.images.findIndex((img) => img.path_id === imgPathId);
    if (imgIndex === -1) {
      throw new ImagePathNotExists(`Image path id ${imgPathId} not in op db`);
    }

    opDb.images[imgIndex].score = newScore;
    await this.saveOpDb(indexDir, opDb);

    return 1;
  }

  /**
   * Classify images by score
   */
  async classify(
    imgDirPathId: string,
    classificationName: string
  ): Promise<{ s2: number; s3: number; s4: number }> {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);
    const opResultPath = path.join(this.basePath, IV_OP_RESULT_DIR);

    // Create op result directory if needed
    await fs.mkdir(opResultPath, { recursive: true, mode: 0o755 });

    // Generate classification name
    let claNameSeed: string;
    if (!classificationName) {
      claNameSeed = await this.getClaName(imgDirPathId);
    } else {
      const seed = generateRandomString();
      claNameSeed = `${classificationName}_${seed}`;
    }
    await this.updateClaName(imgDirPathId, claNameSeed);

    // Get classification detail
    const claDetail = await this.getClaDetail(indexDir);

    // Classify files by score
    const count2 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 2, claDetail);
    const count3 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 3, claDetail);
    const count4 = await this.classifyFiles(indexDir, opResultPath, claNameSeed, 4, claDetail);

    // Undo classification for lower scores
    await this.undoClassify(opResultPath, claDetail);

    await this.updateClaDetail(imgDirPathId, claDetail);
    await this.updateClaTime(imgDirPathId);

    return { s2: count2, s3: count3, s4: count4 };
  }

  /**
   * Check if directory is classified
   */
  async isClassified(imgDirPathId: string): Promise<boolean> {
    const claName = await this.getClaName(imgDirPathId);
    return !!claName;
  }

  /**
   * Remove directory
   */
  async removeDir(imgDirPathId: string): Promise<void> {
    const restorePath = path.join(this.basePath, IV_RESTORE_DIR);
    await fs.mkdir(restorePath, { recursive: true, mode: 0o755 });

    const imgDir = this.getRealPath(imgDirPathId);

    try {
      await fs.access(imgDir);
      await fs.rename(imgDir, path.join(restorePath, path.basename(imgDir)));
    } catch (err) {
      throw new ImageDirRemoveError(`Failed to remove directory: ${err}`);
    }

    // Remove from directory structure
    const dirStructure = await this.getDirStructureFromDb();
    if (!dirStructure || dirStructure.length === 0) {
      return;
    }

    const newDirStructure = this.removeDirFromStructure(imgDirPathId, dirStructure);
    await this.updateDirStructureToDb(newDirStructure);
  }

  // ========================================================================
  // Private methods
  // ========================================================================

  private async initDirStructureDb(): Promise<void> {
    const dirDb: DirDatabase = {
      id: this.dirDbTable,
      dirs: [],
    };

    try {
      await fs.access(this.dirDbPath);
    } catch {
      await fs.writeFile(this.dirDbPath, JSON.stringify(dirDb, null, 2));
    }
  }

  private async loadDirDb(): Promise<DirDatabase> {
    const content = await fs.readFile(this.dirDbPath, 'utf-8');
    return JSON.parse(content);
  }

  private async saveDirDb(data: DirDatabase): Promise<void> {
    await fs.writeFile(this.dirDbPath, JSON.stringify(data, null, 2));
  }

  private async getDirStructureFromDb(): Promise<IVDirectory[]> {
    const db = await this.loadDirDb();
    // Convert DirStructureItem[] to IVDirectory[] using unknown as intermediate type
    return db.dirs as unknown as IVDirectory[];
  }

  private async updateDirStructureToDb(dirStructure: IVDirectory[]): Promise<void> {
    const db = await this.loadDirDb();
    // Convert IVDirectory[] to DirStructureItem[]
    db.dirs = dirStructure as any;
    await this.saveDirDb(db);
  }

  private async buildDirStructure(
    rootPath: string,
    pathPrefix: string,
    result: IVDirectory[]
  ): Promise<void> {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (
        entry.name === IV_CACHE_DIR ||
        entry.name === IV_OP_RESULT_DIR ||
        entry.name === IV_RESTORE_DIR
      ) {
        continue;
      }

      const subPath = pathPrefix ? path.join(pathPrefix, entry.name) : entry.name;
      const subPathId = this.encodePath(subPath);

      const children: IVDirectory[] = [];
      await this.buildDirStructure(path.join(rootPath, entry.name), subPath, children);

      result.push({
        path_id: subPathId,
        name: entry.name,
        create_time: '',
        children: children.length > 0 ? children : undefined,
      });
    }
  }

  private extractDirsFromStructure(
    dirStructure: IVDirectory[]
  ): Array<{ name: string; path_id: string; progress: number }> {
    const result: Array<{ name: string; path_id: string; progress: number }> = [];

    for (const dir of dirStructure) {
      result.push({
        name: dir.name,
        path_id: dir.path_id,
        progress: 0,
      });

      if (dir.children) {
        result.push(...this.extractDirsFromStructure(dir.children));
      }
    }

    return result;
  }

  private removeDirFromStructure(pathId: string, dirStructure: IVDirectory[]): IVDirectory[] {
    const result: IVDirectory[] = [];

    for (const item of dirStructure) {
      if (item.path_id === pathId) {
        continue;
      } else {
        const children = item.children ? this.removeDirFromStructure(pathId, item.children) : [];
        if (children.length > 0 || item.path_id !== pathId) {
          result.push({
            ...item,
            children: children.length > 0 ? children : undefined,
          });
        }
      }
    }

    return result;
  }

  private async checkThumbnailConsistency(imgDirPathId: string): Promise<boolean> {
    const imgDirPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgDirPath, IV_CACHE_DIR);

    const srcImages: string[] = [];
    const tImages: string[] = [];

    try {
      const srcEntries = await fs.readdir(imgDirPath, { withFileTypes: true });
      for (const entry of srcEntries) {
        if (entry.isFile() && entry.name in MIME_MAP) {
          srcImages.push(entry.name);
        }
      }

      const tEntries = await fs.readdir(indexDir, { withFileTypes: true });
      for (const entry of tEntries) {
        if (entry.isFile() && entry.name in MIME_MAP) {
          tImages.push(entry.name);
        }
      }
    } catch {
      return false;
    }

    if (srcImages.length !== tImages.length) {
      return false;
    }

    for (const s of srcImages) {
      if (!tImages.includes(s)) {
        return false;
      }
    }

    return true;
  }

  private async loadOpDb(indexDir: string): Promise<OpDatabase> {
    const opDbPath = path.join(indexDir, IV_OP_DB_FILE);
    const content = await fs.readFile(opDbPath, 'utf-8');
    return JSON.parse(content);
  }

  private async saveOpDb(indexDir: string, opDb: OpDatabase): Promise<void> {
    const opDbPath = path.join(indexDir, IV_OP_DB_FILE);
    await fs.writeFile(opDbPath, JSON.stringify(opDb, null, 2));
  }

  private async saveOpInfo(imgDirPathId: string, tImages: string[]): Promise<void> {
    const realPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(realPath, IV_CACHE_DIR);

    const meta: IVMeta = {
      name: path.basename(realPath),
      create_time: currentTimeObjToStr(),
      cla_name: '',
      cla_time: '',
    };

    // Decode the path_id to get relative path, then build image paths
    const relPath = this.decodePath(imgDirPathId);
    const images: ImageOpInfo[] = tImages.map((name) => ({
      path_id: this.encodePath(path.join(relPath, IV_CACHE_DIR, name)),
      name: name,
      score: 1,
      cla: {},
    }));

    await this.saveOpDb(indexDir, {
      meta,
      images,
    });
  }

  private async getThumbImages(indexDir: string, score: number): Promise<IVImage[]> {
    const opDb = await this.loadOpDb(indexDir);
    const filtered = opDb.images.filter((img) => img.score >= score);
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered.map((img) => ({
      path_id: img.path_id,
      name: img.name,
      score: img.score,
    }));
  }

  private async getMetaFromDb(imgDirPathId: string): Promise<IVMeta> {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    return opDb.meta;
  }

  private async getClaName(imgDirPathId: string): Promise<string> {
    const meta = await this.getMetaFromDb(imgDirPathId);
    return meta.cla_name || '';
  }

  private async updateClaName(imgDirPathId: string, claName: string): Promise<void> {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    opDb.meta.cla_name = claName;
    await this.saveOpDb(indexDir, opDb);
  }

  private async getClaTime(imgDirPathId: string): Promise<string> {
    const meta = await this.getMetaFromDb(imgDirPathId);
    return meta.cla_time || '';
  }

  private async updateClaTime(imgDirPathId: string): Promise<void> {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);
    opDb.meta.cla_time = currentTimeObjToStr();
    await this.saveOpDb(indexDir, opDb);
  }

  private async getClaDetail(indexDir: string): Promise<Record<string, Record<string, string>>> {
    const opDb = await this.loadOpDb(indexDir);
    const result: Record<string, Record<string, string>> = {};

    for (const img of opDb.images) {
      result[img.path_id] = img.cla;
    }

    return result;
  }

  private async updateClaDetail(
    imgDirPathId: string,
    claDetail: Record<string, Record<string, string>>
  ): Promise<void> {
    const imgPath = this.getRealPath(imgDirPathId);
    const indexDir = path.join(imgPath, IV_CACHE_DIR);
    const opDb = await this.loadOpDb(indexDir);

    for (const k of Object.keys(claDetail)) {
      const img = opDb.images.find((img) => img.path_id === k);
      if (img) {
        img.cla = claDetail[k];
      }
    }

    await this.saveOpDb(indexDir, opDb);
  }

  private async classifyFiles(
    indexDir: string,
    opResultPath: string,
    classificationName: string,
    score: number,
    claDetail: Record<string, Record<string, string>>
  ): Promise<number> {
    const tImgList = await this.getThumbImages(indexDir, score);
    const scoreResultPath = path.join(opResultPath, score.toString());

    await fs.mkdir(scoreResultPath, { recursive: true, mode: 0o755 });

    let count = 0;
    for (let idx = 0; idx < tImgList.length; idx++) {
      const tImg = tImgList[idx];
      const tImgPathId = tImg.path_id;
      const srcImgPath = this.getRawImgPathFromThumbnailPathId(tImgPathId);

      const ext = path.extname(srcImgPath);
      const dstImgName = `${classificationName}_${idx}${ext}`;
      const dstImgPath = path.join(scoreResultPath, dstImgName);

      if (!(tImgPathId in claDetail)) {
        claDetail[tImgPathId] = {};
      }

      if (!(score.toString() in claDetail[tImgPathId])) {
        await this.parseImage(srcImgPath, dstImgPath);
        count++;
      }

      claDetail[tImgPathId][score.toString()] = dstImgName;
    }

    return count;
  }

  private async undoClassify(
    opResultPath: string,
    claDetail: Record<string, Record<string, string>>
  ): Promise<void> {
    for (const [tImgPathId, detail] of Object.entries(claDetail)) {
      const score = await this.getImageScoreFromOpDb(tImgPathId); // Note: needs actual path to get score

      for (let s = score + 1; s <= 4; s++) {
        const sStr = s.toString();
        if (sStr in detail) {
          const dstImgName = detail[sStr];
          delete detail[sStr];

          const dstImgPath = path.join(opResultPath, sStr, dstImgName);
          try {
            await fs.unlink(dstImgPath);
          } catch {
            // File doesn't exist, continue
          }
        }
      }
    }
  }

  private async parseImage(srcImg: string, dstImg: string): Promise<void> {
    await fs.copyFile(srcImg, dstImg);
  }

  private async getImageScoreFromOpDb(pathId: string): Promise<number> {
    // Find the index directory
    const parts = pathId.split(path.sep);
    const cacheIndex = parts.indexOf(IV_CACHE_DIR);

    if (cacheIndex === -1) {
      return 1;
    }

    const indexDir = path.join(this.basePath, ...parts.slice(0, cacheIndex + 1));
    const opDb = await this.loadOpDb(indexDir);

    const img = opDb.images.find((img) => img.path_id === pathId);
    return img?.score || 1;
  }

  private getRealPath(pathId: string): string {
    const relPath = this.decodePath(pathId);
    return path.join(this.basePath, relPath);
  }

  private getRawImgPathFromThumbnailPathId(pathId: string): string {
    const pathIdRawPath = this.decodePath(pathId);
    const parts = pathIdRawPath.split(path.sep);

    const newParts: string[] = [];
    for (const p of parts) {
      if (p === IV_CACHE_DIR) continue;
      newParts.push(p);
    }

    const rPath = path.join(...newParts);
    return path.join(this.basePath, rPath);
  }

  private encodePath(rawPath: string | string[]): string {
    if (Array.isArray(rawPath)) {
      rawPath = rawPath.join(path.sep);
    }
    return urlSafeB64Encode(rawPath);
  }

  private decodePath(pathId: string): string {
    return urlSafeB64Decode(pathId);
  }

  /**
   * Public helper method to get the cache directory for a path_id
   */
  public getCacheDir(pathId: string): string {
    const realPath = this.getRealPath(pathId);
    return path.join(realPath, IV_CACHE_DIR);
  }
}
