use crate::error::{AppError, Result};
use std::path::Path;
use std::fs;
use std::time::SystemTime;

/// 文件信息结构
#[derive(serde::Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<String>,
    pub extension: Option<String>,
    pub children: Option<Vec<FileInfo>>,
}

/// 读取目录内容（只读取直接子项，不递归）
#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<FileInfo>> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err(AppError::InvalidPath("路径不存在".to_string()));
    }
    
    if !path_obj.is_dir() {
        return Err(AppError::InvalidPath("不是目录".to_string()));
    }
    
    let mut files = Vec::new();
    
    let entries = fs::read_dir(path_obj)?;
    
    for entry in entries {
        let entry = entry?;
        let metadata = entry.metadata()?;
        
        let file_path = entry.path();
        let name = file_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();
        
        let is_dir = metadata.is_dir();
        let size = if !is_dir { Some(metadata.len()) } else { None };
        
        // 获取修改时间
        let modified = metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_secs().to_string());
        
        // 获取文件扩展名
        let extension = if !is_dir {
            file_path.extension()
                .and_then(|ext| ext.to_str())
                .map(|s| s.to_lowercase())
        } else {
            None
        };
        
        let file_info = FileInfo {
            name,
            path: file_path.to_string_lossy().to_string(),
            is_dir,
            size,
            modified,
            extension,
            children: None, // 子目录内容预留，需要懒加载
        };
        
        files.push(file_info);
    }
    
    // 排序：目录在前，然后按名称排序
    files.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    Ok(files)
}

/// 获取文件内容（限制大小）
#[tauri::command]
pub async fn get_file_content(path: String) -> Result<String> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err(AppError::InvalidPath("文件不存在".to_string()));
    }
    
    if path_obj.is_dir() {
        return Err(AppError::InvalidPath("是目录，不是文件".to_string()));
    }
    
    // 检查文件大小，限制为1MB
    let metadata = fs::metadata(path_obj)?;
    
    if metadata.len() > 1024 * 1024 {
        return Err(AppError::InvalidPath("文件过大，超过1MB限制".to_string()));
    }
    
    let content = fs::read_to_string(path_obj)?;
    
    Ok(content)
}

/// 创建文件
#[tauri::command]
pub async fn create_file(path: String, content: Option<String>) -> Result<()> {
    let path_obj = Path::new(&path);
    
    // 检查父目录是否存在
    if let Some(parent) = path_obj.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    
    // 创建文件
    if let Some(content) = content {
        fs::write(path_obj, content)?;
    } else {
        fs::File::create(path_obj)?;
    }
    
    Ok(())
}

/// 创建目录
#[tauri::command]
pub async fn create_directory(path: String) -> Result<()> {
    fs::create_dir_all(&path)?;
    
    Ok(())
}

/// 删除文件或目录
#[tauri::command]
pub async fn delete_file(path: String) -> Result<()> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err(AppError::InvalidPath("路径不存在".to_string()));
    }
    
    if path_obj.is_dir() {
        fs::remove_dir_all(path_obj)?;
    } else {
        fs::remove_file(path_obj)?;
    }
    
    Ok(())
}

/// 重命名文件或目录
#[tauri::command]
pub async fn rename_file(old_path: String, new_name: String) -> Result<()> {
    let old_path_obj = Path::new(&old_path);
    
    if !old_path_obj.exists() {
        return Err(AppError::InvalidPath("文件不存在".to_string()));
    }
    
    // 构建新路径
    let new_path = if let Some(parent) = old_path_obj.parent() {
        parent.join(&new_name)
    } else {
        Path::new(&new_name).to_path_buf()
    };
    
    fs::rename(old_path_obj, &new_path)?;
    
    Ok(())
}

/// 检查路径是否存在
#[tauri::command]
pub async fn path_exists(path: String) -> Result<bool> {
    Ok(Path::new(&path).exists())
}