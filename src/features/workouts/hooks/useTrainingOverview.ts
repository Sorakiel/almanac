import { useMemo } from 'react'
import { useToday } from '@/hooks/useToday'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { buildWeek, type WeekView } from '@/features/workouts/lib/week'
import type { WorkoutView } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

export interface TrainingOverview {
  week: WeekView
  /** All of the user's workouts (for per-day lookups + list rendering). */
  workouts: WorkoutView[]
  /** The user's local `YYYY-MM-DD` today — the default selected day. */
  todayKey: string
  /** IANA timezone used for day math. */
  timezone: string
  /** Most recently completed sessions, newest first. */
  recent: WorkoutView[]
  /** Total completed sessions all-time. */
  completedCount: number
  /** Due / done slot counts across the current week. */
  weekDue: number
  weekDone: number
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Everything the training week page needs: the strip, today's card, recents. */
export function useTrainingOverview(): TrainingOverview {
  const { t, locale } = useT()
  const { workouts, isLoading, isError, refetch } = useWorkouts()
  const { dateKey, timezone } = useToday()

  return useMemo(() => {
    const week = buildWeek(dateKey, workouts, timezone, t, intlLocale(locale))

    const completed = workouts.filter((w) => w.completed_at)
    const recent = [...completed]
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      .slice(0, 4)

    const weekDue = week.days.reduce((sum, d) => sum + d.dueCount, 0)
    const weekDone = week.days.reduce((sum, d) => sum + d.doneCount, 0)

    return {
      week,
      workouts,
      todayKey: dateKey,
      timezone,
      recent,
      completedCount: completed.length,
      weekDue,
      weekDone,
      isLoading,
      isError,
      refetch,
    }
  }, [workouts, dateKey, timezone, isLoading, isError, refetch, t, locale])
}
