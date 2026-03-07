# AI角色扮演游戏 需求设计

## 1. 核心功能

基于预定义的角色、场景和AI进行角色扮演游戏。

1. **场景管理**：创建、编辑、删除角色扮演场景
2. **对话历史管理**：为每个场景保存和管理多个对话历史
3. **AI聊天**：与AI进行角色扮演对话，支持流式输出
4. **配置管理**：管理LLM模型配置

## 2. UI设计

### 2.1 主界面布局

侧边栏 + 主内容区布局：

1. **左侧边栏**：
   - LLM模型选择
   - 场景列表（带"新建场景"按钮）
   - 当前场景的对话历史列表（带"新建对话"按钮）

2. **主内容区**（多标签页）：
   - **对话标签**：显示聊天历史，支持发送消息、回退、重新生成
   - **编辑对话标签**：可视化编辑当前对话历史
   - **原始数据标签**：显示当前对话的JSON原始数据

### 2.2 场景编辑器页面

左侧场景列表 + 右侧编辑器：

- 左侧：场景列表（单选）
- 右侧：
  - 创建新场景表单
  - 编辑场景定义（JSON编辑器或系统提示词编辑器）

## 3. 工作目录&配置文件

### 3.1 工作目录结构

```
~/.qmin/
├── qmin.json                 # 主配置文件
├── qmin.db                  # SQLite数据库
├── roleplay/                # AI角色扮演游戏工作目录
│   ├── scenario/            # 场景目录
│   │   ├── 场景名称/         # 场景目录
│   │   │   ├── scene.json   # 场景定义文件
│   │   │   └── history/     # 对话历史目录
│   │   │       ├── 对话1.json
│   │   │       └── 对话2.json
│   │   └── 另一个场景/
│   └── llm_configs/         # LLM模型配置目录
│       ├── config.json      # 默认配置
│       └── other.json       # 其他配置
```

### 3.2 场景定义文件结构 (scene.json)

```json
{
  "assistant_name": "模型扮演的角色名称",
  "user_name": "玩家的名称",
  "system_prompt": "场景、角色定义（Markdown格式）",
  "start": [
    {
      "role": "assistant",
      "content": "模型回复内容",
      "name": "模型扮演的角色名称"
    },
    {
      "role": "user",
      "content": "用户输入内容",
      "name": "玩家的名称"
    }
  ]
}
```

### 3.3 对话历史文件结构

```json
{
  "assistant_name": "模型扮演的角色名称",
  "user_name": "玩家的名称",
  "system_prompt": "系统提示词",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词内容"
    },
    {
      "role": "user",
      "content": "用户名: 用户消息",
      "name": "用户名"
    },
    {
      "role": "assistant",
      "content": "角色名: AI回复",
      "name": "角色名"
    }
  ]
}
```

### 3.4 LLM模型配置文件结构

```json
{
  "base_url": "https://openrouter.ai/api/v1/",
  "model": "google/gemini-2.5-flash",
  "key": "",
  "temperature": 0.9,
  "max_tokens": 16000,
  "proxy": "http://127.0.0.1:7897",
  "break_prompt": "可选的破甲提示词"
}
```

### 3.5 qmin.json 配置

```json
{
  "roleplay": {
    "default_llm_config": "config.json"
  }
}
```

## 4. 数据结构

### 4.1 TypeScript 接口定义

```typescript
/**
 * LLM模型配置
 */
interface LLMConfig {
  base_url: string;
  model: string;
  key: string;
  temperature: number;
  max_tokens: number;
  proxy?: string;
  break_prompt?: string;
}

/**
 * 场景定义
 */
interface Scenario {
  assistant_name: string;
  user_name: string;
  system_prompt: string;
  start: Message[];
}

/**
 * 消息
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

/**
 * 对话历史
 */
interface ChatHistory {
  assistant_name: string;
  user_name: string;
  system_prompt: string;
  messages: Message[];
}
```

### 4.2 数据库表（可选，用于快速查询）

如果需要数据库支持，可以创建以下表：

