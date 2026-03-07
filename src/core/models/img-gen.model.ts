/**
 * Image Generation Models
 * TypeScript interfaces and types for AI image generation functionality
 */

/**
 * LLM model configuration for image generation
 */
export interface LLMConfig {
  base_url: string;
  model: string;
  key: string;
  temperature?: number;
  max_tokens?: number;
  proxy?: string;
}

/**
 * Image generation parameters
 */
export interface ImageGenParams {
  count: number; // 生成数量 (1-4)
  size: string; // 图片大小，如 "512x512"
  ratio?: string; // 图片比例，如 "1:1", "16:9"
  quality?: string; // 图片质量，如 "standard", "hd"
  steps?: number; // 推理步数（Qwen 专用）
}

/**
 * Qwen specific image generation parameters
 */
export interface QwenImageGenParams {
  image_size: string; // 图片大小，如 "1328x1328"
  batch_size: number; // 生成数量
  num_inference_steps: number; // 推理步数
}

/**
 * Image generation record
 */
export interface ImageGenRecord {
  id: string; // 记录ID（时间戳目录名）
  timestamp: string; // 生成时间
  prompt: string; // 提示词
  params: ImageGenParams | QwenImageGenParams; // 生成参数
  refImages: string[]; // 参考图路径列表
  resultImages: string[]; // 生成结果路径列表
  llmConfig: string; // 使用的模型配置名称
  response: any; // 模型原始响应
}

/**
 * Image generation request
 */
export interface ImageGenRequest {
  prompt: string;
  refImages?: Buffer[]; // 参考图片的二进制数据
  params: ImageGenParams;
}

/**
 * Qwen image generation request
 */
export interface QwenImageGenRequest {
  prompt: string;
  refImage?: Buffer; // 单张参考图片（Qwen只支持1张）
  params: QwenImageGenParams;
}

/**
 * Image generation result
 */
export interface ImageGenResult {
  success: boolean;
  recordId?: string;
  resultImages?: string[]; // 生成结果图片路径
  error?: string;
}

/**
 * Image generation response from API
 */
export interface ImageGenResponse {
  success: boolean;
  images?: string[]; // base64 或 URL
  error?: string;
}

/**
 * History record list item
 */
export interface HistoryListItem {
  id: string;
  timestamp: string;
  prompt: string;
  refCount: number;
  resultCount: number;
  llmConfig: string;
}

/**
 * Supported image sizes for different models
 */
export const SUPPORTED_SIZES = {
  standard: ['256x256', '512x512', '768x768', '1024x1024'],
  qwen: ['1328x1328', '1664x928', '928x1664', '1472x1140', '1140x1472', '1584x1056', '1056x1584'],
} as const;

/**
 * Supported image ratios
 */
export const SUPPORTED_RATIOS = ['', '1:1', '9:16', '3:4', '16:9', '4:3'] as const;

/**
 * Supported image qualities
 */
export const SUPPORTED_QUALITIES = ['', 'standard', 'hd'] as const;

/**
 * Supported inference steps for Qwen
 */
export const QWEN_STEPS_RANGE = {
  min: 10,
  max: 50,
  default: 20,
} as const;
