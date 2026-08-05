import { useState } from 'react'
import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { trackEvent } from '@/lib/analytics'
import {
  OFFLINE_MUTATION_KEYS,
  type EditSetVariables,
  type ToggleWorkoutCompleteVariables,
} from '@/lib/offlineMutations'
import {
  addSet,
  addWorkoutExercise,
  createExercise,
  removeSet,
  removeWorkoutExercise,
} from '@/features/workouts/api/session.api'
import type { SessionExercise, SetLog, Workout } from '@/features/workouts/types'

interface EditSetArgs {
  id: string
  patch: EditSetVariables['patch']
}

type EditSetContext = { previous: SessionExercise[] | undefined } | undefined

interface AddExerciseArgs {
  exerciseId: string
  sortOrder: number
  targetSets: number | null
  targetReps: number | null
  targetWeight: number | null
}

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

  const sessionKey = ['workoutSession', workoutId]
  const invalidateSession = () => void queryClient.invalidateQueries({ queryKey: sessionKey })

  // Patch a single set inside the cached session for instant feedback.
  const patchSet = (setId: string, patch: Partial<SetLog>) => {
    const prev = queryClient.getQueryData<SessionExercise[]>(sessionKey)
    if (!prev) return prev
    const next = prev.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }))
    queryClient.setQueryData(sessionKey, next)
    return prev
  }

  // Shares its mutationKey/mutationFn with useWorkoutMutations' toggleComplete
  // (same underlying write, two call sites) — see offlineMutations.ts.
  const setCompletedMutation = useMutation<Workout, Error, ToggleWorkoutCompleteVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    onSuccess: (_data, { done }) => {
      if (done) trackEvent('workout_finished')
    },
  })
  const setCompleted = {
    ...setCompletedMutation,
    mutate: (
      done: boolean,
      options?: MutateOptions<Workout, Error, ToggleWorkoutCompleteVariables>,
    ) => setCompletedMutation.mutate({ id: workoutId, userId, done }, options),
    mutateAsync: (done: boolean) =>
      setCompletedMutation.mutateAsync({ id: workoutId, userId, done }),
  }

  const createLibraryExercise = useMutation({
    mutationFn: ({ name, muscleGroup }: { name: string; muscleGroup: string | null }) =>
      createExercise(userId, name, muscleGroup),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exerciseLibrary', userId] }),
  })

  const addExercise = useMutation({
    mutationFn: (args: AddExerciseArgs) =>
      addWorkoutExercise({
        workoutId,
        exerciseId: args.exerciseId,
        sortOrder: args.sortOrder,
        targetSets: args.targetSets,
        targetReps: args.targetReps,
        targetWeight: args.targetWeight,
      }),
    onSuccess: invalidateSession,
  })

  const removeExercise = useMutation({
    mutationFn: (id: string) => removeWorkoutExercise(id),
    onSuccess: invalidateSession,
  })

  const appendSet = useMutation({
    mutationFn: (args: {
      workoutExerciseId: string
      setNumber: number
      reps: number | null
      weight: number | null
    }) => addSet(args),
    onSuccess: invalidateSession,
  })

  // mutationFn and the post-write invalidation live once in
  // registerOfflineMutations (src/lib/offlineMutations.ts) — a set logged
  // offline mid-workout resumes headlessly and has to run the exact same
  // write. See useToggleHabit for why that split exists.
  const editSetMutation = useMutation<void, Error, EditSetVariables, EditSetContext>({
    mutationKey: OFFLINE_MUTATION_KEYS.editSet,
    onMutate: async ({ id, patch }: EditSetVariables) => {
      await queryClient.cancelQueries({ queryKey: sessionKey })
      const previous = patchSet(id, patch)
      // Ticking the last remaining set auto-completes the workout + celebrates.
      if (patch.done === true) {
        const session = queryClient.getQueryData<SessionExercise[]>(sessionKey)
        const workout = queryClient.getQueryData<Workout>(['workout', workoutId])
        if (session && allSetsDone(session) && workout && !workout.completed_at) {
          setCompleted.mutate(true)
          setCelebrate(true)
        }
      }
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(sessionKey, ctx.previous)
    },
  })
  const editSet = {
    ...editSetMutation,
    mutate: (
      args: EditSetArgs,
      options?: MutateOptions<void, Error, EditSetVariables, EditSetContext>,
    ) => editSetMutation.mutate({ ...args, workoutId }, options),
    mutateAsync: (args: EditSetArgs) => editSetMutation.mutateAsync({ ...args, workoutId }),
  }

  const deleteSet = useMutation({
    mutationFn: (id: string) => removeSet(id),
    onSuccess: invalidateSession,
  })

  return {
    createLibraryExercise,
    addExercise,
    removeExercise,
    appendSet,
    editSet,
    deleteSet,
    setCompleted,
    /** True right after the final set is ticked — drives the congrats modal. */
    celebrate,
    dismissCelebrate: () => setCelebrate(false),
  }
}
