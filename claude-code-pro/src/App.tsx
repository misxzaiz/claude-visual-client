import { useEffect, useState } from 'react';
import { Layout, Header, Sidebar, Main, StatusIndicator, WorkspaceSelector, SettingsModal } from './components/Common';
import { ChatMessages, ChatInput } from './components/Chat';
import { ToolPanel } from './components/ToolPanel';
import { useConfigStore, useChatStore, useWorkspaceStore } from './stores';
import { useChatEvent } from './hooks';
import './index.css';

function App() {
  const { healthStatus, loadConfig, refreshHealth } = useConfigStore();
  const {
    messages,
    currentContent,
    isStreaming,
    sendMessage,
    interruptChat,
    handleStreamEvent,
    error
  } = useChatStore();
  const { getCurrentWorkspace } = useWorkspaceStore();
  const [showSettings, setShowSettings] = useState(false);

  // 初始化配置
  useEffect(() => {
    loadConfig();
    refreshHealth();
  }, []);

  // 监听聊天流事件
  useChatEvent(handleStreamEvent);

  const currentWorkspace = getCurrentWorkspace();

  return (
    <Layout>
      <Sidebar>
        {/* 工作区选择器 */}
        <WorkspaceSelector />

        {/* 新建对话按钮 */}
        <div className="p-3">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5
                           bg-primary text-white rounded-xl font-medium text-sm
                           hover:bg-primary-hover transition-colors
                           shadow-glow">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>新对话</span>
          </button>
        </div>

        {/* 会话列表 */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="px-3 py-1">
                <div className="text-xs font-medium text-text-tertiary">今天</div>
              </div>
              <div className="text-sm text-text-muted px-3 py-2">
                暂无对话历史
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="px-3 py-1">
                <div className="text-xs font-medium text-text-tertiary">当前</div>
              </div>
              <div className="text-sm text-text-muted px-3 py-2">
                对话进行中
              </div>
            </div>
          )}
        </nav>

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

      <Main>
        <Header title={currentWorkspace ? `${currentWorkspace.name} - Claude Code Pro` : 'Claude Code Pro'}>
          <StatusIndicator
            status={healthStatus?.claudeAvailable ? 'online' : 'offline'}
            label={healthStatus?.claudeVersion ?? 'Claude 未连接'}
          />
        </Header>

        {/* 错误显示 */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-danger-faint border border-danger/30 rounded-xl text-danger text-sm">
            {error}
          </div>
        )}

        {/* 聊天区域 */}
        <ChatMessages
          messages={messages}
          currentContent={currentContent}
          isStreaming={isStreaming}
        />

        {/* 输入区 */}
        <ChatInput
          onSend={sendMessage}
          onInterrupt={interruptChat}
          disabled={!healthStatus?.claudeAvailable}
          isStreaming={isStreaming}
        />
      </Main>

      {/* 工具面板 */}
      <ToolPanel />

      {/* 设置模态框 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </Layout>
  );
}

export default App;
