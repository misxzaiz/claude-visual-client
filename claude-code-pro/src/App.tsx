import { useEffect } from 'react';
import { Layout, Header, Sidebar, Main, StatusIndicator } from './components/Common';
import { useConfigStore } from './stores';
import './index.css';

function App() {
  const { healthStatus, loadConfig, refreshHealth } = useConfigStore();

  useEffect(() => {
    loadConfig();
    refreshHealth();
  }, []);

  return (
    <Layout>
      <Sidebar>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Claude Code Pro
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {/* TODO: 会话列表 */}
          <div className="text-sm text-text-muted p-2">
            暂无会话
          </div>
        </nav>
        <div className="p-4 border-t border-border">
          {/* TODO: 设置按钮 */}
          <div className="text-xs text-text-muted">
            v0.1.0
          </div>
        </div>
      </Sidebar>

      <Main>
        <Header
          title="Claude Chat"
        >
          <StatusIndicator
            status={healthStatus?.claudeAvailable ? 'online' : 'offline'}
            label={healthStatus?.claudeVersion ?? 'Claude 未连接'}
          />
        </Header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 聊天消息区 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center text-text-muted py-20">
                <p className="text-lg mb-2">欢迎使用 Claude Code Pro</p>
                <p className="text-sm">开始与 Claude 对话</p>
              </div>
            </div>
          </div>

          {/* 输入区 */}
          <div className="border-t border-border p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                  className="flex-1 px-4 py-2 bg-background-tertiary border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!healthStatus?.claudeAvailable}
                />
                <button
                  className="px-6 py-2 bg-primary text-background rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!healthStatus?.claudeAvailable}
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </Layout>
  );
}

export default App;
