import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FocusDay } from '@/features/insights/types'

interface FocusHeatmapProps {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: FocusDay[]
  /** Desktop: stretch the grid to fill the card width with larger cells. */
  fill?: boolean
}

/** Colour a cell by how long the day's focus ran — four intensity buckets. */
function intensityClass(minutes: number): string {
  if (minutes <= 0) return 'bg-foreground/10'
  if (minutes < 25) return 'bg-accent/35'
  if (minutes < 60) return 'bg-accent/65'
  return 'bg-accent'
}

// Cap the diagonal wave delay so a full year still finishes filling promptly.
const WAVE_STEP = 7
const WAVE_MAX = 520

/**
 * GitHub-style focus grid: one column per week, one cell per day, shaded by the
 * minutes focused that day. Cells fill in as a diagonal wave on mount and report
 * their day on hover/tap. Like the habit heatmap it scrolls horizontally on
 * mobile and pins to the newest week so recent focus is never clipped.
 */
export function FocusHeatmap({ days, fill = false }: FocusHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<FocusDay | null>(null)

  const weeks: FocusDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  useLayoutEffect(() => {
    if (fill) return
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length, fill])

  const title = (day: FocusDay) => `${day.date} · ${day.minutes} min`

  const cell = (day: FocusDay, wi: number, di: number, sizeClass: string) => (
    <span
      key={day.date}
      title={title(day)}
      onMouseEnter={() => setActive(day)}
      onFocus={() => setActive(day)}
      onClick={() => setActive(day)}
      className={cn(
        'rounded-[2px] motion-safe:animate-cell-in',
        sizeClass,
        intensityClass(day.minutes),
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

      {active ? (
        <p className="label-mono normal-case tracking-normal text-foreground">{title(active)}</p>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="label-mono normal-case tracking-normal">less</span>
          <span className="h-[9px] w-[9px] rounded-[2px] bg-foreground/10" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/35" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/65" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-accent" />
          <span className="label-mono normal-case tracking-normal">more</span>
        </div>
      )}
    </div>
  )
}
