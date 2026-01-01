use crate::error::{AppError, Result};
use crate::models::config::{Config, HealthStatus};
use std::path::{Path, PathBuf};
use std::env;
use std::process::Command;

/// 配置存储管理器
pub struct ConfigStore {
    config: Config,
    config_path: PathBuf,
}

impl ConfigStore {
    /// 创建新的配置存储
    pub fn new() -> Result<Self> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| AppError::ConfigError("无法获取配置目录".to_string()))?
            .join("claude-code-pro");

        // 确保配置目录存在
        std::fs::create_dir_all(&config_dir)?;

        let config_path = config_dir.join("config.json");
        let config = Self::load_from_file(&config_path)?;

        Ok(Self { config, config_path })
    }

    /// 从文件加载配置
    fn load_from_file(path: &Path) -> Result<Config> {
        if path.exists() {
            let content = std::fs::read_to_string(path)?;
            let config: Config = serde_json::from_str(&content)?;
            Ok(config)
        } else {
            Ok(Config::default())
        }
    }

    /// 保存配置到文件
    pub fn save(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.config)?;
        std::fs::write(&self.config_path, content)?;
        Ok(())
    }

    /// 获取配置
    pub fn get(&self) -> &Config {
        &self.config
    }

    /// 更新配置
    pub fn update(&mut self, config: Config) -> Result<()> {
        self.config = config;
        self.save()
    }

    /// 设置工作目录
    pub fn set_work_dir(&mut self, path: Option<PathBuf>) -> Result<()> {
        self.config.work_dir = path;
        self.save()
    }

    /// 设置 Claude 命令路径
    pub fn set_claude_cmd(&mut self, cmd: String) -> Result<()> {
        self.config.claude_cmd = cmd;
        self.save()
    }

    /// 设置权限模式
    pub fn set_permission_mode(&mut self, mode: String) -> Result<()> {
        self.config.permission_mode = mode;
        self.save()
    }

    /// 检测 Claude CLI 是否可用
    pub fn detect_claude(&self) -> Option<String> {
        let output = Command::new(&self.config.claude_cmd)
            .arg("--version")
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    String::from_utf8_lossy(&output.stdout)
                        .lines()
                        .next()
                        .map(|s| s.to_string())
                } else {
                    None
                }
            }
            Err(_) => None,
        }
    }

    /// 获取会话目录
    pub fn session_dir(&self) -> Result<PathBuf> {
        if let Some(ref dir) = self.config.session_dir {
            Ok(dir.clone())
        } else {
            let data_dir = dirs::data_local_dir()
                .ok_or_else(|| AppError::ConfigError("无法获取数据目录".to_string()))?
                .join("claude-code-pro")
                .join("sessions");

            // 确保目录存在
            std::fs::create_dir_all(&data_dir)?;
            Ok(data_dir)
        }
    }

    /// 获取健康状态
    pub fn health_status(&self) -> HealthStatus {
        let claude_available = self.detect_claude().is_some();
        let claude_version = self.detect_claude();

        HealthStatus {
            claude_available,
            claude_version,
            work_dir: self.config.work_dir.as_ref()
                .and_then(|p| p.to_str().map(|s| s.to_string())),
            config_valid: true,
        }
    }

    /// 获取当前工作目录
    pub fn current_work_dir(&self) -> PathBuf {
        self.config.work_dir.clone()
            .unwrap_or_else(|| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
    }

    /// 设置会话目录
    pub fn set_session_dir(&mut self, path: PathBuf) -> Result<()> {
        std::fs::create_dir_all(&path)?;
        self.config.session_dir = Some(path);
        self.save()
    }
}

impl Default for ConfigStore {
    fn default() -> Self {
        Self::new().expect("无法创建配置存储")
    }
}
