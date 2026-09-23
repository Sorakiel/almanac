import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { useT } from '@/hooks/useT'
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

/** A create: the form's fields plus an id to refer to the workout before it is saved. */
export interface NewWorkoutInput extends WorkoutFormInput {
  id?: string
}

/** The row a create will produce, for the list to show before the server answers. */
function draftWorkout(id: string, userId: string, input: WorkoutFormInput): Workout {
  return { ...input, id, user_id: userId, completed_at: null, created_at: new Date().toISOString() }
}

/**
 * Create / edit / complete / delete workouts, invalidating the list on settle.
 * Each patches the cache first, so the form can close without waiting —
 * offline the write queues behind it.
 */
export function useWorkoutMutations() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = workoutKeys.all(userId)

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createWorkout,
    ({ id = crypto.randomUUID(), ...input }: NewWorkoutInput) => ({ input, userId, id }),
    {
      onMutate: ({ input, id }) => {
        if (!id) return undefined
        const draft = draftWorkout(id, userId, input)
        // Its detail page too: offline that query would pause with nothing to show.
        queryClient.setQueryData<Workout>(workoutKeys.detail(id), draft)
        return patchQueryData<Workout[]>(queryClient, key, (previous) =>
          previous ? [draft, ...previous] : undefined,
        )
      },
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, key, context),
    },
  )
  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateWorkout,
    (args: { id: string; input: WorkoutFormInput }) => ({ ...args, userId }),
    {
      onMutate: async ({ id, input }) => {
        queryClient.setQueryData<Workout>(workoutKeys.detail(id), (w) =>
          w ? { ...w, ...input } : w,
        )
        return patchQueryData<Workout[]>(queryClient, key, (previous) =>
          previous?.map((w) => (w.id === id ? { ...w, ...input } : w)),
        )
      },
      onError: (_error, { id }, context) => {
        rollbackQueryData(queryClient, key, context)
        void queryClient.invalidateQueries({ queryKey: workoutKeys.detail(id) })
      },
    },
  )
  const remove = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.deleteWorkout,
    (id: string) => ({ id, userId }),
    {
      onMutate: ({ id }) =>
        patchQueryData<Workout[]>(queryClient, key, (previous) =>
          previous?.filter((w) => w.id !== id),
        ),
      // Toasted here: the sheet that fired it has already closed and navigated away.
      onError: (error, _vars, context) => {
        rollbackQueryData(queryClient, key, context)
        toast.error(error instanceof Error ? error.message : t('workouts.form.removeFailed'))
      },
    },
  )

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
