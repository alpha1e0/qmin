# 图片查看器（IV） 需求设计

## 核心功能

1. 从指定的目录搜索图片，并记录
2. 对搜索到的所有图片创建缩略图（方便查看大图片）
3. 对图片目录中的图片进行打分标记
4. 基于打分标记进行图片分类、重命名

## UI设计

2列设计：

1. 图片目录树
2. 图片展示区域

    1. 第一行为操作区域：基本信息，分类按钮、删除按钮
    2. 第一行下面为图片展示区域

## 工作目录&配置文件

### 工作目录

工作目录使用：

- 配置文件qmin.json
- tasks.json文件；用于保存图片处理任务


### qmin.json

应用主配置文件，位于工作目录根目录，和markdown编辑器相关的配置有：

```json
{
  "img_viewer": {
    "iv_path": "dir_not_exists"       // 待查看的图片目录
  }
}
```

### 图片目录

```
<iv_path>/                # 图片查看器根目录（配置在 qmin.json 的 iv_path）
  .wos_index/               # 缩略图缓存目录
  .wos_op_result/           # 分类结果目录
    2/                      # 2分图片
    3/                      # 3分图片
    4/                      # 4分图片
  .wos_restore/             # 删除目录备份
  .wos_dir.json             # 目录结构数据库
  <img_dir>/                # 图片目录
    .wos_index/             # 该目录的缩略图缓存
      op.json               # 操作数据库
      <thumbnail files>     # 缩略图文件
```

### op.json 结构

```json
{
  "meta": {
    "name": "目录名",
    "create_time": "2024-03-03 12:00:00",
    "cla_name": "分类名称_随机串",
    "cla_time": "2024-03-03 12:30:00"
  },
  "images": [
    {
      "path_id": "base64编码的路径",
      "name": "图片文件名.jpg",
      "score": 3,
      "cla": {
        "2": "分类名_0.jpg",
        "3": "分类名_1.jpg"
      }
    }
  ]
}
```

## 数据结构

### 常量配置

| 常量名 | 值 | 说明 |
|--------|-----|------|
| IV_CACHE_DIR | .wos_index | 缩略图缓存目录 |
| IV_OP_RESULT_DIR | .wos_op_result | 操作结果目录 |
| IV_RESTORE_DIR | .wos_restore | 恢复目录 |
| IV_OP_DB_FILE | op.json | 操作数据库文件名 |
| IV_DIR_DB_FILE | .wos_dir.json | 目录数据库文件名 |
| IV_IMG_LITTLE_SIZE | 1600 | 缩略图目标尺寸 |

### TypeScript 模型

```typescript
// 目录项
interface IVDirectory {
  path_id: string;      // base64编码的相对路径
  name: string;         // 目录名
  create_time: string;  // 创建时间
  children?: IVDirectory[];  // 子目录
}

// 元数据
interface IVMeta {
  name: string;         // 目录名称
  create_time: string;  // 创建时间
  cla_name: string;     // 分类名称
  cla_time: string;     // 分类时间
}

// 图片项
interface IVImage {
  path_id: string;      // base64编码的路径
  name: string;         // 文件名
  score: number;        // 评分（1-4）
}
```

### 评分规则

- **1分**: 默认分数，不参与分类
- **2分**: 低质量图片
- **3分**: 中等质量图片
- **4分**: 高质量图片
