/**
 * 工具调用时间线组件
 */

import { type ToolCall } from '../../types';
import { clsx } from 'clsx';

interface ToolCallTimelineProps {
  toolCalls: ToolCall[];
}

/** 格式化时间戳 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** 计算持续时间 */
function getDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** 获取状态图标 */
function getStatusIcon(status: ToolCall['status']): string {
  switch (status) {
    case 'pending':
      return '○';
    case 'running':
      return '⟳';
    case 'completed':
      return '✓';
    case 'failed':
      return '✕';
  }
}

/** 获取状态颜色类名 */
function getStatusColor(status: ToolCall['status']): string {
  switch (status) {
    case 'pending':
      return 'text-text-muted';
    case 'running':
      return 'text-warning animate-pulse';
    case 'completed':
      return 'text-success';
    case 'failed':
      return 'text-error';
  }
}

/** 截断长字符串 */
function truncate(str: string, maxLen = 50): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

export function ToolCallTimeline({ toolCalls }: ToolCallTimelineProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="mt-3 border-l-2 border-background-tertiary pl-3 ml-1">
      <div className="text-xs text-text-muted mb-2 flex items-center gap-2">
        <span>工具调用</span>
        <span className="bg-background-tertiary px-1.5 py-0.5 rounded text-text">
          {toolCalls.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {toolCalls.map((tool, index) => (
          <div
            key={tool.id || index}
            className="text-sm group"
          >
            <div className="flex items-center gap-2">
              <span className={clsx('text-xs', getStatusColor(tool.status))}>
                {getStatusIcon(tool.status)}
              </span>
              <span className="font-mono text-text text-xs">
                {tool.name}
              </span>
              {tool.completedAt && (
                <span className="text-xs text-text-muted">
                  {getDuration(tool.startedAt, tool.completedAt)}
                </span>
              )}
            </div>

            {/* 工具输入（仅在运行或完成时显示，可折叠） */}
            {tool.input && Object.keys(tool.input).length > 0 && (
              <details className="ml-4 mt-1 group-details:open">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-text transition-colors select-none">
                  输入
                </summary>
                <pre className="text-xs bg-background-tertiary p-2 rounded mt-1 overflow-x-auto">
                  {truncate(JSON.stringify(tool.input, null, 2), 200)}
                </pre>
              </details>
            )}

            {/* 工具输出（仅在完成时显示，可折叠） */}
            {tool.output && (
              <details className="ml-4 mt-1">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-text transition-colors select-none">
                  输出
                </summary>
                <pre className="text-xs bg-background-tertiary p-2 rounded mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                  {truncate(tool.output, 500)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
