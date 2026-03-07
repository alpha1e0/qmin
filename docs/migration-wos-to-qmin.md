# 项目名称迁移：WOS → Qmin

## 迁移日期
2026-03-03

## 迁移概述
将项目名称从 "WOS" 更改为 "Qmin"，涉及代码、配置、文件名等多个方面。

## 修改内容总览

### ✅ 文件和目录重命名
| 旧名称 | 新名称 | 类型 |
|--------|--------|------|
| `data/wos.sql` | `data/qmin.sql` | 数据库初始化文件 |
| `src/components/eidtor/` | `src/components/editor/` | 组件目录（拼写修正+改名） |

### ✅ 代码标识符修改

#### 数据库相关
- `wpath.wosdb` → `wpath.qminDb`
- `wos.db` → `qmin.db`
- `wos.sql` → `qmin.sql`
- `TEST_WOS_DB` → `TEST_QMIN_DB`

#### 异常类
- `WOSException` → `QminException`

#### 常量
- `IV_CACHE_DIR = '.wos_index'` → `IV_CACHE_DIR = '.qmin_index'`
- `IV_OP_RESULT_DIR = '.wos_op_result'` → `IV_OP_RESULT_DIR = '.qmin_op_result'`
- `IV_RESTORE_DIR = '.wos_restore'` → `IV_RESTORE_DIR = '.qmin_restore'`
- `IV_DIR_DB_FILE = '.wos_dir.json'` → `IV_DIR_DB_FILE = '.qmin_dir.json'`

#### IPC 通道
所有 IPC 通道前缀从 `wos:` 改为 `qmin:`
- `'wos:get-version'` → `'qmin:get-version'`
- `'wos:md:*'` → `'qmin:md:*'`
- `'wos:iv:*'` → `'qmin:iv:*'`
- 等 30+ 个通道

#### localStorage 键名
- `'wosLastOpTime'` → `'qminLastOpTime'`

#### 文档标题
- `'WOS MDEditor'` → `'Qmin MDEditor'`
- `'WOS IVViewer'` → `'Qmin IVViewer'`

### ✅ 配置文件更新

#### qmin.json
移除无用配置项：
- ~~`server_ip`~~
- ~~`server_port`~~
- ~~`access_token`~~

保留配置项：
- `en_key`: 文档内容加密密钥
- `hkey_hash`: 隐藏space验证密码哈希
- `debug`: 调试模式
- `iv_path`: 图片查看器工作目录

### ✅ 注释更新
- `src/core/common/config.ts`: 文件头注释
- `src/core/ipc/preload.ts`: 文件头注释
- `src/core/background.ts`: 关于对话框文本

## 修改文件列表

### 核心文件 (17个)
1. `src/core/common/context.ts` - WPath类和Config类
2. `src/core/common/config.ts` - WorkspaceConfig接口
3. `src/core/common/constants.ts` - 常量定义
4. `src/core/common/exceptions.ts` - 异常类
5. `src/core/database/db-manager.ts` - 数据库管理器
6. `src/core/background.ts` - 主进程入口
7. `src/core/ipc/channels.ts` - IPC通道定义
8. `src/core/ipc/preload.ts` - 预加载脚本
9. `src/core/vitest.setup.ts` - 测试设置

### 测试文件 (3个)
10. `src/core/services/md-editor.service.test.ts`
11. `src/core/services/md-editor.service.mock.test.ts`
12. `src/core/services/iv-viewer.service.test.ts`

### Vue组件 (2个)
13. `src/components/editor/MdEditor.vue`
14. `src/components/image-view/IVViewer.vue`

### 构建文件 (1个)
15. `src/preload.js`

### 文档文件 (3个)
16. `docs/specs/md-editor.md`
17. `docs/specs/image-viewer.md`
18. `readme.md`

### 数据库文件 (1个)
19. `data/qmin.sql` (重命名)

## 验证结果

### ✅ 测试通过
```
Test Files:  2 passed (2)
Tests:      25 passed (25)
```

### ✅ 代码格式化
所有修改的文件已通过 Prettier 格式化

### ✅ WOS 引用清理
剩余 WOS 引用: **0** 个

## 注意事项

### 兼容性
- IPC 通道名称已更改，确保前端和后端都使用新版本
- localStorage 键名已更改，首次运行会重置计时器

### 数据迁移
- 数据库文件名从 `wos.db` 改为 `qmin.db`
- 如需迁移旧数据，请手动重命名数据库文件

### 环境变量
- `TEST_WOS_DB` → `TEST_QMIN_DB` (仅测试环境)
- `QMIN_WORKSPACE` 保持不变

## 回滚方案
如需回滚，请使用 git 版本控制查看修改前的代码：
```bash
git log --oneline
git show <commit-hash>:filename
```
