import { InsightStat } from '@/features/insights/components/InsightStat'
import { FocusHeatmap } from '@/features/insights/components/FocusHeatmap'
import type { FocusInsights } from '@/features/insights/types'

interface FocusInsightsSectionProps {
  data: FocusInsights
}

/** Turn a minute count into a compact "2h 30m" / "45m" label. */
function focusTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Deep Work stats block: focus KPIs and a minutes-shaded focus heatmap. */
export function FocusInsightsSection({ data }: FocusInsightsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">// deep work</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightStat label="focus · 30d" value={focusTimeLabel(data.minutes30d)} accent />
        <InsightStat label="sessions · 30d" value={String(data.sessions30d)} />
        <InsightStat label="streak" value={`${data.currentStreak}d`} />
        <InsightStat label="total" value={`${data.hoursTotal}`} unit="h" />
      </div>

      <div>
        <p className="label-mono mb-3">// focus over the last year</p>
        <FocusHeatmap days={data.heatmap} />
      </div>
    </div>
  )
}
