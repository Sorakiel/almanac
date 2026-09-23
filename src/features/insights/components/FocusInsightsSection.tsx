import { InsightStat } from '@/features/insights/components/InsightStat'
import { FocusHeatmap } from '@/features/insights/components/FocusHeatmap'
import type { FocusInsights } from '@/features/insights/types'
import { useT, type TFunction } from '@/hooks/useT'

interface FocusInsightsSectionProps {
  data: FocusInsights
}

/** Turn a minute count into a compact "2h 30m" / "45m" label. */
function focusTimeLabel(minutes: number, t: TFunction): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return t('units.mOnly', { m })
  if (m === 0) return t('units.hOnly', { h })
  return t('units.hm', { h, m })
}

/** Deep Work stats block: focus KPIs and a minutes-shaded focus heatmap. */
export function FocusInsightsSection({ data }: FocusInsightsSectionProps) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">{t('insights.sectionFocus')}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightStat
          label={t('insights.focus30d')}
          value={focusTimeLabel(data.minutes30d, t)}
          accent
        />
        <InsightStat label={t('insights.sessions30d')} value={String(data.sessions30d)} />
        <InsightStat
          label={t('insights.streak')}
          value={t('units.daysShort', { count: data.currentStreak })}
        />
        <InsightStat
          label={t('insights.total')}
          value={String(data.hoursTotal)}
          unit={t('units.h')}
        />
      </div>

      <div>
        <p className="label-mono mb-3">{t('insights.focusYear')}</p>
        <FocusHeatmap days={data.heatmap} />
      </div>
    </div>
  )
}
