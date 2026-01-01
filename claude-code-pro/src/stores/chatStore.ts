/**
 * 聊天状态管理
 */

import { create } from 'zustand';
import type { Message, PermissionRequest, StreamEvent, ToolCall } from '../types';
import * as tauri from '../services/tauri';

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
  /** 当前会话的工具调用列表 */
  toolCalls: ToolCall[];

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
  toolCalls: [],

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
    const { currentContent, messages, toolCalls } = get();
    if (currentContent) {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: currentContent,
        timestamp: new Date().toISOString(),
        toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
      };
      set({
        messages: [...messages, newMessage],
        currentContent: '',
        toolCalls: []
      });
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

    switch (event.type) {
      case 'system':
        // 系统事件，保存会话 ID
        if (event.session_id) {
          set({ conversationId: event.session_id, isStreaming: true });
        }
        break;

      case 'assistant':
        // 助手消息 - 提取文本内容
        const textContent = event.message.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('');

        if (textContent) {
          set((state) => ({
            currentContent: state.currentContent + textContent
          }));
        }
        break;

      case 'session_start':
        set({ conversationId: event.sessionId, isStreaming: true });
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
        const newToolCall: ToolCall = {
          id: crypto.randomUUID(),
          name: event.toolName,
          status: 'running',
          input: event.input,
          startedAt: new Date().toISOString(),
        };
        set((state) => ({
          toolCalls: [...state.toolCalls, newToolCall]
        }));
        break;
      }

      case 'tool_end': {
        set((state) => ({
          toolCalls: state.toolCalls.map(tc =>
            tc.name === event.toolName && tc.status === 'running'
              ? { ...tc, status: 'completed', output: event.output, completedAt: new Date().toISOString() }
              : tc
          )
        }));
        break;
      }
    }
  },

  sendMessage: async (content: string) => {
    // 添加用户消息
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(userMessage);

    // 清空当前内容和工具调用，开始流式传输
    set({ currentContent: '', isStreaming: true, error: null, toolCalls: [] });

    try {
      const sessionId = await tauri.startChat(content);
      set({ conversationId: sessionId });
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
