import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { CompletionToggle } from '@/components/common/CompletionToggle'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { useTodaysWorkouts, type DueWorkout } from '@/features/workouts/hooks/useTodaysWorkouts'
import { useWorkoutMutations } from '@/features/workouts/hooks/useWorkoutMutations'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { useModulesStore } from '@/stores/modules'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

function Row({ item }: { item: DueWorkout }) {
  const { toggleComplete } = useWorkoutMutations()
  const { t } = useT()
  const { workout, doneToday } = item
  const label = recurrenceLabel(workout, t) ?? t('dashboard.scheduledToday')

  const toggle = () =>
    toggleComplete.mutate(
      { id: workout.id, done: !doneToday },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t('dashboard.workoutUpdateFailed')),
      },
    )

  return (
    <Card className="flex items-center gap-3 p-4">
      <CompletionToggle
        done={doneToday}
        onToggle={toggle}
        tone="teal"
        size="md"
        aria-label={
          doneToday
            ? t('dashboard.markWorkoutNotDone', { name: workout.name })
            : t('dashboard.markWorkoutDone', { name: workout.name })
        }
      />
      <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" />
      <Link to={`/train/${workout.id}`} className="min-w-0 flex-1">
        <p className={cn('truncate font-semibold', doneToday && 'text-muted line-through')}>
          {workout.name}
        </p>
        <p className="truncate text-sm text-muted">{label}</p>
      </Link>
      {doneToday ? <Tag tone="teal">{t('dashboard.done')}</Tag> : null}
    </Card>
  )
}

/** Dashboard block: workouts scheduled for today. Hidden when nothing's due. */
export function TodaysWorkoutsBlock() {
  const { t } = useT()
  const workoutsEnabled = useModulesStore((s) => s.enabled.workouts)
  const { due } = useTodaysWorkouts()
  // Don't leak training onto the dashboard when the module is switched off.
  if (!workoutsEnabled || due.length === 0) return null

  const doneCount = due.filter((d) => d.doneToday).length

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel accessory={t('dashboard.doneOf', { done: doneCount, total: due.length })}>
        {t('dashboard.todayTraining')}
      </SectionLabel>
      <div className="flex flex-col gap-3">
        {due.map((item) => (
          <Row key={item.workout.id} item={item} />
        ))}
      </div>
    </section>
  )
}
