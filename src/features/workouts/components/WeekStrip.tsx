import type { WeekDay } from '@/features/workouts/lib/week'
import { cn } from '@/lib/utils'

interface WeekStripProps {
  days: WeekDay[]
}

/** A day marker: filled when all due workouts are done, ring when some remain. */
function DayMarker({ day }: { day: WeekDay }) {
  if (day.dueCount === 0) return <span className="mt-2 block h-1.5 w-1.5" aria-hidden="true" />
  const allDone = day.doneCount >= day.dueCount
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-2 block h-1.5 w-1.5 rounded-full',
        allDone ? 'bg-teal' : 'border border-teal/60',
      )}
    />
  )
}

/** Monday-anchored 7-day training strip; today's cell is accent-highlighted. */
export function WeekStrip({ days }: WeekStripProps) {
  return (
    <ol className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const label =
          day.dueCount === 0
            ? `${day.weekday} ${day.dayOfMonth}, rest day`
            : `${day.weekday} ${day.dayOfMonth}, ${day.doneCount} of ${day.dueCount} done`
        return (
          <li
            key={day.dateKey}
            aria-current={day.isToday ? 'date' : undefined}
            aria-label={label}
            className={cn(
              'flex flex-col items-center rounded-2xl border py-2.5 transition-colors',
              day.isToday ? 'border-accent/50 bg-accent/10' : 'bg-surface',
            )}
          >
            <span className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
              {day.weekday}
            </span>
            <span
              className={cn(
                'mt-1 text-[15px] font-semibold tabular-nums',
                day.isToday && 'text-accent',
              )}
            >
              {day.dayOfMonth}
            </span>
            <DayMarker day={day} />
          </li>
        )
      })}
    </ol>
  )
}
