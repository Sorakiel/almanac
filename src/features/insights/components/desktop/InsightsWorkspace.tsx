import { CompletionTrend } from '@/features/insights/components/CompletionTrend'
import { InsightStat } from '@/features/insights/components/InsightStat'
import type { Insights } from '@/features/insights/types'

interface InsightsWorkspaceProps {
  insights: Insights
}

/** Desktop "Insights" workspace — KPI tiles + completion trend, centre column. */
export function InsightsWorkspace({ insights }: InsightsWorkspaceProps) {
  const completionPct = Math.round(insights.completionRate * 100)

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// last 30 days</p>
          <h1 className="mt-1.5 text-[44px] leading-none tracking-title">Insights</h1>
          <p className="mt-2 text-[15px] text-muted">
            Where your habits are strong — and where the week slips.
          </p>
        </div>
        <div className="rounded-[11px] border px-3.5 py-2 font-mono text-[11px] text-muted">
          30D
        </div>
      </header>

      <section className="mt-7 flex gap-3.5">
        <InsightStat
          label="completion"
          value={String(completionPct)}
          unit="%"
          delta={insights.completionDelta}
          deltaSuffix="% vs prev"
        />
        <InsightStat label="best streak" value={`${insights.bestStreak}d`} accent />
        <InsightStat label="active" value={String(insights.activeHabits)} />
        <InsightStat label="done · 30d" value={String(insights.totalDone)} />
      </section>

      <p className="label-mono mt-8 mb-3">// completion over time</p>
      <CompletionTrend weekly={insights.weekly} />
    </div>
  )
}
