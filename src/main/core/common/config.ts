/**
 * TypeScript types file for Qmin application
 *
 * This file contains configuration types and common types.
 * Database models are defined in src/main/core/models/
 */

import { IVOperation } from '@/main/core/models';

// ============================================================================
// Task Models
// ============================================================================

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Task type enum
 */
export enum TaskType {
  INDEX = 'index',
  CLASSIFICATION = 'classification',
  UNKNOWN = 'unknown',
}

/**
 * Base task interface
 */
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  create_time: number;
  start_time?: number;
  end_time?: number;
  error?: string;
}

/**
 * Image viewer task
 */
export interface IVTask extends Task {
  path_id: string;
  path_name: string;
  total_images: number;
  processed_images: number;
}

/**
 * Task list response
 */
export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// ============================================================================
// API Response Models
// ============================================================================

/**
 * Standard API response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  err_code?: string;
  err_msg?: string;
}

/**
 * Common API response with ID
 */
export interface ApiIdResponse extends ApiResponse {
  id?: number;
}

// ============================================================================
// IPC Types
// ============================================================================

/**
 * IPC request/response types
 */
export interface IPCRequest {
  channel: string;
  data?: any;
}

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  err_code?: string;
  err_msg?: string;
}

/**
 * Progress update event data
 */
export interface ProgressUpdate {
  path_id: string;
  progress: number;
  message?: string;
}

/**
 * All index progress update event data
 */
export interface AllIndexProgressUpdate {
  progress: number;
  finish: boolean;
  detail: Array<{
    path_id: string;
    name: string;
    progress: number;
  }>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Markdown Editor configuration
 */
export interface MdEditorConfig {
  en_key?: string;
  hkey_hash?: string;
  debug?: boolean;
}

/**
 * Image Viewer configuration
 */
export interface ImgViewerConfig {
  iv_path?: string;
}

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  md_editor?: MdEditorConfig;
  img_viewer?: ImgViewerConfig;
}

/**
 * Directory configuration for image viewer
 */
export interface DirConfig {
  name: string;
  create_time: number;
  children: DirConfig[];
  images: string[];
}

/**
 * Operation configuration for image viewer
 */
export interface OpConfig {
  images: Record<string, number>;
  history: IVOperation[];
}

// ============================================================================
// Roleplay Models
// ============================================================================

/**
 * LLM configuration for roleplay
 */
export interface RoleplayLLMConfig {
  base_url: string;
  model: string;
  key: string;
  temperature: number;
  max_tokens: number;
  proxy?: string;
  break_prompt?: string;
}

/**
 * Message in chat
 */
export interface RoleplayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

/**
 * Scenario definition
 */
export interface RoleplayScenario {
  assistant_name: string;
  user_name: string;
  system_prompt: string;
  start: RoleplayMessage[];
}

/**
 * Chat history
 */
export interface RoleplayChatHistory {
  assistant_name: string;
  user_name: string;
  system_prompt: string;
  messages: RoleplayMessage[];
}
