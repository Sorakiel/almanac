import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { weekdayOfKey } from '@/lib/date'
import {
  fetchHabitById,
  fetchHabitFreezes,
  fetchHabitHistory,
} from '@/features/habits/api/habits.api'
import { dailyTarget, intervalDays } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'

const HEATMAP_DAYS = 371 // 53 weeks

export interface HabitDetailStats {
  streak: number
  best: number
  ratePct: number
  /** Total completed days over the heatmap window. */
  total: number
  /** One entry per day over the heatmap window, oldest→newest. */
  heatmap: { date: string; done: boolean; frozen: boolean }[]
  todayDone: boolean
  /** Today is protected by a streak freeze. */
  todayFrozen: boolean
}

/** Day-based stats: a streak is consecutive completed days; frozen days skip. */
function computeDailyStats(completed: Set<string>, frozen: Set<string>, windowKeys: string[]) {
  let best = 0
  let run = 0
  for (const key of windowKeys) {
    if (completed.has(key)) {
      run += 1
      if (run > best) best = run
    } else if (!frozen.has(key)) {
      run = 0
    }
    // A frozen day leaves the run untouched — it bridges but doesn't count.
  }

  // Current streak: walk backwards from today, skipping frozen days.
  let streak = 0
  for (let i = windowKeys.length - 1; i >= 0; i--) {
    const key = windowKeys[i]!
    if (completed.has(key)) streak++
    else if (frozen.has(key)) continue
    else break
  }

  const last30 = windowKeys.slice(-30)
  const done30 = last30.filter((k) => completed.has(k)).length
  const ratePct = Math.round((done30 / last30.length) * 100)

  return { streak, best, ratePct }
}

/**
 * Interval stats for every-N-days habits: a streak is consecutive completions
 * no more than N days apart, and it survives until a due day is missed. A
 * frozen day is a mark that bridges the spacing without adding to the count.
 */
function computeIntervalStats(
  completed: Set<string>,
  frozen: Set<string>,
  windowKeys: string[],
  n: number,
) {
  const marks = windowKeys.reduce<{ i: number; done: boolean }[]>((acc, key, i) => {
    const done = completed.has(key)
    if (done || frozen.has(key)) acc.push({ i, done })
    return acc
  }, [])

  const runFrom = (pos: number): number => {
    let run = marks[pos]!.done ? 1 : 0
    for (let j = pos; j > 0; j--) {
      if (marks[j]!.i - marks[j - 1]!.i > n) break
      if (marks[j - 1]!.done) run++
    }
    return run
  }

  let best = 0
  for (let i = 0; i < marks.length; i++) best = Math.max(best, runFrom(i))

  let streak = 0
  const today = windowKeys.length - 1
  const last = marks.at(-1)
  if (last !== undefined && today - last.i <= n) streak = runFrom(marks.length - 1)

  const last30 = windowKeys.slice(-30)
  const done30 = last30.filter((k) => completed.has(k)).length
  const expected = Math.max(Math.floor(30 / n), 1)
  const ratePct = Math.min(Math.round((done30 / expected) * 100), 100)

  return { streak, best, ratePct }
}

function computeStats(
  habit: Habit,
  completed: Set<string>,
  frozen: Set<string>,
  windowKeys: string[],
): HabitDetailStats {
  const heatmap = windowKeys.map((date) => ({
    date,
    done: completed.has(date),
    // Only surface a freeze on days that weren't completed anyway.
    frozen: frozen.has(date) && !completed.has(date),
  }))
  const interval = intervalDays(habit)

  let core: { streak: number; best: number; ratePct: number }
  if (interval !== null) {
    core = computeIntervalStats(completed, frozen, windowKeys, interval)
  } else if (habit.frequency === 'weekdays') {
    // Weekends don't count against a weekdays streak — evaluate weekdays only.
    const weekdayKeys = windowKeys.filter((k) => {
      const day = weekdayOfKey(k)
      return day !== 0 && day !== 6
    })
    core = computeDailyStats(completed, frozen, weekdayKeys)
  } else {
    core = computeDailyStats(completed, frozen, windowKeys)
  }

  const todayKey = windowKeys.at(-1)!
  return {
    ...core,
    total: completed.size,
    heatmap,
    todayDone: completed.has(todayKey),
    todayFrozen: frozen.has(todayKey),
  }
}

interface UseHabitDetailResult {
  habit: Habit | undefined
  stats: HabitDetailStats | undefined
  isLoading: boolean
  isError: boolean
}

export function useHabitDetail(habitId: string): UseHabitDetailResult {
  const { dateKey } = useToday()
  const windowKeys = lastNDateKeys(dateKey, HEATMAP_DAYS)

  const habitQuery = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => fetchHabitById(habitId),
  })

  const historyQuery = useQuery({
    queryKey: ['habitHistory', habitId, dateKey],
    queryFn: () => fetchHabitHistory(habitId, windowKeys[0]!),
  })

  const freezesQuery = useQuery({
    queryKey: ['habitFreezes', habitId, dateKey],
    queryFn: () => fetchHabitFreezes(habitId, windowKeys[0]!),
  })

  const habit = habitQuery.data
  let stats: HabitDetailStats | undefined
  if (habit && historyQuery.data) {
    const target = dailyTarget(habit)
    const completed = new Set(historyQuery.data.filter((l) => l.count >= target).map((l) => l.date))
    const frozen = new Set((freezesQuery.data ?? []).map((f) => f.date))
    stats = computeStats(habit, completed, frozen, windowKeys)
  }

  return {
    habit,
    stats,
    isLoading: habitQuery.isLoading || historyQuery.isLoading,
    isError: habitQuery.isError || historyQuery.isError,
  }
}
