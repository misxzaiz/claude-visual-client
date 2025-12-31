/**
 * Claude Visual Client - 前端应用
 * 基于 Claude CLI 的版本
 */

// 使用相对路径，自动适配服务器的实际端口
const API_BASE = '/api';

// 应用状态
const state = {
  conversationId: null,
  sessionId: null,
  isConnected: false,
  isStreaming: false,
  currentMessage: '',
  toolCalls: [],
  pendingPermission: null  // 待处理的权限请求
};

// DOM 元素
const elements = {
  connectionStatus: document.getElementById('connectionStatus'),
  chatMessages: document.getElementById('chatMessages'),
  messageInput: document.getElementById('messageInput'),
  sendMessage: document.getElementById('sendMessage'),
  clearChat: document.getElementById('clearChat'),
  continueChat: document.getElementById('continueChat'),
  taskList: document.getElementById('taskList'),
  refreshTasks: document.getElementById('refreshTasks'),
  toolLog: document.getElementById('toolLog'),
  clearTools: document.getElementById('clearTools'),
  // 权限弹窗元素
  permissionModal: document.getElementById('permissionModal'),
  permissionList: document.getElementById('permissionList'),
  allowPermission: document.getElementById('allowPermission'),
  denyPermission: document.getElementById('denyPermission')
};

// ==================== 初始化 ====================

async function init() {
  console.log('Claude Visual Client 初始化中...');

  // 绑定事件
  elements.sendMessage.addEventListener('click', sendMessage);
  elements.clearChat.addEventListener('click', clearChat);

  // 继续对话按钮（如果有）
  if (elements.continueChat) {
    elements.continueChat.addEventListener('click', continueConversation);
  }

  elements.refreshTasks.addEventListener('click', () => renderTasks([]));
  elements.clearTools.addEventListener('click', clearToolLog);

  // 输入框事件
  elements.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 自动调整输入框高度
  elements.messageInput.addEventListener('input', () => {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 150) + 'px';
  });

  // 权限弹窗事件
  if (elements.allowPermission) {
    elements.allowPermission.addEventListener('click', () => handlePermissionResponse(true));
  }
  if (elements.denyPermission) {
    elements.denyPermission.addEventListener('click', () => handlePermissionResponse(false));
  }

  // 检查连接
  await checkConnection();

  console.log('初始化完成');
}

// ==================== 连接管理 ====================

async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    state.isConnected = data.status === 'ok';
    updateConnectionStatus(state.isConnected, data);

    return state.isConnected;
  } catch (error) {
    console.error('连接检查失败:', error);
    updateConnectionStatus(false, {});
    return false;
  }
}

function updateConnectionStatus(connected, data) {
  const status = elements.connectionStatus;
  const dot = status.querySelector('.dot');
  const text = status.querySelector('.text');

  status.className = 'status-indicator';

  if (!connected) {
    status.classList.add('offline');
    text.textContent = '未连接';
  } else {
    status.classList.add('online');
    const version = data.claudeVersion ? ` (CLI ${data.claudeVersion})` : '';
    text.textContent = `已连接${version}`;
  }
}

// ==================== 对话功能 ====================

async function sendMessage() {
  const message = elements.messageInput.value.trim();
  if (!message || state.isStreaming) return;

  if (!state.isConnected) {
    addSystemMessage('⚠️ 未连接到服务器，请检查服务器是否运行');
    return;
  }

  // 清空输入框
  elements.messageInput.value = '';
  elements.messageInput.style.height = 'auto';

  // 显示用户消息
  addMessage('user', message);

  // 开始流式对话
  await streamChat(message, state.conversationId);
}

async function continueConversation() {
  if (state.isStreaming) return;

  if (!state.conversationId) {
    addSystemMessage('⚠️ 没有可继续的对话');
    return;
  }

  await streamChat(null, state.conversationId, true);
}

