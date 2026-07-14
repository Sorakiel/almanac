import { isMobilePlatform, isTauri } from '@/lib/notify'

/** True only inside a desktop (macOS/Windows/Linux) Tauri shell. */
export function isDesktopApp(): boolean {
  return isTauri() && !isMobilePlatform()
}

/**
 * Apply the "run in background" preference to the native shell:
 *  - tell Rust whether closing the window should hide-to-tray or quit, and
 *  - enable/disable launch-on-login so the reminder is armed after a reboot.
 *
 * No-op off the desktop shell. Failures are swallowed to a debug log — a sync
 * hiccup must never break settings.
 */
export async function applyRunInBackground(enabled: boolean): Promise<void> {
  if (!isDesktopApp()) return

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_run_in_background', { enabled })
  } catch (err) {
    console.debug('[desktop] set_run_in_background failed', err)
  }

  try {
    const autostart = await import('@tauri-apps/plugin-autostart')
    const on = await autostart.isEnabled()
    if (enabled && !on) await autostart.enable()
    else if (!enabled && on) await autostart.disable()
  } catch (err) {
    console.debug('[desktop] autostart sync failed', err)
  }
}
