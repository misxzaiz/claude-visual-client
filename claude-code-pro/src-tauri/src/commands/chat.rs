use crate::error::{AppError, Result};
use crate::models::config::Config;
use crate::models::events::StreamEvent;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio, Child};
use tauri::{Emitter, Window};
use uuid::Uuid;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Windows 进程创建标志：不创建新窗口
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Claude 聊天会话
pub struct ChatSession {
    pub id: String,
    pub child: Child,
}

impl ChatSession {
    /// 创建ChatSession实例（用于continue_chat）
    pub fn with_id_and_child(id: String, child: Child) -> Self {
        Self { id, child }
    }
}

impl ChatSession {
    /// 启动新的聊天会话
    pub fn start(config: &Config, message: &str) -> Result<Self> {
        eprintln!("[ChatSession::start] 启动 Claude 会话");
        eprintln!("[ChatSession::start] claude_cmd: {}", config.claude_cmd);
        eprintln!("[ChatSession::start] message: {}", message);
        eprintln!("[ChatSession::start] permission_mode: {}", config.permission_mode);

        // 在 Windows 上，.cmd 文件需要通过 cmd.exe 执行
        // 参数必须分别传递，不能合并为一个字符串
        #[cfg(windows)]
        let mut cmd = Command::new("cmd");
        #[cfg(windows)]
        cmd.args([
            "/c",
            &config.claude_cmd,
            "--print",
            "--verbose",
            "--output-format",
            "stream-json",
            "--permission-mode",
            &config.permission_mode,
            message,
        ]);

        #[cfg(not(windows))]
        let mut cmd = Command::new(&config.claude_cmd);
        #[cfg(not(windows))]
        cmd.args([
            "--print",
            "--verbose",
            "--output-format",
            "stream-json",
            "--permission-mode",
            &config.permission_mode,
            message,
        ]);

        cmd.stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Windows 上隐藏 CMD 窗口
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        // 设置工作目录
        if let Some(ref work_dir) = config.work_dir {
            eprintln!("[ChatSession::start] work_dir: {:?}", work_dir);
            cmd.current_dir(work_dir);
        }

        // 设置 Git Bash 环境变量 (Windows 需要)
        if let Some(ref git_bash_path) = config.git_bin_path {
            eprintln!("[ChatSession::start] 设置 CLAUDE_CODE_GIT_BASH_PATH: {}", git_bash_path);
            cmd.env("CLAUDE_CODE_GIT_BASH_PATH", git_bash_path);
        }

        eprintln!("[ChatSession::start] 执行命令: {:?}", cmd);

        let child = cmd.spawn()
            .map_err(|e| AppError::ProcessError(format!("启动 Claude 失败: {}", e)))?;

        eprintln!("[ChatSession::start] 进程 PID: {:?}", child.id());

        Ok(Self {
            id: Uuid::new_v4().to_string(),
            child,
        })
    }

    /// 读取输出并解析事件
    pub fn read_events<F>(self, mut callback: F)
    where
        F: FnMut(StreamEvent) + Send + 'static,
    {
        eprintln!("[ChatSession::read_events] 开始读取输出");

        let stdout = self.child.stdout
            .ok_or_else(|| AppError::ProcessError("无法获取 stdout".to_string()));

        if stdout.is_err() {
            return;
        }

        let stderr = self.child.stderr
            .ok_or_else(|| AppError::ProcessError("无法获取 stderr".to_string()));

        if stderr.is_err() {
            return;
        }

        let stdout = stdout.unwrap();
        let stderr = stderr.unwrap();

        // 启动单独的线程读取 stderr
        std::thread::spawn(move || {
            eprintln!("[stderr_reader] 开始读取 stderr");
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                match line {
                    Ok(l) => eprintln!("[stderr] {}", l),
                    Err(_) => break,
                }
            }
            eprintln!("[stderr_reader] stderr 结束");
        });

        let reader = BufReader::new(stdout);
        let mut line_count = 0;

        for line in reader.lines() {
            let line = match line {
                Ok(l) => l,
                Err(e) => {
                    eprintln!("[ChatSession::read_events] 读取行错误: {}", e);
                    break;
                }
            };

            line_count += 1;
            let line_trimmed = line.trim();

            if line_trimmed.is_empty() {
                continue;
            }

            eprintln!("[ChatSession::read_events] 行 {}: {}", line_count, line_trimmed.chars().take(100).collect::<String>());

            // 使用 StreamEvent::parse_line 解析
            if let Some(event) = StreamEvent::parse_line(line_trimmed) {
                eprintln!("[ChatSession::read_events] 解析成功事件: {:?}", std::mem::discriminant(&event));
                callback(event);
            } else {
                eprintln!("[ChatSession::read_events] 解析失败，原始内容: {}", line_trimmed.chars().take(200).collect::<String>());
            }
        }

