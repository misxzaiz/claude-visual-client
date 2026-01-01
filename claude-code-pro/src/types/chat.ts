/**
 * 聊天相关类型定义
 */

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 工具调用状态 */
export type ToolStatus = 'pending' | 'running' | 'completed' | 'failed';

/** 工具调用信息 */
export interface ToolCall {
  id: string;
  name: string;
  status: ToolStatus;
  input?: Record<string, unknown>;
  output?: string;
  startedAt: string;
  completedAt?: string;
}

/** 聊天消息 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

/** 权限拒绝详情 */
export interface PermissionDenial {
  toolName: string;
  reason: string;
  details: Record<string, unknown>;
}

/** 权限请求 */
export interface PermissionRequest {
  id: string;
  sessionId: string;
  denials: PermissionDenial[];
  createdAt: string;
}

/** 流事件类型 */
export type StreamEvent =
  | { type: 'session_start'; sessionId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_start'; toolName: string; input: Record<string, unknown> }
  | { type: 'tool_end'; toolName: string; output?: string }
  | { type: 'permission_request'; sessionId: string; denials: PermissionDenial[] }
  | { type: 'result'; subtype: string; content?: string }
  | { type: 'error'; error: string }
  | { type: 'session_end' };
