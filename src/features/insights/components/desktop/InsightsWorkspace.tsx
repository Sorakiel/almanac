import { Cascade } from '@/components/common/Cascade'
import { CompletionTrend } from '@/features/insights/components/CompletionTrend'
import { InsightStat } from '@/features/insights/components/InsightStat'
import { WorkoutInsightsSection } from '@/features/insights/components/WorkoutInsightsSection'
import { ReadingInsightsSection } from '@/features/insights/components/ReadingInsightsSection'
import { ReflectInsightsSection } from '@/features/insights/components/ReflectInsightsSection'
import { FocusInsightsSection } from '@/features/insights/components/FocusInsightsSection'
import type {
  FocusInsights,
  Insights,
  ReadingInsights,
  ReflectInsights,
  WorkoutInsights,
} from '@/features/insights/types'

interface InsightsWorkspaceProps {
  insights: Insights
  workoutInsights: WorkoutInsights | null
  readingInsights: ReadingInsights | null
  reflectInsights: ReflectInsights | null
  focusInsights: FocusInsights | null
}

/** Desktop "Insights" workspace — habit KPIs + trend, then training, reading, reflect, focus. */
export function InsightsWorkspace({
  insights,
  workoutInsights,
  readingInsights,
  reflectInsights,
  focusInsights,
}: InsightsWorkspaceProps) {
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

      <Cascade>
        {insights.hasData ? (
          <>
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

            <p className="label-mono mb-3 mt-8">// completion over time</p>
            <CompletionTrend weekly={insights.weekly} />
          </>
        ) : null}

        {workoutInsights?.hasData ? (
          <div className="mt-9">
            <WorkoutInsightsSection data={workoutInsights} />
          </div>
        ) : null}

        {readingInsights?.hasData ? (
          <div className="mt-9">
            <ReadingInsightsSection data={readingInsights} />
          </div>
        ) : null}

        {reflectInsights?.hasData ? (
          <div className="mt-9">
            <ReflectInsightsSection data={reflectInsights} />
          </div>
        ) : null}

        {focusInsights?.hasData ? (
          <div className="mt-9">
            <FocusInsightsSection data={focusInsights} />
          </div>
        ) : null}
      </Cascade>
    </div>
  )
}
