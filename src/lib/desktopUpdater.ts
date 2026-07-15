import { toast } from 'sonner'

// Auto-update for the Tauri desktop build. In the browser / Vercel build this is
// a no-op: the plugins only exist inside the native shell, so we feature-detect
// Tauri and dynamically import the plugins (keeping them out of the web bundle's
// eager path). Failures are swallowed to a debug log — a missing update must
// never block app start.
export async function checkForDesktopUpdate(): Promise<void> {
  if (!('__TAURI_INTERNALS__' in window)) return

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return

    const dismiss = toast.loading(`Обновление ${update.version} — загрузка…`)
    await update.downloadAndInstall()
    toast.dismiss(dismiss)

    // Restart via our own command, not plugin-process `relaunch()`: on macOS the
    // latter spawns the bundle's raw binary and the app never reappears. The
    // Rust side reopens through LaunchServices on macOS, plain restart elsewhere.
    const { invoke } = await import('@tauri-apps/api/core')
    toast.success('Обновление установлено — перезапуск…')
    await invoke('restart_app')
  } catch (err) {
    // Non-fatal: offline, no release published yet, or signature mismatch.
    console.debug('[updater] check failed', err)
  }
}
