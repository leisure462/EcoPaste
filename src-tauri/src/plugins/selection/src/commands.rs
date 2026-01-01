use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Runtime, Wry};

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
        // 需要将 R 转换为 Wry 或者让 monitor 支持 generic。
        // 由于 monitor 使用 static Mutex<AppHandle<Wry>>，这里我们做一个 unsafe transmute 或者假设 R 是 Wry。
        // 但更好的做法是 lib.rs 中已经 setup 好了，command 只需要简单的触发。
        // 其实 start_monitor 在 lib.rs setup 中没有被自动调用，需要前端调用。
        
        // 尝试转换为 Wry handle，如果失败则说明 Runtime 不匹配
        let app_wry = unsafe { std::mem::transmute::<AppHandle<R>, AppHandle<Wry>>(app) };
        monitor::start_monitor(app_wry).map_err(|e| e.to_string())?;
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
pub fn emit_selection_event(app: &AppHandle<Wry>, event: SelectionEvent) {
    if let Err(e) = app.emit("selection:text-selected", event) {
        log::error!("Failed to emit selection event: {}", e);
    }
}
