import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys, localDateKey } from '@/lib/date'
import { weekdayOfKey } from '@/lib/date'
import {
  fetchHabitById,
  fetchHabitFreezes,
  fetchHabitHistory,
} from '@/features/habits/api/habits.api'
import { dailyTarget, intervalDays } from '@/features/habits/lib/frequency'
import { completionRate, computeDayCells, type DayCell } from '@/features/habits/lib/schedule'
import type { Habit } from '@/features/habits/types'

const HEATMAP_DAYS = 371 // 53 weeks

export interface HabitDetailStats {
  streak: number
  best: number
  ratePct: number
  /** Total completed days over the heatmap window. */
  total: number
  /** One entry per day over the heatmap window, oldest→newest. */
  heatmap: DayCell[]
  /** Local date key the habit was created — days before it are void, not rest. */
  createdKey: string
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

  return { streak, best }
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

  return { streak, best }
}

function computeStats(
  habit: Habit,
  completed: Set<string>,
  frozen: Set<string>,
  windowKeys: string[],
  createdKey: string,
): HabitDetailStats {
  const todayKey = windowKeys.at(-1)!
  const heatmap = computeDayCells(habit, completed, frozen, windowKeys, todayKey, createdKey)
  const interval = intervalDays(habit)

  let core: { streak: number; best: number }
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

  return {
    ...core,
    ratePct: completionRate(habit, completed, windowKeys, createdKey),
    total: completed.size,
    heatmap,
    createdKey,
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
  const { dateKey, timezone } = useToday()
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
    // The habit only "exists" from its creation day — days before it don't count
    // as misses. created_at is a UTC instant; resolve it in the user's zone.
    const createdKey = localDateKey(timezone, new Date(habit.created_at))
    stats = computeStats(habit, completed, frozen, windowKeys, createdKey)
  }

  return {
    habit,
    stats,
    isLoading: habitQuery.isLoading || historyQuery.isLoading,
    isError: habitQuery.isError || historyQuery.isError,
  }
}
