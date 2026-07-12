import { BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { CompletionTrend } from '@/features/insights/components/CompletionTrend'
import { HabitRateList } from '@/features/insights/components/HabitRateList'
import { InsightStat } from '@/features/insights/components/InsightStat'
import { InsightsWorkspace } from '@/features/insights/components/desktop/InsightsWorkspace'
import { InsightsRail } from '@/features/insights/components/desktop/InsightsRail'
import { useInsights } from '@/features/insights/hooks/useInsights'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function InsightsPage() {
  const { insights, isLoading, isError, refetch } = useInsights()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading insights…</span>
      </div>
    )
  }

  if (isError || !insights) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load insights"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }

  if (!insights.hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No insights yet"
        description="Track habits for a few days and your trends will show up here."
      />
    )
  }

  if (isDesktop) {
    return (
      <>
        <InsightsWorkspace insights={insights} />
        <Rail>
          <InsightsRail insights={insights} />
        </Rail>
      </>
    )
  }

  const completionPct = Math.round(insights.completionRate * 100)

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// last 30 days</p>
        <h1 className="mt-1 text-2xl">Insights</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div>
        <p className="label-mono mb-3">// completion over time</p>
        <CompletionTrend weekly={insights.weekly} height={150} />
      </div>

      {insights.byHabit.length > 0 ? (
        <div>
          <p className="label-mono mb-3">// by habit</p>
          <div className="rounded-card border bg-surface p-4">
            <HabitRateList habits={insights.byHabit} />
          </div>
        </div>
      ) : null}

      {insights.bestWeekday ? (
        <div className="rounded-card border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-4">
          <p className="label-mono text-accent">read-out</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
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
    </section>
  )
}

export default InsightsPage
