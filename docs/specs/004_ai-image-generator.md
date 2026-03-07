# AI图片生成 需求设计

## 1. 核心功能

AI图片生成功能，支持文生图（text-to-image）和图生图（image-to-image）。

1. **文生图**：根据文本提示词生成图片
2. **图生图**：基于参考图片和文本提示词生成新图片
3. **生成历史管理**：保存生成记录，包括提示词、参数、参考图、生成结果
4. **模型配置管理**：支持多个AI生图模型配置
5. **Qwen专用入口**：由于 Qwen 模型的特殊性（文生图和图生图使用不同模型），提供独立入口

## 2. UI设计

### 2.1 主界面布局

侧边栏 + 主内容区布局：

1. **左侧边栏**：
   - 模型配置选择（标准入口，排除 Qwen）
   - 生成数量滑块（1-4）
   - 图片大小选择
   - 图片比例选择（可选）
   - 图片质量选择（可选）

2. **主内容区**：
   - 提示词输入框（多行文本）
   - 参考图上传区域（支持多张）
   - 参考图预览区域（一行最多4张）
   - 生成按钮
   - 生成结果展示区域

### 2.2 Qwen专用入口

由于 Qwen 模型的特殊性（文生图和图生图使用不同模型），需要提供独立的入口页面：

- **Qwen生图页面**：与主界面类似，但：
  - 固定使用 Qwen 模型配置
  - 自动根据是否有参考图切换模型（qwen-image vs qwen-image-edit）
  - 参数选项调整为 Qwen 支持的格式（image_size、batch_size、num_inference_steps）

## 3. 工作目录&配置文件

### 3.1 工作目录结构

```
~/.qmin/
├── qmin.json                 # 主配置文件
├── qmin.db                  # SQLite数据库
├── img_gen/                 # AI图片生成工作目录
│   ├── llm_configs/         # LLM模型配置目录
│   │   ├── default.json     # 默认配置
│   │   ├── gemini.json      # Gemini 配置
│   │   ├── flux.json        # Flux 配置
│   │   ├── qwen.json        # Qwen 文生图配置
│   │   └── qwen-edit.json   # Qwen 图生图配置
│   └── history/             # 生图历史记录
│       ├── 20260306_143022/ # 每次生成一个目录（时间戳命名）
│       │   ├── prompt.txt   # 提示词
│       │   ├── params.json  # 生成参数
│       │   ├── ref_0.jpg    # 参考图（如有）
│       │   ├── ref_1.jpg
│       │   ├── response.json # 模型原始响应
│       │   ├── output_0.jpg # 生成结果
│       │   └── output_1.jpg
│       └── 20260306_153045/
```

### 3.2 LLM模型配置文件结构

标准模型配置（Gemini、Flux 等）：

```json
{
  "base_url": "https://openrouter.ai/api/v1/",
  "model": "google/gemini-2.5-flash",
  "key": "",
  "temperature": 0.9,
  "max_tokens": 16000,
  "proxy": "http://127.0.0.1:7897"
}
```

Qwen 模型配置：

```json
{
  "base_url": "https://api.siliconflow.cn/v1/",
  "model": "qwen/qwen-2-vl-72b-instruct",
  "key": "",
  "proxy": ""
}
```

### 3.3 qmin.json 配置

```json
{
  "img_gen": {
    "default_llm_config": "default.json",
    "qwen_llm_config": "qwen.json",
    "qwen_edit_llm_config": "qwen-edit.json"
  }
}
```

## 4. 数据结构

### 4.1 TypeScript 接口定义

```typescript
/**
 * LLM模型配置
 */
interface LLMConfig {
  base_url: string;
  model: string;
  key: string;
  temperature?: number;
  max_tokens?: number;
  proxy?: string;
}

/**
 * 图片生成参数
 */
interface ImageGenParams {
  count: number;           // 生成数量
  size: string;           // 图片大小，如 "512x512"
  ratio?: string;         // 图片比例，如 "1:1", "16:9"
  quality?: string;       // 图片质量，如 "standard", "hd"
  steps?: number;         // 推理步数（Qwen 专用）
}

/**
 * 图片生成记录
 */
interface ImageGenRecord {
  id: string;             // 记录ID（时间戳）
  timestamp: string;      // 生成时间
  prompt: string;         // 提示词
  params: ImageGenParams; // 生成参数
  refImages: string[];    // 参考图路径列表
  resultImages: string[]; // 生成结果路径列表
  llmConfig: string;      // 使用的模型配置名称
  response: any;          // 模型原始响应
}
```

### 4.2 数据库表（可选）

如果需要数据库支持，可以创建以下表：

#### img_gen_history

图片生成历史表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| record_id | TEXT | 记录ID（时间戳） |
| timestamp | TEXT | 生成时间 |
| prompt | TEXT | 提示词 |
| params | TEXT | 生成参数（JSON） |
| llm_config | TEXT | 模型配置名称 |
| ref_count | INTEGER | 参考图数量 |
| result_count | INTEGER | 生成结果数量 |
| record_path | TEXT | 记录目录路径 |

## 5. 功能模块详细设计

### 5.1 图片生成器模块

**核心类**：`ImgGenerator`

