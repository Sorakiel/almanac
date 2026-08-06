import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { InsightStat } from '@/features/insights/components/InsightStat'
import type { ReflectInsights } from '@/features/insights/types'
import { useT } from '@/hooks/useT'

interface ReflectInsightsSectionProps {
  data: ReflectInsights
}

/** Journaling stats block: entry/streak/rating KPIs and a 30-day consistency bar. */
export function ReflectInsightsSection({ data }: ReflectInsightsSectionProps) {
  const { t } = useT()
  const consistencyPct = Math.round(data.consistency30d * 100)

  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">// reflect · last 30 days</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightStat label={t('insights.entries30d')} value={String(data.entries30d)} accent />
        <InsightStat
          label={t('insights.streak')}
          value={t('units.daysShort', { count: data.currentStreak })}
        />
        <InsightStat label={t('insights.days30d')} value={String(data.daysJournaled30d)} />
        <InsightStat
          label={t('insights.avgDay')}
          value={data.avgDayRating30d !== null ? data.avgDayRating30d.toFixed(1) : '—'}
        />
      </div>

      <div className="rounded-card border bg-surface p-4">
        <p className="label-mono mb-3">consistency</p>
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-lg text-accent">{consistencyPct}%</span>
          <ProgressBlocks
            value={data.daysJournaled30d}
            total={30}
            blocks={30}
            size="lg"
            className="min-w-0"
            aria-label={t('a11y.daysJournaled', { count: data.daysJournaled30d, total: 30 })}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          {data.daysJournaled30d} of the last 30 days journaled · {data.totalEntries} entries
          all-time.
        </p>
      </div>
    </div>
  )
}
