# Qmin 测试指南

## 测试环境说明

### 问题背景
项目使用 Electron + better-sqlite3（原生模块），存在以下挑战：
- **better-sqlite3** 为 Electron 编译（NODE_MODULE_VERSION 125）
- **Vitest** 运行在标准 Node.js 环境（NODE_MODULE_VERSION 137）
- Windows 环境缺少 Visual Studio 编译工具

### 解决方案
使用 **Mock（模拟）**进行单元测试，避免依赖原生模块。

## 当前测试状态

### ✅ 通过的测试（25个）
- `src/core/utils/crypto.test.ts` - 10个测试
  - 加密/解密
  - Base64 编码
  - URL-safe Base64
  - MD5 哈希
  - 内容混码

- `src/core/utils/common.test.ts` - 15个测试
  - 时间格式化
  - 随机字符串生成
  - UUID 生成
  - 文件操作
  - 防抖/节流

### ⏳ 待完善的测试
服务层测试需要更完整的 Mock 配置：
- `src/core/services/md-editor.service.test.ts`
- `src/core/services/iv-viewer.service.test.ts`
- `src/core/services/task.service.test.ts`
- `src/core/services/task-manager.service.test.ts`

## 运行测试

### 只运行工具函数测试
```bash
npm test src/core/utils/
```

### 运行所有测试
```bash
npm test
```

### 查看测试 UI
```bash
npm run test:ui
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

## 测试配置

### Vitest 配置文件
- `vitest.config.ts` - 测试运行器配置
- `src/core/vitest.setup.ts` - Mock 配置

### Mock 策略
```typescript
// better-sqlite3 原生模块被 Mock
vi.mock('better-sqlite3');

// Logger 被Mock（避免文件操作）
vi.mock('../utils/logger');

// Context 配置被 Mock
vi.mock('../common/context');
```

## 服务层测试建议

### 选项1：完整 Mock（推荐用于单元测试）
```typescript
// 在测试文件中 Mock 数据库操作
vi.mock('../database/db-manager');

// 测试业务逻辑而非数据库操作
describe('MdEditorService', () => {
  it('should validate category name', () => {
    // 测试验证逻辑
  });
});
```

### 选项2：集成测试（需要在 Electron 环境中运行）
使用 `electron-mocha` 或 `spectron` 在真实 Electron 环境中测试。

### 选项3：内存数据库
创建仅用于测试的内存数据库：
```typescript
const testDb = new Database(':memory:');
// 初始化测试数据
```

## 下一步建议

1. **完善服务层 Mock**
   - 为每个服务创建完整的 Mock 配置
   - 使用 `vi.mocked()` 来验证方法调用

2. **添加集成测试**
   - 在 Electron 环境中测试完整流程
   - 使用真实的数据库操作

3. **提高覆盖率**
   - 目标：核心工具函数 100% 覆盖
   - 目标：服务层 80% 覆盖

4. **CI/CD 集成**
   - GitHub Actions 自动运行测试
   - 自动生成覆盖率报告

## 代码质量检查

### ESLint 检查
```bash
npm run lint
```

### Prettier 格式化
```bash
npm run format
npm run format:check
```

### 全部检查
```bash
npm run lint && npm run format:check && npm test
```

## 常见问题

### Q: 为什么服务层测试失败？
A: better-sqlite3 原生模块编译版本不匹配。需要使用 Mock 测试或在 Electron 环境中测试。

### Q: 如何测试数据库操作？
A: 使用 Mock 数据库或内存数据库（`:memory:`）。

### Q: 测试覆盖率如何？
A: 当前工具函数测试覆盖率约 95%，服务层测试待完善。
