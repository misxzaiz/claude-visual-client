import { useEffect, useState } from 'react';
import { SearchBar } from './SearchBar';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';
import { useFileExplorerStore, useWorkspaceStore } from '../../stores';

export function FileExplorer() {
  const { 
    current_path, 
    file_tree, 
    selected_file, 
    loading, 
    error,
    load_directory,
    clear_error 
  } = useFileExplorerStore();
  
  const { getCurrentWorkspace } = useWorkspaceStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // 获取当前工作区路径
  const currentWorkspace = getCurrentWorkspace();
  const workspacePath = currentWorkspace?.path;

  // 初始化文件浏览器
  useEffect(() => {
    if (workspacePath && !isInitialized) {
      load_directory(workspacePath);
      setIsInitialized(true);
    }
  }, [workspacePath, isInitialized, load_directory]);

  // 工作区切换时重新加载
  useEffect(() => {
    if (workspacePath) {
      load_directory(workspacePath);
    }
  }, [workspacePath, load_directory]);

  return (
    <div className="h-full flex flex-col bg-background-panel">
      {/* 错误提示 */}
      {error && (
        <div className="p-2 border-b border-border bg-danger-faint">
          <div className="flex items-center justify-between">
            <span className="text-sm text-danger">{error}</span>
            <button
              onClick={clear_error}
              className="text-danger hover:text-text-primary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <SearchBar />

      {/* 当前路径显示 */}
      {current_path && (
        <div className="px-3 py-2 border-b border-border bg-background-surface">
          <div className="text-xs text-text-tertiary truncate" title={current_path}>
            📍 {current_path}
          </div>
        </div>
      )}

      {/* 文件树 */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-tertiary">
            <div className="animate-spin mr-2">⏳</div>
            加载中...
          </div>
        ) : (
          <FileTree />
        )}
      </div>

      {/* 文件预览 */}
      {selected_file && (
        <FilePreview file={selected_file} />
      )}
    </div>
  );
}