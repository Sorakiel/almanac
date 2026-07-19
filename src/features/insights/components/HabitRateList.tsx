import { ProgressBlocks } from '@/components/common/ProgressBlocks'
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
          <div key={habit.id} className="flex flex-col gap-1.5">
            <span className="truncate text-[13px]">{habit.name}</span>
            <div className="flex items-center gap-2.5">
              <ProgressBlocks
                value={pct}
                total={100}
                blocks={18}
                color={color.stroke}
                animated
                aria-label={`${habit.name} completion`}
              />
              <span
                className="flex-none font-mono text-[13px] tabular-nums"
                style={{ color: color.stroke }}
              >
                {pct}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
