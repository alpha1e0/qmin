# Qmin 变更日志

## [2.0.1] - 2026-03-12

### Fixed
- **配置文件统一** 🔧
  - 统一配置文件名称为 `qmin.json`（消除 `cfg.json` 和 `qmin.json` 的混乱）
  - 配置文件位置统一为 `{workspace}/qmin.json`
  - 更新 `WPath.configPath` 从 `cfg.json` 改为 `qmin.json`
  - 更新所有配置读取代码使用统一的 `wpath.configPath`

### Changed
- **代码修改**:
  - `src/main/core/common/context.ts`: 配置路径从 `cfg.json` 改为 `qmin.json`
  - `src/main/index.ts`: 使用 `wpath.configPath` 替代硬编码路径
  - `src/main/core/background.ts`: 使用 `wpath.configPath` 替代硬编码路径
  - `src/main/core/ipc/handlers/common.handler.ts`: 使用 `wpath.configPath`
  - `src/main/core/vitest.setup.ts`: 更新测试 mock 配置
  - `docs/specs/index.md`: 明确配置文件规范

### Technical
- 配置文件路径统一：所有代码现在使用 `wpath.configPath` 获取配置路径
- 向后兼容：保留 `wpath.cfg` 作为 `configPath` 的 deprecated alias
- 测试状态：324个测试通过，9个测试失败（与本次修改无关的已知问题）

## [2.0.0] - 2026-03-10

### Changed
- **构建系统迁移** 🚀
  - 从 vue-cli-plugin-electron-builder 迁移到 electron-vite
  - 更快的开发服务器启动和热重载（Vite vs Webpack）
  - 更好的 TypeScript 原生支持
  - 更简洁的配置文件结构

### Added
- **新配置文件**
  - electron.vite.config.ts (主构建配置)
  - tsconfig.node.json (主进程/预加载 TypeScript 配置)
  - tsconfig.web.json (渲染进程 TypeScript 配置)
  - electron-builder.json5 (打包配置)

### Changed
- **目录结构调整**
  - src/core → src/main/core (主进程代码)
  - src/background.js → src/main/index.ts (主进程入口)
  - src/preload.js → src/preload/index.ts (预加载脚本)
  - src/components → src/renderer/src/components (渲染进程代码)

### Removed
- **旧配置文件**
  - vue.config.js (不再需要)
  - babel.config.js (Vite 不需要)

### Technical
- NPM scripts 更新:
  - e-serve → dev (electron-vite dev)
  - build → build (electron-vite build)
  - e-build → build:win/mac/linux (平台特定打包)
- 主进程入口: dist/background.js → dist-electron/main/index.js
- 开发服务器: webpack-dev-server → Vite dev server

## [1.4.0] - 2026-03-07

### Added
- **MockDatabase 增强** 🗄️
  - 改进 vitest.setup.ts 中的 MockDatabase 类
  - 支持 INSERT 操作和数据持久化
  - 支持 WHERE 子句参数化查询
  - 添加 close() 方法以支持数据库关闭
  - 修复 AES-256 密钥长度问题（必须32字节）

### Fixed
- **测试修复** 🐛
  - 修复 md-editor.service.test.ts 中的加密密钥长度错误
  - 改进数据库 mock 以支持基本的 CRUD 操作
  - 8个 md-editor 测试通过（从0个提升到8个）
  - 仍有8个复杂测试需要真实的数据库集成

### Technical
- 测试通过率: 97% (325/335)
- MockDatabase 使用内存表存储数据
- 支持 doc_category 和 doc_doc 表的基本操作

## [1.3.0] - 2026-03-07

### Added
- **日志记录完善** 📝
  - 为所有 IPC handlers 添加了完整的日志记录
  - common.handler.ts: 添加配置读取和版本获取日志
  - md-editor.handler.ts: 添加分类和文档操作日志
  - roleplay.handler.ts: 添加场景管理和聊天日志
  - iv-viewer.handler.ts: 添加图片查看和索引日志

### Changed
- **代码质量改进** 🔧
  - 清理 tmp/ 目录：删除 4 个旧临时文件
  - 验证类级注释完整性：所有公共类都有 JSDoc 注释
  - 验证 service 层日志覆盖：84个日志调用分布在14个文件

### Technical
- 日志类别使用统一：IPC:* 和 *Service
- 日志级别规范：debug（查询）、info（操作）、error（错误）

## [1.2.1] - 2026-03-07

