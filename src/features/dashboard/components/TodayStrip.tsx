import { Flame } from 'lucide-react'
import { CountUp } from '@/components/common/CountUp'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useT } from '@/hooks/useT'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface TodayStripProps {
  habits: HabitWithTodayLog[]
}

/**
 * Mobile "today" summary — the same numbers the desktop donut shows, in ~70px
 * instead of ~350px.
 *
 * The donut earns its space on desktop, where the rail has room to spare. On a
 * phone it pushed the habit list — the one thing the app is opened to do —
 * below the fold, which is the opposite of what a one-tap tracker should do.
 * The block bar is the same signature motif, just laid on its side.
 *
 * Only habits actually due today count; resting interval habits don't, which
 * matches every other completion figure in the app.
 */
export function TodayStrip({ habits }: TodayStripProps) {
  const { t } = useT()
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const total = due.length
  if (total === 0) return null

  const done = due.filter((h) => h.isComplete).length
  const pct = Math.round((done / total) * 100)
  const atRisk = due.filter((h) => h.atRisk).length

  return (
    <section className="relative overflow-hidden rounded-card border bg-surface px-4 py-3.5">
      {/* Ambient tint that scales with progress — the still-life version of the
          donut's perfect-day halo, kept so both layouts read as one family. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 90% 0%, rgb(var(--color-accent) / ${(
            0.04 +
            (pct / 100) * 0.2
          ).toFixed(3)}) 0%, transparent 70%)`,
        }}
      />
      <div className="relative flex items-baseline justify-between">
        <span className="label-mono">// {t('dashboard.today')}</span>
        <span className="font-mono text-[13px] tabular-nums">
          <span className="text-foreground">{done}</span>
          <span className="text-muted"> / {total}</span>
        </span>
      </div>
      <div className="relative mt-2 flex items-center gap-3">
        <ProgressBlocks
          value={done}
          total={total}
          blocks={16}
          size="lg"
          animated
          className="min-w-0 flex-1"
          aria-label={t('dashboard.percentOfTodayDone', { pct })}
        />
        <span className="font-mono text-xl font-semibold tabular-nums">
          <CountUp value={pct} />%
        </span>
      </div>
      {atRisk > 0 ? (
        <p className="relative mt-2.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-label text-accent">
          <Flame className="h-3 w-3 motion-safe:animate-pulse" aria-hidden="true" />
          {t('dashboard.streaksAtRisk', { count: atRisk })}
        </p>
      ) : null}
    </section>
  )
}
