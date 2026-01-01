/**
 * 聊天状态管理
 */

import { create } from 'zustand';
import type { Message, PermissionRequest, StreamEvent } from '../types';
import * as tauri from '../services/tauri';
import { useToolPanelStore, updateToolByToolUseId } from './toolPanelStore';

interface ChatState {
  /** 消息列表 */
  messages: Message[];
  /** 当前会话 ID */
  conversationId: string | null;
  /** 是否正在流式传输 */
  isStreaming: boolean;
  /** 当前正在输入的内容（用于流式追加） */
  currentContent: string;
  /** 待处理的权限请求 */
  pendingPermission: PermissionRequest | null;
  /** 错误 */
  error: string | null;

  /** 添加消息 */
  addMessage: (message: Message) => void;
  /** 清空消息 */
  clearMessages: () => void;
  /** 设置会话 ID */
  setConversationId: (id: string | null) => void;
  /** 设置流式状态 */
  setStreaming: (streaming: boolean) => void;
  /** 追加流式内容 */
  appendContent: (text: string) => void;
  /** 完成当前消息 */
  finishMessage: () => void;
  /** 设置权限请求 */
  setPermissionRequest: (request: PermissionRequest | null) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 处理流事件 */
  handleStreamEvent: (event: StreamEvent) => void;

  /** 发送消息 */
  sendMessage: (content: string) => Promise<void>;
  /** 继续会话 */
  continueChat: () => Promise<void>;
  /** 中断会话 */
  interruptChat: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  isStreaming: false,
  currentContent: '',
  pendingPermission: null,
  error: null,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  clearMessages: () => {
    set({
      messages: [],
      currentContent: '',
      conversationId: null
    });
    // 同时清空工具面板
    useToolPanelStore.getState().clearTools();
  },

  setConversationId: (id) => {
    set({ conversationId: id });
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  appendContent: (text) => {
    set((state) => ({
      currentContent: state.currentContent + text
    }));
  },

  finishMessage: () => {
    const { currentContent, messages } = get();
    const toolPanelStore = useToolPanelStore.getState();

    if (currentContent) {
      // 从工具面板获取工具摘要
      const tools = toolPanelStore.tools;
      const toolSummary = tools.length > 0 ? {
        count: tools.length,
        names: Array.from(new Set(tools.map(t => t.name)))
      } : undefined;

      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: currentContent,
        timestamp: new Date().toISOString(),
        toolSummary,
      };
      set({
        messages: [...messages, newMessage],
        currentContent: ''
      });

      // 清空工具面板（为下次对话准备）
      // 注意：这里保留工具用于查看，不清空
    }
  },

  setPermissionRequest: (request) => {
    set({ pendingPermission: request });
  },

  setError: (error) => {
    set({ error });
  },

  handleStreamEvent: (event) => {
    const state = get();
    const toolPanelStore = useToolPanelStore.getState();

    switch (event.type) {
      case 'system':
        // 系统事件，保存会话 ID
        if (event.session_id) {
          set({ conversationId: event.session_id, isStreaming: true });
          console.log('[handleStreamEvent] 设置真实会话ID:', event.session_id);
        }
        break;

      case 'assistant': {
        // 助手消息 - 提取文本内容和工具调用
        const textContent = event.message.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('');

        if (textContent) {
          set((state) => ({
            currentContent: state.currentContent + textContent
          }));
        }

        // 提取工具调用 (tool_use 类型) 并发送到工具面板
        const toolUseBlocks = event.message.content.filter(
          (item) => item.type === 'tool_use'
        );

        for (const block of toolUseBlocks) {
          if (block.id && block.name && block.input) {
            toolPanelStore.addTool({
              id: block.id,
              name: block.name,
              status: 'running',
              input: block.input,
              startedAt: new Date().toISOString(),
            });
          }
        }

        // 如果 stop_reason 是 tool_use，说明等待工具执行
        if (event.message.stop_reason === 'tool_use') {
          // 继续等待工具结果
        }
        break;
      }

      case 'user': {
        // 用户消息 - 包含工具执行结果 (tool_result 类型)
        const toolResults = event.message.content.filter(
          (item) => item.type === 'tool_result'
        );

        for (const result of toolResults) {
          if (result.tool_use_id) {
            // 更新工具面板中的工具状态
            toolPanelStore.updateTool(result.tool_use_id, {
              status: result.is_error ? 'failed' : 'completed',
              output: result.content || '',
              completedAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'session_start':
        set({ conversationId: event.sessionId, isStreaming: true });
        console.log('[handleStreamEvent] session_start 设置会话ID:', event.sessionId);
        // 清空之前的工具调用
        toolPanelStore.clearTools();
        break;

      case 'text_delta':
        set((state) => ({
          currentContent: state.currentContent + event.text
        }));
        break;

      case 'result':
      case 'session_end':
        // 会话结束，完成消息
        state.finishMessage();
        set({ isStreaming: false });
        break;

      case 'error':
        set({
          error: event.error,
          isStreaming: false
        });
        break;

      case 'permission_request':
        set({
          pendingPermission: {
            id: crypto.randomUUID(),
            sessionId: event.sessionId,
            denials: event.denials,
            createdAt: new Date().toISOString(),
          }
        });
        break;

      case 'tool_start': {
        // 兼容旧格式事件
        const toolId = crypto.randomUUID();
        toolPanelStore.addTool({
          id: toolId,
          name: event.toolName,
          status: 'running',
          input: event.input,
          startedAt: new Date().toISOString(),
        });
        break;
      }

      case 'tool_end': {
        // 兼容旧格式事件 - 通过名称查找并更新
        const tools = toolPanelStore.tools;
        const runningTool = tools.find(t => t.name === event.toolName && t.status === 'running');
        if (runningTool) {
          toolPanelStore.updateTool(runningTool.id, {
            status: 'completed',
            output: event.output,
            completedAt: new Date().toISOString(),
          });
        }
        break;
      }
    }
  },

  sendMessage: async (content: string) => {
    const { conversationId } = get();
    
    // 添加用户消息
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(userMessage);

    // 清空当前内容，开始流式传输
    set({ currentContent: '', isStreaming: true, error: null });

    // 清空工具面板
    useToolPanelStore.getState().clearTools();

    try {
      if (conversationId) {
        // 继续现有会话
        await tauri.continueChat(conversationId, content);
        console.log('[sendMessage] 继续会话:', conversationId);
      } else {
        // 创建新会话 - 不设置会话ID，等待system事件返回真实ID
        await tauri.startChat(content);
        console.log('[sendMessage] 创建新会话，等待system事件返回真实session_id');
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '发送消息失败',
        isStreaming: false
      });
    }
  },

  continueChat: async () => {
    const { conversationId } = get();
    if (!conversationId) {
      set({ error: '没有活动会话' });
      return;
    }

    set({ isStreaming: true, error: null, currentContent: '' });

    try {
      await tauri.continueChat(conversationId);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '继续对话失败',
        isStreaming: false
      });
    }
  },

  interruptChat: async () => {
    const { conversationId } = get();
    if (!conversationId) return;

    try {
      await tauri.interruptChat(conversationId);
      set({ isStreaming: false });
      // 完成当前消息
      get().finishMessage();
    } catch (e) {
      console.error('中断失败:', e);
    }
  },
}));
