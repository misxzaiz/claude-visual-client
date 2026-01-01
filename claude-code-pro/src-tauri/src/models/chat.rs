use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// 消息角色
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

/// 工具调用状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ToolStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

/// 工具调用信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub status: ToolStatus,
    pub input: Option<serde_json::Value>,
    pub output: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl ToolCall {
    pub fn new(name: String, input: Option<serde_json::Value>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            status: ToolStatus::Pending,
            input,
            output: None,
            started_at: Utc::now(),
            completed_at: None,
        }
    }

    pub fn complete(&mut self, output: String) {
        self.status = ToolStatus::Completed;
        self.output = Some(output);
        self.completed_at = Some(Utc::now());
    }

    pub fn fail(&mut self, error: String) {
        self.status = ToolStatus::Failed;
        self.output = Some(error);
        self.completed_at = Some(Utc::now());
    }
}

/// 聊天消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub tool_calls: Vec<ToolCall>,
}

impl Message {
    pub fn new(role: MessageRole, content: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            role,
            content,
            timestamp: Utc::now(),
            tool_calls: Vec::new(),
        }
    }

    pub fn user(content: String) -> Self {
        Self::new(MessageRole::User, content)
    }

    pub fn assistant(content: String) -> Self {
        Self::new(MessageRole::Assistant, content)
    }

    pub fn system(content: String) -> Self {
        Self::new(MessageRole::System, content)
    }
}

/// 权限拒绝详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionDenial {
    pub tool_name: String,
    pub reason: String,
    pub details: serde_json::Value,
}

/// 权限请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequest {
    pub id: String,
    pub session_id: String,
    pub denials: Vec<PermissionDenial>,
    pub created_at: DateTime<Utc>,
}

impl PermissionRequest {
    pub fn new(session_id: String, denials: Vec<PermissionDenial>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            session_id,
            denials,
            created_at: Utc::now(),
        }
    }
}
