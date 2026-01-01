use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::chat::Message;

/// 会话信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    /// 唯一 ID
    pub id: String,

    /// 会话标题（从第一条消息生成）
    pub title: String,

    /// 消息列表
    pub messages: Vec<Message>,

    /// 创建时间
    pub created_at: DateTime<Utc>,

    /// 更新时间
    pub updated_at: DateTime<Utc>,

    /// Claude CLI 的 session ID (用于 --resume)
    pub claude_session_id: Option<String>,

    /// 是否已归档
    pub archived: bool,
}

impl Session {
    pub fn new(title: String) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            messages: Vec::new(),
            created_at: now,
            updated_at: now,
            claude_session_id: None,
            archived: false,
        }
    }

    pub fn add_message(&mut self, message: Message) {
        self.messages.push(message);
        self.updated_at = Utc::now();
    }

    pub fn last_message(&self) -> Option<&Message> {
        self.messages.last()
    }
}

/// 会话摘要（用于列表显示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub message_count: usize,
    pub archived: bool,
}

impl From<&Session> for SessionSummary {
    fn from(session: &Session) -> Self {
        Self {
            id: session.id.clone(),
            title: session.title.clone(),
            created_at: session.created_at,
            updated_at: session.updated_at,
            message_count: session.messages.len(),
            archived: session.archived,
        }
    }
}
