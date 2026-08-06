import { Plus, X } from 'lucide-react'
import { Stepper } from '@/features/workouts/components/edit/Stepper'
import { useT } from '@/hooks/useT'
import {
  REST_PRESETS,
  restLabel,
  type DraftExercise,
  type DraftSet,
} from '@/features/workouts/lib/draft'

interface SetEditorTableProps {
  exercise: DraftExercise
  onEditSet: (setId: string, patch: Partial<Omit<DraftSet, 'id'>>) => void
  onStepSet: (setId: string, field: 'reps' | 'weight', delta: number) => void
  onRemoveSet: (setId: string) => void
  onAddSet: () => void
}

/** Advance rest to the next preset (wraps around). */
function nextRest(current: number | null): number {
  const idx = REST_PRESETS.indexOf(current ?? 0)
  return REST_PRESETS[(idx + 1) % REST_PRESETS.length] ?? 0
}

/** The inline set editor: a stepper table for reps / weight / rest per set. */
export function SetEditorTable({
  exercise,
  onEditSet,
  onStepSet,
  onRemoveSet,
  onAddSet,
}: SetEditorTableProps) {
  const { t } = useT()
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[2.25rem_1fr_1fr_auto] items-center gap-2 px-1 pb-2 font-mono text-[9px] uppercase tracking-label text-muted-strong lg:grid-cols-[2.25rem_1fr_1fr_4.5rem_auto] lg:gap-3">
        <span>set</span>
        <span className="text-center">{t('workouts.reps')}</span>
        <span className="text-center">{t('workouts.weightKg')}</span>
        <span className="hidden text-center lg:block">{t('workouts.rest')}</span>
        <span className="w-8" />
      </div>

      <div className="flex flex-col gap-2">
        {exercise.sets.map((set, i) => (
          <div
            key={set.id}
            className="grid grid-cols-[2.25rem_1fr_1fr_auto] items-center gap-2 lg:grid-cols-[2.25rem_1fr_1fr_4.5rem_auto] lg:gap-3"
          >
            <span className="flex h-10 items-center justify-center rounded-xl bg-bg font-mono text-sm tabular-nums text-muted">
              {i + 1}
            </span>
            <Stepper
              value={set.reps}
              onChange={(v) => onEditSet(set.id, { reps: v })}
              onStep={(d) => onStepSet(set.id, 'reps', d)}
              ariaLabel={`Reps for set ${i + 1}`}
            />
            <Stepper
              value={set.weight}
              onChange={(v) => onEditSet(set.id, { weight: v })}
              onStep={(d) => onStepSet(set.id, 'weight', d)}
              step={5}
              ariaLabel={`Weight for set ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => onEditSet(set.id, { restSeconds: nextRest(set.restSeconds) })}
              aria-label={t('a11y.restForSet', {
                number: i + 1,
                value: restLabel(set.restSeconds),
              })}
              className="hidden h-10 items-center justify-center rounded-xl border bg-bg font-mono text-[13px] tabular-nums text-muted transition-colors hover:text-foreground lg:flex"
            >
              {restLabel(set.restSeconds)}
            </button>
            <button
              type="button"
              onClick={() => onRemoveSet(set.id)}
              aria-label={t('a11y.removeSet', { number: i + 1 })}
              className="flex h-9 w-8 flex-none items-center justify-center rounded-lg text-muted-strong transition-colors hover:text-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSet}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 font-mono text-[13px] text-accent transition-colors hover:bg-accent/5"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('workouts.addSet')}
      </button>
    </div>
  )
}
