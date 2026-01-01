use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Runtime};

#[cfg(target_os = "windows")]
use crate::monitor;

/// 选区事件数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionEvent {
    pub text: String,
    pub x: i32,
    pub y: i32,
    pub trigger: String,
}

/// 启动选区监控
#[command]
pub async fn start_selection_monitor<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        monitor::start_monitor(app).map_err(|e| e.to_string())?;
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;
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

/// 发送选区事件到前端
pub fn emit_selection_event<R: Runtime>(app: &AppHandle<R>, event: SelectionEvent) {
    if let Err(e) = app.emit("selection:text-selected", event) {
        log::error!("Failed to emit selection event: {}", e);
    }
}
