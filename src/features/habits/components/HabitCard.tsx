import { Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface HabitCardProps {
  habit: HabitWithTodayLog
}

/** A single habit row: tap the check to complete, pencil to edit. */
export function HabitCard({ habit }: HabitCardProps) {
  const toggle = useToggleHabit()
  const openEditHabit = useUiStore((s) => s.openEditHabit)
  const multi = habit.target_count > 1

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
    <Card className="flex items-center gap-4 p-4">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={habit.isComplete}
        aria-label={habit.isComplete ? `Mark ${habit.name} incomplete` : `Complete ${habit.name}`}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          habit.isComplete
            ? 'border-accent bg-accent text-on-accent'
            : 'border-border text-muted hover:border-accent hover:text-accent',
        )}
      >
        <Check className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('truncate font-medium', habit.isComplete && 'text-muted line-through')}>
            {habit.name}
          </p>
          {multi ? (
            <span className="label-mono shrink-0">
              {habit.todayCount}/{habit.target_count}
            </span>
          ) : null}
        </div>
        {multi ? (
          <ProgressBlocks
            value={habit.todayCount}
            total={habit.target_count}
            className="mt-2"
            aria-label={`${habit.name}: ${habit.todayCount} of ${habit.target_count} today`}
          />
        ) : habit.description ? (
          <p className="truncate text-sm text-muted">{habit.description}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => openEditHabit(habit.id)}
        aria-label={`Edit ${habit.name}`}
        className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
    </Card>
  )
}
