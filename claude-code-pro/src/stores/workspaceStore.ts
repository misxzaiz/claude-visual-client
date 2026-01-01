/**
 * 工作区状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, WorkspaceStore } from '../types';
import * as tauri from '../services/tauri';

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      workspaces: [],
      currentWorkspaceId: null,
      isLoading: false,
      error: null,

      // 创建工作区
      createWorkspace: async (name: string, path: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // 验证路径
          const isValid = await get().validateWorkspacePath(path);
          if (!isValid) {
            throw new Error('无效的工作区路径');
          }

          // 检查路径是否已存在
          const existingWorkspace = get().workspaces.find(w => w.path === path);
          if (existingWorkspace) {
            throw new Error('该路径已被其他工作区使用');
          }

          // 创建工作区
          const workspace: Workspace = {
            id: crypto.randomUUID(),
            name,
            path,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
          };

          // 更新状态
          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspaceId: workspace.id,
            isLoading: false,
          }));

          // 切换到新工作区
          await get().switchWorkspace(workspace.id);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建工作区失败',
            isLoading: false,
          });
          throw error;
        }
      },

      // 切换工作区
      switchWorkspace: async (id: string) => {
        const workspace = get().workspaces.find(w => w.id === id);
        if (!workspace) {
          throw new Error('工作区不存在');
        }

        // 更新最后访问时间
        set((state) => ({
          workspaces: state.workspaces.map(w =>
            w.id === id
              ? { ...w, lastAccessed: new Date().toISOString() }
              : w
          ),
          currentWorkspaceId: id,
        }));

        // 更新全局配置的工作目录
        try {
          await tauri.setWorkDir(workspace.path);
        } catch (error) {
          console.error('更新工作目录失败:', error);
        }

        // 通知其他组件工作区已切换
        window.dispatchEvent(new CustomEvent('workspace-changed', {
          detail: { workspaceId: id }
        }));
      },

      // 删除工作区
      deleteWorkspace: async (id: string) => {
        const { workspaces, currentWorkspaceId } = get();
        
        if (workspaces.length <= 1) {
          throw new Error('至少需要保留一个工作区');
        }

        const workspaceToDelete = workspaces.find(w => w.id === id);
        if (!workspaceToDelete) {
          throw new Error('工作区不存在');
        }

        const newWorkspaces = workspaces.filter(w => w.id !== id);
        const newCurrentId = currentWorkspaceId === id 
          ? newWorkspaces[0]?.id || null 
          : currentWorkspaceId;

        set({
          workspaces: newWorkspaces,
          currentWorkspaceId: newCurrentId,
        });

        // 如果删除的是当前工作区，切换到剩余的工作区
        if (currentWorkspaceId === id && newCurrentId) {
          await get().switchWorkspace(newCurrentId);
        }
      },

      // 更新工作区
      updateWorkspace: async (id: string, updates: Partial<Workspace>) => {
        set((state) => ({
          workspaces: state.workspaces.map(w =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      // 获取当前工作区
      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find(w => w.id === currentWorkspaceId) || null;
      },

      // 验证工作区路径
      validateWorkspacePath: async (path: string): Promise<boolean> => {
        try {
          return await tauri.validateWorkspacePath(path);
        } catch {
          return false;
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);