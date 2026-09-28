import type { FocusSessionRow } from '@/features/flow/api/focusSessions.api'
import { lastNDateKeys } from '@/lib/date'

export interface FocusDayBar {
  key: string
  minutes: number
  isToday: boolean
}

/** The last seven days, oldest first, with the minutes focused on each. */
export function focusWeek(rows: FocusSessionRow[], todayKey: string): FocusDayBar[] {
  return lastNDateKeys(todayKey, 7).map((key) => ({
    key,
    minutes: rows.filter((r) => r.date === key).reduce((sum, r) => sum + r.minutes, 0),
    isToday: key === todayKey,
  }))
}

/** Minutes focused on one day. */
export function focusMinutesOn(rows: FocusSessionRow[], key: string): number {
  return rows.filter((r) => r.date === key).reduce((sum, r) => sum + r.minutes, 0)
}
