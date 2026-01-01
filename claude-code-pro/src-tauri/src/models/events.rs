use serde::{Deserialize, Serialize};
use super::chat::PermissionDenial;
use std::collections::HashMap;

/// 流事件类型 - 对应 Claude CLI stream-json 输出
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum StreamEvent {
    /// 系统事件
    #[serde(rename = "system")]
    System {
        subtype: Option<String>,
        #[serde(flatten)]
        extra: HashMap<String, serde_json::Value>,
    },

    /// 助手消息
    #[serde(rename = "assistant")]
    Assistant {
        message: serde_json::Value,
    },

    /// 文本内容
    #[serde(rename = "text_delta")]
    TextDelta { text: String },

    /// 工具调用开始
    #[serde(rename = "tool_start")]
    ToolStart { tool_name: String, input: serde_json::Value },

    /// 工具调用结束
    #[serde(rename = "tool_end")]
    ToolEnd { tool_name: String, output: Option<String> },

    /// 权限请求（工具调用被拒绝）
    #[serde(rename = "permission_request")]
    PermissionRequest {
        session_id: String,
        denials: Vec<PermissionDenial>,
    },

    /// 结果
    #[serde(rename = "result")]
    Result {
        subtype: String,
        #[serde(flatten)]
        extra: HashMap<String, serde_json::Value>,
    },

    /// 错误
    #[serde(rename = "error")]
    Error { error: String },

    /// 会话结束
    #[serde(rename = "session_end")]
    SessionEnd,
}

impl StreamEvent {
    /// 解析 Claude CLI 的 stream-json 行
    pub fn parse_line(line: &str) -> Option<Self> {
        let line = line.trim();
        if line.is_empty() {
            return None;
        }

        // 直接使用 serde 解析
        serde_json::from_str(line).ok()
    }
}

/// Tauri 事件名称
pub const EVENT_CHAT: &str = "chat-event";
pub const EVENT_PERMISSION: &str = "permission-request";
pub const EVENT_ERROR: &str = "error-event";
