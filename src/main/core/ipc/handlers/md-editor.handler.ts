import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { MdEditorService } from '../../services/md-editor.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('IPC:MdEditor');

/**
 * Register Markdown Editor IPC handlers
 */
export function registerMdEditorHandlers(): void {
  const mdEditorService = new MdEditorService();

  // Get category list for a space
  ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_LIST, async (event, space: number = 0) => {
    logger.debug(`Get category list for space ${space}`);
    return await mdEditorService.getCategoryList(space);
  });

  // Get category by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_CATEGORY_BY_ID, async (event, id: number) => {
    logger.debug(`Get category by ID ${id}`);
    return await mdEditorService.getCategoryById(id);
  });

  // Create a new category
  ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_CATEGORY,
    async (event, name: string, space: number = 0) => {
      logger.info(`Create category '${name}' in space ${space}`);
      return await mdEditorService.createCategory(name, space);
    }
  );

  // Update a category
  ipcMain.handle(IPC_CHANNELS.MD_UPDATE_CATEGORY, async (event, id: number, params: any) => {
    logger.info(`Update category ${id}`);
    await mdEditorService.updateCategory(id, params);
    return { success: true };
  });

  // Delete a category
  ipcMain.handle(IPC_CHANNELS.MD_DELETE_CATEGORY, async (event, id: number) => {
    logger.info(`Delete category ${id}`);
    await mdEditorService.deleteCategory(id);
    return { success: true };
  });

  // Get document list for a category
  ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_LIST, async (event, cId: number) => {
    logger.debug(`Get document list for category ${cId}`);
    return await mdEditorService.getDocList(cId);
  });

  // Get document by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_DOC_BY_ID, async (event, id: number) => {
    logger.debug(`Get document by ID ${id}`);
    return await mdEditorService.getDocById(id);
  });

  // Create a new document
  ipcMain.handle(
    IPC_CHANNELS.MD_CREATE_DOC,
    async (event, cid: number, title: string, summary: string) => {
      logger.info(`Create document '${title}' in category ${cid}`);
      return await mdEditorService.createDoc(cid, title, summary);
    }
  );

  // Update a document
  ipcMain.handle(IPC_CHANNELS.MD_UPDATE_DOC, async (event, id: number, params: any) => {
    logger.info(`Update document ${id}`);
    await mdEditorService.updateDoc(id, params);
    return { success: true };
  });

  // Delete a document
  ipcMain.handle(IPC_CHANNELS.MD_DELETE_DOC, async (event, id: number) => {
    logger.info(`Delete document ${id}`);
    await mdEditorService.deleteDoc(id);
    return { success: true };
  });

  // Save an image
  ipcMain.handle(IPC_CHANNELS.MD_SAVE_IMAGE, async (event, filePath: string) => {
    logger.info(`Save image from ${filePath}`);
    return await mdEditorService.saveImage(filePath);
  });

  // Get an image by ID
  ipcMain.handle(IPC_CHANNELS.MD_GET_IMAGE, async (event, id: number) => {
    logger.debug(`Get image by ID ${id}`);
    return await mdEditorService.getImage(id);
  });

  // Verify hkey
  ipcMain.handle(IPC_CHANNELS.MD_VERIFY_HKEY, async (event, content: string) => {
    logger.debug('Verify hkey');
    return await mdEditorService.checkHkey(content);
  });
}
