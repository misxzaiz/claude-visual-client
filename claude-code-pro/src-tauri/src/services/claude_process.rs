use crate::error::{AppError, Result};
use crate::models::config::Config;
use std::process::{Command, Child, Stdio};
use std::io::{BufReader, Write};
use std::path::Path;

/// Claude 进程管理器
pub struct ClaudeProcess {
    child: Child,
}

impl ClaudeProcess {
    /// 启动 Claude 进程
    pub fn spawn(config: &Config, args: &[String]) -> Result<Self> {
        let mut cmd = Command::new(&config.claude_cmd);

        // 设置工作目录
        if let Some(ref work_dir) = config.work_dir {
            if work_dir.as_path().exists() {
                cmd.current_dir(work_dir);
            }
        }

        // 添加参数
        cmd.args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            // Windows 特定处理
            cmd.env("CLAUDE_CODE_GIT_BIN_PATH",
                config.git_bin_path.as_ref().unwrap_or(&"git".to_string()));
        }

        let child = cmd.spawn()
            .map_err(|e| AppError::ProcessError(format!("启动失败: {}", e)))?;

        Ok(Self { child })
    }

    /// 获取 stdout 读取器
    pub fn stdout_reader(&mut self) -> Option<BufReader<std::process::ChildStdout>> {
        self.child.stdout.take().map(BufReader::new)
    }

    /// 获取 stderr 读取器
    pub fn stderr_reader(&mut self) -> Option<BufReader<std::process::ChildStderr>> {
        self.child.stderr.take().map(BufReader::new)
    }

    /// 写入输入到 stdin
    pub fn write_input(&mut self, input: &str) -> Result<()> {
        if let Some(ref mut stdin) = self.child.stdin {
            use std::io::Write;
            writeln!(stdin, "{}", input)
                .map_err(|e| AppError::ProcessError(format!("写入失败: {}", e)))?;
            Ok(())
        } else {
            Err(AppError::ProcessError("stdin 不可用".to_string()))
        }
    }

    /// 终止进程
    pub fn kill(&mut self) -> Result<()> {
        self.child.kill()
            .map_err(|e| AppError::ProcessError(format!("终止失败: {}", e)))?;
        Ok(())
    }

    /// 等待进程结束
    pub fn wait(&mut self) -> Result<std::process::ExitStatus> {
        self.child.wait()
            .map_err(|e| AppError::ProcessError(format!("等待失败: {}", e)))
    }

    /// 获取进程 ID
    pub fn id(&self) -> u32 {
        self.child.id()
    }
}

/// 检测 Claude CLI 是否可用
pub fn detect_claude(claude_cmd: &str) -> Option<String> {
    let output = Command::new(claude_cmd)
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

/// 检查路径是否存在
pub fn path_exists(path: &Path) -> bool {
    path.exists()
}
