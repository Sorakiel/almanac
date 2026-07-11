import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface TodayProgressProps {
  habits: HabitWithTodayLog[]
}

/**
 * "TODAY x / y done" summary card for the habits list — a block progress bar
 * over the habits actually due today (resting interval habits don't count).
 */
export function TodayProgress({ habits }: TodayProgressProps) {
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const done = due.filter((h) => h.isComplete).length
  const total = due.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex flex-col gap-3 rounded-card border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="label-mono">Today</span>
        <span className="font-mono text-base tabular-nums">
          {done} / {total} <span className="text-muted">done</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBlocks
          value={done}
          total={total}
          blocks={20}
          size="lg"
          animated
          aria-label={`${done} of ${total} habits done today`}
        />
        <span className="ml-auto font-mono text-lg font-semibold tabular-nums text-accent">{pct}%</span>
      </div>
    </div>
  )
}
