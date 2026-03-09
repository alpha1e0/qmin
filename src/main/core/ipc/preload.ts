/**
 * Preload script for Qmin application
 * Exposes IPC APIs to the renderer process
 */
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './channels';

/**
 * API exposed to renderer process
 */
export interface ElectronAPI {
  // Common APIs
  getVersion(): Promise<string>;
  getConfig(): Promise<any>;
  readConfig(): Promise<any>;

  // Markdown Editor APIs
  md: {
    getCategoryList(space: number): Promise<any>;
    getCategoryById(id: number): Promise<any>;
    createCategory(name: string, space?: number): Promise<number>;
    updateCategory(id: number, params: any): Promise<void>;
    deleteCategory(id: number): Promise<void>;
    getDocList(cId: number): Promise<any>;
    getDocById(id: number): Promise<any>;
    createDoc(cid: number, title: string, summary: string): Promise<number>;
    updateDoc(id: number, params: any): Promise<void>;
    deleteDoc(id: number): Promise<void>;
    saveImage(filePath: string): Promise<[number, string]>;
    getImage(id: number): Promise<[string, Buffer, string]>;
    verifyHkey(content: string): Promise<boolean>;
  };

  // Image Viewer APIs
  iv: {
    getDirectories(): Promise<any>;
    refreshDirectories(): Promise<any>;
    getDirsToIndex(): Promise<any>;
    hasIndexing(pathId: string): Promise<boolean>;
    startIndex(pathId: string, allIndexing?: boolean): Promise<any>;
    getImages(pathId: string, score?: number): Promise<any>;
    getImage(pathId: string): Promise<any>;
    getImageInfo(pathId: string): Promise<any>;
    getMeta(pathId: string): Promise<any>;
    updateScore(pathId: string, score: number): Promise<void>;
    classify(pathId: string, classificationName: string): Promise<any>;
    isClassified(pathId: string): Promise<boolean>;
    removeDir(pathId: string): Promise<void>;
    removeIndex(pathId: string): Promise<void>;

    // Event listeners for progress updates
    onIndexProgress(callback: (data: { path_id: string; progress: number }) => void): void;
    onAllIndexProgress(callback: (data: any) => void): void;
    offIndexProgress(callback: (data: any) => void): void;
    offAllIndexProgress(callback: (data: any) => void): void;
  };

  // Image Generation APIs
  img: {
    generate(request: any): Promise<any>;
    generateQwen(request: any): Promise<any>;
    listHistory(): Promise<any>;
    getHistory(recordId: string): Promise<any>;
    deleteHistory(recordId: string): Promise<any>;
    listLlmConfigs(): Promise<string[]>;
    getLlmConfig(name: string): Promise<any>;
    saveLlmConfig(name: string, config: any): Promise<any>;
  };

  // Legacy API (for backward compatibility)
  electron: {
    chrome(): string;
    getTips(arg1: any): Promise<any>;
    ipcRendererOn(eventName: string, callback: any): void;
    ipcRendererOff(eventName: string, callback: any): void;
  };
}

/**
 * Create the API object
 */
