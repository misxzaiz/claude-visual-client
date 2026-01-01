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

/** 空状态组件 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Logo 图标 */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-glow mb-6">
        <span className="text-3xl font-bold text-white">C</span>
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        Claude Code Pro
      </h1>

      {/* 描述 */}
      <p className="text-text-secondary mb-8 max-w-md">
        AI 驱动的代码助手，支持文件操作、代码编辑和智能分析
      </p>

      {/* 功能列表 */}
      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-success-faint flex items-center justify-center">
            <span className="text-success text-sm">📁</span>
          </div>
          <span className="text-xs text-text-tertiary">文件操作</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-warning-faint flex items-center justify-center">
            <span className="text-warning text-sm">⚡</span>
          </div>
          <span className="text-xs text-text-tertiary">快速编辑</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-primary-faint flex items-center justify-center">
            <span className="text-primary text-sm">🔍</span>
          </div>
          <span className="text-xs text-text-tertiary">代码分析</span>
        </div>
      </div>

      {/* 提示 */}
      <p className="text-text-tertiary text-sm mt-8">
        在下方输入框开始对话...
      </p>
    </div>
  );
}

export function ChatMessages({
  messages,
  currentContent = '',
  isStreaming = false,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // 自动滚动到底部（仅在有新消息时）
  useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current || currentContent) {
      if (scrollRef.current) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current?.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length, currentContent]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4"
    >
      <div className="max-w-3xl mx-auto h-full">
        {messages.length === 0 && !currentContent ? (
          <EmptyState />
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