        eprintln!("[ChatSession::read_events] 读取结束，共处理 {} 行", line_count);
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
    state: tauri::State<'_, crate::AppState>,
    work_dir: Option<String>,  // 可选的工作目录参数
) -> Result<String> {
    eprintln!("[start_chat] 收到消息: {}", message);

    // 从 AppState 获取实际配置
    let config_store = state.config_store.lock()
        .map_err(|e| crate::error::AppError::Unknown(e.to_string()))?;
    let mut config = config_store.get().clone();

    // 如果传入了 work_dir 参数，优先使用它而不是配置中的
    if let Some(ref work_dir_str) = work_dir {
        let work_dir_path = PathBuf::from(work_dir_str);
        eprintln!("[start_chat] 使用传入的工作目录: {:?}", work_dir_path);
        config.work_dir = Some(work_dir_path);
    }

    // 启动 Claude 会话
    let session = ChatSession::start(&config, &message)?;

    let session_id = session.id.clone();
    let window_clone = window.clone();
    let process_id = session.child.id();

    eprintln!("[start_chat] 会话 ID: {}, 进程 ID: {}", session_id, process_id);

    // 将进程ID存储到全局sessions中
    {
        let mut sessions = state.sessions.lock()
            .map_err(|e| crate::error::AppError::Unknown(e.to_string()))?;
        sessions.insert(session_id.clone(), process_id);
    }

    

    // 在后台线程中读取输出
    std::thread::spawn(move || {
        eprintln!("[start_chat] 后台线程开始");
        session.read_events(move |event| {
            // 发送事件到前端 - 直接序列化为 JSON 字符串
            let event_json = serde_json::to_string(&event)
                .unwrap_or_else(|_| "{}".to_string());
            eprintln!("[start_chat] 发送事件: {}", event_json);
            let _ = window_clone.emit("chat-event", event_json);
        });
        
        eprintln!("[start_chat] 后台线程结束");
    });

    Ok(session_id)
}

/// 继续聊天会话
#[tauri::command]
pub async fn continue_chat(
    session_id: String,
    message: String,
    window: Window,
    state: tauri::State<'_, crate::AppState>,
    work_dir: Option<String>,  // 可选的工作目录参数
) -> Result<()> {
    eprintln!("[continue_chat] 继续会话: {}", session_id);
    eprintln!("[continue_chat] 消息: {}", message);

    // 从 AppState 获取实际配置
    let config_store = state.config_store.lock()
        .map_err(|e| crate::error::AppError::Unknown(e.to_string()))?;
    let mut config = config_store.get().clone();

    // 如果传入了 work_dir 参数，优先使用它而不是配置中的
    if let Some(ref work_dir_str) = work_dir {
        let work_dir_path = PathBuf::from(work_dir_str);
        eprintln!("[continue_chat] 使用传入的工作目录: {:?}", work_dir_path);
        config.work_dir = Some(work_dir_path);
    }

    // 使用 Claude CLI 原生的 --resume 参数恢复会话
    eprintln!("[continue_chat] 使用 --resume 参数恢复会话");

    // 在 Windows 上，.cmd 文件需要通过 cmd.exe 执行
    #[cfg(windows)]
    let mut cmd = Command::new("cmd");
    #[cfg(windows)]
    cmd.args([
        "/c",
        &config.claude_cmd,
        "--resume",            // ✅ 使用真正的会话恢复
        &session_id,          // ✅ 传递会话ID
        "--print",
        "--verbose",
        "--output-format", "stream-json",
        "--permission-mode", &config.permission_mode,
        &message,
    ]);

    #[cfg(not(windows))]
    let mut cmd = Command::new(&config.claude_cmd);
    #[cfg(not(windows))]
    cmd.args([
        "--resume",            // ✅ 使用真正的会话恢复
        &session_id,          // ✅ 传递会话ID
        "--print",
        "--verbose",
        "--output-format", "stream-json",
        "--permission-mode", &config.permission_mode,
        &message,
    ]);

    cmd.stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Windows 上隐藏 CMD 窗口
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    // 设置工作目录
    if let Some(ref work_dir) = config.work_dir {
        eprintln!("[continue_chat] work_dir: {:?}", work_dir);
        cmd.current_dir(work_dir);
    }

    // 设置 Git Bash 环境变量 (Windows 需要)
    if let Some(ref git_bash_path) = config.git_bin_path {
        eprintln!("[continue_chat] 设置 CLAUDE_CODE_GIT_BASH_PATH: {}", git_bash_path);
        cmd.env("CLAUDE_CODE_GIT_BASH_PATH", git_bash_path);
    }

    eprintln!("[continue_chat] 执行命令: {:?}", cmd);

    let child = cmd.spawn()
        .map_err(|e| AppError::ProcessError(format!("继续 Claude 会话失败: {}", e)))?;

    eprintln!("[continue_chat] 进程 PID: {:?}", child.id());

    let process_id = child.id();
    let session = ChatSession::with_id_and_child(session_id.clone(), child);
    let window_clone = window.clone();

    eprintln!("[continue_chat] 会话 ID: {}, 进程 ID: {}", session_id, process_id);

    // 将进程ID存储到全局sessions中
    {
        let mut sessions = state.sessions.lock()
            .map_err(|e| crate::error::AppError::Unknown(e.to_string()))?;
        sessions.insert(session_id.clone(), process_id);
    }

    // 在后台线程中读取输出
    std::thread::spawn(move || {
        eprintln!("[continue_chat] 后台线程开始");
        session.read_events(move |event| {
            // 发送事件到前端
            let event_json = serde_json::to_string(&event)
                .unwrap_or_else(|_| "{}".to_string());
            eprintln!("[continue_chat] 发送事件: {}", event_json);
            let _ = window_clone.emit("chat-event", event_json);
        });
        
        eprintln!("[continue_chat] 后台线程结束");
    });

    Ok(())
}

