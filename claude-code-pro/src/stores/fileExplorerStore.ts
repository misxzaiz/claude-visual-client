/**
 * 文件浏览器状态管理
 */

import { create } from 'zustand';
import type { FileExplorerStore, FileInfo } from '../types';
import * as tauri from '../services/tauri';

// 辅助函数：更新文件树中的子节点
function updateFolderChildren(tree: FileInfo[], folderPath: string, children: FileInfo[]): FileInfo[] {
  return tree.map(file => {
    if (file.path === folderPath) {
      return { ...file, children: children || undefined };
    }
    
    if (file.children) {
      return {
        ...file,
        children: updateFolderChildren(file.children, folderPath, children) || undefined
      };
    }
    
    return file;
  });
}

export const useFileExplorerStore = create<FileExplorerStore>((set, get) => ({
  // 初始状态
  current_path: '',
  file_tree: [],
  selected_file: null,
  expanded_folders: new Set(),
  search_query: '',
  loading: false,
  error: null,
  folder_cache: new Map(), // 文件夹内容缓存
  loading_folders: new Set(), // 正在加载的文件夹
  is_refreshing: false, // 是否正在刷新

  // 加载目录内容
  load_directory: async (path: string) => {
    set({ loading: true, error: null });
    
    try {
      const files = await tauri.readDirectory(path);
      set({ 
        current_path: path,
        file_tree: files,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载目录失败',
        loading: false 
      });
    }
  },

  // 加载文件夹内容（懒加载）
  load_folder_content: async (folderPath: string) => {
    const { folder_cache } = get();
    
    // 检查缓存
    if (folder_cache.has(folderPath)) {
      return;
    }
    
    // 检查是否正在加载
    const { loading_folders } = get();
    if (loading_folders.has(folderPath)) {
      return;
    }
    
    set((state) => ({
      loading_folders: new Set([...state.loading_folders, folderPath])
    }));
    
    try {
      const children = await tauri.readDirectory(folderPath);
      
      set((state) => {
        // 更新缓存
        const newCache = new Map(state.folder_cache);
        newCache.set(folderPath, children);
        
        // 更新文件树
        const updatedTree = updateFolderChildren(state.file_tree, folderPath, children);
        
        // 移除加载状态
        const newLoading = new Set(state.loading_folders);
        newLoading.delete(folderPath);
        
        return {
          folder_cache: newCache,
          file_tree: updatedTree,
          loading_folders: newLoading,
        };
      });
    } catch (error) {
      set((state) => {
        // 移除加载状态
        const newLoading = new Set(state.loading_folders);
        newLoading.delete(folderPath);
        
        return {
          loading_folders: newLoading,
          error: error instanceof Error ? error.message : '加载文件夹失败',
        };
      });
    }
  },

  // 获取缓存的文件夹内容
  get_cached_folder_content: (folderPath: string) => {
    return get().folder_cache.get(folderPath) || null;
  },

  // 刷新当前目录（清除缓存并重新加载）
  refresh_directory: async () => {
    const { current_path } = get();
    
    if (!current_path) {
      return;
    }
    
    set({ is_refreshing: true, error: null });
    
    try {
      // 清除所有缓存
      set({ 
        folder_cache: new Map(),
        expanded_folders: new Set() // 清除展开状态，重新加载
      });
      
      // 重新加载当前目录
      const files = await tauri.readDirectory(current_path);
      
      set({ 
        current_path,
        file_tree: files,
        is_refreshing: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '刷新目录失败',
        is_refreshing: false 
      });
    }
  },

  // 选择文件
  select_file: (file: FileInfo) => {
    set({ selected_file: file });
  },

  // 切换文件夹展开状态
  toggle_folder: (path: string) => {
    set((state) => {
      const expanded = new Set(state.expanded_folders);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      return { expanded_folders: expanded };
    });
  },

  // 设置搜索查询
  set_search_query: (query: string) => {
    set({ search_query: query });
  },

  // 创建文件
  create_file: async (path: string, content?: string) => {
    try {
      await tauri.createFile(path, content);
      // 刷新当前目录
      const { current_path } = get();
      if (current_path) {
        get().refresh_directory();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建文件失败' });
    }
  },

  // 创建目录
  create_directory: async (path: string) => {
    try {
      await tauri.createDirectory(path);
      // 刷新当前目录
      const { current_path } = get();
      if (current_path) {
        get().refresh_directory();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建目录失败' });
    }
  },

  // 删除文件或目录
  delete_file: async (path: string) => {
    try {
      await tauri.deleteFile(path);
      // 刷新当前目录
      const { current_path } = get();
      if (current_path) {
        get().refresh_directory();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除文件失败' });
    }
  },

  // 重命名文件或目录
  rename_file: async (old_path: string, new_name: string) => {
    try {
      await tauri.renameFile(old_path, new_name);
      // 刷新当前目录
      const { current_path } = get();
      if (current_path) {
        get().refresh_directory();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '重命名文件失败' });
    }
  },

  // 获取文件内容
  get_file_content: async (path: string) => {
    try {
      return await tauri.getFileContent(path);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '读取文件内容失败' });
      throw error;
    }
  },

  // 清除错误
  clear_error: () => {
    set({ error: null });
  },
}));