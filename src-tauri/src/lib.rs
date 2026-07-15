use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Desktop device preference: when true, closing the window hides it to the tray
/// so the reminder timer keeps running in the background; when false, closing the
/// window quits the app (and daily reminders can't fire while it's closed).
/// Defaults to true; the frontend pushes the user's saved choice on startup.
struct RunInBackground(Arc<AtomicBool>);

/// Let the frontend sync the user's "run in background" choice into native state.
#[tauri::command]
fn set_run_in_background(state: tauri::State<'_, RunInBackground>, enabled: bool) {
    state.0.store(enabled, Ordering::Relaxed);
}

/// Restart the app after an update. On macOS the built-in relaunch spawns the
/// bundle's raw binary directly, which LaunchServices won't bring up as a proper
/// foreground app — so the process exits but nothing reopens (the "restarting…"
/// hang). We instead ask LaunchServices to `open` a fresh instance of the .app
/// bundle, then exit. Windows/Linux keep the normal restart, which works there.
#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        // current_exe is …/Almanac.app/Contents/MacOS/Almanac — walk up to the
        // bundle and reopen it via LaunchServices as a new, independent instance.
        if let Ok(exe) = std::env::current_exe() {
            if let Some(bundle) = exe
                .ancestors()
                .find(|p| p.extension().and_then(|e| e.to_str()) == Some("app"))
            {
                let _ = Command::new("/usr/bin/open").arg("-n").arg(bundle).spawn();
            }
        }
        app.exit(0);
    }
    #[cfg(not(target_os = "macos"))]
    {
        app.restart();
    }
}

/// Show the count of unfinished habits as a badge on the app icon (dock on
/// macOS, taskbar on Linux/iOS). Zero clears it. Unsupported platforms no-op.
#[tauri::command]
fn set_badge(app: tauri::AppHandle, count: u32) {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("main") {
        let value = if count == 0 { None } else { Some(i64::from(count)) };
        let _ = window.set_badge_count(value);
    }
}

#[cfg(desktop)]
fn show_main_window(app: &tauri::AppHandle) {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Build the system tray icon and its menu (desktop only). The tray is what keeps
/// Almanac reachable once the window is hidden to background.
#[cfg(desktop)]
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
    use tauri::Manager;

    let open = MenuItem::with_id(app, "open", "Open Almanac", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Almanac")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            // Single left-click (release) or double-click reopens the window.
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            }
            | TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } => show_main_window(tray.app_handle()),
            _ => {}
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .manage(RunInBackground(Arc::new(AtomicBool::new(true))))
        .invoke_handler(tauri::generate_handler![
            set_run_in_background,
            set_badge,
            restart_app
        ]);

    // Desktop-only: auto-update, launch-on-login, and close-to-tray. These crates
    // don't exist on mobile, so both the plugins and the window handler are gated.
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                None,
            ))
            .on_window_event(|window, event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    use tauri::Manager;
                    let keep_running =
                        window.state::<RunInBackground>().0.load(Ordering::Relaxed);
                    if keep_running {
                        // Hide instead of quit so the reminder timer survives.
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            });
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            setup_tray(app)?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
