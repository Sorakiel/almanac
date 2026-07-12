import { Link } from 'react-router-dom'
import { Check, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { useTodaysWorkouts, type DueWorkout } from '@/features/workouts/hooks/useTodaysWorkouts'
import { useWorkoutMutations } from '@/features/workouts/hooks/useWorkoutMutations'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { cn } from '@/lib/utils'

function Row({ item }: { item: DueWorkout }) {
  const { toggleComplete } = useWorkoutMutations()
  const { workout, doneToday } = item
  const label = recurrenceLabel(workout) ?? 'Scheduled today'

  const toggle = () =>
    toggleComplete.mutate(
      { id: workout.id, done: !doneToday },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update the workout'),
      },
    )

  return (
    <Card className="flex items-center gap-3 p-4">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={doneToday}
        aria-label={doneToday ? `Mark ${workout.name} not done` : `Mark ${workout.name} done`}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          doneToday
            ? 'border-teal/50 bg-teal/15 text-teal'
            : 'text-transparent hover:border-accent hover:text-accent',
        )}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
      <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" />
      <Link to={`/train/${workout.id}`} className="min-w-0 flex-1">
        <p className={cn('truncate font-semibold', doneToday && 'text-muted line-through')}>
          {workout.name}
        </p>
        <p className="truncate text-sm text-muted">{label}</p>
      </Link>
      {doneToday ? <Tag tone="teal">done</Tag> : null}
    </Card>
  )
}

/** Dashboard block: workouts scheduled for today. Hidden when nothing's due. */
export function TodaysWorkoutsBlock() {
  const { due } = useTodaysWorkouts()
  if (due.length === 0) return null

  const doneCount = due.filter((d) => d.doneToday).length

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel accessory={`${doneCount} / ${due.length} done`}>TODAY · TRAINING</SectionLabel>
      <div className="flex flex-col gap-3">
        {due.map((item) => (
          <Row key={item.workout.id} item={item} />
        ))}
      </div>
    </section>
  )
}
