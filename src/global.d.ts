/**
 * Global type definitions for Qmin application
 */

import { ImageGenRequest, QwenImageGenRequest, ImageGenResult, LLMConfig } from './core/models';
import { HistoryListItem, ImageGenRecord } from './core/models';

/**
 * Window interface extensions
 */
declare global {
  interface Window {
    electron: any;
    mdEditor: any;
    ivViewer: any;
    api: {
      // MD Editor APIs
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

      // Image Viewer APIs
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
      onIndexProgress(callback: (data: any) => void): void;
      onAllIndexProgress(callback: (data: any) => void): void;
      offIndexProgress(callback: (data: any) => void): void;
      offAllIndexProgress(callback: (data: any) => void): void;

      // Image Generation APIs
      img: {
        generate(request: ImageGenRequest): Promise<ImageGenResult>;
        generateQwen(request: QwenImageGenRequest): Promise<ImageGenResult>;
        listHistory(): Promise<HistoryListItem[]>;
        getHistory(recordId: string): Promise<ImageGenRecord | null>;
        deleteHistory(recordId: string): Promise<{ success: boolean; error?: string }>;
        listLlmConfigs(): Promise<string[]>;
        getLlmConfig(name: string): Promise<LLMConfig | null>;
        saveLlmConfig(name: string, config: LLMConfig): Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}

export {};
