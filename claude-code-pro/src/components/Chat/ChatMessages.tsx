/**
 * 聊天消息列表组件
 */

import { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  currentContent?: string;
  isStreaming?: boolean;
}

export function ChatMessages({
  messages,
  currentContent = '',
  isStreaming = false
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentContent]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4"
    >
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 && !currentContent ? (
          <div className="text-center text-text-muted py-20">
            <p className="text-lg mb-2">欢迎使用 Claude Code Pro</p>
            <p className="text-sm">开始与 Claude 对话</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {currentContent && (
              <MessageBubble
                message={{
                  id: 'current',
                  role: 'assistant',
                  content: currentContent,
                  timestamp: new Date().toISOString(),
                }}
                isStreaming={isStreaming}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
