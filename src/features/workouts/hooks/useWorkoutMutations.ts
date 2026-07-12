import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { createWorkout, deleteWorkout, updateWorkout } from '@/features/workouts/api/workouts.api'
import type { Workout, WorkoutRecurrence } from '@/features/workouts/types'

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
  const key = ['workouts', userId]

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key })

  const create = useMutation({
    mutationFn: (input: WorkoutFormInput) => createWorkout({ ...input, user_id: userId }),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkoutFormInput }) =>
      updateWorkout(id, input),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onSuccess: invalidate,
  })

  // Optimistic: completing a session flips its badge instantly, rolls back on error.
  const toggleComplete = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      updateWorkout(id, { completed_at: done ? new Date().toISOString() : null }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Workout[]>(key)
      if (previous) {
        queryClient.setQueryData<Workout[]>(
          key,
          previous.map((w) =>
            w.id === id ? { ...w, completed_at: done ? new Date().toISOString() : null } : w,
          ),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })

  return { create, update, remove, toggleComplete }
}
