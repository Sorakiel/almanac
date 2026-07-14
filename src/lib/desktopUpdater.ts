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

    const { relaunch } = await import('@tauri-apps/plugin-process')
    toast.success('Обновление установлено — перезапуск…')
    await relaunch()
  } catch (err) {
    // Non-fatal: offline, no release published yet, or signature mismatch.
    console.debug('[updater] check failed', err)
  }
}
