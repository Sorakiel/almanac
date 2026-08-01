import { useCallback, useSyncExternalStore } from 'react'
import { browserTimezone, localDateKey, msUntilDailyTime } from '@/lib/date'

/**
 * A shared clock that wakes every consumer when the user's LOCAL calendar day
 * rolls over.
 *
 * Almanac is long-lived: the desktop shell runs in the background for days and
 * the Android WebView is suspended rather than killed. A date resolved once at
 * mount therefore still reads "yesterday" after midnight — and a completion
 * tapped at 00:20 would be written to the wrong day, silently breaking the
 * streak it was meant to extend.
 *
 * One module-level clock rather than a timer per hook: `useToday` has ~35 call
 * sites, and independent timers would both waste wakeups and let two screens
 * disagree about what day it is mid-render.
 */

type Listener = () => void

const listeners = new Set<Listener>()
let timezone = browserTimezone()
let timer: ReturnType<typeof setTimeout> | undefined

function notify(): void {
  for (const listener of listeners) listener()
}

/** Wake one second past the next local midnight — never a hair before it. */
function arm(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = setTimeout(() => {
    notify()
    arm()
  }, msUntilDailyTime(0, 0, timezone) + 1_000)
}

/**
 * Timers are throttled in a hidden tab and don't run at all while a phone
 * sleeps, so the alarm alone can't be trusted — re-check whenever the app
 * comes back to the foreground.
 */
function onWake(): void {
  if (document.visibilityState !== 'visible') return
  notify()
  arm()
}

function subscribe(listener: Listener): () => void {
  if (listeners.size === 0) {
    arm()
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    document.removeEventListener('visibilitychange', onWake)
    window.removeEventListener('focus', onWake)
  }
}

/**
 * Point the clock at the user's saved timezone once their profile resolves.
 * Until then it runs on the device zone, which is the right fallback.
 */
export function setDayClockTimezone(next: string): void {
  if (next === timezone) return
  timezone = next
  notify()
  if (listeners.size > 0) arm()
}

/**
 * Today's `YYYY-MM-DD` key in `timezone`, re-read whenever the day may have
 * changed. The snapshot is a plain string, so React bails out of re-rendering
 * when a wakeup lands on the same day it already knew about.
 */
export function useDayKey(timezone: string): string {
  const getSnapshot = useCallback(() => localDateKey(timezone), [timezone])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
