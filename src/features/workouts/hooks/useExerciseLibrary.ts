import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchExerciseLibrary } from '@/features/workouts/api/session.api'
import type { Exercise } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'

/** The signed-in user's saved exercises, for the add-exercise picker. */
export function useExerciseLibrary(): { exercises: Exercise[]; isLoading: boolean } {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: workoutKeys.exerciseLibrary(userId),
    queryFn: () => fetchExerciseLibrary(userId),
    enabled: Boolean(userId),
  })

  return { exercises: query.data ?? [], isLoading: query.isLoading }
}
