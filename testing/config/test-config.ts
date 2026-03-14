/**
 * Qmin 单元测试配置加载器
 *
 * 从 test-config.json 和环境变量加载测试配置
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 测试配置接口
 */
export interface TestConfig {
  version: string;
  llm: {
    openai: LLMConfig;
    default: LLMConfig;
  };
  imageGen: {
    flux: APIConfig;
    gemini: APIConfig;
    qwen: APIConfig;
  };
  database: {
    type: 'memory' | 'file';
    path: string;
  };
  paths: Record<string, string>;
  encryption: {
    enKey: string;
    hkeyHash: string;
  };
  testSettings: {
    timeout: number;
    verboseLogging: boolean;
    coverageThreshold: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
  };
}

export interface LLMConfig {
  base_url: string;
  model: string;
  key: string;
  temperature?: number;
  max_tokens?: number;
  proxy?: string;
  break_prompt?: string;
}

export interface APIConfig {
  base_url: string;
  model: string;
  key: string;
}

/**
 * 默认测试配置（当配置文件不存在时使用）
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
  version: '1.0.0',
  llm: {
    openai: {
      base_url: 'https://api.example.com',
      model: 'test-model',
      key: '',
      temperature: 0.7,
      max_tokens: 1000,
    },
    default: {
      base_url: 'https://api.example.com',
      model: 'test-model',
      key: '',
      temperature: 0.7,
      max_tokens: 2000,
    },
  },
  imageGen: {
    flux: {
      base_url: 'https://flux-api.example.com',
      model: 'flux-model',
      key: '',
    },
    gemini: {
      base_url: 'https://generativelanguage.googleapis.com',
      model: 'gemini-model',
      key: '',
    },
    qwen: {
      base_url: 'https://dashscope.aliyuncs.com',
      model: 'wanx-v1',
      key: '',
    },
  },
  database: {
    type: 'memory',
    path: ':memory:',
  },
  paths: {
    tempDirectory: '/tmp/qmin-test',
    logDirectory: '/tmp/qmin-test/logs',
    mdEditorDir: '/tmp/qmin-test/md_editor',
    mdEditorImgDir: '/tmp/qmin-test/md_editor/img',
    roleplayDir: '/tmp/qmin-test/roleplay',
    roleplayScenarioDir: '/tmp/qmin-test/roleplay/scenario',
    roleplayLlmConfigsDir: '/tmp/qmin-test/roleplay/llm_configs',
    imgGenDir: '/tmp/qmin-test/img_gen',
    imgGenLlmConfigsDir: '/tmp/qmin-test/img_gen/llm_configs',
    imgGenHistoryDir: '/tmp/qmin-test/img_gen/history',
  },
  encryption: {
    enKey: '12345678901234567890123456789012',
    hkeyHash: '5d41402abc4b2a76b9719d911017c592',
  },
  testSettings: {
    timeout: 30000,
    verboseLogging: false,
    coverageThreshold: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};

/**
 * 加载测试配置
 *
 * 优先级：
 * 1. test-config.local.json（本地覆盖）
 * 2. test-config.json（项目配置）
 * 3. 默认配置
 *
 * 环境变量会覆盖文件配置
 */
export async function loadTestConfig(): Promise<TestConfig> {
  let config: TestConfig = { ...DEFAULT_TEST_CONFIG };

  const testsDir = __dirname;
  const configPath = path.join(testsDir, 'test-config.json');
  const localConfigPath = path.join(testsDir, 'test-config.local.json');

  try {
    // 尝试加载本地配置
    try {
      const localConfigData = await fs.readFile(localConfigPath, 'utf-8');
      const localConfig = JSON.parse(localConfigData);
      config = deepMerge(config, localConfig);
    } catch {
      // 本地配置文件不存在，继续
    }

    // 加载项目配置
    const configData = await fs.readFile(configPath, 'utf-8');
    const projectConfig = JSON.parse(configData);
    config = deepMerge(config, projectConfig);
  } catch (error) {
    // 配置文件加载失败，使用默认配置
    console.warn('Failed to load test config, using defaults');
  }

  // 应用环境变量覆盖
  config = applyEnvOverrides(config);

  return config;
}

/**
 * 应用环境变量覆盖
 */
function applyEnvOverrides(config: TestConfig): TestConfig {
  const env = process.env;

  // OpenAI 配置覆盖
  if (env.OPENAI_API_KEY) {
    config.llm.openai.key = env.OPENAI_API_KEY;
  }
  if (env.OPENAI_API_BASE) {
    config.llm.openai.base_url = env.OPENAI_API_BASE;
  }
  if (env.OPENAI_API_MODEL) {
    config.llm.openai.model = env.OPENAI_API_MODEL;
  }

  // 代理设置
  if (env.HTTP_PROXY || env.HTTPS_PROXY) {
    config.llm.openai.proxy = env.HTTPS_PROXY || env.HTTP_PROXY || '';
  }

  // API 密钥覆盖
  if (env.FLUX_API_KEY) {
    config.imageGen.flux.key = env.FLUX_API_KEY;
  }
  if (env.GEMINI_API_KEY) {
    config.imageGen.gemini.key = env.GEMINI_API_KEY;
  }
  if (env.QWEN_API_KEY) {
    config.imageGen.qwen.key = env.QWEN_API_KEY;
  }

  // 测试设置覆盖
  if (env.TEST_TIMEOUT) {
    config.testSettings.timeout = parseInt(env.TEST_TIMEOUT, 10);
  }
  if (env.TEST_VERBOSE_LOGGING) {
    config.testSettings.verboseLogging = env.TEST_VERBOSE_LOGGING === 'true';
  }

  return config;
}

/**
 * 深度合并对象
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * 获取 LLM 配置（合并环境变量）
 */
export function getLLMConfig(config: TestConfig, provider: 'openai' | 'default' = 'openai'): LLMConfig {
  const llmConfig = config.llm[provider];

  // 如果配置中没有 key，尝试从环境变量读取
  if (!llmConfig.key && process.env.OPENAI_API_KEY) {
    return { ...llmConfig, key: process.env.OPENAI_API_KEY };
  }

  return llmConfig;
}

/**
 * 获取图像生成配置
 */
export function getImageGenConfig(
  config: TestConfig,
  provider: 'flux' | 'gemini' | 'qwen'
): APIConfig {
  return config.imageGen[provider];
}

/**
 * 检查 API 密钥是否已配置
 */
export function hasApiKey(config: TestConfig, provider: 'openai' | 'flux' | 'gemini' | 'qwen'): boolean {
  if (provider === 'openai') {
    return !!(config.llm.openai.key || process.env.OPENAI_API_KEY);
  }
  return !!config.imageGen[provider].key;
}

/**
 * 缓存的配置实例
 */
let cachedConfig: TestConfig | null = null;

/**
 * 获取测试配置（单例模式）
 */
export async function getTestConfig(): Promise<TestConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadTestConfig();
  }
  return cachedConfig;
}
