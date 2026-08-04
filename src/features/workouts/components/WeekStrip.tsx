import type { WeekDay } from '@/features/workouts/lib/week'
import { cn } from '@/lib/utils'

interface WeekStripProps {
  days: WeekDay[]
  /** Currently selected day's `YYYY-MM-DD`. */
  selectedKey: string
  onSelect: (dateKey: string) => void
}

/** Monday-anchored 7-day strip; each day is selectable, today/selected accented. */
export function WeekStrip({ days, selectedKey, onSelect }: WeekStripProps) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
      {days.map((day) => {
        const selected = day.dateKey === selectedKey
        const label =
          day.dueCount === 0
            ? `${day.weekday} ${day.dayOfMonth}, rest day`
            : `${day.weekday} ${day.dayOfMonth}, ${day.dueCount} session${day.dueCount > 1 ? 's' : ''}`
        return (
          <div key={day.dateKey} className="min-w-0 text-center">
            <div
              className={cn(
                'font-mono text-[10px] uppercase tracking-label',
                selected ? 'text-accent' : 'text-muted-strong',
              )}
            >
              {day.weekday}
            </div>
            <button
              type="button"
              onClick={() => onSelect(day.dateKey)}
              aria-pressed={selected}
              aria-current={day.isToday ? 'date' : undefined}
              aria-label={label}
              className={cn(
                'mt-2 flex h-[62px] w-full flex-col items-center justify-center gap-2 rounded-[15px] border transition-colors sm:h-[70px]',
                selected
                  ? 'border-accent/40 bg-gradient-to-br from-accent/15 to-panel'
                  : 'border-transparent bg-panel hover:border-border/25',
              )}
            >
              <span
                className={cn('text-base font-semibold tabular-nums', selected && 'text-accent')}
              >
                {day.dayOfMonth}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  day.dueCount > 0 ? 'bg-accent' : 'bg-muted-strong/40',
                )}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
