import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { weekdayOfKey } from '@/lib/date'
import { fetchHabitById, fetchHabitHistory } from '@/features/habits/api/habits.api'
import { dailyTarget, intervalDays } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'

const HEATMAP_DAYS = 371 // 53 weeks

export interface HabitDetailStats {
  streak: number
  best: number
  ratePct: number
  /** One entry per day over the heatmap window, oldest→newest. */
  heatmap: { date: string; done: boolean }[]
  todayDone: boolean
}

/** Day-based stats: a streak is consecutive completed days. */
function computeDailyStats(completed: Set<string>, windowKeys: string[]) {
  let best = 0
  let run = 0
  for (const key of windowKeys) {
    run = completed.has(key) ? run + 1 : 0
    if (run > best) best = run
  }

  // Current streak: walk backwards from today.
  let streak = 0
  for (let i = windowKeys.length - 1; i >= 0; i--) {
    if (completed.has(windowKeys[i]!)) streak++
    else break
  }

  const last30 = windowKeys.slice(-30)
  const done30 = last30.filter((k) => completed.has(k)).length
  const ratePct = Math.round((done30 / last30.length) * 100)

  return { streak, best, ratePct }
}

/**
 * Interval stats for every-N-days habits: a streak is consecutive completions
 * no more than N days apart, and it survives until a due day is missed.
 */
function computeIntervalStats(completed: Set<string>, windowKeys: string[], n: number) {
  const doneIdx = windowKeys.reduce<number[]>((acc, key, i) => {
    if (completed.has(key)) acc.push(i)
    return acc
  }, [])

  const runFrom = (pos: number): number => {
    let run = 1
    for (let j = pos; j > 0; j--) {
      if (doneIdx[j]! - doneIdx[j - 1]! <= n) run++
      else break
    }
    return run
  }

  let best = 0
  for (let i = 0; i < doneIdx.length; i++) best = Math.max(best, runFrom(i))

  let streak = 0
  const today = windowKeys.length - 1
  const last = doneIdx.at(-1)
  if (last !== undefined && today - last <= n) streak = runFrom(doneIdx.length - 1)

  const last30 = windowKeys.slice(-30)
  const done30 = last30.filter((k) => completed.has(k)).length
  const expected = Math.max(Math.floor(30 / n), 1)
  const ratePct = Math.min(Math.round((done30 / expected) * 100), 100)

  return { streak, best, ratePct }
}

function computeStats(habit: Habit, completed: Set<string>, windowKeys: string[]): HabitDetailStats {
  const heatmap = windowKeys.map((date) => ({ date, done: completed.has(date) }))
  const interval = intervalDays(habit)

  let core: { streak: number; best: number; ratePct: number }
  if (interval !== null) {
    core = computeIntervalStats(completed, windowKeys, interval)
  } else if (habit.frequency === 'weekdays') {
    // Weekends don't count against a weekdays streak — evaluate weekdays only.
    const weekdayKeys = windowKeys.filter((k) => {
      const day = weekdayOfKey(k)
      return day !== 0 && day !== 6
    })
    core = computeDailyStats(completed, weekdayKeys)
  } else {
    core = computeDailyStats(completed, windowKeys)
  }

  return { ...core, heatmap, todayDone: completed.has(windowKeys.at(-1)!) }
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

  const habit = habitQuery.data
  let stats: HabitDetailStats | undefined
  if (habit && historyQuery.data) {
    const target = dailyTarget(habit)
    const completed = new Set(
      historyQuery.data.filter((l) => l.count >= target).map((l) => l.date),
    )
    stats = computeStats(habit, completed, windowKeys)
  }

  return {
    habit,
    stats,
    isLoading: habitQuery.isLoading || historyQuery.isLoading,
    isError: habitQuery.isError || historyQuery.isError,
  }
}
