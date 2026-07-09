import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { fetchHabitById, fetchHabitHistory } from '@/features/habits/api/habits.api'
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

function computeStats(completed: Set<string>, windowKeys: string[]): HabitDetailStats {
  const heatmap = windowKeys.map((date) => ({ date, done: completed.has(date) }))

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

  // Rate over the last 30 days.
  const last30 = windowKeys.slice(-30)
  const done30 = last30.filter((k) => completed.has(k)).length
  const ratePct = Math.round((done30 / last30.length) * 100)

  return { streak, best, ratePct, heatmap, todayDone: completed.has(windowKeys.at(-1)!) }
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
    const completed = new Set(
      historyQuery.data.filter((l) => l.count >= habit.target_count).map((l) => l.date),
    )
    stats = computeStats(completed, windowKeys)
  }

  return {
    habit,
    stats,
    isLoading: habitQuery.isLoading || historyQuery.isLoading,
    isError: habitQuery.isError || historyQuery.isError,
  }
}
