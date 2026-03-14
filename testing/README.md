# Testing Resources

本目录包含测试相关的资源和配置文件。

## 目录结构

```
testing/
├── config/              # 测试配置
│   ├── README.md
│   ├── test-config.json
│   ├── test-config.schema.json
│   └── test-config.ts
├── fixtures/            # 测试夹具（预留）
└── mocks/               # Mock 数据（预留）
```

## 配置说明

详见 `config/README.md`

## 测试文件位置

实际的单元测试文件位于源代码目录中，采用 `*.test.ts` 命名：

```
src/main/core/
├── services/
│   ├── md-editor/
│   │   └── md-editor.service.test.ts
│   ├── img-gen/
│   │   └── img-gen.service.test.ts
│   └── ...
└── models/
    └── *.test.ts
```

**为什么这样组织？**

- ✅ 测试文件与源代码放在一起，易于维护
- ✅ 符合 Vitest 的扫描规则（`src/main/core/**/*.test.ts`）
- ✅ 本目录仅存放配置和资源，与测试代码分离

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定模块测试
npm test -- src/main/core/services/task

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试 UI
npm run test:ui
```

## 历史变更

### 2026-03-14
- 从 `__tests__/` 重构为 `testing/config/`
- 更清晰的目录结构和命名
- 预留 `fixtures/` 和 `mocks/` 目录供未来扩展
