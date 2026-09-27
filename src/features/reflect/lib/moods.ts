import { addDaysToKey, weekdayOfKey } from '@/lib/date'

/** Mood is stored 1–5; labels come from `dashboard.modules.moods.*` at render. */
export const MOODS = [
  { value: 1, key: 'rough', dot: 'bg-mood-1' },
  { value: 2, key: 'meh', dot: 'bg-mood-2' },
  { value: 3, key: 'okay', dot: 'bg-mood-3' },
  { value: 4, key: 'good', dot: 'bg-mood-4' },
  { value: 5, key: 'great', dot: 'bg-mood-5' },
] as const

export type Mood = (typeof MOODS)[number]

/** The mood entry for a stored value, or null for an unset / out-of-range one. */
export function moodFor(value: number | null): Mood | null {
  return MOODS.find((m) => m.value === value) ?? null
}

interface MonthCells {
  /** Empty cells before the 1st, so the grid starts on Monday. */
  lead: number
  /** Every day of the month, as `YYYY-MM-DD` keys. */
  days: string[]
}

/** The calendar month holding `dateKey`, laid out Monday-first. */
export function monthCells(dateKey: string): MonthCells {
  const first = `${dateKey.slice(0, 8)}01`
  const days: string[] = []
  for (let key = first; key.slice(0, 7) === first.slice(0, 7); key = addDaysToKey(key, 1)) {
    days.push(key)
  }
  return { lead: (weekdayOfKey(first) + 6) % 7, days }
}
