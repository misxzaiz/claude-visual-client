/**
 * 聊天相关 Hook
 */

import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { StreamEvent } from '../types';

/** 监听聊天流式事件 */
export function useChatEvent(
  onEvent: (event: StreamEvent) => void,
  onError?: (error: string) => void
) {
  useEffect(() => {
    const unlistenPromise = listen<string>('chat-event', (event) => {
      try {
        const data = JSON.parse(event.payload) as StreamEvent;
        onEvent(data);
      } catch (e) {
        console.error('Failed to parse chat event:', e);
        onError?.(e instanceof Error ? e.message : '解析事件失败');
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onEvent, onError]);
}

/** 发送消息 Hook */
export function useSendMessage() {
  const sendMessage = useCallback(async (message: string) => {
    const { startChat } = await import('../services/tauri');
    return await startChat(message);
  }, []);

  return { sendMessage };
}

/** 继续对话 Hook */
export function useContinueChat() {
  const continueChat = useCallback(async (sessionId: string) => {
    const { continueChat: cont } = await import('../services/tauri');
    return await cont(sessionId);
  }, []);

  return { continueChat };
}

/** 中断对话 Hook */
export function useInterruptChat() {
  const interruptChat = useCallback(async (sessionId: string) => {
    const { interruptChat: interrupt } = await import('../services/tauri');
    return await interrupt(sessionId);
  }, []);

  return { interruptChat };
}
