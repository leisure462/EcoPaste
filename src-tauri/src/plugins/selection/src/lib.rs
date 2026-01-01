use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
#[cfg(target_os = "windows")]
mod monitor;

pub use commands::*;

pub const SELECTION_TOOLBAR_LABEL: &str = "selection-toolbar";

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("eco-selection")
        .invoke_handler(generate_handler![
            commands::start_selection_monitor,
            commands::stop_selection_monitor,
            commands::get_selected_text,
        ])
        .setup(|app, _api| {
            #[cfg(target_os = "windows")]
            {
                // 设置 AppHandle 用于事件发送
                if let Some(app_handle) = app.app_handle().try_cast::<tauri::Wry>() {
                    monitor::set_app_handle(app_handle);
                }
            }
            log::info!("Selection monitor plugin initialized");
            Ok(())
        })
        .build()
}
