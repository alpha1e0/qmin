import { ipcMain } from 'electron';
import { RoleplayScenarioService } from '@/main/core/services/roleplay';
import { RoleplayHistoryService } from '@/main/core/services/roleplay';
import { RoleplayConfigService } from '@/main/core/services/roleplay';
import { RoleplayChatService } from '@/main/core/services/roleplay';
import { IPC_CHANNELS } from '../channels';
import { createLogger } from '@/main/core/utils/logger';

const logger = createLogger('RoleplayHandler');

// Store active chat sessions (scenario + history -> chat service)
const activeChats = new Map<string, RoleplayChatService>();

// Lazy-loaded service instances
let scenarioService: RoleplayScenarioService | null = null;
let historyService: RoleplayHistoryService | null = null;
let configService: RoleplayConfigService | null = null;

/**
 * Get chat session key
 * @param scenarioName - Scenario name
 * @param historyName - History name
 * @returns Session key
 */
function getChatKey(scenarioName: string, historyName: string): string {
  return `${scenarioName}:${historyName}`;
}

/**
 * Get or create scenario service
 */
function getScenarioService(): RoleplayScenarioService {
  if (!scenarioService) {
    scenarioService = new RoleplayScenarioService();
  }
  return scenarioService;
}

/**
 * Get or create history service
 */
function getHistoryService(): RoleplayHistoryService {
  if (!historyService) {
    historyService = new RoleplayHistoryService();
  }
  return historyService;
}

/**
 * Get or create config service
 */
function getConfigService(): RoleplayConfigService {
  if (!configService) {
    configService = new RoleplayConfigService();
  }
  return configService;
}

/**
 * Register all roleplay IPC handlers
 */
