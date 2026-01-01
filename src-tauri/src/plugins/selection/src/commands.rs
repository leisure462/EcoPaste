use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime};

#[cfg(target_os = "windows")]
use crate::monitor;

/// 选区事件数据（只包含坐标）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionEvent {
    pub x: i32,
    pub y: i32,
}

/// 启动选区监控
#[command]
pub async fn start_selection_monitor<R: Runtime>(_app: AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        monitor::enable_monitor().map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        log::warn!("Selection monitor is only supported on Windows");
    }
    
    Ok(())
}

/// 停止选区监控
#[command]
pub async fn stop_selection_monitor<R: Runtime>(_app: AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        monitor::stop_monitor().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

/// 手动获取选中文本（通过模拟 Ctrl+C）
#[command]
pub async fn get_selected_text<R: Runtime>(_app: AppHandle<R>) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let text = monitor::get_selected_text_via_clipboard().map_err(|e| e.to_string())?;
        Ok(text)
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("Selection monitor is only supported on Windows".to_string())
    }
}
