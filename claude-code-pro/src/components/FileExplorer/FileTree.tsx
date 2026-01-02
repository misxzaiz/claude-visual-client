import { memo } from 'react';
import { FileTreeNode } from './FileTreeNode';
import { SearchResultsList } from './SearchResultsList';
import { useFileExplorerStore } from '../../stores';
import type { FileInfo } from '../../types';

interface FileTreeProps {
  files?: FileInfo[];
  className?: string;
}

// 递归过滤文件树
const filterFiles = (files: FileInfo[], query: string): FileInfo[] => {
  if (!query.trim()) return files;

  const lowerQuery = query.toLowerCase();

  return files.reduce((acc: FileInfo[], file) => {
    const nameMatches = file.name.toLowerCase().includes(lowerQuery);

    if (file.is_dir) {
      // 对于目录，检查名称是否匹配或子文件是否匹配
      const filteredChildren = file.children ? filterFiles(file.children, query) : [];

      if (nameMatches || filteredChildren.length > 0) {
        acc.push({
          ...file,
          children: filteredChildren.length > 0 ? filteredChildren : file.children
        });
      }
    } else if (nameMatches) {
      // 对于文件，只检查名称是否匹配
      acc.push(file);
    }

    return acc;
  }, []);
};

export const FileTree = memo<FileTreeProps>(({ files, className = '' }) => {
  const {
    selected_file,
    expanded_folders,
    loading_folders,
    search_query,
    search_results,
    file_tree
  } = useFileExplorerStore();

  // 如果有搜索结果，显示搜索结果列表
  if (search_query && search_results) {
    return <SearchResultsList results={search_results} />;
  }

  const fileTree = files || file_tree;

  // 应用搜索过滤（仅在没有 search_results 时使用，作为降级方案）
  const filteredFiles = search_query
    ? filterFiles(fileTree, search_query)
    : fileTree;

  if (filteredFiles.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-text-tertiary ${className}`}>
        <div className="text-4xl mb-2">📁</div>
        <div className="text-sm">
          {search_query ? '没有找到匹配的文件' : '此目录为空'}
        </div>
      </div>
    );
  }

  return (
    <div className={`py-1 ${className}`}>
      {filteredFiles.map((file) => (
        <FileTreeNode
          key={file.path}
          file={file}
          level={0}
          isExpanded={expanded_folders.has(file.path)}
          isSelected={selected_file?.path === file.path}
          expandedFolders={expanded_folders}
          loadingFolders={loading_folders}
        />
      ))}
    </div>
  );
});

FileTree.displayName = 'FileTree';
