import { memo } from 'react';
import { FileIcon } from './FileIcon';
import { useFileExplorerStore, useFileEditorStore } from '../../stores';
import type { FileInfo } from '../../types';

interface SearchResultsListProps {
  results: FileInfo[];
}

// 获取相对路径显示
function getRelativePath(fullPath: string, basePath: string): string {
  if (fullPath.startsWith(basePath)) {
    const relative = fullPath.slice(basePath.length);
    return relative.startsWith('/') || relative.startsWith('\\')
      ? relative.slice(1)
      : relative;
  }
  return fullPath;
}

// 格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const SearchResultsList = memo<SearchResultsListProps>(({ results }) => {
  const { select_file } = useFileExplorerStore();
  const { openFile } = useFileEditorStore();
  const { current_path } = useFileExplorerStore();

  const handleClick = async (file: FileInfo) => {
    select_file(file);
    if (!file.is_dir) {
      await openFile(file.path, file.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, file: FileInfo) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(file);
    }
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
        <div className="text-4xl mb-2">🔍</div>
        <div className="text-sm">没有找到匹配的文件</div>
      </div>
    );
  }

  // 分组：目录和文件分开显示
  const directories = results.filter(f => f.is_dir);
  const files = results.filter(f => !f.is_dir);

  return (
    <div className="py-1">
      {/* 目录 */}
      {directories.length > 0 && (
        <>
          {directories.map((file) => {
            const relativePath = getRelativePath(file.path, current_path);
            const pathParts = relativePath.split(/[/\\]/);

            return (
              <div
                key={file.path}
                className="flex items-center px-2 py-1.5 cursor-pointer rounded transition-colors hover:bg-background-hover group"
                onClick={() => handleClick(file)}
                onKeyDown={(e) => handleKeyDown(e, file)}
                role="button"
                tabIndex={0}
                aria-label={`目录 ${file.name}`}
              >
                <FileIcon
                  file={file}
                  className="mr-2 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-text-primary truncate flex-1 min-w-0">
                  {file.name}
                </span>
                {/* 相对路径 */}
                {pathParts.length > 1 && (
                  <span className="text-xs text-text-tertiary truncate ml-2 max-w-[200px]" title={relativePath}>
                    {relativePath}
                  </span>
                )}
              </div>
            );
          })}
          {/* 分隔线 */}
          {files.length > 0 && <div className="my-1 border-t border-border-subtle" />}
        </>
      )}

      {/* 文件 */}
      {files.map((file) => {
        const relativePath = getRelativePath(file.path, current_path);
        const pathParts = relativePath.split(/[/\\]/);

        return (
          <div
            key={file.path}
            className="flex items-center px-2 py-1.5 cursor-pointer rounded transition-colors hover:bg-background-hover group"
            onClick={() => handleClick(file)}
            onKeyDown={(e) => handleKeyDown(e, file)}
            role="button"
            tabIndex={0}
            aria-label={`文件 ${file.name}`}
          >
            <FileIcon
              file={file}
              className="mr-2 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-text-primary truncate flex-1 min-w-0">
              {file.name}
            </span>
            {/* 相对路径 */}
            {pathParts.length > 1 && (
              <span className="text-xs text-text-tertiary truncate ml-2 max-w-[200px]" title={relativePath}>
                {relativePath}
              </span>
            )}
            {/* 文件大小 */}
            {!file.is_dir && file.size && (
              <span className="text-xs text-text-tertiary whitespace-nowrap ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

SearchResultsList.displayName = 'SearchResultsList';
