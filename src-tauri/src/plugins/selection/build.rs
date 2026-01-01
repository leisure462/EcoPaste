const COMMANDS: &[&str] = &[
    "start_selection_monitor",
    "stop_selection_monitor",
    "get_selected_text",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
