/**
 * 连接中蒙板组件
 */

import { useConfigStore } from '../../stores';

export function ConnectingOverlay() {
  const { healthStatus } = useConfigStore();

  return (
    <div className="fixed inset-0 bg-background-base flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        {/* 加载动画 */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* 外圈 */}
            <div className="w-16 h-16 border-4 border-border-subtle rounded-full" />
            {/* 内圈 - 旋转动画 */}
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        {/* 文字提示 */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">
            正在连接 Claude Code
          </h2>
          <p className="text-sm text-text-secondary">
            请稍候，正在初始化...
          </p>
        </div>

        {/* 连接状态详情 */}
        {healthStatus?.claudeVersion ? (
          <p className="text-xs text-text-tertiary">
            已检测到版本: {healthStatus.claudeVersion}
          </p>
        ) : (
          <p className="text-xs text-text-tertiary">
            正在检测 Claude CLI...
          </p>
        )}
      </div>
    </div>
  );
}
