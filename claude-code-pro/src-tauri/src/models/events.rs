use serde::{Deserialize, Serialize};
use super::chat::PermissionDenial;

/// 流事件类型 - 对应 Claude CLI stream-json 输出
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum StreamEvent {
    /// 会话开始
    SessionStart { session_id: String },

    /// 文本内容
    TextDelta { text: String },

    /// 工具调用开始
    ToolStart { tool_name: String, input: serde_json::Value },

    /// 工具调用结束
    ToolEnd { tool_name: String, output: Option<String> },

    /// 权限请求（工具调用被拒绝）
    PermissionRequest {
        session_id: String,
        denials: Vec<PermissionDenial>,
    },

    /// 结果子类型
    Result { subtype: String, content: Option<String> },

    /// 错误
    Error { error: String },

    /// 会话结束
    SessionEnd,
}

impl StreamEvent {
    /// 解析 Claude CLI 的 stream-json 行
    pub fn parse_line(line: &str) -> Option<Self> {
        let line = line.trim();
        if line.is_empty() {
            return None;
        }

        // 尝试解析为 JSON
        let value: serde_json::Value = serde_json::from_str(line).ok()?;

        let event_type = value.get("type")?.as_str()?;

        match event_type {
            "session_start" => Some(StreamEvent::SessionStart {
                session_id: value.get("session_id")?.as_str()?.to_string(),
            }),
            "text_delta" => Some(StreamEvent::TextDelta {
                text: value.get("text")?.as_str()?.to_string(),
            }),
            "tool_start" => Some(StreamEvent::ToolStart {
                tool_name: value.get("tool_name")?.as_str()?.to_string(),
                input: value.get("input").cloned().unwrap_or(serde_json::Value::Null),
            }),
            "tool_end" => Some(StreamEvent::ToolEnd {
                tool_name: value.get("tool_name")?.as_str()?.to_string(),
                output: value.get("output").and_then(|v| v.as_str().map(|s| s.to_string())),
            }),
            "permission_request" => {
                let denials: Vec<PermissionDenial> = serde_json::from_value(
                    value.get("denials")?.clone()
                ).ok()?;
                Some(StreamEvent::PermissionRequest {
                    session_id: value.get("session_id")?.as_str()?.to_string(),
                    denials,
                })
            },
            "result" => Some(StreamEvent::Result {
                subtype: value.get("subtype")?.as_str()?.to_string(),
                content: value.get("content").and_then(|v| v.as_str().map(|s| s.to_string())),
            }),
            "error" => Some(StreamEvent::Error {
                error: value.get("error")?.as_str()?.to_string(),
            }),
            "session_end" => Some(StreamEvent::SessionEnd),
            _ => None,
        }
    }
}

/// Tauri 事件名称
pub const EVENT_CHAT: &str = "chat-event";
pub const EVENT_PERMISSION: &str = "permission-request";
pub const EVENT_ERROR: &str = "error-event";
