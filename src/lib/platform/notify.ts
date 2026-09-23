/**
 * Cross-platform notifications. One surface for three runtimes:
 *  - Tauri (macOS, Windows, Linux desktop) via its notification plugin.
 *  - Capacitor (the Android app) via @capacitor/local-notifications.
 *  - Browser (the Vercel web build) via the Web Notifications API.
 *
 * Android used to fall through every branch and get nothing at all: the native
 * path was gated on Tauri, which the Capacitor build is not, while the
 * foreground timer skipped itself on mobile. Both guards were individually
 * reasonable and together left the whole platform silent — hence the explicit
 * `isCapacitor()` branch rather than a looser "is native" check.
 *
 * Plugins only exist inside their own shell, so each is feature-detected and
 * imported dynamically, keeping them out of the web bundle's eager path. Every
 * failure is swallowed to a debug log: a missing nudge must never break the app.
 */

/** Stable id for the repeating daily reminder, so we can replace/cancel it. */
const REMINDER_ID = 1001

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** The Capacitor Android shell. Not Tauri, and not a plain browser either. */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return Boolean(cap?.isNativePlatform?.())
}

/** Any shell where the OS itself can deliver a pre-scheduled notification. */
export function isNativeScheduler(): boolean {
  return isCapacitor() || (isTauri() && isMobilePlatform())
}

/** Android/iOS — where the OS delivers pre-scheduled notifications while the
 *  app is closed, so we register a native schedule instead of a foreground timer. */
export function isMobilePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Whether notifications are currently permitted (never prompts). */
export async function isNotifyGranted(): Promise<boolean> {
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      return (await LocalNotifications.checkPermissions()).display === 'granted'
    } catch {
      return false
    }
  }
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
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      if ((await LocalNotifications.checkPermissions()).display === 'granted') return true
      return (await LocalNotifications.requestPermissions()).display === 'granted'
    } catch {
      return false
    }
  }
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
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      // A one-off needs an id distinct from the repeating reminder's, or it
      // would replace the schedule instead of sitting alongside it.
      await LocalNotifications.schedule({
        notifications: [{ id: REMINDER_ID + 1, title, body }],
      })
    } catch (err) {
      console.debug('[notify] capacitor send failed', err)
    }
    return
  }
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
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {})
      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_ID,
            title: 'Almanac',
            body,
            // `on` with only hour+minute repeats daily at that local time; the
            // OS owns the schedule, so it survives the app being closed.
            //
            // Deliberately not `allowWhileIdle`: that asks for an exact alarm,
            // which needs SCHEDULE_EXACT_ALARM — a permission Android 14 makes
            // the user grant by hand and throws a SecurityException without. A
            // habit nudge that lands a few minutes late in Doze is fine; one
            // that crashes the schedule is not.
            schedule: { on: { hour, minute } },
          },
        ],
      })
    } catch (err) {
      console.debug('[notify] capacitor schedule failed', err)
    }
    return
  }
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
  if (isCapacitor()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
    } catch (err) {
      console.debug('[notify] capacitor cancel failed', err)
    }
    return
  }
  if (!isTauri()) return
  try {
    const n = await import('@tauri-apps/plugin-notification')
    await n.cancel([REMINDER_ID])
  } catch (err) {
    console.debug('[notify] cancel failed', err)
  }
}
