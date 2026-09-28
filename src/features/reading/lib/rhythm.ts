import { addDaysToKey, lastNDateKeys } from '@/lib/date'
import type { Book, ReadingSession } from '@/features/reading/types'

/** How far back the screen reads sessions: the streak can't see past it. */
export const RECENT_DAYS = 90
/** The "Ритм" chart: two weeks of bars. */
export const RHYTHM_DAYS = 14

type SessionLike = Pick<ReadingSession, 'date' | 'units_read'>

/** Units read per day, oldest → newest, for the `days` ending on `todayKey`. */
export function unitsPerDay(sessions: SessionLike[], todayKey: string, days: number): number[] {
  const byDay = new Map<string, number>()
  for (const s of sessions) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.units_read)
  return lastNDateKeys(todayKey, days).map((key) => byDay.get(key) ?? 0)
}

/** Whole-number average over every day of the window, idle days included. */
export function dailyAverage(perDay: number[]): number {
  if (perDay.length === 0) return 0
  return Math.round(perDay.reduce((sum, n) => sum + n, 0) / perDay.length)
}

/**
 * Consecutive days with any reading, ending today — or yesterday, so a
 * streak isn't lost at breakfast before today's pages are in.
 */
export function readingStreak(sessions: SessionLike[], todayKey: string): number {
  const read = new Set(sessions.filter((s) => s.units_read > 0).map((s) => s.date))
  let day = read.has(todayKey) ? todayKey : addDaysToKey(todayKey, -1)
  let streak = 0
  while (read.has(day)) {
    streak++
    day = addDaysToKey(day, -1)
  }
  return streak
}

/** Days until the end at `perDay` a day, or null when it can't be told. */
export function daysToFinish(left: number | null, perDay: number): number | null {
  if (left === null || left <= 0 || perDay <= 0) return null
  return Math.ceil(left / perDay)
}

/** Books finished in the calendar year of `todayKey`. */
export function finishedThisYear(
  books: Pick<Book, 'status' | 'finished_on'>[],
  todayKey: string,
): number {
  const year = todayKey.slice(0, 4)
  return books.filter((b) => b.status === 'finished' && b.finished_on?.startsWith(year)).length
}
