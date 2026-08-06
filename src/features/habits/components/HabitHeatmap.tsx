import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { DayStatus } from '@/features/habits/lib/schedule'
import { useT, type TFunction } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'

interface HeatmapDay {
  date: string
  done: boolean
  /** Protected by a streak freeze (shown distinctly, doesn't break the run). */
  frozen?: boolean
  /** Schedule classification; drives rest-vs-miss coloring when present. */
  status?: DayStatus
}

interface HabitHeatmapProps {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: HeatmapDay[]
  /** Days before this key predate the habit — rendered as blank void, not rest. */
  createdKey?: string
  /** Desktop: stretch the grid to fill the card width with larger cells. */
  fill?: boolean
}

/**
 * Cell fill, honoring the cadence: a `rest` day (a scheduled gap for an
 * every-N-days / weekdays habit) reads as a calm teal whisper — never as the
 * neutral gray of a genuine `missed` due-day. Days before the habit existed are
 * a barely-there void so a brand-new habit's year isn't a wall of "rest".
 */
function cellClass(day: HeatmapDay, createdKey?: string): string {
  // Faint, but not invisible: at 4% a brand-new habit's card read as an empty
  // rectangle with a legend under it. The grid should look like ruled paper
  // waiting to be filled — that is the point of showing a year at all.
  if (createdKey && day.date < createdKey) return 'bg-foreground/[0.07]'
  if (day.done) return 'bg-accent'
  if (day.frozen) return 'bg-teal/70'
  switch (day.status) {
    case 'rest':
      return 'bg-teal/20'
    case 'due':
      return 'bg-accent/30'
    case 'missed':
      return 'bg-foreground/15'
    default:
      return 'bg-foreground/10'
  }
}

/** A swatch + label pair for the heatmap legend. */
function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-[9px] w-[9px] rounded-[2px]', className)} />
      <span className="label-mono normal-case tracking-normal">{label}</span>
    </span>
  )
}

/** Status label keys for the readout; resolved at render, never at module scope. */
const STATUS_KEY: Record<DayStatus, TranslationKey> = {
  done: 'habits.legendDone',
  frozen: 'habits.legendFrozen',
  due: 'habits.rail.statusToday',
  missed: 'habits.legendMissed',
  rest: 'habits.legendRest',
}

/** Hover/tap label: date plus its status, so a rest day reads as intentional. */
function cellTitle(day: HeatmapDay, t: TFunction): string {
  if (day.done) return `${day.date} · ${t('habits.legendDone')}`
  if (day.frozen) return `${day.date} · ${t('habits.legendFrozen')}`
  return day.status ? `${day.date} · ${t(STATUS_KEY[day.status])}` : day.date
}

// Cap the diagonal wave delay so a full year still finishes filling promptly.
const WAVE_STEP = 7
const WAVE_MAX = 520

/**
 * GitHub-style contribution grid: one column per week, one cell per day. Cells
 * fill in as a diagonal wave from the corner on mount, and hovering/tapping any
 * cell reports its day in a readout line. The full year is wider than a phone,
 * so the grid scrolls horizontally, pinned to the newest week.
 */
export function HabitHeatmap({ days, createdKey, fill = false }: HabitHeatmapProps) {
  const { t } = useT()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<HeatmapDay | null>(null)

  const weeks: HeatmapDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const hasFrozen = days.some((d) => d.frozen && !d.done)

  useLayoutEffect(() => {
    if (fill) return
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length, fill])

  const cell = (day: HeatmapDay, wi: number, di: number, sizeClass: string) => (
    <span
      key={day.date}
      title={cellTitle(day, t)}
      onMouseEnter={() => setActive(day)}
      onFocus={() => setActive(day)}
      onClick={() => setActive(day)}
      className={cn(
        'rounded-[2px] motion-safe:animate-cell-in',
        sizeClass,
        cellClass(day, createdKey),
      )}
      style={{ animationDelay: `${Math.min((wi + di) * WAVE_STEP, WAVE_MAX)}ms` }}
    />
  )

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border bg-surface p-4"
      onMouseLeave={() => setActive(null)}
    >
      {fill ? (
        // Desktop: 53 week-columns stretch to fill the card, taller cells.
        <div className="flex w-full gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-[3px]">
              {week.map((day, di) => cell(day, wi, di, 'h-3 w-full'))}
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="no-scrollbar overflow-x-auto pb-1">
          <div className="flex w-max gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => cell(day, wi, di, 'h-[6px] w-[6px]'))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readout: the focused cell's day, or the legend when nothing's active. */}
      {active ? (
        <p className="label-mono normal-case tracking-normal text-foreground">
          {cellTitle(active, t)}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <LegendKey className="bg-accent" label={t('habits.legendDone')} />
          <LegendKey className="bg-teal/20" label={t('habits.legendRest')} />
          <LegendKey className="bg-foreground/15" label={t('habits.legendMissed')} />
          {hasFrozen ? <LegendKey className="bg-teal/70" label={t('habits.legendFrozen')} /> : null}
        </div>
      )}
    </div>
  )
}
