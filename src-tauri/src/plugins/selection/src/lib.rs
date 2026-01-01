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
                let app_handle = app.clone();
                std::thread::spawn(move || {
                    // 后台线程初始化（可选）
                    log::info!("Selection monitor plugin initialized");
                });
            }
            Ok(())
        })
        .build()
}
