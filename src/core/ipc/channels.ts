/**
 * IPC Channel Definitions
 * All IPC communication channels used in the application
 */

export const IPC_CHANNELS = {
  // Common channels
  GET_VERSION: 'qmin:get-version',
  GET_CONFIG: 'qmin:get-config',
  READ_CONFIG: 'qmin:read-config',

  // Markdown Editor channels
  MD_GET_CATEGORY_LIST: 'qmin:md:get-category-list',
  MD_GET_CATEGORY_BY_ID: 'qmin:md:get-category-by-id',
  MD_CREATE_CATEGORY: 'qmin:md:create-category',
  MD_UPDATE_CATEGORY: 'qmin:md:update-category',
  MD_DELETE_CATEGORY: 'qmin:md:delete-category',
  MD_GET_DOC_LIST: 'qmin:md:get-doc-list',
  MD_GET_DOC_BY_ID: 'qmin:md:get-doc-by-id',
  MD_CREATE_DOC: 'qmin:md:create-doc',
  MD_UPDATE_DOC: 'qmin:md:update-doc',
  MD_DELETE_DOC: 'qmin:md:delete-doc',
  MD_SAVE_IMAGE: 'qmin:md:save-image',
  MD_GET_IMAGE: 'qmin:md:get-image',
  MD_VERIFY_HKEY: 'qmin:md:verify-hkey',

  // Image Viewer channels
  IV_GET_DIRECTORIES: 'qmin:iv:get-directories',
  IV_REFRESH_DIRECTORIES: 'qmin:iv:refresh-directories',
  IV_GET_DIRS_TO_INDEX: 'qmin:iv:get-dirs-to-index',
  IV_HAS_INDEXING: 'qmin:iv:has-indexing',
  IV_START_INDEX: 'qmin:iv:start-index',
  IV_GET_IMAGES: 'qmin:iv:get-images',
  IV_GET_IMAGE: 'qmin:iv:get-image',
  IV_GET_IMAGE_INFO: 'qmin:iv:get-image-info',
  IV_GET_META: 'qmin:iv:get-meta',
  IV_UPDATE_SCORE: 'qmin:iv:update-score',
  IV_CLASSIFY: 'qmin:iv:classify',
  IV_IS_CLASSIFIED: 'qmin:iv:is-classified',
  IV_REMOVE_DIR: 'qmin:iv:remove-dir',
  IV_REMOVE_INDEX: 'qmin:iv:remove-index',

  // Indexing progress events (one-way communication from main to renderer)
  IV_INDEX_PROGRESS: 'qmin:iv:index-progress',
  IV_ALL_INDEX_PROGRESS: 'qmin:iv:all-index-progress',

  // Task Manager channels
  TM_GET_ALL_TASKS: 'qmin:tm:get-all-tasks',
  TM_GET_TASK: 'qmin:tm:get-task',
  TM_CREATE_TASK: 'qmin:tm:create-task',
  TM_REMOVE_TASK: 'qmin:tm:remove-task',

  // Roleplay channels
  RP_LIST_SCENARIOS: 'qmin:rp:list-scenarios',
  RP_GET_SCENARIO: 'qmin:rp:get-scenario',
  RP_CREATE_SCENARIO: 'qmin:rp:create-scenario',
  RP_UPDATE_SCENARIO: 'qmin:rp:update-scenario',
  RP_DELETE_SCENARIO: 'qmin:rp:delete-scenario',
  RP_LIST_HISTORIES: 'qmin:rp:list-histories',
  RP_GET_HISTORY: 'qmin:rp:get-history',
  RP_CREATE_HISTORY: 'qmin:rp:create-history',
  RP_SAVE_HISTORY: 'qmin:rp:save-history',
  RP_DELETE_HISTORY: 'qmin:rp:delete-history',
  RP_LIST_LLM_CONFIGS: 'qmin:rp:list-llm-configs',
  RP_GET_LLM_CONFIG: 'qmin:rp:get-llm-config',
  RP_SAVE_LLM_CONFIG: 'qmin:rp:save-llm-config',

  // Image Generation channels
  IMG_GENERATE: 'qmin:img:generate',
  IMG_GENERATE_QWEN: 'qmin:img:generate-qwen',
  IMG_LIST_HISTORY: 'qmin:img:list-history',
  IMG_GET_HISTORY: 'qmin:img:get-history',
  IMG_DELETE_HISTORY: 'qmin:img:delete-history',
  IMG_LIST_LLM_CONFIGS: 'qmin:img:list-llm-configs',
  IMG_GET_LLM_CONFIG: 'qmin:img:get-llm-config',
  IMG_SAVE_LLM_CONFIG: 'qmin:img:save-llm-config',
} as const;

/**
 * Type for IPC channel names
 */
export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
