import { memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
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

// 获取目录路径（不含文件名）
function getDirectoryPath(relativePath: string): string {
  // 找到最后一个路径分隔符
  const lastSlashIndex = Math.max(
    relativePath.lastIndexOf('/'),
    relativePath.lastIndexOf('\\')
  );

  if (lastSlashIndex >= 0) {
    return relativePath.substring(0, lastSlashIndex + 1);
  }
  return '';
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

// 单个文件项组件
interface FileItemProps {
  file: FileInfo;
  currentPath: string;
  onClick: (file: FileInfo) => void;
  onKeyDown: (e: React.KeyboardEvent, file: FileInfo) => void;
}

const FileItem = memo<FileItemProps>(({ file, currentPath, onClick, onKeyDown }) => {
  const relativePath = getRelativePath(file.path, currentPath);
  const pathOnly = getDirectoryPath(relativePath);

  return (
    <div
      className="px-2 py-1.5 cursor-pointer rounded transition-colors hover:bg-background-hover group"
      onClick={() => onClick(file)}
      onKeyDown={(e) => onKeyDown(e, file)}
      role="button"
      tabIndex={0}
      aria-label={`${file.is_dir ? '目录' : '文件'} ${file.name}`}
    >
      <div className="flex items-start gap-2">
        <FileIcon
          file={file}
          className="mt-0.5 w-4 h-4 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* 第一行：文件名 */}
          <div
            className="text-sm text-text-primary truncate"
            title={file.name}
          >
            {file.name}
          </div>
          {/* 第二行：相对路径（小字） */}
          {pathOnly && (
            <div
              className="text-xs text-text-tertiary truncate mt-0.5"
              title={pathOnly}
            >
              {pathOnly}
            </div>
          )}
          {/* 文件大小（仅文件显示，悬停时显示） */}
          {!file.is_dir && file.size && (
            <div className="text-xs text-text-tertiary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {formatFileSize(file.size)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FileItem.displayName = 'FileItem';

// 目录分隔线组件
const DirectorySeparator = memo(() => (
  <div className="px-2 my-1 border-t border-border-subtle" />
));

DirectorySeparator.displayName = 'DirectorySeparator';

export const SearchResultsList = memo<SearchResultsListProps>(({ results }) => {
  const { select_file, current_path } = useFileExplorerStore();
  const { openFile } = useFileEditorStore();

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

  // 合并所有项，目录在前，文件在后，中间加分隔线
  const allItems: Array<{ type: 'directory' | 'file' | 'separator'; data?: FileInfo }> = [
    ...directories.map(d => ({ type: 'directory' as const, data: d })),
    ...(directories.length > 0 && files.length > 0 ? [{ type: 'separator' as const }] : []),
    ...files.map(f => ({ type: 'file' as const, data: f })),
  ];

  // 结果较少时直接渲染，使用虚拟滚动的阈值
  const VIRTUAL_SCROLL_THRESHOLD = 50;
  const shouldUseVirtualScroll = results.length >= VIRTUAL_SCROLL_THRESHOLD;

  // 渲染单个项
  const renderItem = (index: number) => {
    const item = allItems[index];
    if (!item) return null;

    if (item.type === 'separator') {
      return <DirectorySeparator key="separator" />;
    }

    return (
      <FileItem
        key={item.data!.path}
        file={item.data!}
        currentPath={current_path}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
    );
  };

  // 非虚拟滚动模式
  if (!shouldUseVirtualScroll) {
    return (
      <div className="py-1 min-w-max">
        {allItems.map((_, index) => (
          <div key={allItems[index].data?.path || `sep-${index}`}>
            {renderItem(index)}
          </div>
        ))}
      </div>
    );
  }

  // 虚拟滚动模式
  return (
    <Virtuoso
      style={{ height: '100%' }}
      data={allItems}
      itemContent={(_index, item) => {
        if (item.type === 'separator') {
          return <DirectorySeparator />;
        }
        return (
          <FileItem
            file={item.data!}
            currentPath={current_path}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          />
        );
      }}
      defaultItemHeight={60} // 预估每个项的高度
    />
  );
});

SearchResultsList.displayName = 'SearchResultsList';
