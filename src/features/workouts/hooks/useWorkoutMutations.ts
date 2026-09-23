import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { Workout, WorkoutRecurrence } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'

export interface WorkoutFormInput {
  name: string
  scheduled_date: string | null
  recurrence: WorkoutRecurrence
  recurrence_days: number[] | null
  recurrence_interval: number | null
}

/** Create / edit / complete / delete workouts, invalidating the list on settle. */
export function useWorkoutMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = workoutKeys.all(userId)

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createWorkout,
    (input: WorkoutFormInput) => ({ input, userId }),
  )
  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateWorkout,
    (args: { id: string; input: WorkoutFormInput }) => ({ ...args, userId }),
  )
  const remove = useOfflineMutation(OFFLINE_MUTATION_KEYS.deleteWorkout, (id: string) => ({
    id,
    userId,
  }))

  // Optimistic: completing a session flips its badge instantly, rolls back on error.
  const toggleComplete = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    (args: { id: string; done: boolean }) => ({ ...args, userId }),
    {
      onMutate: ({ id, done }) =>
        patchQueryData<Workout[]>(queryClient, key, (previous) =>
          previous?.map((w) =>
            w.id === id ? { ...w, completed_at: done ? new Date().toISOString() : null } : w,
          ),
        ),
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, key, context),
    },
  )

  return { create, update, remove, toggleComplete }
}
