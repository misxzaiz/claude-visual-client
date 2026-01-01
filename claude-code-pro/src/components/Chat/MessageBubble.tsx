/**
 * 消息气泡组件
 */

import { type Message } from '../../types';
import { clsx } from 'clsx';
import { useToolPanelStore } from '../../stores';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

/** 格式化消息内容（简单的 Markdown 处理） */
function formatContent(content: string) {
  // 代码块
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || '';
    const langLabel = lang ? `<span class="text-xs text-text-tertiary select-none float-right mt-1 ml-2">${lang}</span>` : '';
    return `<div class="relative my-3"><div class="flex items-center justify-between bg-background-surface px-3 py-1.5 rounded-t-lg border-b border-border-subtle"><span class="text-xs text-text-tertiary">代码</span>${langLabel}</div><pre class="bg-background-elevated p-3 rounded-b-lg overflow-x-auto"><code class="text-sm text-text-secondary">${code.trim()}</code></pre></div>`;
  });

  // 行内代码
  content = content.replace(/`([^`]+)`/g, '<code class="bg-primary-faint text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // 粗体
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 斜体
  content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 换行
  content = content.replace(/\n/g, '<br>');

  return content;
}

/** 工具摘要标签 */
function ToolSummary({ summary, onClick }: { summary: NonNullable<Message['toolSummary']>; onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      {summary.names.slice(0, 4).map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1.5 px-2 py-1
                   bg-background-surface border border-border-subtle
                   rounded-lg text-xs text-text-tertiary
                   font-mono"
        >
          <span className="w-1 h-1 rounded-full bg-success" />
          {name}
        </span>
      ))}
      {summary.names.length > 4 && (
        <span className="text-xs text-text-muted">+{summary.names.length - 4}</span>
      )}
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
      >
        查看
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const { isOpen: toolPanelOpen, setOpen: setToolPanelOpen } = useToolPanelStore();

  const handleToolClick = () => {
    if (!toolPanelOpen) {
      setToolPanelOpen(true);
    }
  };

  // 用户消息 - 右对齐，渐变背景
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] px-4 py-3 rounded-2xl
                    bg-gradient-to-br from-primary to-primary-600
                    text-white shadow-glow">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // 系统消息
  if (isSystem) {
    return (
      <div className="flex justify-center mb-6">
        <p className="text-sm text-text-muted italic">{message.content}</p>
      </div>
    );
  }

  // Claude 消息 - 左侧布局，头像 + 内容
  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-600
                      flex items-center justify-center shadow-glow shrink-0">
        <span className="text-sm font-bold text-white">C</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 space-y-1">
        {/* 头部信息 */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-text-primary">Claude</span>
          {message.timestamp && (
            <span className="text-xs text-text-tertiary">
              {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* 消息内容 */}
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* 流式光标 */}
        {isStreaming && (
          <span className="inline-flex ml-1">
            <span className="flex gap-0.5 items-end h-4">
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </span>
        )}

        {/* 工具摘要标签 */}
        {!isStreaming && message.toolSummary && (
          <ToolSummary summary={message.toolSummary} onClick={handleToolClick} />
        )}
      </div>
    </div>
  );
}
