mod error;
mod models;
mod services;
mod commands;

use error::Result;
use models::config::{Config, HealthStatus};
use services::config_store::ConfigStore;
use services::logger::Logger;
use commands::chat::{start_chat, continue_chat, interrupt_chat};
use commands::{validate_workspace_path, get_directory_info};
use commands::file_explorer::{
    read_directory, get_file_content, create_file, create_directory,
    delete_file, rename_file, path_exists, read_commands, search_files
};
use commands::logging::{
    get_log_dir, read_logs, clear_logs, open_log_dir,
    set_logging_enabled, is_logging_enabled
};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

/// 全局配置状态
pub struct AppState {
    pub config_store: Mutex<ConfigStore>,
    /// 保存会话 ID 到进程 PID 的映射
    /// 使用 PID 而不是 Child，因为 Child 会在读取输出时被消费
    pub sessions: Arc<Mutex<HashMap<String, u32>>>,
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// 获取配置
#[tauri::command]
fn get_config(state: tauri::State<AppState>) -> Result<Config> {
    let store = state.config_store.lock()
        .map_err(|e| error::AppError::Unknown(e.to_string()))?;
    Ok(store.get().clone())
}

/// 更新配置
#[tauri::command]
fn update_config(config: Config, state: tauri::State<AppState>) -> Result<()> {
    let mut store = state.config_store.lock()
        .map_err(|e| error::AppError::Unknown(e.to_string()))?;
    store.update(config)
}

/// 设置工作目录
#[tauri::command]
fn set_work_dir(path: Option<String>, state: tauri::State<AppState>) -> Result<()> {
    let mut store = state.config_store.lock()
        .map_err(|e| error::AppError::Unknown(e.to_string()))?;
    let path_buf = path.map(|p| p.into());
    store.set_work_dir(path_buf)
}

/// 设置 Claude 命令路径
#[tauri::command]
fn set_claude_cmd(cmd: String, state: tauri::State<AppState>) -> Result<()> {
    let mut store = state.config_store.lock()
        .map_err(|e| error::AppError::Unknown(e.to_string()))?;
    store.set_claude_cmd(cmd)
}



/// 健康检查
#[tauri::command]
fn health_check(state: tauri::State<AppState>) -> HealthStatus {
    let store = state.config_store.lock()
        .unwrap_or_else(|e| {
            e.into_inner()
        });
    store.health_status()
}

/// 检测 Claude CLI
#[tauri::command]
fn detect_claude(state: tauri::State<AppState>) -> Option<String> {
    let store = state.config_store.lock()
        .unwrap_or_else(|e| e.into_inner());
    store.detect_claude()
}

// ============================================================================
// Tauri App Builder
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化配置存储
    let config_store = ConfigStore::new()
        .expect("无法初始化配置存储");

    // 根据配置初始化日志系统
    let logging_enabled = config_store.get().enable_logging;
    let _logger_guard = Logger::init(logging_enabled);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            config_store: Mutex::new(config_store),
            sessions: Arc::new(Mutex::new(HashMap::new())),
        })
        .invoke_handler(tauri::generate_handler![
            // 配置相关
            get_config,
            update_config,
            set_work_dir,
            set_claude_cmd,
            // 健康检查
            health_check,
            detect_claude,
            // 聊天相关
            start_chat,
            continue_chat,
            interrupt_chat,
            // 工作区相关
            validate_workspace_path,
            get_directory_info,
            // 文件浏览器相关
            read_directory,
            get_file_content,
            create_file,
            create_directory,
            delete_file,
            rename_file,
            path_exists,
            read_commands,
            search_files,
            // 日志相关
            get_log_dir,
            read_logs,
            clear_logs,
            open_log_dir,
            set_logging_enabled,
            is_logging_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
