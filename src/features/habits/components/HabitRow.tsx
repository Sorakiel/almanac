import { toast } from 'sonner'
import { Tag } from '@/components/common/Tag'
import { CheckToggle } from '@/features/habits/components/HabitCard'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface HabitRowProps {
  habit: HabitWithTodayLog
}

/** Compact one-tap row used in the dashboard's "today's habits" list. */
export function HabitRow({ habit }: HabitRowProps) {
  const toggle = useToggleHabit()

  const handleToggle = () => {
    toggle.mutate(
      { habit },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update habit'),
      },
    )
  }

  return (
    <div className="flex items-center gap-3 py-1.5">
      <CheckToggle habit={habit} onToggle={handleToggle} />
      <span
        className={cn(
          'min-w-0 flex-1 truncate font-medium',
          habit.isComplete && 'text-muted line-through',
        )}
      >
        {habit.name}
      </span>
      <Tag>{frequencyLabel(habit)}</Tag>
    </div>
  )
}
