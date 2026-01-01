use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    /// Claude CLI 命令路径
    pub claude_cmd: String,

    /// 工作目录
    pub work_dir: Option<PathBuf>,

    /// 权限模式: default, bypassPermissions, dontAsk, acceptEdits
    pub permission_mode: String,

    /// 会话保存路径
    pub session_dir: Option<PathBuf>,

    /// Git 二进制路径 (Windows)
    pub git_bin_path: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        #[cfg(windows)]
        let default_cmd = "C:\\Users\\28409\\AppData\\Roaming\\npm\\claude.cmd".to_string();

        #[cfg(not(windows))]
        let default_cmd = "claude".to_string();

        #[cfg(windows)]
        let default_git_bash = Some("D:\\Program Files\\Git\\usr\\bin\\bash.exe".to_string());

        #[cfg(not(windows))]
        let default_git_bash = None;

        Self {
            claude_cmd: default_cmd,
            work_dir: None,
            permission_mode: "bypassPermissions".to_string(),
            session_dir: None,
            git_bin_path: default_git_bash,
        }
    }
}

/// 健康状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthStatus {
    /// Claude CLI 是否可用
    pub claude_available: bool,

    /// Claude 版本
    pub claude_version: Option<String>,

    /// 工作目录
    pub work_dir: Option<String>,

    /// 配置是否有效
    pub config_valid: bool,
}