async function streamChat(message, conversationId, isContinue = false) {
  state.isStreaming = true;
  elements.sendMessage.disabled = true;

  // 创建助手消息容器
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.id = 'current-message';
  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="message-role assistant">Claude</span>
      <span class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
  `;
  elements.chatMessages.appendChild(messageDiv);
  scrollToBottom();

  const contentDiv = messageDiv.querySelector('.message-content');
  let fullText = '';

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId,
        continue: isContinue
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 移除正在输入动画
    const typing = contentDiv.querySelector('.typing-indicator');
    if (typing) typing.remove();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            continue;
          }

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'session_start':
                state.conversationId = event.conversationId;
                console.log('会话 ID:', event.conversationId);
                break;

              case 'text':
                fullText += event.text;
                contentDiv.innerHTML = formatMessage(fullText);
                scrollToBottom();
                break;

              case 'tool_start':
                addToolLog(event.tool, '执行中...');
                break;

              case 'tool_end':
                updateToolLog(event.tool, '完成');
                break;

              case 'permission_request':
                // 处理权限请求
                console.log('权限请求:', event);
                showPermissionModal(event);
                break;

              case 'error':
                contentDiv.innerHTML += `<p style="color: var(--error);">错误: ${escapeHtml(event.error)}</p>`;
                break;
            }

          } catch (e) {
            console.error('解析 SSE 数据失败:', e, data);
          }
        }
      }
    }

    // 移除临时 ID
    messageDiv.removeAttribute('id');

  } catch (error) {
    console.error('请求失败:', error);
    const messageEl = document.getElementById('current-message');
    if (messageEl) {
      const content = messageEl.querySelector('.message-content');
      content.innerHTML += `<p style="color: var(--error);">请求失败: ${escapeHtml(error.message)}</p>`;
      messageEl.removeAttribute('id');
    } else {
      addSystemMessage(`❌ 请求失败: ${error.message}`);
    }
  } finally {
    state.isStreaming = false;
    elements.sendMessage.disabled = false;
  }
}

function addMessage(role, content) {
  // 移除欢迎消息
  const welcome = elements.chatMessages.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';

  const roleNames = {
    user: '用户',
    assistant: 'Claude'
  };

  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="message-role ${role}">${roleNames[role]}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${formatMessage(content)}</div>
  `;

  elements.chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function addSystemMessage(content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.innerHTML = `
    <div class="message-content" style="color: var(--warning);">${content}</div>
  `;
  elements.chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function formatMessage(content) {
  if (!content) return '';

  // 转义 HTML
  let formatted = escapeHtml(content);

  // 代码块
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // 行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:2px 6px;border-radius:4px;">$1</code>');

  // 段落
  const paragraphs = formatted.split('\n\n');
  if (paragraphs.length > 1 || formatted.includes('\n')) {
    formatted = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  return formatted;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function clearChat() {
  if (confirm('确定要清空对话吗？')) {
    elements.chatMessages.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h2>对话已清空</h2>
        <p class="hint">在下方输入框中开始新对话...</p>
      </div>
    `;
    state.conversationId = null;
  }
}

// ==================== 任务管理 ====================

function renderTasks(tasks) {
  if (!tasks.length) {
    elements.taskList.innerHTML = '<div class="empty-state">暂无任务</div>';
    return;
  }

  elements.taskList.innerHTML = tasks.map(task => `
    <div class="task-item">
      <div class="task-status ${task.status}"></div>
      <div class="task-content ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.content)}</div>
    </div>
  `).join('');
}

// ==================== 工具日志 ====================

function addToolLog(toolName, detail) {
  const logItem = document.createElement('div');
  logItem.className = 'tool-item';
  logItem.id = `tool-${toolName}`;
  logItem.innerHTML = `
    <div class="tool-name">${escapeHtml(toolName)}</div>
    <div class="tool-detail">${escapeHtml(detail)}</div>
  `;

  const emptyState = elements.toolLog.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  elements.toolLog.insertBefore(logItem, elements.toolLog.firstChild);
}

function updateToolLog(toolName, detail) {
  const logItem = document.getElementById(`tool-${toolName}`);
  if (logItem) {
    const detailEl = logItem.querySelector('.tool-detail');
    if (detailEl) detailEl.textContent = detail;
  }
}

function clearToolLog() {
  elements.toolLog.innerHTML = '<div class="empty-state">暂无工具调用</div>';
}

// ==================== 权限处理 ====================

// 显示权限确认弹窗
function showPermissionModal(event) {
  state.pendingPermission = event;

  // 保存 sessionId 用于恢复会话
  if (event.sessionId) {
    state.sessionId = event.sessionId;
  }

  // 生成权限列表 HTML
  const denials = event.denials || [];
  let html = '';

  for (const denial of denials) {
    const toolName = denial.tool_name || 'Unknown';
    const input = denial.tool_input || {};

    html += `
      <div class="permission-item">
        <div class="permission-tool">${escapeHtml(toolName)}</div>
        <div class="permission-detail">${formatPermissionInput(toolName, input)}</div>
      </div>
    `;
  }

  elements.permissionList.innerHTML = html;
  elements.permissionModal.classList.add('show');
}

// 格式化权限输入详情
function formatPermissionInput(toolName, input) {
  switch (toolName) {
    case 'Write':
      return `写入文件: ${escapeHtml(input.file_path || '')}`;
    case 'Edit':
      return `编辑文件: ${escapeHtml(input.file_path || '')}`;
    case 'Bash':
      return `执行命令: ${escapeHtml(input.command || '')}`;
    case 'Read':
      return `读取文件: ${escapeHtml(input.file_path || '')}`;
    default:
      return escapeHtml(JSON.stringify(input));
  }
}

// 处理权限响应（允许/拒绝）
async function handlePermissionResponse(allowed) {
  // 关闭弹窗
  elements.permissionModal.classList.remove('show');

  if (!allowed) {
    addSystemMessage('❌ 权限请求已被拒绝');
    return;
  }

  // 允许后发送继续消息
  addSystemMessage('⏳ 权限已授予，继续执行...');

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        continue: true,
        conversationId: state.conversationId
      })
    });

    // 处理继续对话的流式响应
    await handleContinueResponse(response);
  } catch (error) {
    addSystemMessage(`❌ 继续执行失败: ${error.message}`);
  }
}

// 处理继续对话的响应
async function handleContinueResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // 找到当前消息容器
  const messageDiv = document.querySelector('.message[id="current-message"]') ||
                     document.createElement('div');
  if (!messageDiv.id) {
    messageDiv.className = 'message';
    messageDiv.id = 'current-message';
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-role assistant">Claude</span>
        <span class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="message-content"></div>
    `;
    elements.chatMessages.appendChild(messageDiv);
  }

  const contentDiv = messageDiv.querySelector('.message-content');
  let fullText = contentDiv.textContent || '';

  state.isStreaming = true;
  elements.sendMessage.disabled = true;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'text') {
            fullText += event.text;
            contentDiv.innerHTML = formatMessage(fullText);
            scrollToBottom();
          }
        } catch (e) {
          console.error('解析继续响应失败:', e);
        }
      }
    }
  }

  messageDiv.removeAttribute('id');
  state.isStreaming = false;
  elements.sendMessage.disabled = false;
}

// ==================== 启动应用 ====================

document.addEventListener('DOMContentLoaded', init);

// 全局函数（供 HTML 调用）
// （无）
