import { useState } from 'react'
import { HabitHeatmap } from '@/features/habits/components/HabitHeatmap'
import { monthGrid, type MonthDay } from '@/features/habits/lib/monthGrid'
import type { HabitDetailStats } from '@/features/habits/hooks/useHabitDetail'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

type View = 'month' | 'year'

/** 2026-09-07 is a Monday: seven days from it name the grid's columns. */
const A_MONDAY = '2026-09-07'

const DAY_CLASS: Record<MonthDay['state'], string> = {
  done: 'bg-accent/85 text-on-accent-solid',
  frozen: 'bg-teal/30 text-foreground',
  open: 'text-muted',
  future: 'text-muted opacity-35',
  void: 'text-muted opacity-35',
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface HabitCalendarCardProps {
  stats: HabitDetailStats
}

/** The prototype's .p-cal: this month by default, the year heatmap one tap away. */
export function HabitCalendarCard({ stats }: HabitCalendarCardProps) {
  const { t, locale } = useT()
  const [view, setView] = useState<View>('month')
  const intl = intlLocale(locale)
  const month = capitalize(
    new Intl.DateTimeFormat(intl, { month: 'long', timeZone: 'UTC' }).format(
      dateFromKey(stats.todayKey),
    ),
  )
  const weekday = new Intl.DateTimeFormat(intl, { weekday: 'short', timeZone: 'UTC' })
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    capitalize(weekday.format(new Date(dateFromKey(A_MONDAY).getTime() + i * 86_400_000))),
  )
  const { leading, days } = monthGrid(stats.todayKey, stats.heatmap, stats.createdKey)

  return (
    <div className="rounded-[22px] bg-surface p-3.5">
      <div className="mx-1 mb-2.5 flex items-center justify-between text-body font-semibold">
        <h2 className="text-body">{view === 'month' ? month : t('habits.detail.lastYear')}</h2>
        <div
          role="radiogroup"
          aria-label={t('habits.detail.calendarView')}
          className="flex rounded-inner bg-foreground/[0.08] p-0.5"
        >
          {(['month', 'year'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-lg px-3 py-[5px] text-footnote font-medium',
                view === v && 'bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
              )}
            >
              {t(v === 'month' ? 'habits.detail.month' : 'habits.detail.year')}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdays.map((name) => (
            <span key={name} className="pb-0.5 text-caption font-medium text-muted-strong">
              {name}
            </span>
          ))}
          {Array.from({ length: leading }, (_, i) => (
            <span key={`pad-${i}`} aria-hidden="true" />
          ))}
          {days.map((d) => (
            <span
              key={d.date}
              aria-current={d.today ? 'date' : undefined}
              className={cn(
                'num grid aspect-square place-items-center rounded-full text-footnote font-medium',
                DAY_CLASS[d.state],
                d.today && 'text-foreground outline outline-2 -outline-offset-2 outline-accent',
              )}
            >
              {d.day}
            </span>
          ))}
        </div>
      ) : (
        <HabitHeatmap days={stats.heatmap} createdKey={stats.createdKey} />
      )}
    </div>
  )
}
