import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { MdEditorService } from '@/main/core/services/md-editor';
import { createLogger } from '@/main/core/utils/logger';

const logger = createLogger('IPC:MdEditor');

// Lazy-loaded service instance
let mdEditorService: MdEditorService | null = null;

/**
 * Get or create service instance
 */
function getService(): MdEditorService {
  if (!mdEditorService) {
    mdEditorService = new MdEditorService();
  }
  return mdEditorService;
}

/**
 * Register Markdown Editor IPC handlers
 */
export function registerMdEditorHandlers(): void {
  // Get category list for a space
  ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_LIST, async (event, space: number = 0) => {
    logger.debug(`Get category list for space ${space}`);
    return await getService().getCategoryList(space);
  });

  // Get category by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_BY_ID, async (event, id: number) => {
    logger.debug(`Get category by ID ${id}`);
    return await getService().getCategoryById(id);
  });

  // Create a new category
  ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_CATEGORY,
    async (event, name: string, space: number = 0) => {
      logger.info(`Create category '${name}' in space ${space}`);
      return await getService().createCategory(name, space);
    }
  );

  // Update a category
  ipcMain.handle(IPC_CHANNELS.MD_UPDATE_CATEGORY, async (event, id: number, params: any) => {
    logger.info(`Update category ${id}`);
    await getService().updateCategory(id, params);
    return { success: true };
  });

  // Delete a category
  ipcMain.handle(IPC_CHANNELS.MD_DELETE_CATEGORY, async (event, id: number) => {
    logger.info(`Delete category ${id}`);
    await getService().deleteCategory(id);
    return { success: true };
  });

  // Get document list for a category
  ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_LIST, async (event, cId: number) => {
    logger.debug(`Get document list for category ${cId}`);
    return await getService().getDocList(cId);
  });

  // Get document by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_BY_ID, async (event, id: number) => {
    logger.debug(`Get document by ID ${id}`);
    return await getService().getDocById(id);
  });

  // Create a new document
  ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_DOC,
    async (event, cid: number, title: string, summary: string) => {
      logger.info(`Create document '${title}' in category ${cid}`);
      return await getService().createDoc(cid, title, summary);
    }
  );

  // Update a document
  ipcMain.handle(IPC_CHANNELS.MD_UPDATE_DOC, async (event, id: number, params: any) => {
    logger.info(`Update document ${id}`);
    await getService().updateDoc(id, params);
    return { success: true };
  });

  // Delete a document
  ipcMain.handle(IPC_CHANNELS.MD_DELETE_DOC, async (event, id: number) => {
    logger.info(`Delete document ${id}`);
    await getService().deleteDoc(id);
    return { success: true };
  });

  // Save an image
  ipcMain.handle(IPC_CHANNELS.MD_SAVE_IMAGE, async (event, filePath: string) => {
    logger.info(`Save image from ${filePath}`);
    return await getService().saveImage(filePath);
  });

  // Get an image by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_IMAGE, async (event, id: number) => {
    logger.debug(`Get image by ID ${id}`);
    return await getService().getImage(id);
  });

  // Verify hkey
  ipcMain.handle(IPC_CHANNELS.MD_VERIFY_HKEY, async (event, content: string) => {
    logger.debug('Verify hkey');
    return await getService().checkHkey(content);
  });
}
