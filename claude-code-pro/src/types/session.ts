/**
 * 会话相关类型定义
 */

import type { Message } from './chat';

/** 会话信息 */
export interface Session {
  /** 唯一 ID */
  id: string;
  /** 会话标题 */
  title: string;
  /** 消息列表 */
  messages: Message[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** Claude CLI 的 session ID */
  claudeSessionId?: string;
  /** 是否已归档 */
  archived: boolean;
}

/** 会话摘要（用于列表显示） */
export interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  archived: boolean;
}
