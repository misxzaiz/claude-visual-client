/**
 * 配置相关类型定义
 */

/** 权限模式 */
export type PermissionMode = 'default' | 'bypassPermissions' | 'dontAsk' | 'acceptEdits';

/** 应用配置 */
export interface Config {
  /** Claude CLI 命令路径 */
  claudeCmd: string;
  /** 工作目录 */
  workDir?: string;
  /** 权限模式 */
  permissionMode: PermissionMode;
  /** 会话保存路径 */
  sessionDir?: string;
  /** Git 二进制路径 (Windows) */
  gitBinPath?: string;
  /** 是否启用日志 */
  enableLogging?: boolean;
}

/** 健康状态 */
export interface HealthStatus {
  /** Claude CLI 是否可用 */
  claudeAvailable: boolean;
  /** Claude 版本 */
  claudeVersion?: string;
  /** 工作目录 */
  workDir?: string;
  /** 配置是否有效 */
  configValid: boolean;
}
