import { useEffect } from 'react'
import { setWidgetSummary } from '@/lib/desktop'
import { updateAndroidWidget } from '@/lib/widgetBridge'
import { useHabits } from '@/features/habits/hooks/useHabits'
import type { HabitWithTodayLog } from '@/features/habits/types'

/** Habits due today that aren't finished yet, in dashboard order. */
function pendingNames(habits: HabitWithTodayLog[]): string[] {
  return habits.filter((h) => h.dueToday && !h.isComplete).map((h) => h.name)
}

/**
 * Keep the Android home-screen widget and macOS tray in sync with today's
 * habit completion. Both are read-only glances — see `WidgetBridgePlugin.kt`
 * and `set_widget_summary` in `src-tauri/src/lib.rs` for the native halves;
 * each caps how many pending names it actually displays. Mounted once in the
 * authenticated shell, alongside `useDailyReminder`.
 */
export function useNativeWidgetSync(): void {
  const { habits } = useHabits()

  useEffect(() => {
    const due = habits.filter((h) => h.dueToday || h.isComplete)
    const done = due.filter((h) => h.isComplete).length
    const total = due.length
    const pending = pendingNames(habits)

    void updateAndroidWidget(done, total, pending)
    void setWidgetSummary(done, total, pending)
  }, [habits])
}
