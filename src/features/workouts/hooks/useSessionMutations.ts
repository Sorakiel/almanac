import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type EditSetVariables } from '@/lib/offlineMutations'
import type { SessionExercise, Workout } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'

/** Every logged set is done and there's at least one — the session is finished. */
function allSetsDone(exercises: SessionExercise[]): boolean {
  const sets = exercises.flatMap((e) => e.sets)
  return sets.length > 0 && sets.every((s) => s.done)
}

/** Mutations for a workout's session — exercises, sets, and completion. */
export function useSessionMutations(workoutId: string) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const [celebrate, setCelebrate] = useState(false)

  const sessionKey = workoutKeys.session(workoutId)

  // Shares its key with useWorkoutMutations' toggleComplete — same underlying
  // write, two call sites.
  const setCompleted = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    (done: boolean) => ({ id: workoutId, userId, done }),
    {
      onSuccess: (_data, { done }) => {
        if (done) trackEvent('workout_finished')
      },
    },
  )

  // A set logged offline mid-workout resumes headlessly and has to run the
  // exact same write — hence the registered key rather than a local mutationFn.
  const editSet = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.editSet,
    (args: Omit<EditSetVariables, 'workoutId'>) => ({ ...args, workoutId }),
    {
      onMutate: async ({ id, patch }) => {
        const context = await patchQueryData<SessionExercise[]>(
          queryClient,
          sessionKey,
          (previous) =>
            previous?.map((ex) => ({
              ...ex,
              sets: ex.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            })),
        )
        // Ticking the last remaining set auto-completes the workout + celebrates.
        if (patch.done === true) {
          const session = queryClient.getQueryData<SessionExercise[]>(sessionKey)
          const workout = queryClient.getQueryData<Workout>(workoutKeys.detail(workoutId))
          if (session && allSetsDone(session) && workout && !workout.completed_at) {
            setCompleted.mutate(true)
            setCelebrate(true)
          }
        }
        return context
      },
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, sessionKey, context),
    },
  )

  return {
    editSet,
    setCompleted,
    /** True right after the final set is ticked — drives the congrats modal. */
    celebrate,
    dismissCelebrate: () => setCelebrate(false),
  }
}
