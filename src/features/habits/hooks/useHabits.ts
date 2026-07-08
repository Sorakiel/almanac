import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchHabits, fetchLogsForDate } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitLog, HabitWithTodayLog } from '@/features/habits/types'

function join(habits: Habit[], logs: HabitLog[]): HabitWithTodayLog[] {
  const byHabit = new Map(logs.map((log) => [log.habit_id, log]))
  return habits.map((habit) => {
    const todayCount = byHabit.get(habit.id)?.count ?? 0
    return { ...habit, todayCount, isComplete: todayCount >= habit.target_count }
  })
}

interface UseHabitsResult {
  habits: HabitWithTodayLog[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Active habits joined with today's completion state. */
export function useHabits(): UseHabitsResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)

  const habitsQuery = useQuery({
    queryKey: habitKeys.all(userId),
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  const logsQuery = useQuery({
    queryKey: habitKeys.logsForDate(userId, dateKey),
    queryFn: () => fetchLogsForDate(userId, dateKey),
    enabled,
  })

  const habits =
    habitsQuery.data && logsQuery.data ? join(habitsQuery.data, logsQuery.data) : []

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
