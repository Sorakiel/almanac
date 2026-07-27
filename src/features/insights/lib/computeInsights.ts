import { weekdayOfKey } from '@/lib/date'
import type { Habit, HabitLog } from '@/features/habits/types'
import type { HabitRate, Insights, InsightRange, WeekPoint } from '@/features/insights/types'

export type { InsightRange }

/** Lookback length in days for the fixed-size ranges ("all" uses the full fetched window). */
const RANGE_DAYS: Record<'7d' | '30d', number> = { '7d': 7, '30d': 30 }
const TREND_WEEKS = 6
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Expected completions per week for a habit's cadence. Used as the denominator
 * for a completion rate that's fair across daily, weekly, and interval habits.
 */
function weeklyExpected(habit: Habit): number {
  switch (habit.frequency) {
    case 'daily':
      return 7
    case 'weekdays':
      return 5
    case 'weekly':
      return 1
    case 'x_per_week':
      return Math.max(1, habit.target_count)
    case 'every_n_days':
      return 7 / Math.max(1, habit.target_count)
    case 'every_n_weeks':
      return 1 / Math.max(1, habit.target_count)
    default:
      return 7
  }
}

/** Whether a daily-scheduled habit is due on a weekday (for weekday strength). */
function scheduledOnWeekday(habit: Habit, weekday: number): boolean {
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'weekdays') return weekday >= 1 && weekday <= 5
  return false
}

/** Rate (0–1) over a set of date keys: done habit-days ÷ expected habit-days. */
function rateOver(habits: Habit[], done: Map<string, Set<string>>, keys: string[]): number {
  if (keys.length === 0) return 0
  let doneSum = 0
  let expectedSum = 0
  for (const habit of habits) {
    const days = done.get(habit.id)
    const expected = weeklyExpected(habit) * (keys.length / 7)
    expectedSum += expected
    if (days) doneSum += keys.reduce((n, key) => (days.has(key) ? n + 1 : n), 0)
  }
  if (expectedSum === 0) return 0
  return Math.min(1, doneSum / expectedSum)
}

/** Longest run of consecutive done days for one habit over the ordered keys. */
function longestStreak(days: Set<string>, keys: string[]): number {
  let best = 0
  let run = 0
  for (const key of keys) {
    if (days.has(key)) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

/**
 * Completion-over-time points for the trend chart. 7d buckets by day;
 * 30d buckets into TREND_WEEKS weeks (~42 days back, for a fuller chart);
 * all buckets the entire fetched window into weeks.
 */
function trendPoints(
  habits: Habit[],
  done: Map<string, Set<string>>,
  windowKeys: string[],
  current: string[],
  range: InsightRange,
): WeekPoint[] {
  if (range === '7d') {
    return current.map((key) => ({
      label: WEEKDAY_NAMES[weekdayOfKey(key)] ?? key,
      rate: rateOver(habits, done, [key]),
    }))
  }

  const weeks = range === '30d' ? TREND_WEEKS : Math.max(1, Math.ceil(windowKeys.length / 7))
  const points: WeekPoint[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = windowKeys.length - w * 7
    const weekKeys = windowKeys.slice(Math.max(0, end - 7), end)
    if (weekKeys.length === 0) continue
    points.push({ label: `W${weeks - w}`, rate: rateOver(habits, done, weekKeys) })
  }
  return points
}

/**
 * Derive the Insights read-out from active habits and their logs. Pure: all
 * date math is done against `windowKeys` (oldest→newest local date keys).
 * A day counts as "done" for a habit when it has a log with count ≥ 1.
 */
export function computeInsights(
  habits: Habit[],
  logs: HabitLog[],
  windowKeys: string[],
  range: InsightRange = '30d',
): Insights {
  // habit_id → set of date keys the habit was done on.
  const done = new Map<string, Set<string>>()
  for (const log of logs) {
    if (log.count < 1) continue
    let set = done.get(log.habit_id)
    if (!set) {
      set = new Set()
      done.set(log.habit_id, set)
    }
    set.add(log.date)
  }

  const rangeDays = range === 'all' ? windowKeys.length : RANGE_DAYS[range]
  const current = windowKeys.slice(-rangeDays)
  const previous = range === 'all' ? [] : windowKeys.slice(-rangeDays * 2, -rangeDays)

  const completionRate = rateOver(habits, done, current)
  const completionDelta =
    previous.length > 0
      ? Math.round((completionRate - rateOver(habits, done, previous)) * 100)
      : undefined

  const totalDone = current.reduce((sum, key) => {
    for (const days of done.values()) if (days.has(key)) sum += 1
    return sum
  }, 0)

  const bestStreak = habits.reduce((max, habit) => {
    const days = done.get(habit.id)
    return days ? Math.max(max, longestStreak(days, current)) : max
  }, 0)

  const weekly = trendPoints(habits, done, windowKeys, current, range)

  const byHabit: HabitRate[] = habits
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      rate: rateOver([habit], done, current),
    }))
    .sort((a, b) => b.rate - a.rate)

  // Weekday strength across daily-scheduled habits only.
  const dayDone = Array(7).fill(0)
  const daySched = Array(7).fill(0)
  for (const key of current) {
    const wd = weekdayOfKey(key)
    for (const habit of habits) {
      if (!scheduledOnWeekday(habit, wd)) continue
      daySched[wd] += 1
      if (done.get(habit.id)?.has(key)) dayDone[wd] += 1
    }
  }
  const weekdayRates = daySched.map((sched, wd) => ({
    wd,
    rate: sched > 0 ? dayDone[wd] / sched : null,
  }))
  const rated = weekdayRates.filter((d): d is { wd: number; rate: number } => d.rate !== null)
  const bestWeekday =
    rated.length > 0
      ? (WEEKDAY_NAMES[rated.reduce((a, b) => (b.rate > a.rate ? b : a)).wd] ?? null)
      : null
  const worstWeekday =
    rated.length > 1
      ? (WEEKDAY_NAMES[rated.reduce((a, b) => (b.rate < a.rate ? b : a)).wd] ?? null)
      : null

  return {
    completionRate,
    completionDelta,
    bestStreak,
    activeHabits: habits.length,
    totalDone,
    weekly,
    byHabit,
    bestWeekday,
    worstWeekday,
    hasData: habits.length > 0 && logs.length > 0,
  }
}
