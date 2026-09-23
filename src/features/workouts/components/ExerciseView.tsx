import { Tag } from '@/components/common/Tag'
import { muscleLabel } from '@/features/workouts/lib/muscles'
import { exerciseTargetLabel } from '@/features/workouts/lib/session'
import type { SessionExercise, SetLog } from '@/features/workouts/types'
import { useT, type TFunction } from '@/hooks/useT'

interface ExerciseViewProps {
  exercise: SessionExercise
}

/** Static "reps × weight" for one set, e.g. "10 × 15 kg" or "10 reps". */
function setLine(set: SetLog, t: TFunction): string {
  if (set.reps != null && set.weight != null)
    return t('workouts.setWeight', { reps: set.reps, weight: set.weight })
  if (set.reps != null) return t('workouts.repsCount', { count: set.reps })
  if (set.weight != null) return t('units.kgValue', { value: set.weight })
  return '—'
}

/** Read-only exercise card — the plan as it reads before you tap Edit. */
export function ExerciseView({ exercise }: ExerciseViewProps) {
  const { t } = useT()
  const target = exerciseTargetLabel(exercise, t)

  return (
    <div className="rounded-[20px] border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold">{exercise.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {exercise.muscleGroup ? (
              <Tag tone="teal">{muscleLabel(exercise.muscleGroup, t)}</Tag>
            ) : null}
            {target ? (
              <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
                {t('workouts.targetLine', { target })}
              </span>
            ) : null}
          </div>
        </div>
        <span className="flex-none font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('workouts.setsCount', { count: exercise.sets.length })}
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
              <span className="text-sm font-medium tabular-nums">{setLine(set, t)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">{t('workouts.noSetsPlanned')}</p>
      )}
    </div>
  )
}
