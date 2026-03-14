import { ipcMain, webContents } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../channels';
import { IVViewerService } from '@/main/core/services/iv-viewer';
import { createLogger } from '@/main/core/utils/logger';

const logger = createLogger('IVViewerHandler');

// Lazy-loaded service instance
let ivViewerService: IVViewerService | null = null;

/**
 * Get or create IVViewerService instance
 */
function getService(): IVViewerService {
  if (!ivViewerService) {
    ivViewerService = new IVViewerService();
  }
  return ivViewerService;
}

/**
 * Track ongoing indexing tasks for progress reporting
 */
interface IndexingTask {
  pathId: string;
  events: any[];
  allIndexing: boolean;
  progress: number;
}

const indexingTasks: Map<string, IndexingTask> = new Map();

/**
 * Register Image Viewer IPC handlers
 */
export function registerIvViewerHandlers(): void {
  // Get directory structure
  ipcMain.handle(IPC_CHANNELS.IV_GET_DIRECTORIES, async () => {
    logger.debug('Get directory structure');
    return await getService().getDirStructure();
  });

  // Refresh directory structure
  ipcMain.handle(IPC_CHANNELS.IV_REFRESH_DIRECTORIES, async () => {
    logger.info('Refresh directory structure');
    return await getService().refreshDirStructure();
  });

  // Get directories that need indexing
  ipcMain.handle(IPC_CHANNELS.IV_GET_DIRS_TO_INDEX, async () => {
    logger.debug('Get directories to index');
    return await getService().getDirsToIndex();
  });

  // Check if directory is indexed
  ipcMain.handle(IPC_CHANNELS.IV_HAS_INDEXING, async (event, pathId: string) => {
    logger.debug(`Check if directory indexed: ${pathId}`);
    return await getService().hasIndexing(pathId);
  });

  // Start indexing a directory
  ipcMain.handle(
    IPC_CHANNELS.IV_START_INDEX,
    async (event, pathId: string, allIndexing = false) => {
      logger.info(`Start indexing ${pathId} (all: ${allIndexing})`);
      const taskId = allIndexing ? `all-${pathId}` : pathId;

      // Check if already indexing
      if (indexingTasks.has(taskId)) {
        logger.warn(`Already indexing ${taskId}`);
        return { success: false, message: 'Already indexing' };
      }

      // Create task entry
      indexingTasks.set(taskId, {
        pathId,
        events: [],
        allIndexing,
        progress: 0,
      });

      // Start background indexing
      startIndexing(getService(), taskId, pathId, allIndexing);

      return { success: true };
    }
  );

  // Get images from a directory
  ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGES, async (event, pathId: string, score: number = 0) => {
    logger.debug(`Get images from ${pathId} with score >= ${score}`);
    const images = await getService().getImages(pathId, score);

    // Add thumbnail paths to each image
    const idxCacheDir = path.join(getService().getCacheDir(pathId));

    return images.map((img) => ({
      ...img,
      thumbnail_path: `file://${path.join(idxCacheDir, img.name)}`,
    }));
  });

  // Get a single image
  ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGE, async (event, pathId: string) => {
    logger.debug(`Get image ${pathId}`);
    return await getService().getImage(pathId);
  });

  // Get image info
  ipcMain.handle(IPC_CHANNELS.IV_GET_IMAGE_INFO, async (event, pathId: string) => {
    logger.debug(`Get image info for ${pathId}`);
    return await getService().getImageInfo(pathId);
  });

  // Get directory metadata
  ipcMain.handle(IPC_CHANNELS.IV_GET_META, async (event, pathId: string) => {
    logger.debug(`Get metadata for ${pathId}`);
    return await getService().getMeta(pathId);
  });

  // Update image score
  ipcMain.handle(IPC_CHANNELS.IV_UPDATE_SCORE, async (event, pathId: string, score: number) => {
    logger.info(`Update score for ${pathId} to ${score}`);
    await getService().updateScore(pathId, score);
    return { success: true };
  });

  // Classify images
  ipcMain.handle(
    IPC_CHANNELS.IV_CLASSIFY,
    async (event, pathId: string, classificationName: string) => {
      logger.info(`Classify ${pathId} as '${classificationName}'`);
      return await getService().classify(pathId, classificationName);
    }
  );

  // Check if directory is classified
  ipcMain.handle(IPC_CHANNELS.IV_IS_CLASSIFIED, async (event, pathId: string) => {
    logger.debug(`Check if ${pathId} is classified`);
    return await getService().isClassified(pathId);
  });

  // Remove a directory
  ipcMain.handle(IPC_CHANNELS.IV_REMOVE_DIR, async (event, pathId: string) => {
    logger.info(`Remove directory ${pathId}`);
    await getService().removeDir(pathId);
    return { success: true };
  });

  // Remove index (thumbnails)
  ipcMain.handle(IPC_CHANNELS.IV_REMOVE_INDEX, async (event, pathId: string) => {
    logger.info(`Remove index for ${pathId}`);
    await getService().removeIndexDir(pathId);
    return { success: true };
  });
}

/**
 * Start background indexing task
 */
async function startIndexing(
  ivViewerService: IVViewerService,
  taskId: string,
  pathId: string,
  allIndexing: boolean
): Promise<void> {
  const task = indexingTasks.get(taskId);

  if (!task) return;

  try {
    // Index a single directory
    for await (const progress of ivViewerService.indexing(pathId)) {
      task.progress = progress;

      // Send progress update to all renderer windows
      webContents.getAllWebContents().forEach((wc) => {
        if (!wc.isDestroyed()) {
          wc.send(IPC_CHANNELS.IV_INDEX_PROGRESS, {
            pathId,
            progress,
          });
        }
      });
    }

    // Send completion
    webContents.getAllWebContents().forEach((wc) => {
      if (!wc.isDestroyed()) {
        wc.send(IPC_CHANNELS.IV_INDEX_PROGRESS, {
          pathId,
          progress: 100,
        });
      }
    });
  } catch (error) {
    logger.error(`Indexing failed for ${pathId}`, error);
  } finally {
    indexingTasks.delete(taskId);
  }
}
