/**
 * Image Generation IPC Handlers
 * IPC handlers for AI image generation functionality
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { ImgGenService } from '@/core/services/img-gen';
import { ImageGenRequest, QwenImageGenRequest, LLMConfig } from '@/core/models';
import { createLogger } from '@/core/utils/logger';

const logger = createLogger('ImgGenHandler');

// Lazy-loaded service instance
let imgGenService: ImgGenService | null = null;

/**
 * Get or create ImgGenService instance
 */
function getService(): ImgGenService {
  if (!imgGenService) {
    imgGenService = new ImgGenService();
  }
  return imgGenService;
}

/**
 * Register Image Generation IPC handlers
 */
export function registerImgGenHandlers(): void {
  // Services are now lazily loaded via getService() function

  // Generate image using standard models
  ipcMain.handle(IPC_CHANNELS.IMG_GENERATE, async (event, request: ImageGenRequest) => {
    try {
      logger.info('IMG_GENERATE called', { prompt: request.prompt.substring(0, 50) });
      const result = await getService().generateImage(request);
      return result;
    } catch (err) {
      logger.error('IMG_GENERATE error', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // Generate image using Qwen model
  ipcMain.handle(IPC_CHANNELS.IMG_GENERATE_QWEN, async (event, request: QwenImageGenRequest) => {
    try {
      logger.info('IMG_GENERATE_QWEN called', { prompt: request.prompt.substring(0, 50) });
      const result = await getService().generateImageQwen(request);
      return result;
    } catch (err) {
      logger.error('IMG_GENERATE_QWEN error', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // List generation history
  ipcMain.handle(IPC_CHANNELS.IMG_LIST_HISTORY, async () => {
    try {
      const history = await getService().listHistory();
      return history;
    } catch (err) {
      logger.error('IMG_LIST_HISTORY error', err);
      return [];
    }
  });

  // Get history record details
  ipcMain.handle(IPC_CHANNELS.IMG_GET_HISTORY, async (event, recordId: string) => {
    try {
      const record = await getService().getHistory(recordId);
      return record;
    } catch (err) {
      logger.error('IMG_GET_HISTORY error', err);
      return null;
    }
  });

  // Delete history record
  ipcMain.handle(IPC_CHANNELS.IMG_DELETE_HISTORY, async (event, recordId: string) => {
    try {
      await getService().deleteHistory(recordId);
      return { success: true };
    } catch (err) {
      logger.error('IMG_DELETE_HISTORY error', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // List LLM configs
  ipcMain.handle(IPC_CHANNELS.IMG_LIST_LLM_CONFIGS, async () => {
    try {
      const configs = await getService().listLlmConfigs();
      return configs;
    } catch (err) {
      logger.error('IMG_LIST_LLM_CONFIGS error', err);
      return [];
    }
  });

  // Get LLM config
  ipcMain.handle(IPC_CHANNELS.IMG_GET_LLM_CONFIG, async (event, name: string) => {
    try {
      const config = await getService().getLlmConfig(name);
      return config;
    } catch (err) {
      logger.error('IMG_GET_LLM_CONFIG error', err);
      return null;
    }
  });

  // Save LLM config
  ipcMain.handle(
    IPC_CHANNELS.IMG_SAVE_LLM_CONFIG,
    async (event, name: string, config: LLMConfig) => {
      try {
        await getService().saveLlmConfig(name, config);
        return { success: true };
      } catch (err) {
        logger.error('IMG_SAVE_LLM_CONFIG error', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  );

  logger.info('Image Generation IPC handlers registered');
}
