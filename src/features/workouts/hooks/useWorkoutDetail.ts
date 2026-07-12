import { useQuery } from '@tanstack/react-query'
import { fetchWorkoutById } from '@/features/workouts/api/workouts.api'
import { fetchSessionExercises } from '@/features/workouts/api/session.api'
import type { SessionExercise, Workout } from '@/features/workouts/types'

interface UseWorkoutDetailResult {
  workout: Workout | undefined
  exercises: SessionExercise[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** One workout's header row plus its exercises and set logs. */
export function useWorkoutDetail(id: string): UseWorkoutDetailResult {
  const workoutQuery = useQuery({
    queryKey: ['workout', id],
    queryFn: () => fetchWorkoutById(id),
    enabled: Boolean(id),
  })

  const sessionQuery = useQuery({
    queryKey: ['workoutSession', id],
    queryFn: () => fetchSessionExercises(id),
    enabled: Boolean(id),
  })

  return {
    workout: workoutQuery.data,
    exercises: sessionQuery.data ?? [],
    isLoading: workoutQuery.isLoading || sessionQuery.isLoading,
    isError: workoutQuery.isError || sessionQuery.isError,
    refetch: () => {
      void workoutQuery.refetch()
      void sessionQuery.refetch()
    },
  }
}