**子类实现**：
- `GeminiImgGenerator`：支持 Gemini 系列模型
- `SeeDreamGenerator`：支持 SeeDream 模型
- `Flux2Generator`：支持 Flux.2 模型
- `QwenImgGenerator`：支持 Qwen 模型（特殊处理）

**工厂函数**：`getImgGenerator(llmConfig: LLMConfig): ImgGenerator`

**主要方法**：
- `generateImg(prompt: string, refImages: byte[], params: ImageGenParams)`：生成图片
- `prepareImg(imgBytes: byte, fileName: string): byte`：预处理图片（格式转换）

### 5.2 历史记录模块

**核心类**：`ImageRecorder`

**功能**：
- 创建以时间戳命名的记录目录
- 保存提示词、参数、参考图、生成结果
- 保存模型原始响应

**主要方法**：
- `recordPrompt(prompt: string)`：保存提示词
- `recordParams(params: object)`：保存参数
- `recordImage(imgBytes: byte, fileName: string)`：保存图片
- `recordResponse(resp: object)`：保存模型响应

### 5.3 图片处理模块

**功能**：
- 检测图片格式（JPEG、PNG、GIF 等）
- 转换图片格式为 JPEG
- 编码图片为 base64
- 从 URL 下载图片

### 5.4 配置管理模块

**功能**：
- 列出所有 LLM 配置
- 获取指定配置
- 保存配置

## 6. 模型支持详情

### 6.1 Gemini 系列模型

**特点**：
- 使用 OpenAI 兼容 API
- 支持文生图和图生图
- 通过 `extra_body.modalities` 和 `extra_body.image_config` 传递参数

**支持参数**：
- `size`：图片大小
- `aspect_ratio`：图片比例（可选）
- `quality`：图片质量（可选）

**返回格式**：
- 图片以 base64 格式嵌入响应中

### 6.2 SeeDream / Flux2 模型

**特点**：
- 继承自 GeminiImgGenerator
- 设置 `modalities: ["image"]`（仅图片）

### 6.3 Qwen 模型

**特点**：
- 文生图和图生图使用不同模型
- 需要两个配置文件（qwen.json 和 qwen-edit.json）
- 使用原始 HTTP API 而非 OpenAI SDK

**文生图参数**：
- `image_size`：图片大小（如 "1328x1328"）
- `batch_size`：生成数量
- `num_inference_steps`：推理步数

**图生图参数**：
- `image`：参考图（base64 格式）
- `image_size`：图片大小
- `batch_size`：生成数量
- `num_inference_steps`：推理步数

**返回格式**：
- 返回图片 URL

**支持的图片大小**：
- `1328x1328`、`1664x928`、`928x1664`、`1472x1140`、`1140x1472`、`1584x1056`、`1056x1584`

## 7. IPC 通道设计

### 7.1 图片生成通道

| 通道名 | 说明 |
|--------|------|
| `qmin:img:generate` | 生成图片 |
| `qmin:img:generate-qwen` | 使用 Qwen 模型生成图片 |

### 7.2 历史记录通道

| 通道名 | 说明 |
|--------|------|
| `qmin:img:list-history` | 列出所有生成记录 |
| `qmin:img:get-history` | 获取指定记录详情 |
| `qmin:img:delete-history` | 删除指定记录 |

### 7.3 配置管理通道

| 通道名 | 说明 |
|--------|------|
| `qmin:img:list-llm-configs` | 列出所有 LLM 配置 |
| `qmin:img:get-llm-config` | 获取 LLM 配置 |
| `qmin:img:save-llm-config` | 保存 LLM 配置 |

## 8. 安全考虑

1. **API密钥安全**：LLM配置中的API密钥应妥善保管，不直接显示在UI中
2. **输入验证**：对用户输入的提示词、文件名进行验证
3. **文件权限**：工作目录文件应设置适当的读写权限
4. **图片大小限制**：限制上传图片的大小，防止资源耗尽

## 9. 技术实现要点

### 9.1 图片预处理

- 统一转换为 JPEG 格式
- 支持 HEIF 等现代图片格式
- 使用 `pillow-heif` 处理 HEIF 格式

### 9.2 API 调用

- 标准模型使用 OpenAI SDK
- Qwen 模型使用原始 HTTP 请求
- 支持代理设置
- 错误处理和重试机制

### 9.3 流式处理（可选）

- 如果模型支持，可以考虑实现生成进度的流式展示
- 在 Vue 组件中使用轮询或 WebSocket 获取进度

## 10. 与 example 项目的差异

### 10.1 框架差异

| 项目 | 框架 |
|------|------|
| example | Python + Streamlit |
| qmin | Electron + Vue 3 |

### 10.2 架构调整

1. **前端**：使用 Vue 3 + Element Plus 替代 Streamlit
2. **后端**：在 Electron 主进程中实现图片生成逻辑
3. **通信**：使用 IPC 通道替代直接的函数调用
4. **配置管理**：集成到 qmin.json 主配置文件中

### 10.3 需要保留的核心逻辑

- 图片生成器类层次结构
- 历史记录保存逻辑
- 图片预处理逻辑
- Qwen 模型的特殊处理
