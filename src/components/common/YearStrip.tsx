import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import type { YearDay } from '@/features/insights/lib/yearActivity'

interface YearStripProps {
  days: YearDay[]
  /** Today's local date key — drawn as the caret the year reads up to. */
  todayKey: string
  className?: string
}

/**
 * The year as one line.
 *
 * An almanac's front matter is a calendar, so this is the app's calendar: one
 * hairline tick per day since 1 January, its ink set by how much of that day's
 * schedule was kept. Rest days stay blank rather than reading as failures, and
 * today carries the terminal caret the rest of the app already blinks.
 *
 * It is a *texture*, not a chart — you are meant to see the shape of the year
 * from across the room and only then look for a particular day. Tapping or
 * hovering a tick names it in the readout underneath.
 */
export function YearStrip({ days, todayKey, className }: YearStripProps) {
  const { t, locale } = useT()
  const [active, setActive] = useState<YearDay | null>(null)

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { month: 'short' }),
    [locale],
  )
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long' }),
    [locale],
  )

  // One label per month, positioned by the share of the year its first day sits
  // at — so the ruler stays true whatever width the strip ends up.
  const months = useMemo(() => {
    const seen = new Set<string>()
    return days.flatMap((day, i) => {
      const month = day.date.slice(0, 7)
      if (seen.has(month)) return []
      seen.add(month)
      return [{ month, label: monthFormatter.format(new Date(`${day.date}T00:00:00Z`)), i }]
    })
  }, [days, monthFormatter])

  if (days.length === 0) return null
  const year = days[0]!.date.slice(0, 4)

  const readout = active
    ? active.due === 0
      ? `${dayFormatter.format(new Date(`${active.date}T00:00:00Z`))} · ${t('habits.legendRest')}`
      : `${dayFormatter.format(new Date(`${active.date}T00:00:00Z`))} · ${active.done}/${active.due}`
    : null

  return (
    <section className={cn('rounded-card border bg-surface px-4 py-3.5', className)}>
      <div className="flex items-baseline justify-between">
        <span className="label-mono">{t('insights.yearStrip')}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-strong">{year}</span>
      </div>

      <div
        className="mt-3 flex h-9 items-end gap-px"
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label={t('insights.yearStripAria', { year })}
      >
        {days.map((day) => {
          const isToday = day.date === todayKey
          // Rest days are a whisper of the hairline; kept days climb from a
          // quarter-height mark to the full band at 100%.
          const height = day.ratio === null ? 0.28 : 0.4 + day.ratio * 0.6
          return (
            <span
              key={day.date}
              onMouseEnter={() => setActive(day)}
              onClick={() => setActive(day)}
              title={day.date}
              className={cn(
                'min-w-0 flex-1 rounded-[1px] transition-colors',
                day.ratio === null
                  ? 'bg-border/25'
                  : day.ratio >= 1
                    ? 'bg-accent'
                    : day.ratio > 0
                      ? 'bg-accent/55'
                      : 'bg-foreground/15',
                isToday && 'bg-accent ring-1 ring-accent/60',
              )}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          )
        })}
      </div>

      {/* Twelve month labels don't fit a phone — every other one is hidden
          below `sm`, which still leaves a readable ruler. */}
      <div className="relative mt-1.5 h-3.5">
        {months.map((m, i) => (
          <span
            key={m.month}
            className={cn(
              'absolute font-mono text-[9px] uppercase tracking-label text-muted-strong',
              i % 2 === 1 && 'hidden sm:inline',
            )}
            style={{ left: `${(m.i / days.length) * 100}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <p className="mt-1 h-4 font-mono text-[11px] normal-case tracking-normal text-foreground">
        {readout ?? ''}
      </p>
    </section>
  )
}
