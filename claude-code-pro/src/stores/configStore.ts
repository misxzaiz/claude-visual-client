/**
 * 配置状态管理
 */

import { create } from 'zustand';
import type { Config, HealthStatus } from '../types';
import * as tauri from '../services/tauri';

interface ConfigState {
  /** 当前配置 */
  config: Config | null;
  /** 健康状态 */
  healthStatus: HealthStatus | null;
  /** 加载中 */
  loading: boolean;
  /** 连接中（首次启动） */
  isConnecting: boolean;
  /** 错误 */
  error: string | null;

  /** 加载配置 */
  loadConfig: () => Promise<void>;
  /** 更新配置 */
  updateConfig: (config: Config) => Promise<void>;
  /** 设置工作目录 */
  setWorkDir: (path: string | null) => Promise<void>;
  /** 设置 Claude 命令 */
  setClaudeCmd: (cmd: string) => Promise<void>;
  /** 设置权限模式 */
  setPermissionMode: (mode: string) => Promise<void>;
  /** 刷新健康状态 */
  refreshHealth: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  healthStatus: null,
  loading: false,
  isConnecting: true,  // 默认为 true，显示连接蒙板
  error: null,

  loadConfig: async () => {
    set({ loading: true, isConnecting: true, error: null });
    try {
      const [config, health] = await Promise.all([
        tauri.getConfig(),
        tauri.healthCheck(),
      ]);
      // 确保 enableLogging 有默认值
      const configWithDefaults = {
        ...config,
        enableLogging: config.enableLogging ?? true,
      };
      set({ config: configWithDefaults, healthStatus: health, loading: false, isConnecting: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '加载配置失败',
        loading: false,
        isConnecting: false
      });
    }
  },

  updateConfig: async (config) => {
    set({ loading: true, error: null });
    try {
      await tauri.updateConfig(config);
      set({ config, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '更新配置失败',
        loading: false
      });
    }
  },

  setWorkDir: async (path) => {
    set({ loading: true, error: null });
    try {
      await tauri.setWorkDir(path);
      const config = await tauri.getConfig();
      set({ config, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '设置工作目录失败',
        loading: false
      });
    }
  },

  setClaudeCmd: async (cmd) => {
    set({ loading: true, error: null });
    try {
      await tauri.setClaudeCmd(cmd);
      const config = await tauri.getConfig();
      set({ config, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '设置 Claude 命令失败',
        loading: false
      });
    }
  },

  setPermissionMode: async (mode) => {
    set({ loading: true, error: null });
    try {
      await tauri.setPermissionMode(mode);
      const config = await tauri.getConfig();
      set({ config, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '设置权限模式失败',
        loading: false
      });
    }
  },

  refreshHealth: async () => {
    try {
      const health = await tauri.healthCheck();
      set({ healthStatus: health });
    } catch (e) {
      console.error('刷新健康状态失败:', e);
    }
  },
}));
