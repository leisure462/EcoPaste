use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Manager, Runtime, Wry};

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
        // 安全地将 AppHandle<R> 转换为 AppHandle<Wry>
        // 1. 如果 R 就是 Wry，这应该直接通过（但泛型限制）
        // 2. 我们使用 tauri::Manager::app_handle() 获取 handle，然后使用 tauri 的机制
        // 由于 EcoPaste 只在 Windows 上使用 Wry，我们可以假设 R 兼容
        // 但是 direct transmute 是 UB 如果大小不同。
        // 既然我们不能简单转换，我们修改策略：
        // 让 monitor.rs 的 start_monitor 接受 AppHandle<R> 是不可能的，因为 R 是泛型
        // 所以我们在 Lib.rs 中初始化时就设置好 monitor 的 AppHandle<Wry>
        // 这里只是简单的调用 enable/disable 逻辑
        
        // 正确做法：lib.rs 中 setup 已经调用 monitor::set_app_handle(app)
        // start_monitor 只需要触发 "running" 状态
        
        // 但为了支持 start_monitor 传递 app（如果还没 set 的话），我们尝试获取
        // 实际上，如果 lib.rs 中已经 set 了，这里只需要 toggle flag
        // monitor::start_monitor() 不再需要参数？或者我们需要更新 app handle？
        // 让我们修改 monitor::start_monitor 为不接受参数，只启动线程，前提是 app handle 已设置
        
        // 但之前的设计是 monitor::start_monitor(app)
        // 我们可以修改 monitor::start_monitor 为 monitor::enable_monitor()
        
        // 考虑到 lib.rs setup 中已经设置了 handle
        monitor::enable_monitor().map_err(|e| e.to_string())?;
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