export function registerRoleplayHandlers(): void {
  // Services are now lazily loaded via get*Service() functions

  // ========== Scenario Management ==========

  ipcMain.handle(IPC_CHANNELS.RP_LIST_SCENARIOS, async () => {
    logger.debug('List scenarios');
    try {
      return await getScenarioService().listScenarios();
    } catch (err) {
      logger.error('Failed to list scenarios', err);
      throw err;
    }
  });

  ipcMain.handle(IPC_CHANNELS.RP_GET_SCENARIO, async (_event, name: string) => {
    logger.debug(`Get scenario ${name}`);
    try {
      return await getScenarioService().getScenario(name);
    } catch (err) {
      logger.error(`Failed to get scenario ${name}`, err);
      throw err;
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.RP_CREATE_SCENARIO,
    async (_event, name: string, data: any) => {
      logger.info(`Create scenario ${name}`);
      try {
        await getScenarioService().createScenario(name, data);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to create scenario ${name}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.RP_UPDATE_SCENARIO,
    async (_event, name: string, data: any) => {
      logger.info(`Update scenario ${name}`);
      try {
        await getScenarioService().updateScenario(name, data);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to update scenario ${name}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.RP_DELETE_SCENARIO, async (_event, name: string) => {
    logger.info(`Delete scenario ${name}`);
    try {
      await getScenarioService().deleteScenario(name);
      return { success: true };
    } catch (err) {
      logger.error(`Failed to delete scenario ${name}`, err);
      throw err;
    }
  });

  // ========== History Management ==========

  ipcMain.handle(
    IPC_CHANNELS.RP_LIST_HISTORIES,
    async (_event, scenarioName: string) => {
      try {
        return await getHistoryService().listHistories(scenarioName);
      } catch (err) {
        logger.error(`Failed to list histories for ${scenarioName}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.RP_GET_HISTORY,
    async (_event, scenarioName: string, historyName: string) => {
      try {
        return await getHistoryService().getHistory(scenarioName, historyName);
      } catch (err) {
        logger.error(`Failed to get history ${historyName}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.RP_CREATE_HISTORY,
    async (_event, scenarioName: string, historyName: string, data: any) => {
      try {
        await getHistoryService().createHistory(scenarioName, historyName, data);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to create history ${historyName}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.RP_SAVE_HISTORY,
    async (_event, scenarioName: string, historyName: string, data: any) => {
      try {
        await getHistoryService().saveHistory(scenarioName, historyName, data);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to save history ${historyName}`, err);
        throw err;
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.RP_DELETE_HISTORY,
    async (_event, scenarioName: string, historyName: string) => {
      try {
        await getHistoryService().deleteHistory(scenarioName, historyName);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to delete history ${historyName}`, err);
        throw err;
      }
    }
  );

  // ========== LLM Config Management ==========

  ipcMain.handle(IPC_CHANNELS.RP_LIST_LLM_CONFIGS, async () => {
    try {
      return await getConfigService().listConfigs();
    } catch (err) {
      logger.error('Failed to list LLM configs', err);
      throw err;
    }
  });

  ipcMain.handle(IPC_CHANNELS.RP_GET_LLM_CONFIG, async (_event, name: string) => {
    try {
      return await getConfigService().getConfig(name);
    } catch (err) {
      logger.error(`Failed to get LLM config ${name}`, err);
      throw err;
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.RP_SAVE_LLM_CONFIG,
    async (_event, name: string, data: any) => {
      try {
        await getConfigService().saveConfig(name, data);
        return { success: true };
      } catch (err) {
        logger.error(`Failed to save LLM config ${name}`, err);
        throw err;
      }
    }
  );

  // ========== Chat Session Management ==========

  // Initialize chat session
  ipcMain.handle(
    'qmin:rp:init-chat',
    async (_event, scenarioName: string, historyName: string, configName?: string) => {
      try {
        // Get scenario
        const scenario = await getScenarioService().getScenario(scenarioName);

        // Get LLM config
        const llmConfig = configName
          ? await getConfigService().getConfig(configName)
          : await getConfigService().getDefaultConfig();

        // Create chat service
        const chatService = new RoleplayChatService(llmConfig, scenario);

        // Load history if exists
        const historyExists = await getHistoryService().historyExists(
          scenarioName,
          historyName
        );
        if (historyExists) {
          const history = await getHistoryService().getHistory(
            scenarioName,
            historyName
          );
          chatService.loadHistory(history.messages);
        }

        // Store session
        const key = getChatKey(scenarioName, historyName);
        activeChats.set(key, chatService);

        return { success: true };
      } catch (err) {
        logger.error('Failed to initialize chat', err);
        throw err;
      }
    }
  );

  // Send chat message (streaming response via events)
  ipcMain.handle(
    'qmin:rp:chat-message',
    async (event, scenarioName: string, historyName: string, message: string) => {
      logger.info(`Chat message: ${scenarioName}/${historyName}`);
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);

        if (!chatService) {
          throw new Error('Chat session not initialized');
        }

        // Stream response via events
        for await (const chunk of chatService.chat(message)) {
          event.sender.send('qmin:rp:chat-chunk', { chunk });
        }

        // Send completion event
        event.sender.send('qmin:rp:chat-complete', {
          messages: chatService.getMessages(),
        });

        // Auto-save history
        const historyData = chatService.getHistoryData();
        await getHistoryService().saveHistory(scenarioName, historyName, historyData);

        return { success: true };
      } catch (err) {
        logger.error('Chat failed', err);
        event.sender.send('qmin:rp:chat-error', { error: (err as Error).message });
        throw err;
      }
    }
  );

  // Regenerate last response
  ipcMain.handle(
    'qmin:rp:regenerate',
    async (event, scenarioName: string, historyName: string) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);

        if (!chatService) {
          throw new Error('Chat session not initialized');
        }

        // Stream response via events
        for await (const chunk of chatService.regenerate()) {
          event.sender.send('qmin:rp:chat-chunk', { chunk });
        }

        // Send completion event
        event.sender.send('qmin:rp:chat-complete', {
          messages: chatService.getMessages(),
        });

        // Auto-save history
        const historyData = chatService.getHistoryData();
        await getHistoryService().saveHistory(scenarioName, historyName, historyData);

        return { success: true };
      } catch (err) {
        logger.error('Regenerate failed', err);
        event.sender.send('qmin:rp:chat-error', { error: (err as Error).message });
        throw err;
      }
    }
  );

  // Pop last message
  ipcMain.handle(
    'qmin:rp:pop-message',
    async (_event, scenarioName: string, historyName: string) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);

        if (!chatService) {
          throw new Error('Chat session not initialized');
        }

        const popped = chatService.popMessage();

        // Auto-save history
        if (popped) {
          const historyData = chatService.getHistoryData();
          await getHistoryService().saveHistory(scenarioName, historyName, historyData);
        }

        return { success: true, popped };
      } catch (err) {
        logger.error('Pop message failed', err);
        throw err;
      }
    }
  );

  // Get current messages
  ipcMain.handle(
    'qmin:rp:get-messages',
    async (_event, scenarioName: string, historyName: string) => {
      try {
        const key = getChatKey(scenarioName, historyName);
        const chatService = activeChats.get(key);

        if (!chatService) {
          throw new Error('Chat session not initialized');
        }

        return chatService.getMessages();
      } catch (err) {
        logger.error('Failed to get messages', err);
        throw err;
      }
    }
  );

  logger.info('Roleplay IPC handlers registered');
}
