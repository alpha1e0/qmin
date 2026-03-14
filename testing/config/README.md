# Qmin 测试配置说明

本目录包含 Qmin 项目的测试配置文件。

## 目录结构

```
testing/
├── config/                    # 测试配置目录
│   ├── README.md              # 本文档
│   ├── test-config.json       # 测试配置（JSON格式）
│   ├── test-config.schema.json # 配置Schema验证
│   └── test-config.ts         # 配置加载器（TypeScript）
├── fixtures/                  # 测试夹具（预留）
└── mocks/                     # Mock 数据（预留）
```

## 配置文件说明

### 1. `.env.test`
环境变量配置文件（项目根目录）。包含敏感的 API 密钥等配置。

**注意**: 此文件已在 `.gitignore` 中，不会被提交到 Git

### 2. `test-config.json`
JSON 格式的测试配置文件。包含所有测试所需的配置项。

- **优先级**: 如果需要本地覆盖，创建 `test-config.local.json`（已在 `.gitignore` 中）
- **结构**: 包含 LLM、图像生成、数据库、路径等配置

### 3. `test-config.schema.json`
配置文件的 JSON Schema 定义，用于验证配置格式。

### 4. `test-config.ts`
TypeScript 配置加载器和类型定义。

## 配置项详解

### LLM API 配置
用于 Roleplay 和聊天功能测试：

```json
{
  "llm": {
    "openai": {
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4",
      "key": "sk-...",
      "temperature": 0.7,
      "max_tokens": 1000
    }
  }
}
```

### 图像生成 API 配置
支持多个图像生成服务：

- **Flux**: Flux 专业图像生成
- **Gemini**: Google Gemini 图像生成
- **Qwen**: 通义万相（阿里云）

**注意**:
- 如果不配置实际 API 密钥，相关测试将使用 mock 数据跳过真实 API 调用
- 建议在 CI/CD 环境中配置测试专用的 API 密钥

### 环境变量
支持通过环境变量覆盖部分配置：

| 变量名 | 说明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `OPENAI_API_BASE` | OpenAI API 地址 |
| `OPENAI_API_MODEL` | 默认模型名称 |
| `HTTP_PROXY` | HTTP 代理地址 |
| `HTTPS_PROXY` | HTTPS 代理地址 |

## 使用方法

### 本地开发测试
1. 配置 `.env.test` 文件
2. 运行测试：

   ```bash
   npm run test
   ```

### CI/CD 环境
在 CI/CD 配置中设置环境变量：
```yaml
env:
  OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
  QWEN_API_KEY: ${{ secrets.TEST_QWEN_API_KEY }}
```

### 跳过需要真实 API 的测试
如果没有配置 API 密钥，可以跳过部分测试：
```bash
npm run test -- --reporter=verbose
```

## 最佳实践

1. **安全**: 永远不要将包含真实 API 密钥的配置文件提交到 Git
2. **隔离**: 使用测试专用的 API 密钥，与生产环境隔离
3. **Mock**: 大部分测试应使用 mock 数据，减少真实 API 调用
4. **覆盖**: 定期检查测试覆盖率，确保核心逻辑都被覆盖

## 常见问题

### Q: 测试失败提示 API 密钥无效
A: 检查 `.env.test` 中的 API 密钥是否正确配置，或确认相关测试是否支持 mock 模式。

### Q: 如何在无网络环境下运行测试？
A: 大部分测试使用 mock 数据，可以在无网络环境下运行。只有少数集成测试需要真实 API。

### Q: 测试超时怎么办？
A: 在 `test-config.json` 中增加 `testSettings.timeout` 的值。

## 相关文件

- `src/main/core/vitest.setup.ts` - Vitest 测试环境设置
- `vitest.config.ts` - Vitest 配置文件
- `package.json` - 测试脚本定义
- `.gitignore` - Git 忽略规则（包含 test-config.local.json）

## 迁移说明

本目录原为 `__tests__/`，在重构后迁移到 `testing/config/`：

**原因**:
- `__tests__` 命名容易误导为会被自动加载的测试文件目录
- 实际内容为测试配置资源，非测试代码
- `testing/config` 更清晰地表达其用途，且便于扩展其他测试资源

**影响**:
- ✅ 功能完全相同，仅改变目录位置
- ✅ 已更新 `.gitignore` 中的路径
- ✅ 无代码文件引用此目录，无需修改源代码
