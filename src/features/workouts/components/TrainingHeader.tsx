import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import { useT } from '@/hooks/useT'

/** "Неделя 39 · 1 из 3 по плану" over the large title — the prototype's `.p-head`. */
export function TrainingHeader({ overview }: { overview: TrainingOverview }) {
  const { t } = useT()
  const week = overview.week.weekNumber
  return (
    <header className="mx-0.5 mb-4 mt-2">
      <p className="text-callout font-medium text-muted">
        {overview.weekDue > 0
          ? t('workouts.weekSummary', { week, done: overview.weekDone, due: overview.weekDue })
          : t('workouts.weekOnly', { week })}
      </p>
      <h1 className="text-large-title font-bold tracking-title">{t('workouts.title')}</h1>
    </header>
  )
}
