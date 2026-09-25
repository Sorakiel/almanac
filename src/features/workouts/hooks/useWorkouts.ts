import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchWorkouts } from '@/features/workouts/api/workouts.api'
import type { Workout, WorkoutView } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'
import { isCompletedOn } from '@/features/workouts/lib/recurrence'

interface UseWorkoutsResult {
  workouts: WorkoutView[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

// A recurring workout is "completed" only on the day it was finished.
function toView(w: Workout, dateKey: string, timezone: string): WorkoutView {
  const status = isCompletedOn(w, dateKey, timezone)
    ? 'completed'
    : w.scheduled_date || w.recurrence !== 'none'
      ? 'scheduled'
      : 'unplanned'
  return { ...w, status }
}

/** The signed-in user's workouts with a derived status, own-rows via RLS. */
export function useWorkouts(): UseWorkoutsResult {
  const { user } = useSession()
  const userId = user?.id ?? ''
  const { dateKey, timezone } = useToday()

  const query = useQuery({
    queryKey: workoutKeys.all(userId),
    queryFn: () => fetchWorkouts(userId),
    enabled: Boolean(userId),
  })

  const workouts = useMemo(
    () => (query.data ?? []).map((w) => toView(w, dateKey, timezone)),
    [query.data, dateKey, timezone],
  )

  return {
    workouts,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
