import { Cascade } from '@/components/common/Cascade'
import { YearStrip } from '@/features/insights/components/YearStrip'
import { useYearActivity } from '@/features/insights/hooks/useYearActivity'
import { useToday } from '@/hooks/useToday'
import { CompletionTrend } from '@/features/insights/components/CompletionTrend'
import { HabitInsightStats } from '@/features/insights/components/HabitInsightStats'
import { RangeToggle } from '@/features/insights/components/RangeToggle'
import { WorkoutInsightsSection } from '@/features/insights/components/WorkoutInsightsSection'
import { ReadingInsightsSection } from '@/features/insights/components/ReadingInsightsSection'
import { ReflectInsightsSection } from '@/features/insights/components/ReflectInsightsSection'
import { FocusInsightsSection } from '@/features/insights/components/FocusInsightsSection'
import { insightRangeLabel } from '@/features/insights/lib/insightRange'
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
              <HabitInsightStats insights={insights} range={range} />
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
