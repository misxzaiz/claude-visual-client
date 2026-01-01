import { useEffect, useState } from 'react';
import { Layout, Header, Sidebar, Main, StatusIndicator, WorkspaceSelector, SettingsModal, FileExplorer } from './components/Common';
import { ChatMessages, ChatInput } from './components/Chat';
import { ToolPanel } from './components/ToolPanel';
import { EditorPanel } from './components/Editor';
import { SidebarTabs } from './components/SidebarTabs';
import { useConfigStore, useChatStore, useWorkspaceStore } from './stores';
import { useChatEvent } from './hooks';
import './index.css';

/** Sidebar Tab 类型 */
type SidebarTab = 'chat' | 'files';

function App() {
  const { healthStatus, loadConfig, refreshHealth } = useConfigStore();
  const {
    messages,
    currentContent,
    isStreaming,
    sendMessage,
    interruptChat,
    handleStreamEvent,
    error,
    clearMessages
  } = useChatStore();
  const { getCurrentWorkspace } = useWorkspaceStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewConversationConfirm, setShowNewConversationConfirm] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');

  // 初始化配置
  useEffect(() => {
    loadConfig();
    refreshHealth();
  }, []);

  // 监听聊天流事件
  useChatEvent(handleStreamEvent);

  const currentWorkspace = getCurrentWorkspace();

  // 新对话处理
  const handleNewConversation = () => {
    if (messages.length > 0) {
      setShowNewConversationConfirm(true);
    } else {
      clearMessages();
    }
  };

  const confirmNewConversation = () => {
    clearMessages();
    setShowNewConversationConfirm(false);
  };

  const cancelNewConversation = () => {
    setShowNewConversationConfirm(false);
  };

  return (
    <Layout>
      <Sidebar>
        {/* 工作区选择器 */}
        <WorkspaceSelector />

        {/* Tab 切换 */}
        <SidebarTabs activeTab={sidebarTab} onTabChange={setSidebarTab} />

        {/* 新建对话按钮 - 仅在会话 Tab 显示 */}
        {sidebarTab === 'chat' && (
          <div className="p-3">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5
                             bg-primary text-white rounded-xl font-medium text-sm
                             hover:bg-primary-hover transition-colors
                             shadow-glow">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>新对话</span>
            </button>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'files' ? (
            <FileExplorer />
          ) : (
            <div className="h-full flex flex-col p-3">
              <div className="text-xs font-medium text-text-tertiary mb-2">今天</div>
              {messages.length === 0 ? (
                <div className="text-sm text-text-muted">暂无对话历史</div>
              ) : (
                <div className="text-sm text-text-primary">当前对话</div>
              )}
            </div>
          )}
        </div>

        {/* 底部设置 */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 px-3 py-2
                            rounded-lg text-sm text-text-tertiary
                            hover:bg-background-hover transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065c1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37.996-.608 2.296-.07 2.572 1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>设置</span>
          </button>
        </div>
      </Sidebar>

      <Main className="flex-row">
        {/* 左侧：编辑器 */}
        <div className="w-1/2 min-w-[300px] border-r border-border flex flex-col">
          <EditorPanel />
        </div>

        {/* 右侧：聊天区域 */}
        <div className="flex-1 flex flex-col min-w-[300px]">
          <Header title={currentWorkspace ? `${currentWorkspace.name} - Claude Code Pro` : 'Claude Code Pro'}>
            <StatusIndicator
              status={healthStatus?.claudeAvailable ? 'online' : 'offline'}
              label={healthStatus?.claudeVersion ?? 'Claude 未连接'}
            />
          </Header>

          {error && (
            <div className="mx-5 mt-4 p-3 bg-danger-faint border border-danger/30 rounded-xl text-danger text-sm">
              {error}
            </div>
          )}

          <ChatMessages
            messages={messages}
            currentContent={currentContent}
            isStreaming={isStreaming}
          />

          <ChatInput
            onSend={sendMessage}
            onInterrupt={interruptChat}
            disabled={!healthStatus?.claudeAvailable}
            isStreaming={isStreaming}
          />
        </div>
      </Main>

      {/* 工具面板 */}
      <ToolPanel />

      {/* 设置模态框 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 新对话确认对话框 */}
      {showNewConversationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              开始新对话
            </h3>
            <p className="text-gray-600 mb-6">
              确定要开始新对话吗？当前的对话历史将被清空。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelNewConversation}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmNewConversation}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
