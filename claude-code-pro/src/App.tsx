import { useEffect, useState } from 'react';
import { Layout, Sidebar, Main, StatusIndicator, SettingsModal, FileExplorer, ResizeHandle, ConnectingOverlay, ErrorBoundary } from './components/Common';
import { ChatMessages, ChatInput } from './components/Chat';
import { ToolPanel } from './components/ToolPanel';
import { EditorPanel } from './components/Editor';
import { TopMenuBar as TopMenuBarComponent } from './components/TopMenuBar';
import { CreateWorkspaceModal } from './components/Workspace';
import { useConfigStore, useChatStore, useViewStore } from './stores';
import { useChatEvent } from './hooks';
import './index.css';

function App() {
  const { healthStatus, isConnecting, loadConfig, refreshHealth } = useConfigStore();
  const {
    messages,
    currentContent,
    isStreaming,
    sendMessage,
    interruptChat,
    handleStreamEvent,
    error,
    restoreFromStorage,
    saveToStorage,
  } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const {
    showSidebar,
    showEditor,
    showToolPanel,
    sidebarWidth,
    editorWidth,
    toolPanelWidth,
    setSidebarWidth,
    setEditorWidth,
    setToolPanelWidth
  } = useViewStore();

  // 初始化配置
  useEffect(() => {
    loadConfig();
    refreshHealth();

    // 尝试从本地存储恢复聊天状态
    const restored = restoreFromStorage();
    if (restored) {
      console.log('[App] 已从崩溃中恢复聊天状态');
    }
  }, []);

  // 监听崩溃保存事件
  useEffect(() => {
    const handleCrashSave = () => {
      console.log('[App] 检测到崩溃信号，保存状态...');
      saveToStorage();
    };

    window.addEventListener('app:crash-save', handleCrashSave);
    return () => window.removeEventListener('app:crash-save', handleCrashSave);
  }, [saveToStorage]);

  // 监听恢复事件
  useEffect(() => {
    const handleRecover = () => {
      console.log('[App] 收到恢复信号...');
      const restored = restoreFromStorage();
      if (restored) {
        window.location.reload();
      }
    };

    window.addEventListener('app:recover', handleRecover);
    return () => window.removeEventListener('app:recover', handleRecover);
  }, [restoreFromStorage]);

  // 监听聊天流事件
  useChatEvent(handleStreamEvent);

  // Sidebar 拖拽处理（右边手柄）
  const handleSidebarResize = (delta: number) => {
    const newWidth = Math.max(150, Math.min(600, sidebarWidth + delta));
    setSidebarWidth(newWidth);
  };

  // ToolPanel 拖拽处理（左边手柄）
  const handleToolPanelResize = (delta: number) => {
    const newWidth = Math.max(200, Math.min(600, toolPanelWidth - delta));
    setToolPanelWidth(newWidth);
  };

  // Editor/Chat 分割拖拽处理
  const handleEditorResize = (delta: number) => {
    const containerWidth = window.innerWidth - sidebarWidth - toolPanelWidth;
    const currentEditorWidth = containerWidth * (editorWidth / 100);
    const newEditorWidth = currentEditorWidth + delta;
    const minEditorWidth = containerWidth * 0.3;
    const maxEditorWidth = containerWidth * 0.7;

    const clampedWidth = Math.max(minEditorWidth, Math.min(maxEditorWidth, newEditorWidth));
    const newPercent = (clampedWidth / containerWidth) * 100;

    setEditorWidth(Math.round(newPercent));
  };

  return (
    <ErrorBoundary>
      <Layout>
        {/* 连接中蒙板 */}
        {isConnecting && <ConnectingOverlay />}

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
        {/* 条件渲染 Sidebar */}
        {showSidebar && (
          <>
            <Sidebar width={sidebarWidth}>
              <FileExplorer />
            </Sidebar>
            <ResizeHandle
              direction="horizontal"
              position="right"
              onDrag={handleSidebarResize}
            />
          </>
        )}

        <Main className="flex-row">
          {/* 条件渲染 Editor */}
          {showEditor && (
            <div
              className="border-r border-border flex flex-col"
              style={{ width: `${editorWidth}%` }}
            >
              <EditorPanel />
            </div>
          )}

          {/* Editor/Chat 分割手柄 */}
          {showEditor && (
            <ResizeHandle
              direction="horizontal"
              position="right"
              onDrag={handleEditorResize}
            />
          )}

          {/* 聊天区域 */}
          <div className="flex flex-col min-w-[300px] flex-1">
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

        {/* ToolPanel 拖拽手柄 */}
        {showToolPanel && (
          <ResizeHandle
            direction="horizontal"
            position="left"
            onDrag={handleToolPanelResize}
          />
        )}

        {/* 条件渲染 ToolPanel */}
        {showToolPanel && <ToolPanel width={toolPanelWidth} />}
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
    </ErrorBoundary>
  );
}

export default App;
