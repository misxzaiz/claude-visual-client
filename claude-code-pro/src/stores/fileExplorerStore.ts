/**
 * 文件浏览器状态管理
 */

import { create } from 'zustand';
import type { FileExplorerStore, FileInfo } from '../types';
import * as tauri from '../services/tauri';

export const useFileExplorerStore = create<FileExplorerStore>((set, get) => ({
  // 初始状态
  current_path: '',
  file_tree: [],
  selected_file: null,
  expanded_folders: new Set(),
  search_query: '',
  loading: false,
  error: null,

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
        get().load_directory(current_path);
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
        get().load_directory(current_path);
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
        get().load_directory(current_path);
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
        get().load_directory(current_path);
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