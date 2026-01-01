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
    const langLabel = lang ? `<span class="text-xs text-text-subtle select-none float-right mt-1 ml-2">${lang}</span>` : '';
    return `<div class="relative my-3"><div class="flex items-center justify-between bg-background-elevation px-3 py-1.5 rounded-t-lg border-b border-border-subtle"><span class="text-xs text-text-subtle">代码</span>${langLabel}</div><pre class="bg-background-secondary p-3 rounded-b-lg overflow-x-auto"><code class="text-sm text-text">${code.trim()}</code></pre></div>`;
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
    <div className="flex items-center gap-2 mt-2 px-4 pb-2">
      <div className="flex items-center gap-1.5 text-xs text-text-subtle">
        <span>使用</span>
        <span className="flex gap-1">
          {summary.names.slice(0, 3).map((name) => (
            <span
              key={name}
              className="px-1.5 py-0.5 bg-background-elevation rounded text-text-muted font-mono"
            >
              {name}
            </span>
          ))}
          {summary.names.length > 3 && (
            <span className="text-text-subtle">+{summary.names.length - 3}</span>
          )}
        </span>
        <span>共 {summary.count} 个工具</span>
      </div>
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
      >
        查看详情
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

  // 流式传输时，从工具面板获取当前工具列表
  const toolPanelStore = useToolPanelStore();
  const streamingTools = isStreaming ? toolPanelStore.tools : undefined;

  const handleToolClick = () => {
    if (!toolPanelOpen) {
      setToolPanelOpen(true);
    }
  };

  return (
    <div
      className={clsx(
        'flex w-full mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      <div
        className={clsx(
          'max-w-[85%] rounded-2xl shadow-soft',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary-hover text-white rounded-br-md'
            : 'bg-background-tertiary text-text border border-border-subtle rounded-bl-md',
          isSystem && 'bg-transparent text-text-subtle text-sm italic border-none shadow-none'
        )}
      >
        {/* 消息头部 */}
        {!isUser && !isSystem && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-xs font-medium text-text-subtle">Claude</span>
            {message.timestamp && (
              <span className="text-xs text-text-subtle ml-auto">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* 消息内容 */}
        <div
          className={clsx(
            'px-4 pb-3 prose prose-invert prose-sm max-w-none',
            isUser ? 'py-3 text-white' : ''
          )}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* 流式光标 */}
        {isStreaming && !isUser && (
          <span className="inline-flex ml-4 mb-3">
            <span className="flex gap-0.5 items-end h-4">
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </span>
        )}

        {/* 工具摘要标签（替代内嵌时间线） */}
        {!isUser && !isSystem && message.toolSummary && !isStreaming && (
          <ToolSummary summary={message.toolSummary} onClick={handleToolClick} />
        )}
      </div>
    </div>
  );
}
