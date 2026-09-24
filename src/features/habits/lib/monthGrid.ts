import { addDaysToKey, weekdayOfKey } from '@/lib/date'
import type { DayCell } from '@/features/habits/lib/schedule'

export type MonthDayState = 'done' | 'frozen' | 'open' | 'future' | 'void'

export interface MonthDay {
  date: string
  day: number
  state: MonthDayState
  today: boolean
}

/**
 * The current month as a Monday-first grid: `leading` blank slots before the
 * 1st, then one entry per day. Days before the habit existed are `void`, days
 * after today `future`; the rest come from the detail's day cells.
 */
export function monthGrid(
  todayKey: string,
  cells: DayCell[],
  createdKey: string,
): { leading: number; days: MonthDay[] } {
  const monthPrefix = todayKey.slice(0, 7)
  const first = `${monthPrefix}-01`
  // weekdayOfKey is Sunday = 0; the grid starts on Monday.
  const leading = (weekdayOfKey(first) + 6) % 7
  const byDate = new Map(cells.map((c) => [c.date, c]))

  const days: MonthDay[] = []
  for (let key = first; key.startsWith(monthPrefix); key = addDaysToKey(key, 1)) {
    const cell = byDate.get(key)
    let state: MonthDayState = 'open'
    if (key > todayKey) state = 'future'
    else if (key < createdKey) state = 'void'
    else if (cell?.done) state = 'done'
    else if (cell?.frozen) state = 'frozen'
    days.push({ date: key, day: Number(key.slice(8)), state, today: key === todayKey })
  }
  return { leading, days }
}
