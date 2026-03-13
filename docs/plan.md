# Qmin 项目开发计划

## 当前任务：统一配置文件 cfg.json 和 qmin.json

### 问题描述

项目中存在两个配置文件路径：
1. **cfg.json** - 定义在 `WPath.configPath`，位于 `{workspace}/cfg.json`，但实际未使用
2. **qmin.json** - 在 `readConfig()` 中读取，位于 `{currentDir}/qmin.json`（当前工作目录）

这导致配置文件位置和名称不统一，造成混乱。

### 受影响的文档

- `docs/specs/index.md` - 更新工作目录和配置说明
- `docs/changelog.md` - 记录修改内容

### 分步清单

- [ ] **步骤 1**：更新 `docs/specs/index.md`
  - 明确配置文件名称为 `qmin.json`
  - 明确配置文件位置为 `{workspace}/qmin.json`

- [ ] **步骤 2**：修改 `src/main/core/common/context.ts`
  - 将 `WPath.configPath` 从 `{workspace}/cfg.json` 改为 `{workspace}/qmin.json`
  - 更新相关注释和文档

- [ ] **步骤 3**：修改 `src/main/index.ts`
  - 将 `readConfig()` 中的配置路径从 `{currentDir}/qmin.json` 改为 `{wpath.configPath}`
  - 使用统一的配置路径

- [ ] **步骤 4**：修改 `src/main/core/background.ts`
  - 将 `readConfig()` 中的配置路径从 `{currentDir}/qmin.json` 改为 `{wpath.configPath}`
  - 使用统一的配置路径

- [ ] **步骤 5**：修改 `src/main/core/ipc/handlers/common.handler.ts`
  - 将配置路径从 `{currentDir}/qmin.json` 改为 `{wpath.configPath}`

- [ ] **步骤 6**：修改 `src/main/core/vitest.setup.ts`
  - 更新 mock 配置中的 configPath 为 `{workspace}/qmin.json`
  - 更新 cfg 别名为新的 configPath

- [ ] **步骤 7**：编写单元测试
  - 测试配置文件路径正确性
  - 测试配置读取功能

- [ ] **步骤 8**：运行测试验证
  - 运行 `npm run test`
  - 运行 `npm run build`
  - 手动测试应用启动

- [ ] **步骤 9**：更新文档
  - 更新 `docs/changelog.md` 记录修改

### 当前障碍

无

### 技术方案

#### 配置路径统一

**修改前**：
- `WPath.configPath` → `{workspace}/cfg.json` (未使用)
- `readConfig()` 读取 → `{currentDir}/qmin.json`

**修改后**：
- `WPath.configPath` → `{workspace}/qmin.json`
- `readConfig()` 读取 → `{wpath.configPath}` (即 `{workspace}/qmin.json`)

#### 兼容性处理

为平滑迁移，可以：
1. 优先读取 `{workspace}/qmin.json`
2. 如果不存在，尝试读取旧位置 `{workspace}/cfg.json`
3. 如果旧位置存在，自动迁移到新位置并删除旧文件

#### 配置文件内容

保持现有配置结构不变：
```json
{
  "md_editor": {
    "en_key": "...",
    "hkey_hash": "...",
    "debug": true
  },
  "img_viewer": {
    "iv_path": "..."
  },
  "roleplay": {
    "default_llm_config": "config.json"
  },
  "img_gen": {
    "default_llm_config": "default.json",
    "qwen_llm_config": "qwen.json",
    "qwen_edit_llm_config": "qwen-edit.json"
  }
}
```

### 预期结果

- ✅ 配置文件统一为 `{workspace}/qmin.json`
- ✅ 代码中所有配置读取使用统一路径
- ✅ 消除 `cfg.json` 和 `qmin.json` 的混乱
- ✅ 向后兼容旧配置文件（可选）
