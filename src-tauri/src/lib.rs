//! Native shell for the timezone popover: menu bar item, window placement,
//! persistence, clipboard, global hotkey and launch-at-login.
//! Everything UI-related lives in the web view; this file stays small on purpose.

use std::{fs, io::Write, process::Command, sync::Mutex};

use tauri::{
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Runtime, WebviewWindow,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

const TRAY_ID: &str = "main-tray";
const WINDOW_LABEL: &str = "main";
const STATE_FILE: &str = "state.json";

/// Last known menu bar icon bounds, so the hotkey can open the popover in the same place.
#[derive(Default)]
struct TrayRect(Mutex<Option<tauri::Rect>>);

// ---------------------------------------------------------------------------
// Window

fn main_window<R: Runtime>(app: &AppHandle<R>) -> Option<WebviewWindow<R>> {
    app.get_webview_window(WINDOW_LABEL)
}

fn show_window<R: Runtime>(window: &WebviewWindow<R>) {
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit("popover-shown", ());
}

fn toggle_window<R: Runtime>(app: &AppHandle<R>) {
    let Some(window) = main_window(app) else { return };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }
    let tray_rect = app.try_state::<TrayRect>().and_then(|s| *s.0.lock().unwrap());
    match tray_rect {
        Some(rect) => place_under_tray(&window, &rect),
        None => place_top_center(&window),
    }
    show_window(&window);
}

/// Fallback before the tray has reported its bounds: top center of the main screen.
fn place_top_center<R: Runtime>(window: &WebviewWindow<R>) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let (Ok(Some(monitor)), Ok(size)) = (window.primary_monitor(), window.outer_size()) else { return };
    let area = monitor.work_area();
    let origin = area.position.to_logical::<f64>(scale);
    let area_size = area.size.to_logical::<f64>(scale);
    let win = size.to_logical::<f64>(scale);
    let _ = window.set_position(LogicalPosition::new(origin.x + (area_size.width - win.width) / 2.0, origin.y + 6.0));
}

/// Centers the popover horizontally under the tray icon, clamped to the screen.
fn place_under_tray<R: Runtime>(window: &WebviewWindow<R>, tray: &tauri::Rect) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let icon_pos = tray.position.to_logical::<f64>(scale);
    let icon_size = tray.size.to_logical::<f64>(scale);
    let win = window
        .outer_size()
        .map(|s| s.to_logical::<f64>(scale))
        .unwrap_or(LogicalSize::new(0.0, 0.0));

    let mut x = icon_pos.x + icon_size.width / 2.0 - win.width / 2.0;
    let y = icon_pos.y + icon_size.height + 6.0;

    if let Ok(Some(monitor)) = window.monitor_from_point(icon_pos.x, icon_pos.y) {
        let bounds = monitor.work_area();
        let origin = bounds.position.to_logical::<f64>(scale);
        let size = bounds.size.to_logical::<f64>(scale);
        let max_x = origin.x + size.width - win.width - 8.0;
        x = x.clamp(origin.x + 8.0, max_x.max(origin.x + 8.0));
    }

    let _ = window.set_position(LogicalPosition::new(x, y));
}

fn tray_rect_of(event: &TrayIconEvent) -> Option<tauri::Rect> {
    match event {
        TrayIconEvent::Click { rect, .. }
        | TrayIconEvent::DoubleClick { rect, .. }
        | TrayIconEvent::Enter { rect, .. }
        | TrayIconEvent::Move { rect, .. }
        | TrayIconEvent::Leave { rect, .. } => Some(*rect),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Commands

#[tauri::command]
fn load_state(app: AppHandle) -> Result<Option<String>, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join(STATE_FILE);
    match fs::read_to_string(path) {
        Ok(json) => Ok(Some(json)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn save_state(app: AppHandle, json: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join(STATE_FILE), json).map_err(|e| e.to_string())
}

/// macOS-only app, so the system clipboard tool is the lightest possible dependency.
#[tauri::command]
fn copy_text(text: String) -> Result<(), String> {
    let mut child = Command::new("pbcopy")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    child
        .stdin
        .take()
        .ok_or("no stdin")?
        .write_all(text.as_bytes())
        .map_err(|e| e.to_string())?;
    child.wait().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_tray_title(app: AppHandle, title: Option<String>) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("tray missing")?;
    tray.set_title(title.filter(|t| !t.is_empty()))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_hotkey(app: AppHandle, shortcut: Option<String>) -> Result<(), String> {
    let shortcuts = app.global_shortcut();
    shortcuts.unregister_all().map_err(|e| e.to_string())?;
    if let Some(s) = shortcut.filter(|s| !s.is_empty()) {
        let parsed: Shortcut = s.parse().map_err(|e| format!("{e:?}"))?;
        shortcuts.register(parsed).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    let launcher = app.autolaunch();
    let result = if enabled { launcher.enable() } else { launcher.disable() };
    result.map_err(|e| e.to_string())
}

#[tauri::command]
fn get_autostart(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

/// The web view reports its natural height so the popover hugs its content.
#[tauri::command]
fn fit_height(window: WebviewWindow, height: f64) -> Result<(), String> {
    let scale = window.scale_factor().unwrap_or(1.0);
    let current = window
        .outer_size()
        .map(|s| s.to_logical::<f64>(scale))
        .map_err(|e| e.to_string())?;
    window
        .set_size(LogicalSize::new(current.width, height.clamp(200.0, 900.0)))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn hide_window(window: WebviewWindow) {
    let _ = window.hide();
}

#[tauri::command]
fn quit(app: AppHandle) {
    app.exit(0);
}

// ---------------------------------------------------------------------------
// App

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            load_state,
            save_state,
            copy_text,
            set_tray_title,
            set_hotkey,
            set_autostart,
            get_autostart,
            fit_height,
            hide_window,
            quit
        ])
        .manage(TrayRect::default())
        .setup(|app| {
            // Menu bar app: no Dock icon, no app switcher entry.
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let quit_item = MenuItem::with_id(app, "quit", "Quit Timezone", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;

            let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))?;
            TrayIconBuilder::with_id(TRAY_ID)
                .icon(icon)
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    let app = tray.app_handle();
                    if let Some(rect) = tray_rect_of(&event) {
                        *app.state::<TrayRect>().0.lock().unwrap() = Some(rect);
                    }
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        toggle_window(app);
                    }
                })
                .build(app)?;

            // Popovers dismiss when they lose focus.
            if let Some(window) = main_window(app.handle()) {
                let handle = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = handle.hide();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
