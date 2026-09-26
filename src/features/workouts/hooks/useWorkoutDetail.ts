import { useQuery } from '@tanstack/react-query'
import { fetchWorkoutById } from '@/features/workouts/api/workouts.api'
import { fetchSessionExercises } from '@/features/workouts/api/session.api'
import { useToday } from '@/hooks/useToday'
import type { SessionExercise, Workout } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'

const EMPTY: SessionExercise[] = []

interface UseWorkoutDetailResult {
  workout: Workout | undefined
  exercises: SessionExercise[]
  /** Local day of the session the exercises show. */
  sessionDate: string
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** One workout's header row plus its exercises and set logs. */
export function useWorkoutDetail(id: string): UseWorkoutDetailResult {
  const { dateKey } = useToday()
  const workoutQuery = useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => fetchWorkoutById(id),
    enabled: Boolean(id),
  })

  const sessionQuery = useQuery({
    queryKey: workoutKeys.sessionOn(id, dateKey),
    queryFn: () => fetchSessionExercises(id, dateKey),
    enabled: Boolean(id),
  })

  return {
    workout: workoutQuery.data,
    exercises: sessionQuery.data?.exercises ?? EMPTY,
    sessionDate: sessionQuery.data?.date ?? dateKey,
    isLoading: workoutQuery.isLoading || sessionQuery.isLoading,
    isError: workoutQuery.isError || sessionQuery.isError,
    refetch: () => {
      void workoutQuery.refetch()
      void sessionQuery.refetch()
    },
  }
}
