import { isWeekendKey } from '@/lib/date'
import { intervalDays, expectedCompletionsInWindow } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'

type ScheduleHabit = Pick<Habit, 'frequency' | 'target_count'>

/**
 * Per-day status for the history list. A `rest` day is one the cadence never
 * asked for (a gap between interval marks, a weekend for a weekdays habit, or
 * a day before the habit existed) — crucially NOT a miss. `due` is today,
 * still open. `missed` is a past due day left undone.
 */
export type DayStatus = 'done' | 'frozen' | 'due' | 'missed' | 'rest'

export interface DayCell {
  date: string
  done: boolean
  frozen: boolean
  status: DayStatus
}

/**
 * Classify every day in the window against the habit's schedule. Interval
 * cadences slide off the last mark (done or frozen), so the days between marks
 * read as rest, not misses — which is what makes "every 3 days" honest. Weekly
 * and x-per-week have no fixed day, so an undone day is rest rather than a miss.
 */
export function computeDayCells(
  habit: ScheduleHabit,
  completed: Set<string>,
  frozen: Set<string>,
  windowKeys: string[],
  todayKey: string,
  createdKey: string,
): DayCell[] {
  const n = intervalDays(habit)
  // For interval habits, track the index of the most recent mark so due-ness
  // slides forward from it.
  let lastMark: number | null = null

  return windowKeys.map((date, i): DayCell => {
    const done = completed.has(date)
    const isFrozen = frozen.has(date) && !done
    if (done || isFrozen) lastMark = i

    let status: DayStatus
    if (done) status = 'done'
    else if (isFrozen) status = 'frozen'
    else if (date < createdKey) status = 'rest'
    else {
      const due = isDueForStatus(habit, n, date, i, lastMark)
      if (!due) status = 'rest'
      else status = date === todayKey ? 'due' : date > todayKey ? 'rest' : 'missed'
    }

    return { date, done, frozen: isFrozen, status }
  })
}

/** Whether an undone, existing day was one the cadence expected. */
function isDueForStatus(
  habit: ScheduleHabit,
  n: number | null,
  date: string,
  index: number,
  lastMark: number | null,
): boolean {
  if (n !== null) {
    // Due once the gap since the last mark reaches the interval; if there's no
    // prior mark yet, the habit is overdue every day until first done.
    return lastMark === null ? true : index - lastMark >= n
  }
  switch (habit.frequency) {
    case 'weekdays':
      return !isWeekendKey(date)
    // Flexible cadences have no specific due day — an undone day isn't a miss.
    case 'weekly':
    case 'x_per_week':
      return false
    default:
      return true
  }
}

/**
 * Schedule-aware completion rate over the recent window, counted only from when
 * the habit existed — so a brand-new habit isn't dragged down by days before it
 * was created. Returns a 0–100 integer.
 */
export function completionRate(
  habit: ScheduleHabit,
  completed: Set<string>,
  windowKeys: string[],
  createdKey: string,
  recentDays = 30,
): number {
  const elapsed = windowKeys.filter((k) => k >= createdKey).slice(-recentDays)
  if (elapsed.length === 0) return 0
  const expected = expectedCompletionsInWindow(habit, elapsed)
  if (expected <= 0) return 0
  const done = elapsed.filter((k) => completed.has(k)).length
  return Math.min(Math.round((done / expected) * 100), 100)
}
