import { cn } from '@/lib/utils'

interface HabitHeatmapProps {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: { date: string; done: boolean }[]
}

/** GitHub-style contribution grid: one column per week, one cell per day. */
export function HabitHeatmap({ days }: HabitHeatmapProps) {
  const weeks: { date: string; done: boolean }[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px] overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.date}
                title={day.date}
                className={cn('h-[9px] w-[9px] rounded-[2px]', day.done ? 'bg-accent' : 'bg-border/10')}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="label-mono normal-case tracking-normal">less</span>
        <span className="h-[9px] w-[9px] rounded-[2px] bg-border/10" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/40" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent/70" />
        <span className="h-[9px] w-[9px] rounded-[2px] bg-accent" />
        <span className="label-mono normal-case tracking-normal">more</span>
      </div>
    </div>
  )
}
