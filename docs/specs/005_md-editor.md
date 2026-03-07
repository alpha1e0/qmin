# 本地Markdown编辑器 需求设计

## 核心功能

1. 创建文档分类
2. 在文档分类中创建文档
3. 分类归属于不同的space，如果space>0，则为隐藏的分类，隐藏分类需要输入密码才能够进入
4. 对文档进行加密
5. 支持插入图片、粘贴图片：会自动上传并设置正确的路径

## UI设计

3列设计：

1. 分类列：最上面一行为添加、删除、修改按钮
2. 文档列：最上面一行为添加、删除、修改按钮
3. 文档内容：分为上下结构

    1. 上面一行为操作按钮区域
    2. 下面一行为具体markdown编辑区域


## 工作目录&配置文件

### 工作目录

工作目录使用：

- 配置文件qmin.json
- 数据库文件
- md_editor/目录
  - md_editor/img/ 用于保存markdown文档中的图片


### qmin.json

应用主配置文件，位于工作目录根目录，和markdown编辑器相关的配置有：

```json
{
  "md_editor": {
    "en_key": "your-encryption-key",  // 文档内容加密密钥
    "hkey_hash": "md5-hash",          // 隐藏space验证密码哈希
    "debug": true,                    // 调试模式
    "iv_path": "dir_not_exists"       // 图片查看器工作目录
  }
}
```



## 数据结构

### 数据库表

#### doc_category
文档分类表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 分类名称（base64编码） |
| space | INTEGER | 空间ID（0=公开，>0=隐藏） |
| create_time | TEXT | 创建时间 |

#### doc
文档表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | TEXT | 文档标题（base64编码） |
| summary | TEXT | 文档摘要（base64编码） |
| content | TEXT | 文档内容（AES-256-GCM加密） |
| category_id | INTEGER | 所属分类ID |
| create_time | TEXT | 创建时间 |
| modify_time | TEXT | 修改时间 |

#### image
图片表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 图片名称 |
| content | BLOB | 图片内容（可选，取决于配置） |
| ext | TEXT | 文件扩展名 |
| save_path | TEXT | 保存路径（可选） |
| create_time | TEXT | 创建时间 |

### TypeScript 模型

```typescript
// 文档分类
interface DocCategory {
  id: number;
  name: string;
  space: number;
  create_time: string;
}

// 文档
interface Doc {
  id: number;
  title: string;
  summary: string;
  content: string;
  category_id: number;
  create_time: string;
  modify_time: string;
}

// 文档列表项（不含内容）
interface DocListItem {
  id: number;
  title: string;
  summary: string;
  create_time: string;
  modify_time: string;
}
```
