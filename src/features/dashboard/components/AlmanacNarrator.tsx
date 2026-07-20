import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { buildNarratorLines } from '@/features/dashboard/lib/narrator'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface AlmanacNarratorProps {
  habits: HabitWithTodayLog[]
}

/**
 * "The Almanac" narrator — a thin wrapper over the shared InsightTicker that
 * reads the day from the habit data already on screen (no network). Purely
 * derived; see lib/narrator for the rule-based line generator.
 */
export function AlmanacNarrator({ habits }: AlmanacNarratorProps): ReactElement | null {
  const lines = useMemo(() => buildNarratorLines(habits), [habits])
  return <InsightTicker title="the almanac // reading your day" lines={lines} />
}
