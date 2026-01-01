/**
 * 工具详情组件
 */

import React from 'react';
import { useToolPanelStore } from '../../stores';
import type { ToolCall } from '../../types';
import { clsx } from 'clsx';
import {
  IconPending, IconRunning, IconCompleted, IconFailed, IconCopy
} from '../Common/Icons';

interface ToolDetailProps {
  toolId: string;
  onBack: () => void;
}

/** 计算持续时间 */
function formatDuration(startedAt: string, completedAt?: string): string {
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const start = new Date(startedAt).getTime();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** 格式化时间戳 */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/** 复制到剪贴板 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/** 获取状态显示 */
function getStatusInfo(status: ToolCall['status']) {
  const StatusIcon = {
    pending: IconPending,
    running: IconRunning,
    completed: IconCompleted,
    failed: IconFailed,
  }[status];

  const statusText = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }[status];

  const statusColor = {
    pending: 'text-text-muted',
    running: 'text-warning',
    completed: 'text-success',
    failed: 'text-error',
  }[status];

  return { StatusIcon, statusText, statusColor };
}

export function ToolDetail({ toolId, onBack }: ToolDetailProps) {
  const tools = useToolPanelStore((state) => state.tools);
  const tool = tools.find(t => t.id === toolId);

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-subtle text-sm">工具不存在</p>
      </div>
    );
  }

  const { StatusIcon, statusText, statusColor } = getStatusInfo(tool.status);

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background-tertiary">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-text-subtle hover:text-text transition-colors rounded hover:bg-background-hover"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-mono text-sm font-medium text-text">{tool.name}</span>
        <div className={clsx('flex items-center gap-1.5 ml-auto', statusColor)}>
          <StatusIcon size={14} />
          <span className="text-xs">{statusText}</span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 状态信息 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background-tertiary rounded-lg p-3">
            <div className="text-xs text-text-subtle mb-1">状态</div>
            <div className={clsx('text-sm font-medium', statusColor)}>{statusText}</div>
          </div>
          <div className="bg-background-tertiary rounded-lg p-3">
            <div className="text-xs text-text-subtle mb-1">耗时</div>
            <div className="text-sm font-medium text-text tabular-nums">
              {formatDuration(tool.startedAt, tool.completedAt)}
            </div>
          </div>
          <div className="bg-background-tertiary rounded-lg p-3">
            <div className="text-xs text-text-subtle mb-1">开始时间</div>
            <div className="text-sm text-text-muted tabular-nums">{formatTime(tool.startedAt)}</div>
          </div>
          {tool.completedAt && (
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="text-xs text-text-subtle mb-1">结束时间</div>
              <div className="text-sm text-text-muted tabular-nums">{formatTime(tool.completedAt)}</div>
            </div>
          )}
        </div>

        {/* 工具输入 */}
        {tool.input && Object.keys(tool.input).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text">输入参数</span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(tool.input, null, 2))}
                className="flex items-center gap-1 text-xs text-text-subtle hover:text-text transition-colors"
              >
                <IconCopy size={12} />
                复制
              </button>
            </div>
            <pre className="text-sm bg-background-secondary p-3 rounded-lg border border-border-subtle overflow-x-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
        )}

        {/* 工具输出 */}
        {tool.output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text">
                {tool.status === 'failed' ? '错误信息' : '输出结果'}
              </span>
              <button
                onClick={() => copyToClipboard(tool.output || '')}
                className="flex items-center gap-1 text-xs text-text-subtle hover:text-text transition-colors"
              >
                <IconCopy size={12} />
                复制
              </button>
            </div>
            <pre className={clsx(
              'text-sm p-3 rounded-lg border border-border-subtle overflow-x-auto max-h-64 overflow-y-auto',
              tool.status === 'failed'
                ? 'bg-danger-faint text-error border-danger/30'
                : 'bg-background-secondary text-text-muted'
            )}>
              {tool.output}
            </pre>
          </div>
        )}

        {/* 空状态提示 */}
        {!tool.input && !tool.output && (
          <div className="text-center py-8">
            <p className="text-text-subtle text-sm">暂无详细信息</p>
          </div>
        )}
      </div>
    </div>
  );
}
