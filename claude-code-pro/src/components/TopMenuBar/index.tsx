/**
 * 顶部菜单栏组件
 */

import { useState } from 'react';
import { useWorkspaceStore } from '../../stores';
import { useChatStore } from '../../stores';

interface TopMenuBarProps {
  onNewConversation: () => void;
  onSettings: () => void;
  onCreateWorkspace: () => void;
}

export function TopMenuBar({ onNewConversation, onSettings, onCreateWorkspace }: TopMenuBarProps) {
  const { getCurrentWorkspace } = useWorkspaceStore();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const { clearMessages, messages } = useChatStore();

  const currentWorkspace = getCurrentWorkspace();

  const handleNewConversation = () => {
    // 如果有消息，显示确认对话框
    if (messages.length > 0) {
      setShowNewChatConfirm(true);
    } else {
      clearMessages();
      onNewConversation();
    }
  };

  const confirmNewChat = () => {
    clearMessages();
    onNewConversation();
    setShowNewChatConfirm(false);
  };

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-background-elevated border-b border-border shrink-0">
      {/* 左侧：Logo/应用名称 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-glow">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <span className="text-sm font-medium text-text-primary">Claude Code Pro</span>
      </div>

      {/* 右侧：工作区 | 新对话 | 设置 */}
      <div className="flex items-center gap-1">
        {/* 工作区选择器 */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-secondary
                     hover:text-text-primary hover:bg-background-hover transition-colors"
            title="切换工作区"
          >
            <span className="max-w-[120px] truncate">
              {currentWorkspace?.name || '未选择工作区'}
            </span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 工作区下拉菜单 */}
          {showWorkspaceMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowWorkspaceMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-background-surface border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                <WorkspaceMenuContent
                  onClose={() => setShowWorkspaceMenu(false)}
                  onCreateWorkspace={onCreateWorkspace}
                />
              </div>
            </>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-border-subtle" />

        {/* 新对话按钮 */}
        <button
          onClick={handleNewConversation}
          className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-background-hover transition-colors"
          title="新对话 (Cmd+N)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* 设置按钮 */}
        <button
          onClick={onSettings}
          className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-background-hover transition-colors"
          title="设置"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37.996-.608 2.296-.07 2.572 1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 新对话确认对话框 */}
      {showNewChatConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowNewChatConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-background-elevated rounded-xl border border-border shadow-xl p-5">
            <h3 className="text-base font-semibold text-text-primary mb-2">
              确认新对话
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              当前对话有 {messages.length} 条消息，确定要开始新对话吗？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmNewChat}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** 工作区菜单内容 */
function WorkspaceMenuContent({ onClose, onCreateWorkspace }: { onClose: () => void; onCreateWorkspace: () => void }) {
  const { workspaces, currentWorkspaceId, switchWorkspace } = useWorkspaceStore();

  const handleSwitchWorkspace = async (id: string) => {
    if (id !== currentWorkspaceId) {
      await switchWorkspace(id);
    }
    onClose();
  };

  const handleCreateWorkspace = () => {
    onClose();
    onCreateWorkspace();
  };

  return (
    <div className="py-1">
      <div className="px-3 py-2 text-xs font-medium text-text-tertiary border-b border-border-subtle">
        工作区
      </div>

      {workspaces.length === 0 ? (
        <div className="px-3 py-4 text-center text-sm text-text-tertiary">
          暂无工作区
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSwitchWorkspace(workspace.id)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                workspace.id === currentWorkspaceId
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
              }`}
            >
              <div className="font-medium truncate">{workspace.name}</div>
              <div className="text-xs truncate text-text-tertiary">
                {workspace.path}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border-subtle mt-1 pt-1">
        <button
          onClick={handleCreateWorkspace}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          创建工作区
        </button>
      </div>
    </div>
  );
}
