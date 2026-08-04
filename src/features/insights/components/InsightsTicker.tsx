import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { useFocusInsights } from '@/features/insights/hooks/useFocusInsights'
import { useReadingInsights } from '@/features/insights/hooks/useReadingInsights'
import { useReflectInsights } from '@/features/insights/hooks/useReflectInsights'
import { useWorkoutInsights } from '@/features/insights/hooks/useWorkoutInsights'
import { buildInsightsLines } from '@/features/insights/lib/insightLines'
import type { Insights } from '@/features/insights/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface InsightsTickerProps {
  habits: Insights | null
}

/**
 * Cross-module readout — one headline per module. Pulls each module's cached
 * insights (React Query dedupes with the page's own calls) and feeds the shared
 * ticker.
 */
export function InsightsTicker({ habits }: InsightsTickerProps): ReactElement | null {
  const { t, locale } = useT()
  const { data: workouts } = useWorkoutInsights()
  const { data: reading } = useReadingInsights()
  const { data: reflect } = useReflectInsights()
  const { data: focus } = useFocusInsights()
  const lines = useMemo(
    () => buildInsightsLines({ habits, workouts, reading, reflect, focus }, t, intlLocale(locale)),
    [habits, workouts, reading, reflect, focus, t, locale],
  )
  return <InsightTicker title={t('insights.tickerTitle')} lines={lines} />
}
