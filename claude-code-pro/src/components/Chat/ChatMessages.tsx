/**
 * 聊天消息列表组件
 */

import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  currentContent?: string;
  isStreaming?: boolean;
}

/** 空状态组件 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Logo 图标 */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-glow mb-6 hover:shadow-glow-lg transition-all">
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
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border shadow-soft hover:shadow-medium hover:border-border-strong transition-all">
          <div className="w-8 h-8 rounded-lg bg-success-faint flex items-center justify-center">
            <span className="text-success text-sm">📁</span>
          </div>
          <span className="text-xs text-text-tertiary">文件操作</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border shadow-soft hover:shadow-medium hover:border-border-strong transition-all">
          <div className="w-8 h-8 rounded-lg bg-warning-faint flex items-center justify-center">
            <span className="text-warning text-sm">⚡</span>
          </div>
          <span className="text-xs text-text-tertiary">快速编辑</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-surface border border-border shadow-soft hover:shadow-medium hover:border-border-strong transition-all">
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
});

export function ChatMessages({
  messages,
  currentContent = '',
  isStreaming = false,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const prevContentLengthRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 智能滚动：只在内容实际增长时滚动，并添加节流
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current?.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      });
    }
  }, []);

  useEffect(() => {
    const contentLength = currentContent.length;
    const hasNewMessage = messages.length !== prevMessagesLengthRef.current;
    const hasContentGrowth = contentLength > prevContentLengthRef.current;

    // 只在有新消息或内容增长时滚动
    if (hasNewMessage || (isStreaming && hasContentGrowth)) {
      // 清除之前的定时器（节流）
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 流式更新时使用即时滚动（减少延迟感），完成后使用平滑滚动
      if (isStreaming && currentContent) {
        scrollToBottom(false); // 即时滚动，避免动画堆积
      } else {
        // 节流：限制滚动频率
        scrollTimeoutRef.current = setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      }

      prevMessagesLengthRef.current = messages.length;
      prevContentLengthRef.current = contentLength;
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length, currentContent, isStreaming, scrollToBottom]);

  // 缓存消息列表渲染，避免不必要的重新创建
  const messageElements = useMemo(() => {
    return messages.map((message) => (
      <MessageBubble key={message.id} message={message} />
    ));
  }, [messages]);

  // 缓存当前流式消息元素
  const currentMessageElement = useMemo(() => {
    if (!currentContent) return null;
    return (
      <MessageBubble
        message={{
          id: 'current',
          role: 'assistant',
          content: currentContent,
          timestamp: new Date().toISOString(),
        }}
        isStreaming={isStreaming}
      />
    );
  }, [currentContent, isStreaming]);

  const isEmpty = messages.length === 0 && !currentContent;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4"
    >
      <div className="max-w-3xl mx-auto h-full">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {messageElements}
            {currentMessageElement}
          </>
        )}
      </div>
    </div>
  );
}
