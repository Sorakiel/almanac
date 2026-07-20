import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { useWorkoutInsights } from '@/features/insights/hooks/useWorkoutInsights'
import { buildWorkoutLines } from '@/features/workouts/lib/insightLines'
import { useToday } from '@/hooks/useToday'
import type { WorkoutView } from '@/features/workouts/types'

interface WorkoutTickerProps {
  workouts: WorkoutView[]
}

/** Training readout — the shared ticker fed by the workouts line generator. */
export function WorkoutTicker({ workouts }: WorkoutTickerProps): ReactElement | null {
  const { data } = useWorkoutInsights()
  const { dateKey } = useToday()
  const lines = useMemo(() => buildWorkoutLines(workouts, data, dateKey), [workouts, data, dateKey])
  return <InsightTicker title="the log // reading your training" lines={lines} />
}
