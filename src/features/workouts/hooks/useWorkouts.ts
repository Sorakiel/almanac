import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchWorkouts } from '@/features/workouts/api/workouts.api'
import type { Workout, WorkoutView } from '@/features/workouts/types'

interface UseWorkoutsResult {
  workouts: WorkoutView[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

function toView(w: Workout): WorkoutView {
  const status = w.completed_at ? 'completed' : w.scheduled_date ? 'scheduled' : 'unplanned'
  return { ...w, status }
}

/** The signed-in user's workouts with a derived status, own-rows via RLS. */
export function useWorkouts(): UseWorkoutsResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => fetchWorkouts(userId),
    enabled: Boolean(userId),
  })

  const workouts = useMemo(() => (query.data ?? []).map(toView), [query.data])

  return {
    workouts,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