const api: ElectronAPI = {
  // Common APIs
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VERSION),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
  readConfig: () => ipcRenderer.invoke(IPC_CHANNELS.READ_CONFIG),

  // Markdown Editor APIs
  md: {
    getCategoryList: (space: number = 0) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_GET_CATEGORY_LIST, space),
    getCategoryById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_CATEGORY_BY_ID, id),
    createCategory: (name: string, space: number = 0) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_CREATE_CATEGORY, name, space),
    updateCategory: (id: number, params: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_UPDATE_CATEGORY, id, params),
    deleteCategory: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_DELETE_CATEGORY, id),
    getDocList: (cId: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_DOC_LIST, cId),
    getDocById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_DOC_BY_ID, id),
    createDoc: (cid: number, title: string, summary: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_CREATE_DOC, cid, title, summary),
    updateDoc: (id: number, params: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.MD_UPDATE_DOC, id, params),
    deleteDoc: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_DELETE_DOC, id),
    saveImage: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.MD_SAVE_IMAGE, filePath),
    getImage: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.MD_GET_IMAGE, id),
    verifyHkey: (content: string) => ipcRenderer.invoke(IPC_CHANNELS.MD_VERIFY_HKEY, content),
  },

  // Image Viewer APIs
  iv: {
    getDirectories: () => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_DIRECTORIES),
    refreshDirectories: () => ipcRenderer.invoke(IPC_CHANNELS.IV_REFRESH_DIRECTORIES),
    getDirsToIndex: () => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_DIRS_TO_INDEX),
    hasIndexing: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_HAS_INDEXING, pathId),
    startIndex: (pathId: string, allIndexing = false) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_START_INDEX, pathId, allIndexing),
    getImages: (pathId: string, score = 0) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGES, pathId, score),
    getImage: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGE, pathId),
    getImageInfo: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_IMAGE_INFO, pathId),
    getMeta: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_GET_META, pathId),
    updateScore: (pathId: string, score: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_UPDATE_SCORE, pathId, score),
    classify: (pathId: string, classificationName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.IV_CLASSIFY, pathId, classificationName),
    isClassified: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_IS_CLASSIFIED, pathId),
    removeDir: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_REMOVE_DIR, pathId),
    removeIndex: (pathId: string) => ipcRenderer.invoke(IPC_CHANNELS.IV_REMOVE_INDEX, pathId),

    // Event listeners
    onIndexProgress: (callback: (data: any) => void) =>
      ipcRenderer.on(IPC_CHANNELS.IV_INDEX_PROGRESS, (event, data) => callback(data)),
    onAllIndexProgress: (callback: (data: any) => void) =>
      ipcRenderer.on(IPC_CHANNELS.IV_ALL_INDEX_PROGRESS, (event, data) => callback(data)),
    offIndexProgress: (callback: (data: any) => void) =>
      ipcRenderer.removeListener(IPC_CHANNELS.IV_INDEX_PROGRESS, callback),
    offAllIndexProgress: (callback: (data: any) => void) =>
      ipcRenderer.removeListener(IPC_CHANNELS.IV_ALL_INDEX_PROGRESS, callback),
  },

  // Image Generation APIs
  img: {
    generate: (request: any) => ipcRenderer.invoke(IPC_CHANNELS.IMG_GENERATE, request),
    generateQwen: (request: any) => ipcRenderer.invoke(IPC_CHANNELS.IMG_GENERATE_QWEN, request),
    listHistory: () => ipcRenderer.invoke(IPC_CHANNELS.IMG_LIST_HISTORY),
    getHistory: (recordId: string) => ipcRenderer.invoke(IPC_CHANNELS.IMG_GET_HISTORY, recordId),
    deleteHistory: (recordId: string) => ipcRenderer.invoke(IPC_CHANNELS.IMG_DELETE_HISTORY, recordId),
    listLlmConfigs: () => ipcRenderer.invoke(IPC_CHANNELS.IMG_LIST_LLM_CONFIGS),
    getLlmConfig: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.IMG_GET_LLM_CONFIG, name),
    saveLlmConfig: (name: string, config: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.IMG_SAVE_LLM_CONFIG, name, config),
  },

  // Legacy API
  electron: {
    chrome: () => process.versions.chrome,
    getTips: (arg1: any) => ipcRenderer.invoke('get-tips', arg1),
    ipcRendererOn: (eventName: string, callback: any) => ipcRenderer.on(eventName, callback),
    ipcRendererOff: (eventName: string, callback: any) => ipcRenderer.off(eventName, callback),
  },
};

/**
 * Expose the API to the renderer process
 */
contextBridge.exposeInMainWorld('electron', api);

// Also expose for backward compatibility
contextBridge.exposeInMainWorld('mdEditor', api.md);
contextBridge.exposeInMainWorld('ivViewer', api.iv);
contextBridge.exposeInMainWorld('api', { ...api.md, ...api.iv, ...api.img });
