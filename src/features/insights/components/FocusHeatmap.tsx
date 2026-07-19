import { useLayoutEffect, useRef } from 'react'
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

/**
 * GitHub-style focus grid: one column per week, one cell per day, shaded by the
 * minutes focused that day. Like the habit heatmap it scrolls horizontally on
 * mobile and pins to the newest week so recent focus is never clipped.
 */
export function FocusHeatmap({ days, fill = false }: FocusHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const weeks: FocusDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  useLayoutEffect(() => {
    if (fill) return
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length, fill])

  const title = (day: FocusDay) => `${day.date} · ${day.minutes} min`

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-surface p-4">
      {fill ? (
        <div className="flex w-full gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-[3px]">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={title(day)}
                  className={cn('h-3 w-full rounded-[2px]', intensityClass(day.minutes))}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="no-scrollbar overflow-x-auto pb-1">
          <div className="flex w-max gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day) => (
                  <span
                    key={day.date}
                    title={title(day)}
                    className={cn('h-[6px] w-[6px] rounded-[2px]', intensityClass(day.minutes))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className="label-mono normal-case tracking-normal">less</span>
        <span className="h-[9px] w-[9px] rounded-[2px] bg-foreground/10" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/35" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/65" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent" />
        <span className="label-mono normal-case tracking-normal">more</span>
      </div>
    </div>
  )
}
