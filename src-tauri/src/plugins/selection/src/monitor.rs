//! Windows 系统级选区监控
//! 
//! 使用 WH_MOUSE_LL 低级鼠标钩子监听鼠标事件，
//! 在鼠标释放时通过模拟 Ctrl+C 获取选中文本。

use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Wry};
use windows::Win32::Foundation::{HANDLE, HMODULE, HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::DataExchange::{
    CloseClipboard, EmptyClipboard, GetClipboardData, OpenClipboard, SetClipboardData,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE, HGLOBAL};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYBD_EVENT_FLAGS,
    VK_C, VK_CONTROL,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW,
    TranslateMessage, UnhookWindowsHookEx, HHOOK, MSG, MSLLHOOKSTRUCT,
    WH_MOUSE_LL, WM_LBUTTONUP, WM_LBUTTONDOWN,
};

use crate::commands::{emit_selection_event, SelectionEvent};

// CF_UNICODETEXT 常量值
const CF_UNICODETEXT: u32 = 13;

static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);
static IS_DRAGGING: AtomicBool = AtomicBool::new(false);
static DRAG_START_X: AtomicI32 = AtomicI32::new(0);
static DRAG_START_Y: AtomicI32 = AtomicI32::new(0);

// 使用 Mutex 包装 HHOOK 和 AppHandle
static MOUSE_HOOK: Mutex<Option<isize>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle<Wry>>> = Mutex::new(None);

/// 启动选区监控
pub fn start_monitor(app: AppHandle<Wry>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if MONITOR_RUNNING.load(Ordering::SeqCst) {
        return Ok(()); // 已经在运行
    }
    
    // 设置 AppHandle
    set_app_handle(app);

    MONITOR_RUNNING.store(true, Ordering::SeqCst);
    
    thread::spawn(move || {
        unsafe {
            let h_instance: HMODULE = GetModuleHandleW(None).unwrap_or_default();
            
            let hook_result = SetWindowsHookExW(
                WH_MOUSE_LL,
                Some(mouse_hook_proc),
                h_instance,
                0,
            );
            
            match hook_result {
                Ok(hook) => {
                    // 保存钩子句柄
                    if let Ok(mut guard) = MOUSE_HOOK.lock() {
                        *guard = Some(hook.0 as isize);
                    }
                    
                    log::info!("Mouse hook installed successfully");

                    // 消息循环
                    let mut msg = MSG::default();
                    while MONITOR_RUNNING.load(Ordering::SeqCst) {
                        if GetMessageW(&mut msg, HWND::default(), 0, 0).as_bool() {
                            let _ = TranslateMessage(&msg);
                            DispatchMessageW(&msg);
                        } else {
                            break;
                        }
                    }

                    // 卸载钩子
                    let _ = UnhookWindowsHookEx(hook);
                    log::info!("Mouse hook uninstalled");
                }
                Err(e) => {
                    log::error!("Failed to set mouse hook: {:?}", e);
                }
            }
        }
    });

    Ok(())
}

/// 停止选区监控
pub fn stop_monitor() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    MONITOR_RUNNING.store(false, Ordering::SeqCst);
    
    // 清理钩子句柄
    if let Ok(mut guard) = MOUSE_HOOK.lock() {
        if let Some(hook_ptr) = guard.take() {
            unsafe {
                let hook = HHOOK(hook_ptr as *mut _);
                let _ = UnhookWindowsHookEx(hook);
            }
        }
    }
    
    Ok(())
}

/// 设置 AppHandle（用于发送事件）
pub fn set_app_handle(app: AppHandle<Wry>) {
    if let Ok(mut guard) = APP_HANDLE.lock() {
        *guard = Some(app);
    }
}

