/**
 * 聊天输入组件
 */

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '../Common';
import { IconSend, IconStop } from '../Common/Icons';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled && !isStreaming) {
      onSend(trimmed);
      setValue('');
      // 重置高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4 bg-background-secondary">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-background-tertiary border border-border-subtle rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-shadow">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-3 py-2 bg-transparent text-text placeholder:text-text-subtle resize-none outline-none text-sm leading-relaxed"
            rows={1}
            disabled={disabled}
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />

          {isStreaming && onInterrupt ? (
            <Button
              variant="danger"
              size="sm"
              onClick={onInterrupt}
              className="shrink-0 h-9 px-3"
            >
              <IconStop size={14} className="mr-1" />
              中断
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={disabled || isStreaming || !value.trim()}
              size="sm"
              className="shrink-0 h-9 px-3"
            >
              <IconSend size={14} className="mr-1" />
              发送
            </Button>
          )}
        </div>

        {/* 状态提示 */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-xs text-text-subtle">
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                正在生成回复...
              </span>
            ) : (
              <span>按 Enter 发送，Shift+Enter 换行</span>
            )}
          </div>
          <div className="text-xs text-text-subtle">
            {value.length > 0 && `${value.length} 字符`}
          </div>
        </div>
      </div>
    </div>
  );
}
