import { HabitRateList } from '@/features/insights/components/HabitRateList'
import { InsightsTicker } from '@/features/insights/components/InsightsTicker'
import type { Insights } from '@/features/insights/types'
import { useT } from '@/hooks/useT'
import { WeekdayReadout } from '@/features/insights/components/WeekdayReadout'

interface InsightsRailProps {
  insights: Insights
  /** Fixed at 30d for the cross-module ticker line, independent of the page's range toggle. */
  tickerInsights: Insights | null
}

/** Desktop Insights context rail: per-habit rates + a weekday read-out. */
export function InsightsRail({ insights, tickerInsights }: InsightsRailProps) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-3.5">
      <InsightsTicker habits={tickerInsights} />

      <p className="label-mono">{t('insights.byHabit')}</p>

      {insights.byHabit.length > 0 ? (
        <HabitRateList habits={insights.byHabit} />
      ) : (
        <p className="text-[13px] text-muted">{t('insights.nothingToCompare')}</p>
      )}

      {insights.bestWeekday !== null ? (
        <WeekdayReadout
          best={insights.bestWeekday}
          worst={insights.worstWeekday}
          className="mt-1 rounded-[16px] p-[18px]"
        />
      ) : null}
    </div>
  )
}
