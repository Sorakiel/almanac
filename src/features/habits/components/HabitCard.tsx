import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { IconTile } from '@/components/common/IconTile'
import { Sparkline } from '@/components/common/Sparkline'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { frequencyLabel, timeOfDayLabel } from '@/features/habits/lib/frequency'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface HabitCardProps {
  habit: HabitWithTodayLog
}

/** Rich habits-list card: icon, history stat, sparkline, one-tap check. */
export function HabitCard({ habit }: HabitCardProps) {
  const navigate = useNavigate()
  const toggle = useToggleHabit()
  const color = resolveHabitColor(habit.color)
  const Icon = resolveHabitIcon(habit.icon)
  const timeLabel = timeOfDayLabel(habit.time_of_day)
  const subtitle = [habit.description, frequencyLabel(habit), timeLabel]
    .filter(Boolean)
    .join(' · ')

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
    <Card className="relative p-4 transition-colors hover:border-accent/30">
      {/* Stretched overlay: the whole card opens the habit, while the toggle
          below sits above it (z-10) and keeps its own click. */}
      <button
        type="button"
        onClick={() => navigate(`/habits/${habit.id}`)}
        aria-label={`Open ${habit.name}`}
        className="absolute inset-0 z-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      />
      <div className="flex items-start gap-3">
        <IconTile icon={Icon} tone={color.tile} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{habit.name}</p>
          <p className="truncate text-sm text-muted">{subtitle}</p>
        </div>
        <div className="relative z-10">
          <CheckToggle habit={habit} onToggle={handleToggle} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="label-mono normal-case tracking-normal">
          <span className="tabular-nums">{habit.completedRecent}</span> of last {habit.windowDays}
          {' · '}
          <span className="text-accent">{Math.round(habit.rate * 100)}%</span>
        </span>
        <Sparkline values={habit.series} stroke={color.stroke} />
      </div>
    </Card>
  )
}

interface CheckToggleProps {
  habit: HabitWithTodayLog
  onToggle: () => void
}

/** Circular completion toggle used on cards and rows. */
export function CheckToggle({ habit, onToggle }: CheckToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={habit.isComplete}
      aria-label={habit.isComplete ? `Mark ${habit.name} incomplete` : `Complete ${habit.name}`}
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        habit.isComplete
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'text-transparent hover:border-accent hover:text-accent',
      )}
    >
      {habit.isComplete ? (
        <span
          key="ripple"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-accent motion-safe:animate-ripple motion-reduce:hidden"
        />
      ) : null}
      <Check
        key={habit.isComplete ? 'on' : 'off'}
        className={cn('h-4 w-4', habit.isComplete && 'motion-safe:animate-pop')}
        aria-hidden="true"
      />
    </button>
  )
}
