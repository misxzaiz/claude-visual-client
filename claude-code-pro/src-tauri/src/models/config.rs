use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
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
        Self {
            claude_cmd: "claude".to_string(),
            work_dir: None,
            permission_mode: "default".to_string(),
            session_dir: None,
            git_bin_path: None,
        }
    }
}

/// 健康状态
#[derive(Debug, Clone, Serialize, Deserialize)]
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
