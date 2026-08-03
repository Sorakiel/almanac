import { useCallback, useMemo, useReducer } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { commitDraft } from '@/features/workouts/api/draft.api'
import {
  buildDraft,
  draftSignature,
  type DraftSet,
  type WorkoutDraft,
} from '@/features/workouts/lib/draft'
import type { SessionExercise } from '@/features/workouts/types'

/** A library exercise being added or swapped into the draft. */
export interface LibraryPick {
  exerciseId: string
  name: string
  muscleGroup: string | null
}

interface State {
  draft: WorkoutDraft
  nextTmp: number
}

type Action =
  | { type: 'setName'; name: string }
  | { type: 'addExercise'; pick: LibraryPick }
  | { type: 'removeExercise'; id: string }
  | { type: 'reorder'; from: number; to: number }
  | { type: 'swapExercise'; id: string; pick: LibraryPick }
  | { type: 'addSet'; exId: string }
  | { type: 'removeSet'; exId: string; setId: string }
  | { type: 'editSet'; exId: string; setId: string; patch: Partial<Omit<DraftSet, 'id'>> }
  | { type: 'bumpSet'; exId: string; setId: string; field: 'reps' | 'weight'; delta: number }

/** A sensible starter block for a freshly added exercise. */
function defaultSets(makeId: () => string): DraftSet[] {
  return Array.from({ length: 3 }, () => ({
    id: makeId(),
    reps: 10,
    weight: null,
    restSeconds: 90,
  }))
}

function reducer(state: State, action: Action): State {
  let tmp = state.nextTmp
  const id = () => `tmp-${tmp++}`
  const mapExercises = (
    fn: (ex: State['draft']['exercises'][number]) => State['draft']['exercises'][number],
  ) => ({
    ...state.draft,
    exercises: state.draft.exercises.map(fn),
  })

  switch (action.type) {
    case 'setName':
      return { ...state, draft: { ...state.draft, name: action.name } }

    case 'addExercise': {
      const exercise = {
        id: id(),
        exerciseId: action.pick.exerciseId,
        name: action.pick.name,
        muscleGroup: action.pick.muscleGroup,
        sets: defaultSets(id),
      }
      return {
        nextTmp: tmp,
        draft: { ...state.draft, exercises: [...state.draft.exercises, exercise] },
      }
    }

    case 'removeExercise':
      return {
        ...state,
        draft: {
          ...state.draft,
          exercises: state.draft.exercises.filter((ex) => ex.id !== action.id),
        },
      }

    case 'reorder': {
      const exercises = [...state.draft.exercises]
      const [moved] = exercises.splice(action.from, 1)
      if (moved) exercises.splice(action.to, 0, moved)
      return { ...state, draft: { ...state.draft, exercises } }
    }

    case 'swapExercise':
      return {
        ...state,
        draft: mapExercises((ex) =>
          ex.id === action.id
            ? {
                ...ex,
                exerciseId: action.pick.exerciseId,
                name: action.pick.name,
                muscleGroup: action.pick.muscleGroup,
              }
            : ex,
        ),
      }

    case 'addSet': {
      const draft = mapExercises((ex) => {
        if (ex.id !== action.exId) return ex
        const last = ex.sets[ex.sets.length - 1]
        const set: DraftSet = {
          id: id(),
          reps: last?.reps ?? 10,
          weight: last?.weight ?? null,
          restSeconds: last?.restSeconds ?? 90,
        }
        return { ...ex, sets: [...ex.sets, set] }
      })
      return { nextTmp: tmp, draft }
    }

    case 'removeSet':
      return {
        ...state,
        draft: mapExercises((ex) =>
          ex.id === action.exId
            ? { ...ex, sets: ex.sets.filter((s) => s.id !== action.setId) }
            : ex,
        ),
      }

    case 'editSet':
      return {
        ...state,
        draft: mapExercises((ex) =>
          ex.id === action.exId
            ? {
                ...ex,
                sets: ex.sets.map((s) => (s.id === action.setId ? { ...s, ...action.patch } : s)),
              }
            : ex,
        ),
      }

    case 'bumpSet':
      // Relative bump reads the current value, so rapid clicks accumulate.
      return {
        ...state,
        draft: mapExercises((ex) =>
          ex.id === action.exId
            ? {
                ...ex,
                sets: ex.sets.map((s) =>
                  s.id === action.setId
                    ? { ...s, [action.field]: Math.max(0, (s[action.field] ?? 0) + action.delta) }
                    : s,
                ),
              }
            : ex,
        ),
      }

    default:
      return state
  }
}

/** Editable draft of a workout template, plus a save that commits the diff. */
export function useWorkoutDraft(workoutId: string, name: string, exercises: SessionExercise[]) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  // Snapshot the original once — the baseline for dirty-checking and the commit diff.
  const original = useMemo(() => buildDraft(name, exercises), [name, exercises])
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    draft: buildDraft(name, exercises),
    nextTmp: 0,
  }))

  const isDirty = draftSignature(state.draft) !== draftSignature(original)

  const save = useMutation({
    mutationFn: () => commitDraft(workoutId, original, state.draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workoutSession', workoutId] })
      void queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      void queryClient.invalidateQueries({ queryKey: ['workouts', user?.id ?? ''] })
    },
  })

  const actions = useMemo(
    () => ({
      setName: (n: string) => dispatch({ type: 'setName', name: n }),
      addExercise: (pick: LibraryPick) => dispatch({ type: 'addExercise', pick }),
      removeExercise: (exId: string) => dispatch({ type: 'removeExercise', id: exId }),
      reorder: (from: number, to: number) => dispatch({ type: 'reorder', from, to }),
      swapExercise: (exId: string, pick: LibraryPick) =>
        dispatch({ type: 'swapExercise', id: exId, pick }),
      addSet: (exId: string) => dispatch({ type: 'addSet', exId }),
      removeSet: (exId: string, setId: string) => dispatch({ type: 'removeSet', exId, setId }),
      editSet: (exId: string, setId: string, patch: Partial<Omit<DraftSet, 'id'>>) =>
        dispatch({ type: 'editSet', exId, setId, patch }),
      bumpSet: (exId: string, setId: string, field: 'reps' | 'weight', delta: number) =>
        dispatch({ type: 'bumpSet', exId, setId, field, delta }),
    }),
    [],
  )

  const saveDraft = useCallback(
    (onDone: () => void) => save.mutate(undefined, { onSuccess: onDone }),
    [save],
  )

  return {
    draft: state.draft,
    isDirty,
    actions,
    saveDraft,
    isSaving: save.isPending,
    saveError: save.error,
  }
}
