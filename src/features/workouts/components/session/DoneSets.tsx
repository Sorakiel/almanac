import { formatKg, valuesOf, type Overrides } from '@/features/workouts/lib/sessionRun'
import type { SessionExercise } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface DoneSetsProps {
  exercises: SessionExercise[]
  overrides: Overrides
  onUndoLast: () => void
  onFinishEarly: () => void
}

/** "All sets" (`MOD.wList`): what is done, undo the last one, finish early in red. */
export function DoneSets({ exercises, overrides, onUndoLast, onFinishEarly }: DoneSetsProps) {
  const { t, locale } = useT()
  const loc = intlLocale(locale)
  const rows = exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.done)
      .map((s) => ({ id: s.id, name: ex.name, n: s.set_number, v: valuesOf(s, overrides) })),
  )
  const action =
    'flex min-h-12.5 w-full items-center px-4 text-left text-body transition-colors hover:bg-foreground/5'
  return (
    <div className="divide-y overflow-hidden rounded-card bg-surface">
      {rows.length === 0 ? (
        <p className="px-3.5 py-4 text-footnote text-muted">{t('workouts.session.noSetsYet')}</p>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2">
            <span className="min-w-0 flex-1">
              <b className="block truncate text-body font-medium">{r.name}</b>
              <small className="text-footnote text-muted">
                {t('workouts.session.setN', { n: r.n })}
              </small>
            </span>
            <span className="num text-callout font-medium text-muted">
              {formatKg(r.v.weight, loc)} × {r.v.reps}
            </span>
          </div>
        ))
      )}
      {rows.length > 0 ? (
        <button type="button" onClick={onUndoLast} className={`${action} text-accent`}>
          {t('workouts.session.undoLast')}
        </button>
      ) : null}
      <button type="button" onClick={onFinishEarly} className={`${action} text-danger`}>
        {t('workouts.session.finishEarly')}
      </button>
    </div>
  )
}
