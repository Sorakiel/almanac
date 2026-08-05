import { Flame } from 'lucide-react'
import { CompletionDonut } from '@/features/dashboard/components/CompletionDonut'
import { useT } from '@/hooks/useT'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface TodaySummaryProps {
  habits: HabitWithTodayLog[]
}

/**
 * Dashboard hero card: today's completion as a giant radial gauge (the donut's
 * "big" size threshold) over an ambient canvas tint whose intensity tracks
 * progress — a still-life version of `CompletionDonut`'s own 100% "perfect
 * day" halo, generalized to every percentage instead of just the peak one.
 * Only habits actually due today count (resting interval habits don't),
 * matching the block-bar summary on the Habits page.
 */
export function TodaySummary({ habits }: TodaySummaryProps) {
  const { t } = useT()
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const done = due.filter((h) => h.isComplete).length
  const total = due.length
  if (total === 0) return null
  const remaining = total - done
  const atRisk = due.filter((h) => h.atRisk).length
  const pct = Math.round((done / total) * 100)

  return (
    <div className="relative overflow-hidden rounded-card border bg-surface p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 18% 15%, rgb(var(--color-accent) / ${(0.05 + (pct / 100) * 0.22).toFixed(3)}) 0%, transparent 72%)`,
        }}
      />
      <div className="relative flex items-center gap-4">
        <CompletionDonut completed={done} total={total} size={148} />
        <div className="min-w-0 flex-1">
          <p className="label-mono">// {t('dashboard.today')}</p>
          <p className="mt-1 font-mono text-lg tabular-nums">
            <span className="text-foreground">{done}</span>
            <span className="text-muted">
              {' '}
              / {total} {t('dashboard.done')}
            </span>
          </p>
          <div className="mt-2 flex flex-col gap-1 font-mono text-[11px] uppercase tracking-label text-muted">
            <span>
              <span className="text-accent">▓</span> {t('dashboard.doneLabel')} ·{' '}
              <span className="tabular-nums text-foreground">{done}</span>
            </span>
            <span>
              <span className="text-muted-strong/50">░</span> {t('dashboard.leftLabel')} ·{' '}
              <span className="tabular-nums text-foreground">{remaining}</span>
            </span>
          </div>
        </div>
      </div>
      {atRisk > 0 ? (
        <p className="relative mt-3 flex items-center gap-1.5 border-t border-border pt-3 font-mono text-[11px] uppercase tracking-label text-accent">
          <Flame className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          {t('dashboard.streaksAtRisk', { count: atRisk })}
        </p>
      ) : null}
    </div>
  )
}
