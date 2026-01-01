import { useState, useEffect } from 'react';
import { useFileExplorerStore } from '../../stores';
import { Button } from '../Common';
import type { FileInfo } from '../../types';

interface FilePreviewProps {
  file: FileInfo;
}

export function FilePreview({ file }: FilePreviewProps) {
  const { get_file_content, clear_error } = useFileExplorerStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || file.is_dir) return;

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      clear_error();

      try {
        const fileContent = await get_file_content(file.path);
        setContent(fileContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : '读取文件失败');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file, get_file_content, clear_error]);

  if (file.is_dir) {
    return (
      <div className="border-t border-border p-4 bg-background-surface">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📁</span>
          <div>
            <div className="font-medium text-text-primary">{file.name}</div>
            <div className="text-sm text-text-tertiary">目录</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border p-4 bg-background-surface max-h-96 overflow-y-auto">
      {/* 文件信息头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <div>
            <div className="font-medium text-text-primary">{file.name}</div>
            <div className="text-sm text-text-tertiary">
              {file.extension?.toUpperCase()} 文件
              {file.size && ` • ${formatFileSize(file.size)}`}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setContent('')}
        >
          清空
        </Button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-text-tertiary">
          <div className="animate-spin mr-2">⏳</div>
          加载中...
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="p-3 bg-danger-faint border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* 文件内容 */}
      {!loading && !error && (
        <div className="bg-background border border-border rounded-lg p-3">
          {content ? (
            <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono overflow-x-auto">
              {content}
            </pre>
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm">文件内容为空</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}