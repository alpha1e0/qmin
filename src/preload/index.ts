import { contextBridge, ipcRenderer } from 'electron';

/**
 * API exposed to renderer process
 */

// IPC Channels
const IPC_CHANNELS = {
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

  // Indexing progress events
  IV_INDEX_PROGRESS: 'qmin:iv:index-progress',
  IV_ALL_INDEX_PROGRESS: 'qmin:iv:all-index-progress',
};

/**
 * Event listener storage for cleanup
 */
const listeners = new Map();

/**
 * Create the API object
 */
const api = {
  // Common APIs
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VERSION),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
  readConfig: () => ipcRenderer.invoke(IPC_CHANNELS.READ_CONFIG),

  // Markdown Editor APIs
  md: {
    getCategoryList: (space = 0) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_CATEGORY_LIST, space),
    getCategoryById: (id) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_CATEGORY_BY_ID, id),
    createCategory: (name, space = 0) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_CREATE_CATEGORY, name, space),
    updateCategory: (id, params) => ipcRenderer.invoke(IPC_CHANNELS.MD_UPDATE_CATEGORY, id, params),
    deleteCategory: (id) => ipcRenderer.invoke(IPC_CHANNELS.MD_DELETE_CATEGORY, id),
    getDocList: (cId) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_DOC_LIST, cId),
    getDocById: (id) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_DOC_BY_ID, id),
    createDoc: (cid, title, summary) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_CREATE_DOC, cid, title, summary),
    updateDoc: (id, params) => ipcRenderer.invoke(IPC_CHANNELS.MD_UPDATE_DOC, id, params),
    deleteDoc: (id) => ipcRenderer.invoke(IPC_CHANNELS.MD_DELETE_DOC, id),
    saveImage: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.MD_SAVE_IMAGE, filePath),
    getImage: (id) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_IMAGE, id),
    verifyHkey: (content) => ipcRenderer.invoke(IPC_CHANNELS.MD_VERIFY_HKEY, content),
  },

  // Image Viewer APIs
  iv: {
    getDirectories: () => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_DIRECTORIES),
    refreshDirectories: () => ipcRenderer.invoke(IPC_CHANNELS.IV_REFRESH_DIRECTORIES),
    getDirsToIndex: () => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_DIRS_TO_INDEX),
    hasIndexing: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_HAS_INDEXING, pathId),
    startIndex: (pathId, allIndexing = false) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_START_INDEX, pathId, allIndexing),
    getImages: (pathId, score = 0) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGES, pathId, score),
    getImage: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGE, pathId),
    getImageInfo: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGE_INFO, pathId),
    getMeta: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_META, pathId),
    updateScore: (pathId, score) => ipcRenderer.invoke(IPC_CHANNELS.IV_UPDATE_SCORE, pathId, score),
    classify: (pathId, classificationName) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_CLASSIFY, pathId, classificationName),
    isClassified: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_IS_CLASSIFIED, pathId),
    removeDir: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_REMOVE_DIR, pathId),
    removeIndex: (pathId) => ipcRenderer.invoke(IPC_CHANNELS.IV_REMOVE_INDEX, pathId),

    // Event listeners
    onIndexProgress: (callback) => {
      const wrapper = (event, data) => callback(data);
      listeners.set(`index-progress-${Date.now()}`, {
        channel: IPC_CHANNELS.IV_INDEX_PROGRESS,
        callback: wrapper,
      });
      ipcRenderer.on(IPC_CHANNELS.IV_INDEX_PROGRESS, wrapper);
    },
    onAllIndexProgress: (callback) => {
      const wrapper = (event, data) => callback(data);
      listeners.set(`all-index-progress-${Date.now()}`, {
        channel: IPC_CHANNELS.IV_ALL_INDEX_PROGRESS,
        callback: wrapper,
      });
      ipcRenderer.on(IPC_CHANNELS.IV_ALL_INDEX_PROGRESS, wrapper);
    },
    offIndexProgress: (callback) => {
      for (const [key, value] of listeners.entries()) {
        if (value.channel === IPC_CHANNELS.IV_INDEX_PROGRESS) {
          ipcRenderer.removeListener(IPC_CHANNELS.IV_INDEX_PROGRESS, value.callback);
          listeners.delete(key);
        }
      }
    },
    offAllIndexProgress: (callback) => {
      for (const [key, value] of listeners.entries()) {
        if (value.channel === IPC_CHANNELS.IV_ALL_INDEX_PROGRESS) {
          ipcRenderer.removeListener(IPC_CHANNELS.IV_ALL_INDEX_PROGRESS, value.callback);
          listeners.delete(key);
        }
      }
    },
  },

  // Legacy API for backward compatibility
  getServerAddr: () => ipcRenderer.invoke('get-server-addr'),
  getTips: (arg1) => ipcRenderer.invoke('get-tips', arg1),
};

/**
 * Expose the API to the renderer process
 */
contextBridge.exposeInMainWorld('electron', api);

// Also expose for convenience
contextBridge.exposeInMainWorld('mdEditor', api.md);
contextBridge.exposeInMainWorld('ivViewer', api.iv);
