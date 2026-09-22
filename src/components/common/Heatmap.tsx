import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeatmapProps<T extends { date: string }> {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: T[]
  /** Background class for a day's cell. */
  cellClass: (day: T) => string
  /** Hover/tap readout for a day. */
  cellTitle: (day: T) => string
  /** Shown under the grid while no cell is active. */
  legend: ReactNode
  /** Desktop: stretch the grid to fill the card width with larger cells. */
  fill?: boolean
}

// Cap the diagonal wave delay so a full year still finishes filling promptly.
const WAVE_STEP = 7
const WAVE_MAX = 520

/**
 * GitHub-style grid: one column per week, one cell per day. Cells fill in as a
 * diagonal wave from the corner on mount, and hovering/tapping any cell reports
 * its day in a readout line. The full year is wider than a phone, so the grid
 * scrolls horizontally, pinned to the newest week.
 */
export function Heatmap<T extends { date: string }>({
  days,
  cellClass,
  cellTitle,
  legend,
  fill = false,
}: HeatmapProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<T | null>(null)

  const weeks: T[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  useLayoutEffect(() => {
    if (fill) return
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length, fill])

  const cell = (day: T, wi: number, di: number, sizeClass: string) => (
    <span
      key={day.date}
      title={cellTitle(day)}
      onMouseEnter={() => setActive(day)}
      onFocus={() => setActive(day)}
      onClick={() => setActive(day)}
      className={cn('rounded-[2px] motion-safe:animate-cell-in', sizeClass, cellClass(day))}
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

      {active ? (
        <p className="label-mono normal-case tracking-normal text-foreground">
          {cellTitle(active)}
        </p>
      ) : (
        legend
      )}
    </div>
  )
}

/** A legend swatch, sized to match the grid's cells. */
export function HeatmapSwatch({ className }: { className: string }) {
  return <span className={cn('h-[9px] w-[9px] rounded-[2px]', className)} />
}
