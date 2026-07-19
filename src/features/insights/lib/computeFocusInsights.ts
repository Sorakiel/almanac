import { lastNDateKeys } from '@/lib/date'
import type { FocusInsightsRow } from '@/features/insights/api/focusInsights.api'
import type { FocusDay, FocusInsights } from '@/features/insights/types'

const HEATMAP_DAYS = 371 // 53 weeks, matching the habit heatmap window.

/**
 * Roll finished focus sessions into Deep Work stats. Minutes bucket by day for
 * the heatmap and by the last-30-day window for the headline totals; the
 * current streak counts consecutive days with any focus, allowing today to be
 * blank so far (it runs through yesterday, like the journaling streak).
 */
export function computeFocusInsights(rows: FocusInsightsRow[], todayKey: string): FocusInsights {
  const since30 = lastNDateKeys(todayKey, 30)[0]!
  const minutesByDay = new Map<string, number>()
  let totalMinutes = 0
  let sessions30d = 0
  let minutes30d = 0

  for (const row of rows) {
    totalMinutes += row.minutes
    minutesByDay.set(row.date, (minutesByDay.get(row.date) ?? 0) + row.minutes)
    if (row.date >= since30) {
      sessions30d += 1
      minutes30d += row.minutes
    }
  }

  const windowKeys = lastNDateKeys(todayKey, HEATMAP_DAYS)
  const heatmap: FocusDay[] = windowKeys.map((date) => ({
    date,
    minutes: minutesByDay.get(date) ?? 0,
  }))

  const hasFocus = (key: string): boolean => (minutesByDay.get(key) ?? 0) > 0
  let currentStreak = 0
  let i = windowKeys.length - 1
  // Grace: if today has no focus logged yet, start the count from yesterday.
  if (i >= 0 && windowKeys[i] === todayKey && !hasFocus(windowKeys[i]!)) i -= 1
  for (; i >= 0; i--) {
    if (hasFocus(windowKeys[i]!)) currentStreak += 1
    else break
  }

  return {
    sessions30d,
    minutes30d,
    hoursTotal: Math.round((totalMinutes / 60) * 10) / 10,
    currentStreak,
    heatmap,
    hasData: rows.length > 0,
  }
}
