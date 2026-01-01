import { useEffect } from 'react';
import { Layout, Header, Sidebar, Main, StatusIndicator } from './components/Common';
import { ChatMessages, ChatInput } from './components/Chat';
import { useConfigStore, useChatStore } from './stores';
import { useChatEvent } from './hooks';
import './index.css';

function App() {
  const { healthStatus, loadConfig, refreshHealth } = useConfigStore();
  const {
    messages,
    currentContent,
    isStreaming,
    toolCalls,
    sendMessage,
    interruptChat,
    handleStreamEvent,
    error
  } = useChatStore();

  // 初始化配置
  useEffect(() => {
    loadConfig();
    refreshHealth();
  }, []);

  // 监听聊天流事件
  useChatEvent(handleStreamEvent);

  return (
    <Layout>
      <Sidebar>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Claude Code Pro
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {/* 会话列表 */}
          {messages.length === 0 ? (
            <div className="text-sm text-text-muted p-2">
              暂无会话
            </div>
          ) : (
            <div className="text-sm text-text-muted p-2">
              当前会话
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-xs text-text-muted">
            v0.1.0
          </div>
        </div>
      </Sidebar>

      <Main>
        <Header title="Claude Chat">
          <StatusIndicator
            status={healthStatus?.claudeAvailable ? 'online' : 'offline'}
            label={healthStatus?.claudeVersion ?? 'Claude 未连接'}
          />
        </Header>

        {/* 错误显示 */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-danger/20 border border-danger rounded-md text-danger text-sm">
            {error}
          </div>
        )}

        {/* 聊天区域 */}
        <ChatMessages
          messages={messages}
          currentContent={currentContent}
          isStreaming={isStreaming}
          toolCalls={toolCalls}
        />

        {/* 输入区 */}
        <ChatInput
          onSend={sendMessage}
          onInterrupt={interruptChat}
          disabled={!healthStatus?.claudeAvailable}
          isStreaming={isStreaming}
        />
      </Main>
    </Layout>
  );
}

export default App;
