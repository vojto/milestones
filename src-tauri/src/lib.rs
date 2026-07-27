// The whole app is the webview: the document, the timeline rule, the undo
// history and the menu bar all live in TypeScript under ../../src. The Rust
// side exists to open a window and to lend the frontend a filesystem, so it
// registers one plugin and gets out of the way.
//
// The menu is built in JavaScript (src/platform/app-menu.ts) rather than here,
// because whether Undo is available is a question about TinyBase checkpoints —
// state that lives in the webview. Building it there keeps the answer next to
// the thing that knows it, instead of shuttling it across IPC.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
