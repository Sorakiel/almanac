import { lastNDateKeys } from '@/lib/date'
import { journalStreak } from '@/features/reflect/lib/format'
import type { ReflectInsightsRow } from '@/features/insights/api/reflectInsights.api'
import type { ReflectInsights } from '@/features/insights/types'

const WINDOW_DAYS = 30

/**
 * Roll reflections into journaling stats. The 30-day window is bucketed against
 * `todayKey` (the user's local date); the streak counts consecutive local days
 * with an entry, ending today or yesterday.
 */
export function computeReflectInsights(
  rows: ReflectInsightsRow[],
  todayKey: string,
): ReflectInsights {
  const since30 = lastNDateKeys(todayKey, WINDOW_DAYS)[0]!
  const dayKeys = new Set(rows.map((r) => r.date))

  let entries30d = 0
  let ratingSum = 0
  let ratingCount = 0
  const days30 = new Set<string>()
  for (const row of rows) {
    if (row.date < since30) continue
    entries30d += 1
    days30.add(row.date)
    if (row.day_rating != null) {
      ratingSum += row.day_rating
      ratingCount += 1
    }
  }

  return {
    entries30d,
    daysJournaled30d: days30.size,
    currentStreak: journalStreak(dayKeys, todayKey),
    totalEntries: rows.length,
    avgDayRating30d: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    consistency30d: days30.size / WINDOW_DAYS,
    hasData: rows.length > 0,
  }
}
