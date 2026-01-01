use crate::error::{AppError, Result};
use crate::models::config::Config;
use crate::models::events::StreamEvent;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio, Child};
use tauri::{Emitter, Window};
use uuid::Uuid;

/// Claude 聊天会话
pub struct ChatSession {
    pub id: String,
    pub child: Child,
    pub stdin: std::process::ChildStdin,
}

impl ChatSession {
    /// 启动新的聊天会话
    pub fn start(config: &Config, message: &str) -> Result<Self> {
        let mut cmd = Command::new(&config.claude_cmd);
        cmd.args(["chat", "--json"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // 设置工作目录
        if let Some(ref work_dir) = config.work_dir {
            cmd.current_dir(work_dir);
        }

        let mut child = cmd.spawn()
            .map_err(|e| AppError::ProcessError(format!("启动 Claude 失败: {}", e)))?;

        // 写入用户消息
        if let Some(ref mut stdin) = child.stdin {
            use std::io::Write;
            writeln!(stdin, "{}", message)
                .map_err(|e| AppError::ProcessError(format!("写入消息失败: {}", e)))?;
        }

        let stdin = child.stdin.take()
            .ok_or_else(|| AppError::ProcessError("无法获取 stdin".to_string()))?;

        Ok(Self {
            id: Uuid::new_v4().to_string(),
            child,
            stdin,
        })
    }

    /// 发送更多输入
    pub fn send_input(&mut self, input: &str) -> Result<()> {
        use std::io::Write;
        writeln!(self.stdin, "{}", input)
            .map_err(|e| AppError::ProcessError(format!("发送输入失败: {}", e)))?;
        Ok(())
    }

    /// 读取输出并解析事件
    pub fn read_events<F>(&mut self, mut callback: F)
    where
        F: FnMut(StreamEvent),
    {
        if let Some(stdout) = self.child.stdout.take() {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(_) => break,
                };

                if line.trim().is_empty() {
                    continue;
                }

                // 使用 StreamEvent::parse_line 解析
                if let Some(event) = StreamEvent::parse_line(&line) {
                    callback(event);
                }
            }
        }
    }

    /// 终止会话
    pub fn terminate(&mut self) -> Result<()> {
        self.child.kill()
            .map_err(|e| AppError::ProcessError(format!("终止会话失败: {}", e)))?;
        Ok(())
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// 启动聊天会话（后台异步执行）
#[tauri::command]
pub async fn start_chat(
    message: String,
    window: Window,
) -> Result<String> {
    // 获取配置
    let config = Config::default(); // TODO: 从 AppState 获取配置

    // 启动 Claude 会话
    let mut session = ChatSession::start(&config, &message)?;

    let session_id = session.id.clone();
    let window_clone = window.clone();

    // 在后台线程中读取输出
    std::thread::spawn(move || {
        session.read_events(|event| {
            // 发送事件到前端
            let event_json = serde_json::to_value(&event)
                .unwrap_or(serde_json::Value::Null);
            let _ = window_clone.emit("chat-event", event_json);
        });
    });

    Ok(session_id)
}

/// 继续聊天会话
#[tauri::command]
pub async fn continue_chat(
    _session_id: String,
    window: Window,
) -> Result<()> {
    // TODO: 实现继续聊天逻辑
    // 需要保存会话状态并在后台线程中恢复

    window.emit("chat-event", serde_json::json!({
        "type": "text_delta",
        "text": "继续对话功能待实现...\n"
    }))?;

    Ok(())
}

/// 中断聊天
#[tauri::command]
pub async fn interrupt_chat(
    _session_id: String,
) -> Result<()> {
    // TODO: 实现中断逻辑
    // 需要终止对应的后台线程和进程

    Ok(())
}
