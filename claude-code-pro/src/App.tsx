import { useEffect, useState } from 'react';
import { Layout, Sidebar, Main, StatusIndicator, SettingsModal, FileExplorer } from './components/Common';
import { ChatMessages, ChatInput } from './components/Chat';
import { ToolPanel } from './components/ToolPanel';
import { EditorPanel } from './components/Editor';
import { TopMenuBar as TopMenuBarComponent } from './components/TopMenuBar';
import { CreateWorkspaceModal } from './components/Workspace';
import { useConfigStore, useChatStore } from './stores';
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
    error,
  } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  // 初始化配置
  useEffect(() => {
    loadConfig();
    refreshHealth();
  }, []);

  // 监听聊天流事件
  useChatEvent(handleStreamEvent);

  return (
    <Layout>
      {/* 顶部菜单栏 */}
      <TopMenuBarComponent
        onNewConversation={() => {
          // 新对话功能直接清空消息
        }}
        onSettings={() => setShowSettings(true)}
        onCreateWorkspace={() => setShowCreateWorkspace(true)}
      />

      {/* 主体内容区域：Sidebar | Main | ToolPanel */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <FileExplorer />
        </Sidebar>

        <Main className="flex-row">
          {/* 左侧：编辑器 */}
          <div className="w-1/2 min-w-[300px] border-r border-border flex flex-col">
            <EditorPanel />
          </div>

          {/* 右侧：聊天区域 */}
          <div className="flex-1 flex flex-col min-w-[300px]">
            {/* 状态指示器 */}
            <div className="flex items-center justify-between px-4 py-2 bg-background-elevated border-b border-border-subtle">
              <span className="text-sm text-text-primary">AI 对话</span>
              <StatusIndicator
                status={healthStatus?.claudeAvailable ? 'online' : 'offline'}
                label={healthStatus?.claudeVersion ?? 'Claude 未连接'}
              />
            </div>

            {error && (
              <div className="mx-4 mt-4 p-3 bg-danger-faint border border-danger/30 rounded-xl text-danger text-sm">
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
      </div>

      {/* 设置模态框 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 创建工作区模态框 */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
      )}
    </Layout>
  );
}

export default App;
