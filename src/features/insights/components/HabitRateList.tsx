import { resolveHabitColor } from '@/features/habits/lib/habitVisuals'
import type { HabitRate } from '@/features/insights/types'

interface HabitRateListProps {
  habits: HabitRate[]
}

/** Per-habit completion bars (name · % · colored track), strongest first. */
export function HabitRateList({ habits }: HabitRateListProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {habits.map((habit) => {
        const color = resolveHabitColor(habit.color)
        const pct = Math.round(habit.rate * 100)
        return (
          <div key={habit.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate">{habit.name}</span>
              <span className="flex-none font-mono tabular-nums" style={{ color: color.stroke }}>
                {pct}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-border/15"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${habit.name} completion`}
            >
              <div className={`h-full rounded-full ${color.solid}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
