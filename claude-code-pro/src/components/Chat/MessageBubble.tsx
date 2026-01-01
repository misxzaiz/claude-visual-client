/**
 * 消息气泡组件
 */

import { type Message } from '../../types';
import { clsx } from 'clsx';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

/** 格式化消息内容（简单的 Markdown 处理） */
function formatContent(content: string) {
  // 代码块
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre class="bg-background-tertiary p-3 rounded-md overflow-x-auto my-2"><code class="text-sm">${code.trim()}</code></pre>`;
  });

  // 行内代码
  content = content.replace(/`([^`]+)`/g, '<code class="bg-background-tertiary px-1.5 py-0.5 rounded text-sm">$1</code>');

  // 换行
  content = content.replace(/\n/g, '<br>');

  return content;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={clsx(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      <div
        className={clsx(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-background'
            : 'bg-background-tertiary text-text',
          isSystem && 'text-text-muted text-sm italic'
        )}
      >
        {!isUser && !isSystem && (
          <div className="text-xs text-text-muted mb-1">Claude</div>
        )}
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-text-muted animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
