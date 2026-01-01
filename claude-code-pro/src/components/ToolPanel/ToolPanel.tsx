/**
 * 工具面板主组件
 */

import React from 'react';
import { useToolPanelStore } from '../../stores';
import { clsx } from 'clsx';
import { ToolList } from './ToolList';
import { ToolDetail } from './ToolDetail';

interface ToolPanelProps {
  className?: string;
}

export function ToolPanel({ className = '' }: ToolPanelProps) {
  const { isOpen, selectedToolId, selectTool, tools } = useToolPanelStore();

  if (tools.length === 0 && !selectedToolId) {
    return null;
  }

  return (
    <aside
      className={clsx(
        'flex flex-col border-l border-border bg-background-secondary transition-all duration-300',
        isOpen ? 'w-72' : 'w-10'
      , className)}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        {isOpen ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-text">工具调用</span>
              <span className="text-xs text-text-subtle bg-background-tertiary px-1.5 py-0.5 rounded">
                {tools.length}
              </span>
            </div>
            <button
              onClick={() => useToolPanelStore.getState().setOpen(false)}
              className="p-1 text-text-subtle hover:text-text transition-colors rounded hover:bg-background-hover"
              title="折叠面板"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => useToolPanelStore.getState().setOpen(true)}
            className="w-full h-full flex items-center justify-center text-text-subtle hover:text-text transition-colors"
            title="展开工具面板"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* 内容区 */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          {selectedToolId ? (
            <ToolDetail
              toolId={selectedToolId}
              onBack={() => selectTool(null)}
            />
          ) : (
            <ToolList />
          )}
        </div>
      )}

      {/* 底部状态栏 */}
      {isOpen && !selectedToolId && (
        <div className="px-3 py-2 border-t border-border text-xs text-text-subtle">
          <div className="flex items-center justify-between">
            <span>运行中: {tools.filter(t => t.status === 'running').length}</span>
            <span>完成: {tools.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
