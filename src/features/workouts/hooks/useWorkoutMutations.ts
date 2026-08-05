import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  OFFLINE_MUTATION_KEYS,
  type CreateWorkoutVariables,
  type DeleteWorkoutVariables,
  type ToggleWorkoutCompleteVariables,
  type UpdateWorkoutVariables,
} from '@/lib/offlineMutations'
import type { Workout, WorkoutRecurrence } from '@/features/workouts/types'

export interface WorkoutFormInput {
  name: string
  scheduled_date: string | null
  recurrence: WorkoutRecurrence
  recurrence_days: number[] | null
  recurrence_interval: number | null
}

type ToggleContext = { previous: Workout[] | undefined } | undefined

/**
 * Create / edit / complete / delete workouts, invalidating the list on
 * settle. mutationFn and the settle invalidation live once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see
 * useToggleHabit for why.
 */
export function useWorkoutMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = ['workouts', userId]

  const createMutation = useMutation<Workout, Error, CreateWorkoutVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.createWorkout,
  })
  const create = {
    ...createMutation,
    mutate: (
      input: WorkoutFormInput,
      options?: MutateOptions<Workout, Error, CreateWorkoutVariables>,
    ) => createMutation.mutate({ input, userId }, options),
    mutateAsync: (input: WorkoutFormInput) => createMutation.mutateAsync({ input, userId }),
  }

  const updateMutation = useMutation<Workout, Error, UpdateWorkoutVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.updateWorkout,
  })
  const update = {
    ...updateMutation,
    mutate: (
      args: { id: string; input: WorkoutFormInput },
      options?: MutateOptions<Workout, Error, UpdateWorkoutVariables>,
    ) => updateMutation.mutate({ ...args, userId }, options),
    mutateAsync: (args: { id: string; input: WorkoutFormInput }) =>
      updateMutation.mutateAsync({ ...args, userId }),
  }

  const removeMutation = useMutation<void, Error, DeleteWorkoutVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.deleteWorkout,
  })
  const remove = {
    ...removeMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, DeleteWorkoutVariables>) =>
      removeMutation.mutate({ id, userId }, options),
    mutateAsync: (id: string) => removeMutation.mutateAsync({ id, userId }),
  }

  // Optimistic: completing a session flips its badge instantly, rolls back on error.
  const toggleCompleteMutation = useMutation<
    Workout,
    Error,
    ToggleWorkoutCompleteVariables,
    ToggleContext
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    onMutate: async ({ id, done }: ToggleWorkoutCompleteVariables) => {
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
  })
  const toggleComplete = {
    ...toggleCompleteMutation,
    mutate: (
      args: { id: string; done: boolean },
      options?: MutateOptions<Workout, Error, ToggleWorkoutCompleteVariables, ToggleContext>,
    ) => toggleCompleteMutation.mutate({ ...args, userId }, options),
    mutateAsync: (args: { id: string; done: boolean }) =>
      toggleCompleteMutation.mutateAsync({ ...args, userId }),
  }

  return { create, update, remove, toggleComplete }
}
