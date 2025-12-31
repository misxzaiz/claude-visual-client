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
const WORK_DIR = process.env.WORK_DIR;  // 如果未设置，则为 undefined
const PERMISSION_MODE = process.env.PERMISSION_MODE || 'bypassPermissions';

// Git Bash 配置
const GIT_BIN_PATH = process.env.CLAUDE_CODE_GIT_BIN_PATH;

// 直接修改 process.env，添加 Git 到 PATH
if (GIT_BIN_PATH) {
  console.log(`Git bin 目录: ${GIT_BIN_PATH}`);
  console.log(`已添加到系统 PATH`);
  process.env.PATH = `${GIT_BIN_PATH};${process.env.PATH}`;
}

console.log(`使用 Claude CLI: ${CLAUDE_CMD}`);
if (WORK_DIR) {
  console.log(`工作目录: ${WORK_DIR}`);
} else {
  console.log(`工作目录: (使用当前目录)`);
}

// 权限模式说明
const modeDescriptions = {
  'default': '每次操作需要确认',
  'dontAsk': '不询问但自动拒绝危险操作（写入/Bash被禁用）',
  'bypassPermissions': '自动允许所有操作 ⚠️',
  'acceptEdits': '自动允许编辑操作'
};

if (modeDescriptions[PERMISSION_MODE]) {
  console.log('');
  console.log(`权限模式: ${PERMISSION_MODE} (${modeDescriptions[PERMISSION_MODE]})`);
  if (PERMISSION_MODE === 'bypassPermissions') {
    console.log('⚠️  请确保你信任 Claude 的操作');
  }
  console.log('');
}

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

    const spawnOptions = {
      shell: true,  // 使用系统默认 shell
      ...options
    };

    // 只有在设置了 WORK_DIR 时才添加 cwd
    if (WORK_DIR) {
      spawnOptions.cwd = WORK_DIR;
    }

    const child = spawn(CLAUDE_CMD, cmdArgs, spawnOptions);

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
  const cmdArgs = [
    '--print',
    '--verbose',
    '--output-format', 'stream-json',
    '--permission-mode', PERMISSION_MODE,
    ...args
  ];

  console.log('[spawn] 命令:', CLAUDE_CMD);
  console.log('[spawn] 参数:', cmdArgs);
  console.log('[spawn] 工作目录:', WORK_DIR || '(使用当前目录)');
  console.log('[spawn] Git bin 目录:', GIT_BIN_PATH);
  console.log('[spawn] PERMISSION_MODE:', PERMISSION_MODE);

  const spawnOptions = {
    shell: true,  // 使用系统默认 shell
    stdio: ['ignore', 'pipe', 'pipe']
  };

  // 只有在设置了 WORK_DIR 时才添加 cwd
  if (WORK_DIR) {
    spawnOptions.cwd = WORK_DIR;
  }

  const child = spawn(CLAUDE_CMD, cmdArgs, spawnOptions);

  console.log('[spawn] PID:', child.pid);
  console.log('[spawn] stdout 存在:', !!child.stdout);
  console.log('[spawn] stderr 存在:', !!child.stderr);

  let buffer = '';
  let byteCount = 0;

  // 移除可选链，确保错误能被暴露
  if (!child.stdout) {
    onError('child.stdout is null!');
    return child;
  }

  child.stdout.on('data', (data) => {
    byteCount += data.length;
    const chunk = data.toString();
    console.log('[stdout] 接收', data.length, '字节, 总计:', byteCount);
    console.log('[stdout] 内容片段:', chunk.substring(0, 200));

    buffer += chunk;

    // 尝试解析每一行 JSON
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留未完成的行

    console.log('[stdout] 分割后行数:', lines.length);

    for (const line of lines) {
      if (line.trim()) {
        console.log('[stdout] 处理行:', line.substring(0, 100));
        try {
          const parsed = JSON.parse(line);
          console.log('[stdout] 解析成功, type:', parsed.type);
          onData(parsed);
        } catch (e) {
          // 不是有效的 JSON，可能是文本输出
          console.log('[stdout] JSON 解析失败:', e.message);
          if (line.trim()) {
            onData({ type: 'text', content: line });
          }
        }
      }
    }
  });

  child.stdout.on('end', () => {
    console.log('[stdout] 流结束');
  });

  if (!child.stderr) {
    onError('child.stderr is null!');
    return child;
  }

  child.stderr.on('data', (data) => {
    const msg = data.toString();
    console.error('[stderr]', msg);
    onError(msg);
  });

  child.stderr.on('end', () => {
    console.log('[stderr] 流结束');
  });

  child.on('close', (code) => {
    console.log('[process] 关闭, 退出码:', code);
    onComplete(code);
  });

  child.on('exit', (code) => {
    console.log('[process] 退出, 退出码:', code);
  });

  child.on('error', (err) => {
    console.error('[process] 错误:', err);
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
      const child = spawn(CLAUDE_CMD, ['--version'], {
        shell: true  // 使用系统默认 shell
      });
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
    console.error('[health] 健康检查失败:', error);
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
      // 调试：打印接收到的数据类型
      console.log('[claude event]:', data.type);

      // 处理不同类型的消息
      if (data.type === 'system') {
        // 系统初始化信息
        console.log('[claude]: System initialized, session:', data.session_id);
      }
      else if (data.type === 'assistant') {
        // 助手消息
        console.log('[claude]: Assistant message received');

        // 保存 session_id
        if (data.session_id) {
          conversation.sessionId = data.session_id;
        }

        // 提取消息内容
        if (data.message && data.message.content) {
          for (const item of data.message.content) {
            if (item.type === 'text' && item.text) {
              currentMessage += item.text;
              res.write(`data: ${JSON.stringify({ type: 'text', text: item.text })}\n\n`);
            }
            // TODO: 处理工具调用 (tool_use 类型)
            else if (item.type === 'tool_use') {
              const toolName = item.name;
              res.write(`data: ${JSON.stringify({ type: 'tool_start', tool: toolName })}\n\n`);
            }
          }
        }
      }
      else if (data.type === 'result') {
        // 结果事件，对话结束
        console.log('[claude]: Result received, subtype:', data.subtype);

        // 检查是否有权限被拒绝
        if (data.permission_denials && data.permission_denials.length > 0) {
          console.log('[permission] 权限被拒绝:', data.permission_denials);

          // 发送权限请求事件给前端
          res.write(`data: ${JSON.stringify({
            type: 'permission_request',
            denials: data.permission_denials,
            sessionId: data.session_id
          })}\n\n`);
        }

        // 保存到会话历史
        if (currentMessage) {
          conversation.messages.push({
            role: 'assistant',
            content: currentMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
      else if (data.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: data.error || data.message })}\n\n`);
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

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  const workDirDisplay = WORK_DIR || process.cwd();
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Claude Visual Client - 原型服务器                   ║
║                                                           ║
║        服务地址: http://localhost:${PORT}                    ║
║        版本: 0.2.0 (基于 Claude CLI)                      ║
║                                                           ║
║        Claude CLI: ${CLAUDE_CMD}                              ║
║        工作目录: ${workDirDisplay}             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log('按 Ctrl+C 停止服务器\n');
});
