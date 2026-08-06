import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Tag } from '@/components/common/Tag'
import { CheckToggle } from '@/features/habits/components/HabitCard'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

interface HabitRowProps {
  habit: HabitWithTodayLog
}

/** Compact one-tap row used in the dashboard's "today's habits" list. */
export function HabitRow({ habit }: HabitRowProps) {
  const { t } = useT()
  const toggle = useToggleHabit()

  const handleToggle = () => {
    toggle.mutate(
      { habit },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t('habits.updateFailed')),
      },
    )
  }

  const resting = !habit.isComplete && !habit.dueToday

  return (
    <div className="flex items-center gap-3 py-1.5">
      <CheckToggle habit={habit} onToggle={handleToggle} />
      <Link
        to={`/habits/${habit.id}`}
        className={cn(
          'min-w-0 flex-1 truncate rounded font-medium transition-colors hover:text-accent',
          (habit.isComplete || resting) && 'text-muted line-through',
        )}
      >
        {habit.name}
      </Link>
      {resting ? (
        <Tag tone="muted">
          {habit.dueInDays > 0
            ? t('habits.inDays', { count: habit.dueInDays })
            : t('habits.legendRest')}
        </Tag>
      ) : (
        <Tag>{frequencyLabel(habit, t)}</Tag>
      )}
    </div>
  )
}
