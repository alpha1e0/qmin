# 项目需求总览

## 1. 核心架构说明

## 2. 功能模块列表 (Feature Registry)

| 编号 | 功能名称 | 状态 | 关联文档 | 简述 |
| :--- | :--- | :--- | :--- | :--- |
| 001 | 首页 | 🚧 开发中 | ./001_homepage.md | 项目首页，路由到具体功能、简介、配置 |
| 002 | AI个人助手 | 📅 待办 | ./002_ai-assistant.md | 翻译、搜索总结、本地查找文档总结、智能体 |
| 003 | AI角色扮演游戏 | 🚧 开发中 | ./003_ai-roleplay.md | 基于模板的AI角色扮演游戏、支持加密、隐藏 |
| 004 | AI图片生成 | 📝 设计中 | ./004_ai-image-generator.md | AI文生图、图生图、历史记录管理 |
| 005 | 本地markdown编辑器 | 🚧 开发中 | ./005_md-editor.md | 本地markdown编辑器，本地存储、分类、加密、隐藏 |
| 006 | 本地图片查看器(IV) | ✅ 已完成 | ./006_image-viewer.md | 本地图片查看器，生成缩略图、图片打分、基于打分分类 |

该应用的工作目录用于保存配置、数据，工作目录通过环境变量 `QMIN_WORKSPACE` 指定，如果没有该环境变量则默认为当前目录下的 `.qmin` 目录

## 3. 全局依赖关系 (Global Dependencies)

## 4. 测试基础设施

### 4.1 单元测试 (Vitest)

项目使用 Vitest 进行单元测试，测试文件位于 `src/main/core/` 目录下，与源代码文件并列放置。

**运行命令：**
- `npm test` - 运行所有单元测试
- `npm run test:ui` - 使用UI界面运行测试
- `npm run test:coverage` - 生成测试覆盖率报告

### 4.2 冒烟测试 (Playwright)

项目使用 Playwright 进行端到端冒烟测试，测试文件位于 `e2e/smoke/` 目录。

**测试覆盖：**
- 应用启动和基本功能
- 导航功能
- 各功能模块的基本可用性

**运行命令：**
- `npm run test:smoke` - 运行所有冒烟测试
- `npm run test:e2e` - 运行所有E2E测试
- `npm run test:e2e:ui` - 使用UI界面运行测试
- `npm run test:e2e:debug` - 使用调试模式运行测试

详细文档请参考：`e2e/README.md`

## 4. 公共模块设计

### 4.1 工作目录设计

工作目录用于：保存配置、本地数据库、后台任务队列

工作目录默认为：`~/.qmin`，如果设置了环境变量 `QMIN_WORKSPACE`则优先使用环境变量中的目录为工作目录

工作目录保存：

- 配置文件 qmin.json（主配置文件，位于工作目录根目录）
- 数据库文件 qmin.db
- log/目录，保存日志
- md_editor/目录，用于保存本地markdown编辑器中的插图
- roleplay/目录，AI角色扮演游戏配置、对话历史
- img_gen/目录，AI图片生成配置、生成历史

### 4.2 全局配置设计

应用主配置文件，位于工作目录根目录，为json格式，不同功能模块分开，例如：

```
{
	"md_editor": {},
	"img_viewer": {},
	"roleplay": {}
}
```
