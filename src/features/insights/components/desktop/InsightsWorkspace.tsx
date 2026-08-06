import { Cascade } from '@/components/common/Cascade'
import { YearStrip } from '@/components/common/YearStrip'
import { useYearActivity } from '@/features/insights/hooks/useYearActivity'
import { useToday } from '@/hooks/useToday'
import { CompletionTrend } from '@/features/insights/components/CompletionTrend'
import { InsightStat } from '@/features/insights/components/InsightStat'
import { RangeToggle } from '@/features/insights/components/RangeToggle'
import { WorkoutInsightsSection } from '@/features/insights/components/WorkoutInsightsSection'
import { ReadingInsightsSection } from '@/features/insights/components/ReadingInsightsSection'
import { ReflectInsightsSection } from '@/features/insights/components/ReflectInsightsSection'
import { FocusInsightsSection } from '@/features/insights/components/FocusInsightsSection'
import { insightRangeLabel, insightRangeSuffix } from '@/features/insights/lib/insightRange'
import { useT } from '@/hooks/useT'
import type {
  FocusInsights,
  Insights,
  InsightRange,
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
  range: InsightRange
  onRangeChange: (range: InsightRange) => void
}

/** Desktop "Insights" workspace — habit KPIs + trend, then training, reading, reflect, focus. */
export function InsightsWorkspace({
  insights,
  workoutInsights,
  readingInsights,
  reflectInsights,
  focusInsights,
  range,
  onRangeChange,
}: InsightsWorkspaceProps) {
  const { t } = useT()
  const { days: yearDays } = useYearActivity()
  const { dateKey } = useToday()
  const completionPct = Math.round(insights.completionRate * 100)

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// {insightRangeLabel(range, t)}</p>
          <h1 className="mt-1.5 text-[44px] leading-none tracking-title">{t('insights.title')}</h1>
          <p className="mt-2 text-[15px] text-muted">{t('insights.subtitle')}</p>
        </div>
        <RangeToggle value={range} onChange={onRangeChange} />
      </header>

      <Cascade>
        <div className="mt-7">
          <YearStrip days={yearDays} todayKey={dateKey} />
        </div>

        {insights.hasData ? (
          <>
            <section className="mt-4 flex gap-3.5">
              <InsightStat
                label={t('insights.completion')}
                value={String(completionPct)}
                unit="%"
                delta={insights.completionDelta}
                deltaSuffix={t('insights.vsPrev')}
              />
              <InsightStat
                label={t('insights.bestStreak')}
                value={t('units.daysShort', { count: insights.bestStreak })}
                accent
              />
              <InsightStat label={t('insights.active')} value={String(insights.activeHabits)} />
              <InsightStat
                label={`${t('insights.doneLower')} · ${insightRangeSuffix(range, t)}`}
                value={String(insights.totalDone)}
              />
            </section>

            <p className="label-mono mb-3 mt-8">{t('insights.completionOverTime')}</p>
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
