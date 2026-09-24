import type { DayStatus } from '@/features/habits/lib/schedule'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface WeekDotsProps {
  /** The last seven days, oldest first; the last one is today. */
  week: DayStatus[]
  /** The habit's colour as a CSS colour (`resolveHabitColor(...).stroke`). */
  color: string
  className?: string
}

const FILLED: ReadonlySet<DayStatus> = new Set(['done', 'frozen'])

/**
 * Seven dots, one per day: filled when done (or protected by a freeze), empty
 * otherwise, today ringed. Replaces the sparkline — a week is seven yes/no
 * answers, not a trend line.
 */
export function WeekDots({ week, color, className }: WeekDotsProps) {
  const { t } = useT()
  const done = week.filter((s) => s === 'done').length

  return (
    <span
      role="img"
      aria-label={t('habits.weekDots', { done, total: week.length })}
      className={cn('flex flex-none gap-[3px]', className)}
    >
      {week.map((status, i) => {
        const today = i === week.length - 1
        const filled = FILLED.has(status)
        // A frozen day reads in teal whatever the habit's colour: it was protected, not done.
        const fill = status === 'frozen' ? 'rgb(var(--color-teal))' : color
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{ backgroundColor: filled ? fill : undefined, outlineColor: color }}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              !filled && (today ? 'bg-transparent' : 'bg-border/25'),
              filled && !today && 'opacity-85',
              today && 'outline outline-[1.5px] outline-offset-1',
            )}
          />
        )
      })}
    </span>
  )
}
