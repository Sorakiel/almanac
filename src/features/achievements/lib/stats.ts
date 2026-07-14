import type { AchievementStats } from '@/features/achievements/types'

/** Whole-day number for a `YYYY-MM-DD` key (UTC-safe), for streak arithmetic. */
function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000)
}

/**
 * Current and best run of consecutive days present in `days`. The current run
 * counts back from `todayKey` (today may be blank, so it may start yesterday).
 */
export function completionStreaks(
  days: Set<string>,
  todayKey: string,
): { current: number; best: number } {
  const nums = [...days].map(dayNumber).sort((a, b) => a - b)

  let best = 0
  let run = 0
  let prev: number | null = null
  for (const n of nums) {
    run = prev !== null && n === prev + 1 ? run + 1 : 1
    if (run > best) best = run
    prev = n
  }

  const present = new Set(nums)
  let cursor = dayNumber(todayKey)
  if (!present.has(cursor)) cursor -= 1
  let current = 0
  while (present.has(cursor)) {
    current += 1
    cursor -= 1
  }

  return { current, best }
}

export interface AchievementStatsInput {
  /** Habit-log dates with count ≥ 1 (repeats across habits kept for the total). */
  completionDates: string[]
  habitsCount: number
  workoutsCompleted: number
  booksFinished: number
  pagesRead: number
  notesWritten: number
  reflections: number
  betaUser: boolean
  todayKey: string
}

/** Fold raw aggregates into the stats every achievement is scored against. */
export function computeAchievementStats(input: AchievementStatsInput): AchievementStats {
  const { current, best } = completionStreaks(new Set(input.completionDates), input.todayKey)

  const activeModules = [
    input.habitsCount > 0,
    input.workoutsCompleted > 0,
    input.booksFinished > 0 || input.pagesRead > 0,
    input.reflections > 0,
  ].filter(Boolean).length

  return {
    currentStreak: current,
    bestStreak: best,
    totalCompletions: input.completionDates.length,
    workoutsCompleted: input.workoutsCompleted,
    booksFinished: input.booksFinished,
    pagesRead: input.pagesRead,
    notesWritten: input.notesWritten,
    reflections: input.reflections,
    activeModules,
    betaUser: input.betaUser,
  }
}
