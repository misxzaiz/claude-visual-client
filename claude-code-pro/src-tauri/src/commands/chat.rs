use crate::error::Result;
use crate::services::claude_process::ClaudeProcess;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tauri::{Emitter, Window};
use uuid::Uuid;

/// 会话状态
#[derive(Clone)]
pub struct SessionState {
    pub id: String,
    pub claude_session_id: Option<String>,
    pub is_active: bool,
}

/// 活跃会话管理器
pub struct SessionManager {
    sessions: Arc<Mutex<HashMap<String, SessionState>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_session(&self) -> String {
        let id = Uuid::new_v4().to_string();
        let state = SessionState {
            id: id.clone(),
            claude_session_id: None,
            is_active: true,
        };
        self.sessions.lock().unwrap().insert(id.clone(), state);
        id
    }

    pub fn get_session(&self, id: &str) -> Option<SessionState> {
        self.sessions.lock().unwrap().get(id).cloned()
    }

    pub fn set_claude_session_id(&self, id: &str, claude_id: String) {
        if let Some(session) = self.sessions.lock().unwrap().get_mut(id) {
            session.claude_session_id = Some(claude_id);
        }
    }

    pub fn end_session(&self, id: &str) {
        if let Some(session) = self.sessions.lock().unwrap().get_mut(id) {
            session.is_active = false;
        }
    }

    pub fn is_active(&self, id: &str) -> bool {
        self.get_session(id)
            .map(|s| s.is_active)
            .unwrap_or(false)
    }
}

impl Default for SessionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// 全局进程管理器
pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, ClaudeProcess>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn add_process(&self, id: String, process: ClaudeProcess) {
        self.processes.lock().unwrap().insert(id, process);
    }

    pub fn remove_process(&self, id: &str) {
        self.processes.lock().unwrap().remove(id);
    }

    pub fn get_process(&self, _id: &str) -> Option<ClaudeProcess> {
        // 注意：这里需要克隆进程，但由于 ClaudeProcess 包含 Child，
        // 我们不能直接克隆。这个方法需要重构。
        // 暂时返回 None，实际使用时会直接操作 HashMap
        None
    }

    pub fn kill_process(&self, id: &str) -> Result<()> {
        let mut processes = self.processes.lock().unwrap();
        if let Some(mut process) = processes.remove(id) {
            process.kill()?;
        }
        Ok(())
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// 启动聊天会话
#[tauri::command]
pub async fn start_chat(
    message: String,
    window: Window,
) -> Result<String> {
    // TODO: 实现完整的聊天启动逻辑
    // 1. 创建会话
    // 2. 启动 Claude 进程
    // 3. 监听 stdout 并解析流事件
    // 4. 通过 Tauri events 发送到前端

    // 简化实现：先返回会话 ID
    let session_id = Uuid::new_v4().to_string();

    // 发送测试事件
    window.emit("chat-event", serde_json::json!({
        "type": "session_start",
        "sessionId": session_id
    }))?;

    window.emit("chat-event", serde_json::json!({
        "type": "text_delta",
        "text": format!("测试响应: {}\n", message)
    }))?;

    Ok(session_id)
}

/// 继续聊天会话
#[tauri::command]
pub async fn continue_chat(
    session_id: String,
    window: Window,
) -> Result<()> {
    // TODO: 实现继续聊天逻辑
    // 1. 检查会话是否存在
    // 2. 使用 --resume 参数启动 Claude
    // 3. 发送空输入触发继续

    window.emit("chat-event", serde_json::json!({
        "type": "text_delta",
        "text": "继续对话...\n"
    }))?;

    Ok(())
}

/// 中断聊天
#[tauri::command]
pub async fn interrupt_chat(
    _session_id: String,
) -> Result<()> {
    // TODO: 实现中断逻辑
    // 1. 终止对应的 Claude 进程
    // 2. 更新会话状态

    Ok(())
}
