/**
 * Cross-platform notifications. One surface for two runtimes:
 *  - Native (Tauri: macOS, Windows, Android, iOS) via the notification plugin.
 *  - Browser (the Vercel web build) via the Web Notifications API.
 *
 * The plugin only exists inside the native shell, so we feature-detect Tauri
 * and dynamically import it — keeping it out of the web bundle's eager path,
 * exactly like the desktop updater. Every failure is swallowed to a debug log:
 * a missing nudge must never break the app.
 */

/** Stable id for the repeating daily reminder, so we can replace/cancel it. */
const REMINDER_ID = 1001

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Android/iOS — where the OS delivers pre-scheduled notifications while the
 *  app is closed, so we register a native schedule instead of a foreground timer. */
export function isMobilePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Whether notifications are currently permitted (never prompts). */
export async function isNotifyGranted(): Promise<boolean> {
  if (isTauri()) {
    try {
      const n = await import('@tauri-apps/plugin-notification')
      return await n.isPermissionGranted()
    } catch {
      return false
    }
  }
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/** Ask the user for notification permission, returning whether it was granted. */
export async function requestNotifyPermission(): Promise<boolean> {
  if (isTauri()) {
    try {
      const n = await import('@tauri-apps/plugin-notification')
      if (await n.isPermissionGranted()) return true
      return (await n.requestPermission()) === 'granted'
    } catch {
      return false
    }
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

/** Fire a notification right now (used by the foreground scheduler + web). */
export async function pushNotification(title: string, body: string): Promise<void> {
  if (isTauri()) {
    try {
      const n = await import('@tauri-apps/plugin-notification')
      await n.sendNotification({ title, body })
    } catch (err) {
      console.debug('[notify] native send failed', err)
    }
    return
  }
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  } catch (err) {
    console.debug('[notify] web send failed', err)
  }
}

/**
 * Register a repeating daily reminder that the OS delivers at `hour`:`minute`
 * local time even when the app is closed. Only meaningful on mobile — desktop has no
 * OS-level scheduling, so it relies on the foreground timer instead.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  body: string,
): Promise<void> {
  if (!isTauri() || !isMobilePlatform()) return
  try {
    const n = await import('@tauri-apps/plugin-notification')
    await n.cancel([REMINDER_ID]).catch(() => {})
    await n.sendNotification({
      id: REMINDER_ID,
      title: 'Almanac',
      body,
      // A partial interval match fires daily at this hour:minute.
      schedule: n.Schedule.interval({ hour, minute }, true),
    })
  } catch (err) {
    console.debug('[notify] schedule failed', err)
  }
}

/** Cancel any pending native daily reminder (reminder turned off). */
export async function clearScheduledReminders(): Promise<void> {
  if (!isTauri()) return
  try {
    const n = await import('@tauri-apps/plugin-notification')
    await n.cancel([REMINDER_ID])
  } catch (err) {
    console.debug('[notify] cancel failed', err)
  }
}
