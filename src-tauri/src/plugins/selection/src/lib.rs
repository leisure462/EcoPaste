use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Wry,
};

mod commands;
#[cfg(target_os = "windows")]
mod monitor;

pub use commands::*;

pub const SELECTION_TOOLBAR_LABEL: &str = "selection-toolbar";

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("eco-selection")
        .invoke_handler(generate_handler![
            commands::start_selection_monitor,
            commands::stop_selection_monitor,
            commands::get_selected_text,
        ])
        .setup(|app, _api| {
            #[cfg(target_os = "windows")]
            {
                // app 是 &AppHandle<Wry>
                monitor::set_app_handle(app.clone());
            }
            log::info!("Selection monitor plugin initialized");
            Ok(())
        })
        .build()
}