/// 鼠标钩子回调
unsafe extern "system" fn mouse_hook_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 {
        let mouse_info = &*(l_param.0 as *const MSLLHOOKSTRUCT);
        
        match w_param.0 as u32 {
            WM_LBUTTONDOWN => {
                // 记录拖拽起点
                IS_DRAGGING.store(true, Ordering::SeqCst);
                DRAG_START_X.store(mouse_info.pt.x, Ordering::SeqCst);
                DRAG_START_Y.store(mouse_info.pt.y, Ordering::SeqCst);
            }
            WM_LBUTTONUP => {
                if IS_DRAGGING.load(Ordering::SeqCst) {
                    IS_DRAGGING.store(false, Ordering::SeqCst);
                    
                    let start_x = DRAG_START_X.load(Ordering::SeqCst);
                    let start_y = DRAG_START_Y.load(Ordering::SeqCst);
                    let end_x = mouse_info.pt.x;
                    let end_y = mouse_info.pt.y;
                    
                    // 判断是否有实际的拖拽距离（至少 5 像素）
                    let dx = (end_x - start_x).abs();
                    let dy = (end_y - start_y).abs();
                    
                    if dx > 5 || dy > 5 {
                        let x = end_x;
                        let y = end_y;
                        
                        // 在新线程中处理获取文本
                        thread::spawn(move || {
                            thread::sleep(Duration::from_millis(100));
                            
                            match get_selected_text_via_clipboard() {
                                Ok(text) => {
                                    if !text.is_empty() {
                                        log::info!("Selected text: {} chars at ({}, {})", text.len(), x, y);
                                        
                                        // 发送事件到前端
                                        if let Ok(guard) = APP_HANDLE.lock() {
                                            if let Some(app) = guard.as_ref() {
                                                emit_selection_event(app, SelectionEvent {
                                                    text,
                                                    x,
                                                    y,
                                                    trigger: "selected".to_string(),
                                                });
                                            }
                                        }
                                    }
                                }
                                Err(e) => {
                                    log::error!("Failed to get selected text: {}", e);
                                }
                            }
                        });
                    }
                }
            }
            _ => {}
        }
    }
    
    CallNextHookEx(None, n_code, w_param, l_param)
}

/// 通过模拟 Ctrl+C 获取选中文本
pub fn get_selected_text_via_clipboard() -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    unsafe {
        // 1. 保存当前剪贴板内容
        let saved_text = get_clipboard_text().unwrap_or_default();
        
        // 2. 清空剪贴板
        if OpenClipboard(HWND::default()).is_ok() {
            let _ = EmptyClipboard();
            let _ = CloseClipboard();
        }
        
        // 3. 模拟 Ctrl+C
        simulate_ctrl_c()?;
        
        // 4. 等待剪贴板更新
        thread::sleep(Duration::from_millis(50));
        
        // 5. 读取新的剪贴板内容
        let selected_text = get_clipboard_text().unwrap_or_default();
        
        // 6. 恢复原始剪贴板内容
        if !saved_text.is_empty() && saved_text != selected_text {
            let _ = set_clipboard_text(&saved_text);
        }
        
        Ok(selected_text)
    }
}

/// 模拟 Ctrl+C 按键
unsafe fn simulate_ctrl_c() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let inputs = [
        // Ctrl 按下
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: KEYBD_EVENT_FLAGS(0),
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        // C 按下
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_C,
                    wScan: 0,
                    dwFlags: KEYBD_EVENT_FLAGS(0),
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        // C 释放
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_C,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
        // Ctrl 释放
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VK_CONTROL,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        },
    ];

    SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    
    Ok(())
}

/// 获取剪贴板文本
unsafe fn get_clipboard_text() -> Option<String> {
    if OpenClipboard(HWND::default()).is_err() {
        return None;
    }
    
    let result = (|| {
        let handle = GetClipboardData(CF_UNICODETEXT).ok()?;
        // Handle (HANDLE) 转换为 HGLOBAL
        let hglobal = HGLOBAL(handle.0);
        let ptr = GlobalLock(hglobal) as *const u16;
        
        if ptr.is_null() {
            return None;
        }
        
        // 计算字符串长度
        let mut len = 0;
        while *ptr.add(len) != 0 {
            len += 1;
        }
        
        let slice = std::slice::from_raw_parts(ptr, len);
        let text = String::from_utf16_lossy(slice);
        
        let _ = GlobalUnlock(hglobal);
        
        Some(text)
    })();
    
    let _ = CloseClipboard();
    
    result
}

/// 设置剪贴板文本
unsafe fn set_clipboard_text(text: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let wide: Vec<u16> = text.encode_utf16().chain(std::iter::once(0)).collect();
    let size = wide.len() * 2;
    
    let mem = GlobalAlloc(GMEM_MOVEABLE, size)?;
    // GlobalAlloc 返回 HGLOBAL (mem)
    let ptr = GlobalLock(mem) as *mut u16;
    
    std::ptr::copy_nonoverlapping(wide.as_ptr(), ptr, wide.len());
    
    let _ = GlobalUnlock(mem);
    
    if OpenClipboard(HWND::default()).is_ok() {
        let _ = EmptyClipboard();
        // HGLOBAL (mem) 转换为 HANDLE
        let _ = SetClipboardData(CF_UNICODETEXT, HANDLE(mem.0));
        let _ = CloseClipboard();
    }
    
    Ok(())
}
