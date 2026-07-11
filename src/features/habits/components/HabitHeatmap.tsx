import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface HabitHeatmapProps {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: { date: string; done: boolean }[]
  /** Desktop: stretch the grid to fill the card width with larger cells. */
  fill?: boolean
}

/**
 * GitHub-style contribution grid: one column per week, one cell per day.
 * The full year is wider than a phone screen, so the grid scrolls
 * horizontally and starts pinned to the newest week — recent activity must
 * never be clipped out of view.
 */
export function HabitHeatmap({ days, fill = false }: HabitHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const weeks: { date: string; done: boolean }[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  useLayoutEffect(() => {
    if (fill) return
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [days.length, fill])

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-surface p-4">
      {fill ? (
        // Desktop: 53 week-columns stretch to fill the card, taller cells.
        <div className="flex w-full gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-[3px]">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={day.date}
                  className={cn('h-3 w-full rounded-[2px]', day.done ? 'bg-accent' : 'bg-foreground/10')}
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
                    title={day.date}
                    className={cn(
                      'h-[6px] w-[6px] rounded-[2px]',
                      day.done ? 'bg-accent' : 'bg-foreground/10',
                    )}
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
