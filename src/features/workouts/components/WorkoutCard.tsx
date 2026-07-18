import { useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { CompletionToggle } from '@/components/common/CompletionToggle'
import { IconTile } from '@/components/common/IconTile'
import { Tag } from '@/components/common/Tag'
import { useWorkoutMutations } from '@/features/workouts/hooks/useWorkoutMutations'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import type { WorkoutStatus, WorkoutView } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface WorkoutCardProps {
  workout: WorkoutView
}

const STATUS_TONE: Record<WorkoutStatus, 'teal' | 'accent' | 'muted'> = {
  completed: 'teal',
  scheduled: 'accent',
  unplanned: 'muted',
}

const STATUS_LABEL: Record<WorkoutStatus, string> = {
  completed: 'done',
  scheduled: 'planned',
  unplanned: 'anytime',
}

/** Friendly label for a `YYYY-MM-DD` date, UTC-safe to avoid tz drift. */
function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)))
}

/** A workout row: complete toggle, identity (tap to edit), status badge. */
export function WorkoutCard({ workout }: WorkoutCardProps) {
  const navigate = useNavigate()
  const { toggleComplete } = useWorkoutMutations()
  const done = Boolean(workout.completed_at)
  const subtitle =
    recurrenceLabel(workout) ??
    (workout.scheduled_date ? formatDate(workout.scheduled_date) : 'No date set')

  const handleToggle = () => {
    toggleComplete.mutate(
      { id: workout.id, done: !done },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update the workout'),
      },
    )
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      <CompletionToggle
        done={done}
        onToggle={handleToggle}
        tone="teal"
        size="md"
        aria-label={done ? `Mark ${workout.name} not done` : `Mark ${workout.name} done`}
      />

      <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" />

      <button
        type="button"
        onClick={() => navigate(`/train/${workout.id}`)}
        className="min-w-0 flex-1 text-left"
      >
        <p className={cn('truncate font-semibold', done && 'text-muted line-through')}>
          {workout.name}
        </p>
        <p className="truncate text-sm text-muted">{subtitle}</p>
      </button>

      <Tag tone={STATUS_TONE[workout.status]}>{STATUS_LABEL[workout.status]}</Tag>
    </Card>
  )
}