/// 中断聊天会话
#[tauri::command]
pub async fn interrupt_chat(
    session_id: String,
    state: tauri::State<'_, crate::AppState>,
) -> Result<()> {
    eprintln!("[interrupt_chat] 中断会话: {}", session_id);
    
    // 从sessions中获取并移除进程ID
    let mut sessions = state.sessions.lock()
        .map_err(|e| crate::error::AppError::Unknown(e.to_string()))?;
    
    if let Some(process_id) = sessions.remove(&session_id) {
        eprintln!("[interrupt_chat] 找到进程 PID: {}", process_id);
        
        // 使用系统API终止进程
        #[cfg(windows)]
        {
            use std::process::Command;
            let result = Command::new("taskkill")
                .args(["/F", "/PID", &process_id.to_string()])
                .output();
                
            match result {
                Ok(output) => {
                    if output.status.success() {
                        eprintln!("[interrupt_chat] 成功终止进程");
                    } else {
                        eprintln!("[interrupt_chat] 终止进程失败: {}", String::from_utf8_lossy(&output.stderr));
                        return Err(AppError::ProcessError(format!("无法终止进程: {}", String::from_utf8_lossy(&output.stderr))));
                    }
                }
                Err(e) => {
                    eprintln!("[interrupt_chat] 执行taskkill命令失败: {}", e);
                    return Err(AppError::ProcessError(format!("无法终止进程: {}", e)));
                }
            }
        }
        
        #[cfg(not(windows))]
        {
            use std::process::Command;
            let result = Command::new("kill")
                .arg("-9")
                .arg(process_id.to_string())
                .output();
                
            match result {
                Ok(output) => {
                    if output.status.success() {
                        eprintln!("[interrupt_chat] 成功终止进程");
                    } else {
                        eprintln!("[interrupt_chat] 终止进程失败: {}", String::from_utf8_lossy(&output.stderr));
                        return Err(AppError::ProcessError(format!("无法终止进程: {}", String::from_utf8_lossy(&output.stderr))));
                    }
                }
                Err(e) => {
                    eprintln!("[interrupt_chat] 执行kill命令失败: {}", e);
                    return Err(AppError::ProcessError(format!("无法终止进程: {}", e)));
                }
            }
        }
    } else {
        eprintln!("[interrupt_chat] 未找到会话: {}", session_id);
        return Err(AppError::ProcessError(format!("未找到会话: {}", session_id)));
    }
    
    Ok(())
}
