import { useMemo } from 'react'
import { useToday } from '@/hooks/useToday'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { buildWeek, type WeekView } from '@/features/workouts/lib/week'
import { isDoneOn, isDueOn } from '@/features/workouts/lib/recurrence'
import type { WorkoutView } from '@/features/workouts/types'

export interface TrainingOverview {
  week: WeekView
  /** Today's session to surface, preferring one not yet done. Null on a rest day. */
  todaysWorkout: WorkoutView | null
  /** Whether `todaysWorkout` is already completed today. */
  todayDone: boolean
  /** Most recently completed sessions, newest first. */
  recent: WorkoutView[]
  /** Due / done slot counts across the current week. */
  weekDue: number
  weekDone: number
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Everything the training week page needs: the strip, today's card, recents. */
export function useTrainingOverview(): TrainingOverview {
  const { workouts, isLoading, isError, refetch } = useWorkouts()
  const { dateKey, timezone } = useToday()

  return useMemo(() => {
    const week = buildWeek(dateKey, workouts, timezone)

    const dueToday = workouts.filter((w) => isDueOn(w, dateKey))
    const todaysWorkout =
      dueToday.find((w) => !isDoneOn(w, dateKey, timezone)) ?? dueToday[0] ?? null
    const todayDone = todaysWorkout ? isDoneOn(todaysWorkout, dateKey, timezone) : false

    const recent = workouts
      .filter((w) => w.completed_at)
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      .slice(0, 4)

    const weekDue = week.days.reduce((sum, d) => sum + d.dueCount, 0)
    const weekDone = week.days.reduce((sum, d) => sum + d.doneCount, 0)

    return {
      week,
      todaysWorkout,
      todayDone,
      recent,
      weekDue,
      weekDone,
      isLoading,
      isError,
      refetch,
    }
  }, [workouts, dateKey, timezone, isLoading, isError, refetch])
}
