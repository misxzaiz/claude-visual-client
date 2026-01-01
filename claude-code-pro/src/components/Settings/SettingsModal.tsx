import { useState } from 'react';
import { useConfigStore } from '../../stores';
import { Button } from '../Common';
import type { Config, PermissionMode } from '../../types';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { config, loading, error, updateConfig } = useConfigStore();
  const [localConfig, setLocalConfig] = useState<Config | null>(config);

  const handleSave = async () => {
    if (!localConfig) return;
    
    try {
      await updateConfig(localConfig);
      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const handlePermissionModeChange = (mode: PermissionMode) => {
    if (!localConfig) return;
    setLocalConfig({ ...localConfig, permissionMode: mode });
  };

  const handleClaudeCmdChange = (cmd: string) => {
    if (!localConfig) return;
    setLocalConfig({ ...localConfig, claudeCmd: cmd });
  };

  if (!localConfig) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background-panel rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">加载配置中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background-panel rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">设置</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-danger-faint border border-danger/30 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {/* Claude 命令路径 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Claude CLI 命令路径
          </label>
          <input
            type="text"
            value={localConfig.claudeCmd}
            onChange={(e) => handleClaudeCmdChange(e.target.value)}
            className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="claude"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            Claude CLI 命令的完整路径，例如: claude 或 C:\path\to\claude.cmd
          </p>
        </div>

        {/* 权限模式 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            权限模式
          </label>
          <select
            value={localConfig.permissionMode}
            onChange={(e) => handlePermissionModeChange(e.target.value as PermissionMode)}
            className="w-full px-3 py-2 bg-background-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="default">默认（每次询问）</option>
            <option value="bypassPermissions">自动授权</option>
            <option value="dontAsk">拒绝所有</option>
            <option value="acceptEdits">允许编辑</option>
          </select>
          <div className="mt-2 text-xs text-text-tertiary">
            <div className="mb-1">
              <strong>默认：</strong>每次使用工具时询问权限
            </div>
            <div className="mb-1">
              <strong>自动授权：</strong>自动允许所有工具请求
            </div>
            <div className="mb-1">
              <strong>拒绝所有：</strong>拒绝所有工具请求
            </div>
            <div>
              <strong>允许编辑：</strong>允许文件编辑操作
            </div>
          </div>
        </div>

        {/* 工作目录 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            当前工作目录
          </label>
          <div className="px-3 py-2 bg-background-surface border border-border rounded-lg text-text-tertiary">
            {localConfig.workDir || '未设置'}
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            工作目录通过工作区选择器设置
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="min-w-[80px]"
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
}