import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { updateWorkout } from '@/features/workouts/api/workouts.api'
import {
  addSet,
  addWorkoutExercise,
  createExercise,
  removeSet,
  removeWorkoutExercise,
  updateSet,
} from '@/features/workouts/api/session.api'
import type { SessionExercise, SetLog, Workout } from '@/features/workouts/types'

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

  const setCompleted = useMutation({
    mutationFn: (done: boolean) =>
      updateWorkout(workoutId, { completed_at: done ? new Date().toISOString() : null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      void queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    },
  })

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
    }) => addSet(args.workoutExerciseId, args.setNumber, args.reps, args.weight),
    onSuccess: invalidateSession,
  })

  const editSet = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SetLog> }) => updateSet(id, patch),
    onMutate: async ({ id, patch }) => {
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
    onSettled: invalidateSession,
  })

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
