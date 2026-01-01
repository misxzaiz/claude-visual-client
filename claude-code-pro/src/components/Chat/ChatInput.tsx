/**
 * 聊天输入组件
 */

import { useState, KeyboardEvent } from 'react';
import { Button } from '../Common';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onInterrupt?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  isStreaming = false,
  onInterrupt
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled && !isStreaming) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 items-end">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-4 py-3 bg-background-tertiary border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={1}
            disabled={disabled}
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
          {isStreaming && onInterrupt ? (
            <Button
              variant="danger"
              onClick={onInterrupt}
              className="h-11"
            >
              中断
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={disabled || isStreaming || !value.trim()}
              className="h-11"
            >
              发送
            </Button>
          )}
        </div>
        <div className="text-xs text-text-muted mt-2">
          {isStreaming ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
              正在生成回复...
            </span>
          ) : (
            <span>按 Enter 发送，Shift+Enter 换行</span>
          )}
        </div>
      </div>
    </div>
  );
}
