import { updateWorkout } from '@/features/workouts/api/workouts.api'
import {
  addSet,
  addWorkoutExercise,
  removeSet,
  removeWorkoutExercise,
  updateSet,
  updateWorkoutExercise,
} from '@/features/workouts/api/session.api'
import { isTempId, type DraftExercise, type WorkoutDraft } from '@/features/workouts/lib/draft'

/** Representative targets to keep the collapsed row / read-only view coherent. */
function targets(ex: DraftExercise) {
  const first = ex.sets[0]
  return {
    target_sets: ex.sets.length,
    target_reps: first?.reps ?? null,
    target_weight: first?.weight ?? null,
  }
}

/**
 * Commit an edited draft to the DB by diffing it against the original snapshot:
 * rename, drop/add/reorder exercises, and reconcile each exercise's sets. Runs
 * sequentially — not a single transaction, but every write is an own-row change.
 */
export async function commitDraft(
  workoutId: string,
  original: WorkoutDraft,
  draft: WorkoutDraft,
): Promise<void> {
  const name = draft.name.trim()
  if (name && name !== original.name.trim()) {
    await updateWorkout(workoutId, { name })
  }

  // Drop exercises that were removed.
  const keptIds = new Set(draft.exercises.filter((e) => !isTempId(e.id)).map((e) => e.id))
  for (const ex of original.exercises) {
    if (!keptIds.has(ex.id)) await removeWorkoutExercise(ex.id)
  }

  // Create / update the rest, in their new order.
  for (let i = 0; i < draft.exercises.length; i++) {
    const ex = draft.exercises[i]
    if (!ex) continue

    if (isTempId(ex.id)) {
      const weId = await addWorkoutExercise({
        workoutId,
        exerciseId: ex.exerciseId,
        sortOrder: i,
        targetSets: targets(ex).target_sets,
        targetReps: targets(ex).target_reps,
        targetWeight: targets(ex).target_weight,
      })
      for (let j = 0; j < ex.sets.length; j++) {
        const s = ex.sets[j]!
        await addSet({
          workoutExerciseId: weId,
          setNumber: j + 1,
          reps: s.reps,
          weight: s.weight,
          restSeconds: s.restSeconds,
        })
      }
      continue
    }

    await updateWorkoutExercise(ex.id, {
      sort_order: i,
      exercise_id: ex.exerciseId,
      ...targets(ex),
    })

    const originalEx = original.exercises.find((e) => e.id === ex.id)
    const draftSetIds = new Set(ex.sets.filter((s) => !isTempId(s.id)).map((s) => s.id))
    for (const s of originalEx?.sets ?? []) {
      if (!draftSetIds.has(s.id)) await removeSet(s.id)
    }
    for (let j = 0; j < ex.sets.length; j++) {
      const s = ex.sets[j]!
      if (isTempId(s.id)) {
        await addSet({
          workoutExerciseId: ex.id,
          setNumber: j + 1,
          reps: s.reps,
          weight: s.weight,
          restSeconds: s.restSeconds,
        })
      } else {
        await updateSet(s.id, {
          set_number: j + 1,
          reps: s.reps,
          weight: s.weight,
          rest_seconds: s.restSeconds,
        })
      }
    }
  }
}
