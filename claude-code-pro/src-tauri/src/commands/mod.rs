pub mod chat;
pub mod workspace;

// 重新导出工作区命令函数，确保它们在模块级别可见
pub use workspace::validate_workspace_path;
pub use workspace::get_directory_info;
