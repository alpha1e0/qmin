# AI 图片生成功能使用说明

## 功能概述

AI图片生成功能支持：
- **文生图**：根据文本提示词生成图片
- **图生图**：基于参考图片和文本提示词生成新图片
- **多模型支持**：Gemini、Flux、SeeDream、Qwen
- **历史记录管理**：保存所有生成记录，包括提示词、参数、参考图、结果
- **Qwen专用入口**：针对Qwen模型的特殊优化（文生图/图生图使用不同模型）

## 快速开始

### 1. 配置LLM模型

在 `~/.qmin/img_gen/llm_configs/` 目录创建配置文件。例如 `default.json`:

```json
{
  "base_url": "https://openrouter.ai/api/v1/",
  "model": "google/gemini-2.0-flash-exp:free",
  "key": "your-api-key-here",
  "proxy": "http://127.0.0.1:7897"
}
```

**支持的模型**：
- Gemini: `google/gemini-2.0-flash-exp`, `google/gemini-2.5-flash`
- Flux: `black-forest-labs/flux.2-max`
- SeeDream: `bytedance-seed/seedream-4.5`
- Qwen: 需要两个配置文件

### 2. Qwen模型特殊配置

Qwen模型需要两个配置文件：

**qwen.json** (文生图):
```json
{
  "base_url": "https://api.siliconflow.cn/v1/",
  "model": "qwen/qwen-2-vl-72b-instruct",
  "key": "your-api-key"
}
```

**qwen-edit.json** (图生图):
```json
{
  "base_url": "https://api.siliconflow.cn/v1/",
  "model": "qwen-extended/qwen-2-vl-7b-instruct",
  "key": "your-api-key"
}
```

### 3. 启动应用

```bash
npm run e-serve
```

### 4. 使用功能

- 点击菜单：`功能 -> AI生图` 或按 `Ctrl+Alt+G`
- 输入提示词（例如：`一只可爱的橘猫在阳光下睡觉，卡通风格`）
- 可选：上传参考图片（支持多张）
- 设置生成参数（数量、大小、比例、质量）
- 点击"生成图片"按钮

## Qwen专用页面

对于Qwen模型，由于文生图和图生图使用不同模型，提供了专用入口：

- 自动根据是否有参考图切换模型
- 支持的图片大小：1328x1328、1664x928、928x1664等
- 可调整推理步数（10-50步）

## 历史记录

- 所有生成记录自动保存到 `~/.qmin/img_gen/history/`
- 每次生成一个目录，包含：
  - `prompt.txt` - 提示词
  - `params.json` - 生成参数
  - `ref_0.jpg`, `ref_1.jpg` - 参考图
  - `output_0.jpg`, `output_1.jpg` - 生成结果
  - `response.json` - 模型原始响应
  - `llm_config.txt` - 使用的模型配置

## 工作目录结构

```
~/.qmin/
├── img_gen/
│   ├── llm_configs/          # LLM模型配置目录
│   │   ├── default.json      # 默认配置
│   │   ├── gemini.json       # Gemini 配置
│   │   ├── flux.json         # Flux 配置
│   │   ├── qwen.json         # Qwen 文生图配置
│   │   └── qwen-edit.json    # Qwen 图生图配置
│   └── history/              # 生图历史记录
│       ├── 20260306_143022/  # 每次生成一个目录（时间戳命名）
│       │   ├── prompt.txt
│       │   ├── params.json
│       │   ├── ref_0.jpg
│       │   ├── response.json
│       │   └── output_0.jpg
│       └── 20260306_153045/
└── qmin.json                 # 主配置文件
```

## 技术实现

- **核心服务**：`src/core/services/img-gen.service.ts`
- **图片生成器**：`src/core/services/img-generators/`
- **历史记录**：`src/core/services/img-recorder.service.ts`
- **配置管理**：`src/core/services/img-config.service.ts`
- **UI组件**：`src/components/img-gen/`
- **IPC通信**：`src/core/ipc/handlers/img-gen.handler.ts`

## 注意事项

1. **API密钥安全**：请妥善保管API密钥，不要泄露
2. **图片大小限制**：不同模型支持不同的图片大小
3. **生成数量**：每次最多生成4张图片
4. **代理设置**：如需使用代理，在配置文件中添加 `proxy` 字段
5. **Qwen限制**：Qwen图生图只支持1张参考图片

## 故障排查

### 生成失败
- 检查API密钥是否正确
- 检查网络连接
- 检查代理设置（如使用）
- 查看日志：`~/.qmin/log/`

### 图片无法显示
- 检查图片路径是否正确
- 确认历史记录目录存在
- 查看控制台错误信息

### 配置文件未生效
- 确认配置文件在正确的目录
- 检查JSON格式是否正确
- 确认必需字段（base_url、model、key）都已填写
