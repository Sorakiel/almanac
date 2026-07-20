import { HabitRateList } from '@/features/insights/components/HabitRateList'
import { InsightsTicker } from '@/features/insights/components/InsightsTicker'
import type { Insights } from '@/features/insights/types'

interface InsightsRailProps {
  insights: Insights
}

/** Desktop Insights context rail: per-habit rates + a weekday read-out. */
export function InsightsRail({ insights }: InsightsRailProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <InsightsTicker habits={insights} />

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-[17px] text-accent"
        >
          ▧
        </span>
        <div>
          <p className="text-[15px] font-semibold">By habit</p>
          <p className="font-mono text-[10px] text-muted-strong">last 30 days</p>
        </div>
      </div>

      {insights.byHabit.length > 0 ? (
        <HabitRateList habits={insights.byHabit} />
      ) : (
        <p className="text-[13px] text-muted">No habits to compare yet.</p>
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