#### scenario
场景表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 场景名称 |
| path | TEXT | 场景文件路径 |
| create_time | TEXT | 创建时间 |

## 5. 功能模块详细设计

### 5.1 场景管理模块

**功能**：
- 列出所有场景
- 创建新场景
- 删除场景
- 更新场景定义
- 获取场景详情

**实现方式**：
- 使用文件系统存储场景
- 每个场景一个独立目录
- 场景定义保存在 `scene.json`

### 5.2 对话历史管理模块

**功能**：
- 列出指定场景的所有对话历史
- 创建新对话历史
- 删除对话历史
- 保存对话历史
- 加载对话历史

**实现方式**：
- 每个场景下有 `history/` 子目录
- 每个对话历史保存为一个JSON文件

### 5.3 AI聊天模块

**功能**：
- 初始化AI对话上下文
- 发送消息并获取AI回复（流式）
- 回退上一条消息
- 重新生成AI回复
- 加载历史对话
- 保存对话历史

**实现方式**：
- 使用OpenAI SDK调用LLM API
- 支持流式输出
- 维护对话上下文

### 5.4 配置管理模块

**功能**：
- 列出所有LLM配置
- 获取指定配置
- 保存配置

**实现方式**：
- 配置文件保存在 `roleplay/llm_configs/` 目录

## 6. 系统提示词模板

提供场景编辑器时，可包含以下系统提示词模板：

```markdown
你是擅长角色扮演、聊天的AI助手，将扮演如下角色、遵循如下场景和【用户】进行聊天：

### 角色设定

你将扮演【角色名】，【角色名】是【用户】的【关系】

**【角色名】**的个人信息：

- 基本情况：【姓名，年龄，相貌，身材、着装打扮...】
- 职业：
- 人设：
- 性格：
- 经历：

### 聊天场景

当前时间是【具体时间】，地点在【具体地点】。

【描述具体情境，角色正在做什么，和用户什么关系】。

### 对话风格

请使用【具体语言风格，如：古风、现代口语、科幻术语等】进行对话，语气应体现【具体语气，如：傲慢、温柔、冷酷等】。

可以使用【特定口头禅或表达方式】。

### 行为规则

- 必须始终以【角色名】的身份说话，不得跳出角色。
- 不要提及【禁止提及的事物】。

### 对话示例

【用户】：
【角色名】：
```

## 7. IPC 通道设计

### 7.1 场景管理通道

| 通道名 | 说明 |
|--------|------|
| `qmin:rp:list-scenarios` | 列出所有场景 |
| `qmin:rp:create-scenario` | 创建新场景 |
| `qmin:rp:get-scenario` | 获取场景详情 |
| `qmin:rp:update-scenario` | 更新场景 |
| `qmin:rp:delete-scenario` | 删除场景 |

### 7.2 对话历史管理通道

| 通道名 | 说明 |
|--------|------|
| `qmin:rp:list-histories` | 列出场景的所有对话历史 |
| `qmin:rp:create-history` | 创建新对话历史 |
| `qmin:rp:get-history` | 获取对话历史 |
| `qmin:rp:save-history` | 保存对话历史 |
| `qmin:rp:delete-history` | 删除对话历史 |

### 7.3 AI聊天通道

| 通道名 | 说明 |
|--------|------|
| `qmin:rp:chat-stream` | 发送消息并获取流式回复 |
| `qmin:rp:regenerate` | 重新生成最后一条回复 |
| `qmin:rp:pop-message` | 回退上一条消息 |

### 7.4 配置管理通道

| 通道名 | 说明 |
|--------|------|
| `qmin:rp:list-llm-configs` | 列出所有LLM配置 |
| `qmin:rp:get-llm-config` | 获取LLM配置 |
| `qmin:rp:save-llm-config` | 保存LLM配置 |

## 8. 安全考虑

1. **API密钥安全**：LLM配置中的API密钥应妥善保管，不直接显示在UI中
2. **输入验证**：对用户输入的场景名称、对话名称进行验证，防止路径遍历攻击
3. **文件权限**：工作目录文件应设置适当的读写权限
