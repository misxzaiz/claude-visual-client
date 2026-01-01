import { memo, useEffect } from 'react';
import { FileIcon } from './FileIcon';
import { useFileExplorerStore } from '../../stores';
import type { FileInfo } from '../../types';

interface FileTreeNodeProps {
  file: FileInfo;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  onToggle: () => void;
  onSelect: () => void;
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

// 格式化修改时间
const formatModifiedTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const date = new Date(parseInt(timestamp) * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

export const FileTreeNode = memo<FileTreeNodeProps>(({
  file,
  level,
  isExpanded,
  isSelected,
  expandedFolders,
  loadingFolders,
  onToggle,
  onSelect
}) => {
  const { load_folder_content, get_cached_folder_content } = useFileExplorerStore();

  // 懒加载逻辑：展开文件夹时加载内容
  useEffect(() => {
    if (file.is_dir && isExpanded) {
      const cached = get_cached_folder_content(file.path);
      
      // 如果没有缓存且没有子项，触发加载
      if (!cached && (!file.children || file.children.length === 0)) {
        load_folder_content(file.path);
      }
    }
  }, [file.is_dir, file.path, isExpanded, file.children, load_folder_content, get_cached_folder_content]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (file.is_dir) {
      onToggle();
      
      // 展开时检查是否需要加载内容
      if (!isExpanded) {
        const cached = get_cached_folder_content(file.path);
        
        // 如果没有缓存且没有子项，触发加载
        if (!cached && (!file.children || file.children.length === 0)) {
          await load_folder_content(file.path);
        }
      }
    } else {
      onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  // 检查是否正在加载
  const isLoading = file.is_dir && loadingFolders.has(file.path);
  
  // 检查是否有子内容
  const hasChildren = file.children && file.children.length > 0;

  return (
    <div>
      <div
        className={`
          flex items-center px-2 py-1 cursor-pointer rounded transition-colors
          hover:bg-background-hover group
          ${isSelected ? 'bg-primary/20 border-l-2 border-primary' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={file.is_dir ? `文件夹 ${file.name}` : `文件 ${file.name}`}
      >
        {/* 展开/收起箭头 */}
        {file.is_dir && (
          <span className="mr-1 text-text-tertiary transition-transform duration-200" 
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            {isLoading ? '⏳' : '▶'}
          </span>
        )}
        
        {/* 占位符（非目录文件） */}
        {!file.is_dir && <span className="mr-1 w-3" />}
        
        {/* 文件图标 */}
        <FileIcon 
          file={file}
          className="mr-2 w-4 h-4 flex-shrink-0"
        />
        
        {/* 文件名 */}
        <span className="text-sm text-text-primary truncate flex-1 min-w-0">
          {file.name}
        </span>
        
        {/* 文件信息 */}
        <div className="hidden md:flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 文件大小 */}
          {!file.is_dir && file.size && (
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {formatFileSize(file.size)}
            </span>
          )}
          
          {/* 修改时间 */}
          {file.modified && (
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {formatModifiedTime(file.modified)}
            </span>
          )}
        </div>
      </div>
      
      {/* 子文件 */}
      {file.is_dir && isExpanded && hasChildren && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {file.children?.map(child => (
            <FileTreeNode
              key={child.path}
              file={child}
              level={level + 1}
              isExpanded={expandedFolders.has(child.path)}
              isSelected={false}
              expandedFolders={expandedFolders}
              loadingFolders={loadingFolders}
              onToggle={() => {}}
              onSelect={() => {}}
            />
          ))}
        </div>
      )}
      
      {/* 加载中提示 */}
      {file.is_dir && isExpanded && isLoading && (
        <div 
          style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }} 
          className="text-xs text-text-tertiary py-1 animate-pulse"
        >
          加载中...
        </div>
      )}
      
      {/* 空文件夹提示 */}
      {file.is_dir && isExpanded && !isLoading && !hasChildren && (
        <div 
          style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }} 
          className="text-xs text-text-tertiary py-1 italic"
        >
          空文件夹
        </div>
      )}
    </div>
  );
});

FileTreeNode.displayName = 'FileTreeNode';