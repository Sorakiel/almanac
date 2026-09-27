import type { WeekDay } from '@/features/workouts/lib/week'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface WeekStripProps {
  days: WeekDay[]
  /** Currently selected day's `YYYY-MM-DD`. */
  selectedKey: string
  onSelect: (dateKey: string) => void
}

/**
 * Monday-anchored 7-day strip (the prototype's `.m-week`): weekday and date in
 * one tile, a teal dot for a planned day (solid once done), today outlined in
 * teal. Picking another day shows its plan below.
 */
export function WeekStrip({ days, selectedKey, onSelect }: WeekStripProps) {
  const { t } = useT()
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const selected = day.dateKey === selectedKey
        const vars = { weekday: day.weekday, day: day.dayOfMonth }
        const label =
          day.dueCount === 0
            ? t('workouts.dayRest', vars)
            : t('workouts.daySessions', { ...vars, count: day.dueCount })
        return (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelect(day.dateKey)}
            aria-pressed={selected}
            aria-current={day.isToday ? 'date' : undefined}
            aria-label={label}
            className={cn(
              'grid min-w-0 justify-items-center gap-1.5 rounded-2xl bg-surface pb-2.5 pt-2 text-footnote font-medium text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              day.isToday
                ? 'bg-teal/15 ring-2 ring-inset ring-teal'
                : selected && 'ring-1 ring-inset ring-foreground/30',
            )}
          >
            {day.weekday}
            <b className="text-body font-semibold text-foreground">{day.dayOfMonth}</b>
            <i
              aria-hidden="true"
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                day.dueCount === 0
                  ? 'bg-transparent'
                  : day.doneCount >= day.dueCount
                    ? 'bg-teal'
                    : 'bg-teal/45',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
