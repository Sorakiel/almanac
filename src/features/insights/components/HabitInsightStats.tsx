import { InsightStat } from '@/features/insights/components/InsightStat'
import { insightRangeSuffix } from '@/features/insights/lib/insightRange'
import type { InsightRange, Insights } from '@/features/insights/types'
import { useT } from '@/hooks/useT'

interface HabitInsightStatsProps {
  insights: Insights
  range: InsightRange
}

/** The four headline habit numbers; the caller lays them out. */
export function HabitInsightStats({ insights, range }: HabitInsightStatsProps) {
  const { t } = useT()
  return (
    <>
      <InsightStat
        label={t('insights.completion')}
        value={String(Math.round(insights.completionRate * 100))}
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
    </>
  )
}
