/**
 * Claude Visual Client - 原型服务器
 * 通过调用已安装的 claude CLI 实现功能
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ==================== 配置 ====================

const CLAUDE_CMD = process.env.CLAUDE_CMD || 'claude';
const WORK_DIR = process.env.WORK_DIR || 'D:\\claude';

console.log(`使用 Claude CLI: ${CLAUDE_CMD}`);
console.log(`工作目录: ${WORK_DIR}`);

// ==================== 活跃会话管理 ====================

const activeSessions = new Map();

// ==================== 辅助函数 ====================

// 生成 UUID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 执行 claude 命令并返回结果
function executeClaude(args, options = {}) {
  return new Promise((resolve, reject) => {
    const cmdArgs = ['--print', '--output-format', 'json', ...args];

    const child = spawn(CLAUDE_CMD, cmdArgs, {
      cwd: WORK_DIR,
      shell: true,
      env: { ...process.env },
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          // 如果不是 JSON，返回原始文本
          resolve({ raw: stdout, stderr });
        }
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr || stdout}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  });
}

// 流式执行 claude 命令
function streamClaude(args, onData, onError, onComplete) {
  const cmdArgs = ['--print', '--output-format', 'stream-json', ...args];

  const child = spawn(CLAUDE_CMD, cmdArgs, {
    cwd: WORK_DIR,
    shell: true,
    env: { ...process.env }
  });

  let buffer = '';

  child.stdout?.on('data', (data) => {
    const chunk = data.toString();
    buffer += chunk;

    // 尝试解析每一行 JSON
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留未完成的行

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          onData(data);
        } catch (e) {
          // 不是有效的 JSON，可能是文本输出
          if (line.trim()) {
            onData({ type: 'text', content: line });
          }
        }
      }
    }
  });

  child.stderr?.on('data', (data) => {
    const msg = data.toString();
    onError(msg);
  });

  child.on('close', (code) => {
    onComplete(code);
  });

  child.on('error', (err) => {
    onError(err.message);
  });

  return child;
}

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 直接获取 claude 版本
    const { spawn } = require('child_process');
    const version = await new Promise((resolve, reject) => {
      const child = spawn(CLAUDE_CMD, ['--version'], { shell: true });
      let output = '';
      child.stdout?.on('data', (d) => output += d.toString());
      child.stderr?.on('data', (d) => output += d.toString());
      child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(output)));
      child.on('error', reject);
    });

    res.json({
      status: 'ok',
      version: '0.2.0',
      claudeVersion: version,
      claudeCmd: CLAUDE_CMD,
      workDir: WORK_DIR,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ==================== 对话接口 ====================

// 会话历史存储 (内存)
const conversations = new Map();

// SSE 连接存储
const sseClients = new Map();

// 发送消息 - 流式响应
app.post('/api/chat', async (req, res) => {
  const { message, conversationId, continue: cont = false } = req.body;

  if (!message && !cont) {
    return res.status(400).json({ error: '消息内容不能为空' });
  }

  // 获取或创建会话
  const convId = conversationId || uuid();
  if (!conversations.has(convId)) {
    conversations.set(convId, {
      id: convId,
      messages: [],
      sessionId: null
    });
  }

  const conversation = conversations.get(convId);

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送会话 ID
  res.write(`data: ${JSON.stringify({ type: 'session_start', conversationId: convId })}\n\n`);

  // 构建 claude 参数
  const args = [];

  if (cont) {
    args.push('-c'); // 继续对话
  } else {
    // 将消息作为参数传递
    args.push(message);
  }

  // 如果有会话 ID，恢复会话
  if (conversation.sessionId) {
    args.unshift('--resume', conversation.sessionId);
  }

  console.log('执行 claude 命令:', args);

  // 流式执行
  let currentMessage = '';
  let toolCalls = [];
  let tasks = [];

  const child = streamClaude(
    args,
    // onData
    (data) => {
      // 处理不同类型的消息
      if (data.type === 'message' || data.type === 'content_block_delta') {
        if (data.delta?.text) {
          currentMessage += data.delta.text;
          res.write(`data: ${JSON.stringify({ type: 'text', text: data.delta.text })}\n\n`);
        }
      } else if (data.type === 'content_block_start') {
        if (data.content_block?.tool_use) {
          const toolName = data.content_block.tool_use.name;
          toolCalls.push({ name: toolName, input: data.content_block.tool_use.input });
          res.write(`data: ${JSON.stringify({ type: 'tool_start', tool: toolName })}\n\n`);
        }
      } else if (data.type === 'content_block_stop') {
        if (toolCalls.length > 0) {
          const lastTool = toolCalls[toolCalls.length - 1];
          res.write(`data: ${JSON.stringify({ type: 'tool_end', tool: lastTool.name })}\n\n`);
        }
      } else if (data.type === 'message_stop') {
        // 保存会话 ID
        if (data.session_id) {
          conversation.sessionId = data.session_id;
        }
      } else if (data.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: data.error })}\n\n`);
      }

      // 保存到会话历史
      if (data.type === 'message_stop' && currentMessage) {
        conversation.messages.push({
          role: 'assistant',
          content: currentMessage,
          timestamp: new Date().toISOString()
        });
      }
    },
    // onError
    (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
    },
    // onComplete
    (code) => {
      if (code !== 0) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: `Process exited with code ${code}` })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    }
  );

  // 保存子进程引用（用于中断）
  sseClients.set(convId, child);
});

// 中断对话
app.post('/api/chat/interrupt/:id', (req, res) => {
  const child = sseClients.get(req.params.id);
  if (child) {
    child.kill();
    sseClients.delete(req.params.id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '会话不存在或已结束' });
  }
});

// 获取会话历史
app.get('/api/conversations/:id', (req, res) => {
  const conv = conversations.get(req.params.id);
  if (!conv) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json(conv);
});

// 清除会话
app.delete('/api/conversations/:id', (req, res) => {
  conversations.delete(req.params.id);
  const child = sseClients.get(req.params.id);
  if (child) {
    child.kill();
    sseClients.delete(req.params.id);
  }
  res.json({ success: true });
});

// ==================== 文件系统接口 ====================

const fs = require('fs').promises;

// 获取目录树
app.get('/api/files/tree', async (req, res) => {
  try {
    const dirPath = req.query.path || WORK_DIR;
    const tree = await buildDirectoryTree(dirPath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 读取文件内容
app.get('/api/files/content', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: '文件路径不能为空' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    res.json({
      path: filePath,
      content: content,
      size: stats.size,
      modified: stats.mtime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 会话列表接口 ====================

// 获取可恢复的会话列表
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await executeClaude(['--list-sessions']);
    res.json(result);
  } catch (error) {
    // 如果命令不支持，返回空列表
    res.json({ sessions: [] });
  }
});

// ==================== 辅助函数 ====================

async function buildDirectoryTree(dirPath, maxDepth = 3, currentDepth = 0) {
  try {
    if (currentDepth >= maxDepth) {
      return { name: path.basename(dirPath), type: 'folder', collapsed: true };
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(entry.name)) {
          nodes.push({
            name: entry.name,
            type: 'folder',
            path: fullPath,
            collapsed: true
          });
        } else {
          nodes.push({
            name: entry.name,
            type: 'folder',
            path: fullPath,
            children: await buildDirectoryTree(fullPath, maxDepth, currentDepth + 1)
          });
        }
      } else {
        nodes.push({
          name: entry.name,
          type: 'file',
          path: fullPath,
          ext: path.extname(entry.name)
        });
      }
    }

    return {
      name: path.basename(dirPath) || dirPath,
      type: 'folder',
      path: dirPath,
      children: nodes
    };

  } catch (error) {
    return { name: path.basename(dirPath), type: 'folder', error: error.message };
  }
}

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Claude Visual Client - 原型服务器                   ║
║                                                           ║
║        服务地址: http://localhost:${PORT}                    ║
║        版本: 0.2.0 (基于 Claude CLI)                      ║
║                                                           ║
║        Claude CLI: ${CLAUDE_CMD}                              ║
║        工作目录: ${WORK_DIR}             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log('按 Ctrl+C 停止服务器\n');
});
