import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { useReflectInsights } from '@/features/insights/hooks/useReflectInsights'
import { buildReflectLines } from '@/features/reflect/lib/insightLines'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'

interface ReflectTickerProps {
  reflections: Reflection[]
  /** The user's local date key, for the last-entry gap. */
  dateKey: string
}

/** Journaling readout — the shared ticker fed by the reflect line generator. */
export function ReflectTicker({ reflections, dateKey }: ReflectTickerProps): ReactElement | null {
  const { t } = useT()
  const { data } = useReflectInsights()
  const lines = useMemo(
    () => buildReflectLines(reflections, data, dateKey, t),
    [reflections, data, dateKey, t],
  )
  return <InsightTicker title={t('reflect.tickerTitle')} lines={lines} />
}
