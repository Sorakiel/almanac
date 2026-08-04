import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

interface TodayProgressProps {
  habits: HabitWithTodayLog[]
}

/**
 * "TODAY x / y done" summary card for the habits list — a block progress bar
 * over the habits actually due today (resting interval habits don't count).
 */
export function TodayProgress({ habits }: TodayProgressProps) {
  const { t } = useT()
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const done = due.filter((h) => h.isComplete).length
  const total = due.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex flex-col gap-3 rounded-card border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="label-mono">{t('habits.today')}</span>
        <span className="font-mono text-base tabular-nums">
          {done} / {total} <span className="text-muted">{t('dashboard.done')}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBlocks
          value={done}
          total={total}
          blocks={14}
          size="lg"
          animated
          className="min-w-0 shrink"
          aria-label={t('habits.doneTodayAria', { done, total })}
        />
        <span className="ml-auto flex-none font-mono text-lg font-semibold tabular-nums text-accent">
          {pct}%
        </span>
      </div>
    </div>
  )
}
