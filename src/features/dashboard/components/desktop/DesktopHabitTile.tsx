import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Tag } from '@/components/common/Tag'
import { CheckToggle } from '@/features/habits/components/HabitCard'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

type Tone = 'accent' | 'teal' | 'amber' | 'muted'
const TONES: Tone[] = ['accent', 'teal', 'amber', 'muted']

function toneFor(color: string | null): Tone {
  return TONES.includes(color as Tone) ? (color as Tone) : 'accent'
}

/** Desktop dashboard habit tile: bordered panel, one-tap check, category tag. */
export function DesktopHabitTile({ habit }: { habit: HabitWithTodayLog }) {
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

  const resting = !habit.isComplete && !habit.dueToday

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border bg-panel px-[18px] py-4">
      <CheckToggle habit={habit} onToggle={handleToggle} />
      <Link
        to={`/habits/${habit.id}`}
        className={cn(
          'min-w-0 flex-1 truncate rounded font-medium transition-colors hover:text-accent',
          (habit.isComplete || resting) && 'text-muted-strong line-through',
        )}
      >
        {habit.name}
      </Link>
      {resting ? (
        <Tag tone="muted">{habit.dueInDays > 0 ? `in ${habit.dueInDays}d` : 'rest'}</Tag>
      ) : (
        <Tag tone={toneFor(habit.color)}>{frequencyLabel(habit)}</Tag>
      )}
    </div>
  )
}
