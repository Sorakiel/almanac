import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import { groupYearByWeek, type YearDay, type YearWeek } from '@/features/insights/lib/yearActivity'

interface YearStripProps {
  days: YearDay[]
  /** Today's local date key — its week carries the caret. */
  todayKey: string
  className?: string
}

/** Stagger between bars on entrance; the whole ruler lands in about half a second. */
const STAGGER_MS = 8

/** Fill tint by how much of the week was kept. */
function fillClass(ratio: number): string {
  if (ratio >= 1) return 'bg-accent'
  if (ratio >= 0.66) return 'bg-accent/70'
  if (ratio > 0) return 'bg-accent/40'
  return 'bg-foreground/20'
}

/**
 * The year as one ruler of weeks.
 *
 * An almanac's front matter is a calendar, so this is the app's calendar: one
 * column per week of the calendar year, filled from the bottom by how much of
 * that week's schedule was kept. Weeks that asked for nothing get a dot rather
 * than reading as failures, weeks still ahead are empty slots, and the current
 * week carries the caret. Hover, tap, or focus + arrow keys names a week in the
 * readout; at rest the readout sums up the year so far.
 */
export function YearStrip({ days, todayKey, className }: YearStripProps) {
  const { t, locale } = useT()
  const weeks = useMemo(() => groupYearByWeek(days, todayKey), [days, todayKey])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const readoutId = useId()
  const hintId = useId()

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', timeZone: 'UTC' }),
    [locale],
  )
  const rangeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale(locale), {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    [locale],
  )

  // One label per month, pinned to the column of the week its 1st falls in.
  const months = useMemo(
    () =>
      weeks.flatMap((week, i) => {
        const first = monthStartWithin(week)
        return first ? [{ key: first, label: monthFormatter.format(dateFromKey(first)), i }] : []
      }),
    [weeks, monthFormatter],
  )

  if (weeks.length === 0) return null
  const year = weeks[0]!.start.slice(0, 4)
  const todayIndex = weeks.findIndex((w) => w.containsToday)

  const totals = weeks.reduce(
    (acc, w) => ({
      done: acc.done + w.done,
      due: acc.due + w.due,
      perfect: acc.perfect + (w.ratio !== null && w.ratio >= 1 && !w.containsToday ? 1 : 0),
    }),
    { done: 0, due: 0, perfect: 0 },
  )

  const describe = (week: YearWeek): string => {
    const range = rangeFormatter.formatRange(dateFromKey(week.start), dateFromKey(week.end))
    if (week.future) return t('insights.yearWeekAhead', { range })
    if (week.ratio === null) return t('insights.yearWeekRest', { range })
    return t('insights.yearWeek', {
      range,
      done: week.done,
      due: week.due,
      pct: Math.round(week.ratio * 100),
    })
  }

  const active = activeIndex === null ? null : weeks[activeIndex]
  const readout = active
    ? describe(active)
    : totals.due === 0
      ? t('insights.yearNothingYet')
      : t('insights.yearSummary', {
          pct: Math.round((totals.done / totals.due) * 100),
          count: totals.perfect,
        })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = weeks.length - 1
    const from = activeIndex ?? Math.max(todayIndex, 0)
    const next =
      event.key === 'ArrowLeft'
        ? Math.max(0, from - 1)
        : event.key === 'ArrowRight'
          ? Math.min(last, from + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    setActiveIndex(next)
  }

  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }

  return (
    <section className={cn('rounded-card border bg-surface px-4 py-3.5', className)}>
      <div className="flex items-baseline justify-between">
        <span className="label-mono">{t('insights.yearStrip')}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-strong">{year}</span>
      </div>

      <div
        className="mt-3 grid h-12 items-end gap-[2px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:gap-[3px]"
        style={columns}
        role="group"
        tabIndex={0}
        aria-label={t('insights.yearStripAria', { year })}
        aria-describedby={`${readoutId} ${hintId}`}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setActiveIndex(null)}
        onBlur={() => setActiveIndex(null)}
      >
        {weeks.map((week, i) => {
          const isActive = i === activeIndex
          return (
            <span
              key={week.start}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'relative flex h-full min-w-0 items-end justify-center rounded-[2px] transition-colors',
                isActive && 'bg-foreground/[0.06]',
              )}
            >
              {/* No full-height track: an empty week must not read as a full one. */}
              {week.future ? (
                <span className="h-[3px] w-full rounded-[1px] bg-muted-strong/20" />
              ) : week.ratio === null ? (
                <span className="h-[3px] w-[3px] rounded-full bg-muted-strong/60" />
              ) : (
                <span
                  className={cn(
                    'w-full origin-bottom rounded-[2px] motion-safe:animate-cell-in',
                    fillClass(week.ratio),
                  )}
                  style={{
                    height: `${Math.max(8, Math.round(week.ratio * 100))}%`,
                    animationDelay: `${i * STAGGER_MS}ms`,
                  }}
                />
              )}
            </span>
          )
        })}
      </div>

      {/* The current week's caret sits on its own row so it never covers the fill. */}
      <div className="mt-1 grid h-1.5 gap-[2px] sm:gap-[3px]" style={columns} aria-hidden="true">
        {todayIndex >= 0 ? (
          <span
            className="h-1.5 rounded-full bg-accent"
            style={{ gridColumnStart: todayIndex + 1 }}
          />
        ) : null}
      </div>

      {/* Twelve labels don't fit a phone — every other one is hidden below `sm`. */}
      <div className="relative mt-1 h-3.5" aria-hidden="true">
        {months.map((m, i) => (
          <span
            key={m.key}
            className={cn(
              'absolute whitespace-nowrap font-mono text-[9px] uppercase tracking-label text-muted-strong',
              i % 2 === 1 && 'hidden sm:inline',
            )}
            style={{ left: `${(m.i / weeks.length) * 100}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <p
        id={readoutId}
        aria-live="polite"
        className="mt-2 min-h-4 font-mono text-[11px] normal-case tracking-normal text-foreground"
      >
        {readout}
      </p>
      <p id={hintId} className="sr-only">
        {t('insights.yearStripHint')}
      </p>
    </section>
  )
}

/** The 1st of a month when it falls inside the week (at most one can). */
function monthStartWithin(week: YearWeek): string | null {
  const first = `${week.end.slice(0, 7)}-01`
  return first >= week.start ? first : null
}
