import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { useWorkoutInsights } from '@/features/insights/hooks/useWorkoutInsights'
import { buildWorkoutLines } from '@/features/workouts/lib/insightLines'
import { useToday } from '@/hooks/useToday'
import type { WorkoutView } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface WorkoutTickerProps {
  workouts: WorkoutView[]
}

/** Training readout — the shared ticker fed by the workouts line generator. */
export function WorkoutTicker({ workouts }: WorkoutTickerProps): ReactElement | null {
  const { t, locale } = useT()
  const { data } = useWorkoutInsights()
  const { dateKey } = useToday()
  const lines = useMemo(
    () => buildWorkoutLines(workouts, data, dateKey, t, intlLocale(locale)),
    [workouts, data, dateKey, t, locale],
  )
  return <InsightTicker title={t('workouts.tickerTitle')} lines={lines} />
}
