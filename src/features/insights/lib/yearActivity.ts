import { computeDayCells } from '@/features/habits/lib/schedule'
import type { Habit } from '@/features/habits/types'

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
