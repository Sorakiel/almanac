import { computeDayCells } from '@/features/habits/lib/schedule'
import type { Habit } from '@/features/habits/types'
import { addDaysToKey, weekdayOfKey } from '@/lib/date'

export interface YearDay {
  date: string
  /**
   * 0–1 share of the day's due habits that were completed, or `null` when the
   * cadence asked for nothing at all — a rest day is not a zero, and drawing it
   * as one would turn every "every 3 days" habit into a wall of failure.
   */
  ratio: number | null
  done: number
  due: number
}

/**
 * A year of days, each scored by how much of what the day asked for got done.
 *
 * Reuses `computeDayCells` per habit rather than counting raw logs, so the
 * schedule is honoured: a weekday habit's Saturday, the gap days of an
 * interval cadence, and any day before a habit existed are all "nothing was
 * due", not "nothing was done". Frozen days are excluded from the denominator
 * for the same reason — the freeze is exactly the promise that the day doesn't
 * count against you.
 *
 * Pure: takes already-fetched data so it stays testable at both languages and
 * over any window the caller cares to pass.
 */
export function buildYearActivity(
  habits: Habit[],
  completedByHabit: Map<string, Set<string>>,
  frozenByHabit: Map<string, Set<string>>,
  windowKeys: string[],
  todayKey: string,
): YearDay[] {
  const empty = new Set<string>()
  const perHabit = habits.map((habit) =>
    computeDayCells(
      habit,
      completedByHabit.get(habit.id) ?? empty,
      frozenByHabit.get(habit.id) ?? empty,
      windowKeys,
      todayKey,
      habit.created_at.slice(0, 10),
    ),
  )

  return windowKeys.map((date, i) => {
    let done = 0
    let due = 0
    for (const cells of perHabit) {
      const status = cells[i]?.status
      if (status === 'done') {
        done += 1
        due += 1
      } else if (status === 'due' || status === 'missed') {
        due += 1
      }
    }
    return { date, done, due, ratio: due === 0 ? null : done / due }
  })
}

const MONDAY = 1

export interface YearWeek {
  /** First and last date key of the week, clamped to the calendar year. */
  start: string
  end: string
  done: number
  due: number
  /** Same meaning as `YearDay.ratio`: `null` when the whole week asked for nothing. */
  ratio: number | null
  /** The week lies entirely after today — drawn as an empty slot, not a zero. */
  future: boolean
  containsToday: boolean
}

/**
 * Fold the year's days into Monday-started weeks covering the *whole* calendar
 * year, not just the days so far.
 *
 * A bar per day is 365 hairlines — unreadable on a phone and noise on a desktop.
 * Weeks give ~53 bars that each carry a legible share. Padding out to December
 * keeps the ruler fixed: in January the strip is mostly empty slots instead of
 * three fat bars stretched across the card.
 */
export function groupYearByWeek(days: YearDay[], todayKey: string): YearWeek[] {
  const first = days[0]
  if (!first) return []
  const year = first.date.slice(0, 4)
  const byDate = new Map(days.map((d) => [d.date, d]))

  const weeks: YearWeek[] = []
  let current: YearWeek | null = null
  for (let key = `${year}-01-01`; key.startsWith(year); key = addDaysToKey(key, 1)) {
    if (current === null || weekdayOfKey(key) === MONDAY) {
      current = {
        start: key,
        end: key,
        done: 0,
        due: 0,
        ratio: null,
        future: key > todayKey,
        containsToday: false,
      }
      weeks.push(current)
    }
    current.end = key
    if (key === todayKey) current.containsToday = true
    const day = byDate.get(key)
    if (day) {
      current.done += day.done
      current.due += day.due
    }
  }
  for (const week of weeks) week.ratio = week.due === 0 ? null : week.done / week.due
  return weeks
}
