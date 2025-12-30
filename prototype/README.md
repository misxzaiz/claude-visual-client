# Claude Visual Client - 原型版本

基于 Node.js 的 Claude Code 可视化操作客户端快速原型。

**架构说明**: 本项目通过调用已安装的 `claude` CLI 实现功能，**无需单独配置 API Key**，复用你现有的 Claude Code 配置。

## 功能特性

- **对话交互** - 与 Claude AI 进行实时对话，支持流式输出
- **文件浏览** - 可视化浏览项目文件结构
- **文件预览** - 点击文件查看内容
- **工具调用日志** - 显示 Claude 使用的工具
- **暗色主题** - 护眼的深色界面

## 快速开始

### 前置要求

1. 已安装 Node.js (v16+)
2. 已安装 Claude Code CLI (`claude` 命令可用)

### 验证 Claude CLI

```bash
claude --version
# 应显示: 2.0.76 (Claude Code) 或类似版本
```

### 安装和运行

```bash
# 进入项目目录
cd D:\claude\claude-visual-client\prototype

# 安装依赖
npm install

# 启动服务器
npm start
```

### 访问

打开浏览器访问: http://localhost:3000

## 项目结构

```
prototype/
├── server/
│   └── index.js          # Express 后端 (通过调用 claude CLI)
├── public/
│   ├── index.html        # 前端页面
│   ├── styles.css        # 暗色主题样式
│   └── app.js            # 前端逻辑 (SSE 流式处理)
├── package.json
└── README.md
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查和 Claude CLI 版本 |
| `/api/chat` | POST | 发送消息 (SSE 流式响应) |
| `/api/files/tree` | GET | 获取目录树 |
| `/api/files/content` | GET | 读取文件内容 |

## 工作原理

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Browser │ <--→│ Express   │ <--→│  claude   │
│  (Web)   │ SSE │ Server   │ Spawn │   CLI    │
└──────────┘      └──────────┘      └──────────┘
```

1. 用户在浏览器输入消息
2. 后端通过 `child_process.spawn` 调用 `claude --print --output-format stream-json`
3. 解析流式 JSON 输出
4. 通过 Server-Sent Events 推送到前端

## 配置

环境变量 (`.env` 文件):

```bash
# Claude 命令路径 (默认: claude)
CLAUDE_CMD=claude

# 工作目录 (默认: D:\claude)
WORK_DIR=D:\claude

# 服务器端口 (默认: 3000)
PORT=3000

# 权限模式 (默认: bypassPermissions)
# default              - 每次操作需要确认
# dontAsk              - 不询问但自动拒绝危险操作（写入/Bash被禁用）
# bypassPermissions    - 自动允许所有操作 ⚠️ (原型推荐)
# acceptEdits          - 自动允许编辑操作
PERMISSION_MODE=bypassPermissions
```

### 权限模式说明

| 模式 | 说明 | 写入 | Bash | 推荐场景 |
|------|------|------|------|---------|
| `default` | 每次操作需要确认 | ✅ | ✅ | 个人使用 |
| `dontAsk` | 不询问但拒绝危险操作 | ❌ | ❌ | 仅读取 |
| `bypassPermissions` | 自动允许所有操作 | ✅ | ✅ | **原型开发** |
| `acceptEdits` | 自动允许编辑 | ✅ | ❌ | 仅编辑文件 |

> ⚠️ `bypassPermissions` 模式会自动允许所有操作，请确保你信任 Claude 的操作内容。

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **通信**: Server-Sent Events (SSE)
- **AI**: 通过调用已安装的 Claude Code CLI

## 与直接调用 API 的区别

| 方式 | 优点 | 缺点 |
|------|------|------|
| **通过 CLI** | 无需 API Key，复用现有配置，支持会话恢复 | 依赖 CLI 安装 |
| **直接 API** | 更灵活，不依赖 CLI | 需要单独配置 API Key |

本原型采用**通过 CLI** 的方式。

## 下一步计划

- [ ] 添加会话恢复功能
- [ ] 实现代码编辑
- [ ] 添加 MCP 插件可视化
- [ ] 支持多会话管理
- [ ] 添加快捷键支持

## 许可

MIT