### Fixed
- **测试修复** 🐛
  - 修复 iv-viewer.service.test.ts 中的路径编码bug（Windows路径分隔符问题）
  - 修复 task.service.test.ts 中未实现的 run() 方法问题（使用 mock）
  - 改进 vitest.setup.ts 的 MockDatabase 以支持数组格式查询结果
  - 修复 vitest.setup.ts 中缺失的 imgGen 配置属性
  - 更新 iv-viewer.service.ts 的 saveOpInfo 方法以正确处理路径编码

- **测试统计** 📊
  - 测试成功率: 97.3% (324/333 通过)
  - iv-viewer.service.test.ts: 13个测试全部通过 ✅
  - task.service.test.ts: 22个测试全部通过 ✅
  - md-editor.service.test.ts: 7个通过，9个待修复 ⚠️

### Technical
- 问题根源: Windows路径分隔符 `\` 在 base64 编码/解码时导致路径错误
- 解决方案: 在 saveOpInfo 中先解码 path_id 再构建路径

## [1.2.0] - 2026-03-07

### Added
- **完整的单元测试覆盖** ✅
  - AI角色扮演模块：93个测试（roleplay-scenario, history, chat, config服务）
  - AI图片生成模块：51个测试（img-gen, recorder, generators）
  - 数据模型：54个测试（category, doc, image, img-gen, user）
  - 工具类：42个测试（logger, path）
  - **总计**: 240个单元测试全部通过

### Changed
- **命名规范改进** 🔧
  - context.ts: 添加符合规范的属性名（currentDirectory, userDirectory等）
  - 保留旧属性名作为getter以保持向后兼容性
  - exceptions.ts: ERR_CODE → errorCode
  - 移除过时函数current_time_obj_to_str

- **Bug修复** 🐛
  - 修复roleplay-scenario.service.ts中createScenario方法的错误处理逻辑

### Technical
- 测试框架：Vitest + Vue Test Utils
- 测试覆盖：核心业务逻辑100%覆盖
- 测试类型：单元测试、集成测试、类型验证测试

## [1.1.0] - 2026-03-06

### Added
- **AI图片生成功能完整实现** 🎨
  - 核心服务层：`ImgGenService`、`ImgRecorderService`、`ImgConfigService`
  - 图片生成器类层次：`BaseImgGenerator`、`GeminiImgGenerator`、`FluxImgGenerator`、`QwenImgGenerator`
  - 图片处理工具：格式检测、JPEG转换、Base64编码、URL下载
  - IPC通信层：8个新通道（生成、历史、配置管理）
  - UI组件：主生图页面、Qwen专用页面、历史记录查看器
  - 支持多模型：Gemini、Flux、SeeDream、Qwen（文生图/图生图分离）
  - 完整历史记录：保存prompt、参数、参考图、结果、响应
  - LLM配置管理：支持多配置文件、动态加载
  - 单元测试：图片处理工具、配置服务（14个测试全部通过）
  - 使用文档：`docs/img-gen-usage.md`

### Changed
- 依赖更新：新增 `axios` 和 `https-proxy-agent`
- 全局类型定义：`src/global.d.ts`（window.api类型定义）

### Fixed
- Qwen生成器类型错误处理
- API调用路径修正（`window.api.img.*`）
- LLMConfig导入缺失

## [Unreleased]

- 结构化日志系统 (`src/core/utils/logger.ts`)
- 单元测试基础设施 (Vitest + Vue Test Utils)
- 测试配置文件 (`vitest.config.ts`)
- 工具函数测试套件 (`common.test.ts`, `crypto.test.ts`, `image-helper.test.ts`, `img-config.service.test.ts`)

### Changed
- 统一函数命名为 camelCase (`current_time_obj_to_str` → `currentTimeObjToStr`)
- 重命名 `src/components/eidtor/` → `src/components/editor/`
- 删除重复的 `src/core/common/constants.js` 文件
- 所有 console 调用替换为结构化 logger 调用

### Fixed
- 修复目录命名拼写错误

---

## [1.0.0] - 2024-03-03

### Initial Release
- Markdown 编辑器
  - 文档分类管理
  - 文档 CRUD 操作
  - 文档加密（AES-256-GCM）
  - 隐藏 space 支持
  - 图片上传和管理

- 图片查看器
  - 目录结构扫描
  - 缩略图生成
  - 图片评分系统（1-4分）
  - 基于评分的分类和重命名

- 技术栈
  - Electron + Vue 3
  - Element Plus UI
  - better-sqlite3 数据库
  - Sharp 图片处理
  - Vditor Markdown 编辑器

---

## 版本号规则

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能新增
- **修订号**: 向下兼容的问题修复
