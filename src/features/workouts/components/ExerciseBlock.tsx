import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tag } from '@/components/common/Tag'
import { SetRow } from '@/features/workouts/components/SetRow'
import { exerciseTargetLabel } from '@/features/workouts/lib/session'
import type { useSessionMutations } from '@/features/workouts/hooks/useSessionMutations'
import type { SessionExercise } from '@/features/workouts/types'

interface ExerciseBlockProps {
  exercise: SessionExercise
  mutations: ReturnType<typeof useSessionMutations>
}

const fail = (error: unknown, fallback: string) =>
  toast.error(error instanceof Error ? error.message : fallback)

/** One exercise in the plan editor: rename-free, edit its sets and targets. */
export function ExerciseBlock({ exercise, mutations }: ExerciseBlockProps) {
  const target = exerciseTargetLabel(exercise)
  const nextSetNumber = exercise.sets.reduce((max, s) => Math.max(max, s.set_number), 0) + 1

  const addSet = () =>
    mutations.appendSet.mutate(
      {
        workoutExerciseId: exercise.id,
        setNumber: nextSetNumber,
        reps: exercise.targetReps,
        weight: exercise.targetWeight,
      },
      { onError: (e) => fail(e, 'Could not add the set') },
    )

  const removeExercise = () =>
    mutations.removeExercise.mutate(exercise.id, {
      onError: (e) => fail(e, 'Could not remove the exercise'),
    })

  return (
    <div className="rounded-[20px] border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold">{exercise.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {exercise.muscleGroup ? <Tag tone="teal">{exercise.muscleGroup}</Tag> : null}
            {target ? (
              <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
                target {target}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={removeExercise}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-strong transition-colors hover:bg-bg hover:text-accent"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {exercise.sets.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onCommit={(patch) =>
                mutations.editSet.mutate(
                  { id: set.id, patch },
                  { onError: (e) => fail(e, 'Could not save the set') },
                )
              }
              onRemove={() =>
                mutations.deleteSet.mutate(set.id, {
                  onError: (e) => fail(e, 'Could not remove the set'),
                })
              }
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No sets yet.</p>
      )}

      <button
        type="button"
        onClick={addSet}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-deep"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add set
      </button>
    </div>
  )
}
