import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { useExerciseLibrary } from '@/features/workouts/hooks/useExerciseLibrary'
import { muscleLabel } from '@/features/workouts/lib/muscles'
import { useT } from '@/hooks/useT'

/** "Exercise library · N ›" — opens the saved exercises in a sheet. */
export function ExerciseLibraryLink() {
  const { t } = useT()
  const { exercises } = useExerciseLibrary()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-card bg-surface px-4 text-left text-body transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t('workouts.library.title')}
        <span className="flex items-center gap-1 text-muted">
          <span className="num">{exercises.length}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={t('workouts.library.title')}>
        {exercises.length === 0 ? (
          <p className="text-callout text-muted">{t('workouts.library.empty')}</p>
        ) : (
          <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-card bg-surface">
            {exercises.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate text-body">{e.name}</span>
                {e.muscle_group ? (
                  <span className="flex-none text-footnote text-muted">
                    {muscleLabel(e.muscle_group, t)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  )
}
