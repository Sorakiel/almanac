import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Dumbbell } from '@/components/common/icons'
import { IconTile } from '@/components/common/IconTile'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { daysUntilNext } from '@/features/workouts/lib/week'
import type { WorkoutView } from '@/features/workouts/types'
import { useT, type TFunction } from '@/hooks/useT'

interface PlanListProps {
  workouts: WorkoutView[]
  todayKey: string
  timezone: string
}

function nextLabel(days: number | null, t: TFunction): string | null {
  if (days === null) return null
  if (days === 0) return t('workouts.plan.today')
  if (days === 1) return t('workouts.plan.tomorrow')
  return t('workouts.plan.inDays', { count: days })
}

function PlanRow({
  workout,
  todayKey,
  timezone,
}: { workout: WorkoutView } & Omit<PlanListProps, 'workouts'>) {
  const { t } = useT()
  const navigate = useNavigate()
  const { exercises } = useWorkoutDetail(workout.id)
  const cadence = recurrenceLabel(workout, t) ?? t('workouts.plan.once')
  const next = nextLabel(daysUntilNext(workout, todayKey, timezone), t)

  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/train/${workout.id}`)}
        className="flex min-h-14 w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium">{workout.name}</span>
          <span className="block truncate text-footnote text-muted">
            {cadence} · {t('workouts.plan.exercises', { count: exercises.length })}
          </span>
        </span>
        {next ? <span className="flex-none text-callout text-muted">{next}</span> : null}
        <ChevronRight className="h-4 w-4 flex-none text-muted-strong" aria-hidden="true" />
      </button>
    </li>
  )
}

/** Every workout as a template row (the prototype's "План"): cadence, size, next time. */
export function PlanList({ workouts, todayKey, timezone }: PlanListProps) {
  return (
    <ul className="divide-y overflow-hidden rounded-card bg-surface">
      {workouts.map((w) => (
        <PlanRow key={w.id} workout={w} todayKey={todayKey} timezone={timezone} />
      ))}
    </ul>
  )
}
