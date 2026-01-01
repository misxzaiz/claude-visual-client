/**
 * 聊天状态管理
 */

import { create } from 'zustand';
import type { Message, PermissionRequest } from '../types';

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

  /** 发送消息（待实现） */
  sendMessage: (content: string) => Promise<void>;
  /** 继续会话（待实现） */
  continueChat: () => Promise<void>;
  /** 中断会话（待实现） */
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
    if (currentContent) {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: currentContent,
        timestamp: new Date().toISOString(),
      };
      set({
        messages: [...messages, newMessage],
        currentContent: ''
      });
    }
  },

  setPermissionRequest: (request) => {
    set({ pendingPermission: request });
  },

  setError: (error) => {
    set({ error });
  },

  // 待实现的命令
  sendMessage: async (_content: string) => {
    // TODO: 实现 send_message Tauri 命令后调用
    console.log('sendMessage 待实现');
  },

  continueChat: async () => {
    // TODO: 实现 continue_chat Tauri 命令后调用
    console.log('continueChat 待实现');
  },

  interruptChat: async () => {
    // TODO: 实现 interrupt_chat Tauri 命令后调用
    console.log('interruptChat 待实现');
  },
}));
