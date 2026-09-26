import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type LogSetVariables } from '@/lib/offlineMutations'
import type { SessionData, SessionExercise, SetLog, Workout } from '@/features/workouts/types'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'
import { isCompletedOn } from '@/features/workouts/lib/recurrence'

/** Every logged set is done and there's at least one — the session is finished. */
function allSetsDone(exercises: SessionExercise[]): boolean {
  const sets = exercises.flatMap((e) => e.sets)
  return sets.length > 0 && sets.every((s) => s.done)
}

interface SessionMutationOptions {
  /** Ticking the last remaining set finished the workout. */
  onFinished?: () => void
}

/** Mutations for a workout's session — exercises, sets, and completion. */
export function useSessionMutations(
  workoutId: string,
  { onFinished }: SessionMutationOptions = {},
) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  // onMutate outlives the render that created it; it always reaches the latest callback.
  const onFinishedRef = useRef(onFinished)
  useEffect(() => {
    onFinishedRef.current = onFinished
  })

  const { dateKey, timezone } = useToday()
  const sessionKey = workoutKeys.sessionOn(workoutId, dateKey)
  // The day the shown ticks belong to — today, or a one-off's unfinished earlier day.
  const sessionDate = () => queryClient.getQueryData<SessionData>(sessionKey)?.date ?? dateKey

  // Shares its key with useWorkoutMutations' toggleComplete — same underlying
  // write, two call sites.
  const setCompleted = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    (done: boolean) => ({ id: workoutId, userId, done, date: sessionDate() }),
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
    ({ set, done }: { set: SetLog; done: boolean }): LogSetVariables => ({
      workoutId,
      id: set.id,
      workoutExerciseId: set.workout_exercise_id,
      setNumber: set.set_number,
      date: sessionDate(),
      reps: set.reps,
      weight: set.weight,
      done,
      restSeconds: set.rest_seconds,
    }),
    {
      onMutate: async (variables) => {
        if ('patch' in variables) return undefined
        const { id, done } = variables
        const context = await patchQueryData<SessionData>(queryClient, sessionKey, (previous) =>
          previous
            ? {
                ...previous,
                exercises: previous.exercises.map((ex) => ({
                  ...ex,
                  sets: ex.sets.map((s) => (s.id === id ? { ...s, done } : s)),
                })),
              }
            : previous,
        )
        // Ticking the last remaining set auto-completes the workout.
        if (done) {
          const session = queryClient.getQueryData<SessionData>(sessionKey)
          const workout = queryClient.getQueryData<Workout>(workoutKeys.detail(workoutId))
          if (
            session &&
            allSetsDone(session.exercises) &&
            workout &&
            !isCompletedOn(workout, dateKey, timezone)
          ) {
            setCompleted.mutate(true)
            onFinishedRef.current?.()
          }
        }
        return context
      },
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, sessionKey, context),
    },
  )

  return { editSet, setCompleted }
}
