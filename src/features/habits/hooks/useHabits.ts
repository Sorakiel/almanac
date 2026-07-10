import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys } from '@/lib/date'
import { fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget, dueInDays, isDueOn } from '@/features/habits/lib/frequency'
import type { Habit, HabitLog, HabitWithTodayLog } from '@/features/habits/types'

const WINDOW_DAYS = 7
/** Fetch window: long enough to resolve due-ness for the longest interval
 *  cadence the form allows (every 8 weeks = 56 days), plus a small buffer. */
const FETCH_DAYS = 64

function join(habits: Habit[], logs: HabitLog[], windowKeys: string[]): HabitWithTodayLog[] {
  // Index counts by habit + date for O(1) lookup.
  const counts = new Map<string, number>()
  for (const log of logs) counts.set(`${log.habit_id}:${log.date}`, log.count)
  const todayKey = windowKeys[windowKeys.length - 1]!

  return habits.map((habit) => {
    const target = dailyTarget(habit)
    const doneOn = (key: string): boolean => (counts.get(`${habit.id}:${key}`) ?? 0) >= target

    const series: number[] = windowKeys.slice(-WINDOW_DAYS).map((key) => (doneOn(key) ? 1 : 0))
    const todayCount = counts.get(`${habit.id}:${todayKey}`) ?? 0
    const completedRecent = series.reduce((a, b) => a + b, 0)

    // Whole days since the most recent completion (0 = today), for interval due-ness.
    let daysSinceLastDone: number | null = null
    for (let i = windowKeys.length - 1; i >= 0; i--) {
      if (doneOn(windowKeys[i]!)) {
        daysSinceLastDone = windowKeys.length - 1 - i
        break
      }
    }
    const dueIn = dueInDays(habit, daysSinceLastDone)

    return {
      ...habit,
      todayCount,
      isComplete: todayCount >= target,
      series,
      completedRecent,
      windowDays: WINDOW_DAYS,
      rate: completedRecent / WINDOW_DAYS,
      dueInDays: dueIn,
      dueToday: isDueOn(habit, todayKey, daysSinceLastDone),
    }
  })
}

interface UseHabitsResult {
  habits: HabitWithTodayLog[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Active habits joined with today's completion and a 7-day history. */
export function useHabits(): UseHabitsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)
  const windowKeys = lastNDateKeys(dateKey, FETCH_DAYS)

  const habitsQuery = useQuery({
    queryKey: habitKeys.all(userId),
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  const logsQuery = useQuery({
    queryKey: habitKeys.recentLogs(userId, dateKey),
    queryFn: () => fetchLogsSince(userId, windowKeys[0]!),
    enabled,
  })

  const habits =
    habitsQuery.data && logsQuery.data
      ? join(habitsQuery.data, logsQuery.data, windowKeys)
      : []

  return {
    habits,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError,
    refetch: () => {
      void habitsQuery.refetch()
      void logsQuery.refetch()
    },
  }
}
