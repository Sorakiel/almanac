import { Tag } from '@/components/common/Tag'
import { exerciseTargetLabel } from '@/features/workouts/lib/session'
import type { SessionExercise, SetLog } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'

interface ExerciseViewProps {
  exercise: SessionExercise
}

/** Static "reps × weight" for one set, e.g. "10 × 15 kg" or "10 reps". */
function setLine(set: SetLog): string {
  if (set.reps != null && set.weight != null) return `${set.reps} × ${set.weight} kg`
  if (set.reps != null) return `${set.reps} reps`
  if (set.weight != null) return `${set.weight} kg`
  return '—'
}

/** Read-only exercise card — the plan as it reads before you tap Edit. */
export function ExerciseView({ exercise }: ExerciseViewProps) {
  const { t } = useT()
  const target = exerciseTargetLabel(exercise)

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
        <span className="flex-none font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {exercise.sets.length} sets
        </span>
      </div>

      {exercise.sets.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {exercise.sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2.5"
            >
              <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
                {set.set_number}
              </span>
              <span className="text-sm font-medium tabular-nums">{setLine(set)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">{t('workouts.noSetsPlanned')}</p>
      )}
    </div>
  )
}
