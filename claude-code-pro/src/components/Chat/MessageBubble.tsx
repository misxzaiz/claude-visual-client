/**
 * 消息气泡组件
 */

import { type Message } from '../../types';
import { clsx } from 'clsx';
import { ToolCallTimeline } from './ToolCallTimeline';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  /** 当前活动的工具调用（流式传输时） */
  activeToolCalls?: Message['toolCalls'];
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

export function MessageBubble({ message, isStreaming, activeToolCalls }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // 显示的工具调用：流式时用 activeToolCalls，否则用 message.toolCalls
  const toolCallsToShow = isStreaming ? activeToolCalls : message.toolCalls;

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

        {/* 工具调用时间线 */}
        {!isUser && !isSystem && toolCallsToShow && toolCallsToShow.length > 0 && (
          <div className="px-4 pb-3">
            <ToolCallTimeline toolCalls={toolCallsToShow} />
          </div>
        )}
      </div>
    </div>
  );
}
