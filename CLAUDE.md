# Qmin项目

**简介**：一个基于 Electron + VUE 的桌面综合AI工具。

##  Role & Style

- **角色**：资深 Electron 和 TypeScript 架构师、程序员。
- **风格**：简洁、模块化、必要的注释、风格统一。
- **方法**：编码前务必确认规范/计划更新。

## Tech Stack

- **前端**： Electron、Vue 3 (Composition API)
- **UI组件**：Element Plus
- **打包**：electron-builder
- **中间件**：sqlite
- **单元测试**：Vitest + Vue Test Utils

## Project Map & Logic

### 目录结构

- `src/core/`: 核心业务逻辑（禁止在此处写 UI 代码）。
- `src/components/`: 前端UI实现。
- `docs/specs/`: 需求文档。
- `docs/usage/`: 手册文档。

总体需求概览、公共方案设计在 `docs/specs/index.md`文件，**所有需求实现、方案设计都需要先参考 specs/index.md**

## Critical Rules (Never Violate)

1. **需求一致**：修改代码前，请先更新 `docs/specs/` 中的需求
2. **测试驱动逻辑**：`src/core` 中的任何代码都必须有对应的 `.test.ts` 文件。实现后立即运行测试。
3. **命名约定**：

	- **文件**：组件/类使用 PascalCase 命名法（例如 `AuthService.ts`），资源/其他文件使用 kebab-case 命名法。
	- **类**：使用 PascalCase 命名法（例如 `UserManager`）。
	- **函数/变量**：使用 camelCase 命名法（例如 `fetchData`、`isLoggedIn`）。

	  	- **布尔值**：必须带前缀，如 `is`, `has`, `should`, `can` (例如: `isUserLoggedIn`)。
  		- **动作函数**：必须以动词开头 (例如: `fetchData`, `validateForm`)。

	- **常量**：格式例如：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）。

4. **日志记录**：使用结构化日志记录器。所有主要的进程间通信 (IPC) 事件和服务错误都必须通过 `logger.info` 或 `logger.error` 记录。
5. **注释**：

	- **意图优先**：不要注释“代码在做什么”，要注释“为什么要这么做”。
	- **函数注释**：所有公共函数必须包含简单的 JSDoc/Docstring，说明参数、返回值及潜在的副作用。
	- **TODO 规范**：所有临时方案必须标注 `// TODO(name): description`。

6. **测试**：使用 [Vitest/Jest]。确保新功能的逻辑覆盖率达到 100%。


## Workflow

**请按照如下工作流进行开发**

用户新需求 -> 阅读相关需求设计文档 `docs/specs/*.md`  -> 给出计划并记录到 `docs/plan.md` -> 让用户确认 -> 执行 -> 总结修改内容并记录到 `docs/changelog.md`

**注意**：需要查看需求设计文档，并决定是否要更新需求设计文档，需求文档更新也需要记录到 `docs/plan.md`

### docs/plan.md 格式建议

每次更新 `plan.md` 时，请使用以下结构：

1. **任务**：简短标题。
2. **受影响的文档**：（例如，`docs/specs/auth.md`、`docs/changelog.md`）。
3. **分步清单**：

- [ ] 步骤 1：更新文档。
- [ ] 步骤 2：在 `services/` 目录下实现逻辑。
- [ ] 步骤 3：编写并运行单元测试（至关重要）。
- [ ] 步骤 4：与用户界面集成。
- [ ] 步骤 5：手动验证和日志检查。

4. **当前障碍**：列出任何缺失的信息。

### docs/changelog.md 格式建议

每次在文件head插入新的内容，格式如下：

```
## [当前版本号] 日期

具体修改内容
```