import { HabitRateList } from '@/features/insights/components/HabitRateList'
import { InsightsTicker } from '@/features/insights/components/InsightsTicker'
import type { Insights } from '@/features/insights/types'
import { useT } from '@/hooks/useT'

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

      <p className="label-mono">// by habit</p>

      {insights.byHabit.length > 0 ? (
        <HabitRateList habits={insights.byHabit} />
      ) : (
        <p className="text-[13px] text-muted">{t('insights.nothingToCompare')}</p>
      )}

      {insights.bestWeekday ? (
        <div className="mt-1 rounded-[16px] border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-[18px]">
          <p className="font-mono text-[10px] uppercase tracking-label text-accent">read-out</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            You&rsquo;re most consistent on{' '}
            <span className="font-medium text-accent">{insights.bestWeekday}</span>
            {insights.worstWeekday ? (
              <>
                {' '}
                — <span className="text-foreground">{insights.worstWeekday}</span> is your weak
                point.
              </>
            ) : (
              '.'
            )}
          </p>
        </div>
      ) : null}
    </div>
  )
}
