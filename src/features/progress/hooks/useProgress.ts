import { useQuery } from '@tanstack/react-query'
import { fetchFocusInsightsData } from '@/features/progress/api/focusInsights.api'
import { fetchReadingInsightsData } from '@/features/progress/api/readingInsights.api'
import { fetchReflectInsightsData } from '@/features/progress/api/reflectInsights.api'
import { fetchWorkoutInsightsData } from '@/features/progress/api/workoutInsights.api'
import { useInsights } from '@/features/progress/hooks/useInsights'
import { computeFocusInsights } from '@/features/progress/lib/computeFocusInsights'
import {
  focusPeriod,
  periodStart,
  readingPeriod,
  reflectPeriod,
  workoutPeriod,
  type FocusPeriod,
  type ReadingPeriod,
  type ReflectPeriod,
  type WorkoutPeriod,
} from '@/features/progress/lib/period'
import type { FocusDay, InsightRange, Insights } from '@/features/progress/types'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useModulesStore } from '@/stores/modules'

export interface ProgressData {
  habits: Insights | null
  /** Null when the module is switched off; zeros when it's on but empty. */
  workouts: WorkoutPeriod | null
  reading: ReadingPeriod | null
  focus: (FocusPeriod & { heatmap: FocusDay[] }) | null
  reflect: ReflectPeriod | null
}

interface UseProgressResult {
  data: ProgressData
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Everything the Progress screen shows for one period. Each module's rows are
 * fetched once under the same `['insights', <module>, userId, dateKey]` keys
 * the writers already invalidate, and re-scored per period on the client —
 * switching Неделя → Месяц → Всё never refetches.
 */
export function useProgress(range: InsightRange): UseProgressResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = useModulesStore((s) => s.enabled)
  const start = periodStart(dateKey, range)

  const habits = useInsights(range)
  const on = (flag: boolean): boolean => Boolean(userId) && flag

  const workoutsQ = useQuery({
    queryKey: ['insights', 'workouts', userId, dateKey],
    queryFn: () => fetchWorkoutInsightsData(userId),
    enabled: on(enabled.workouts),
  })
  const readingQ = useQuery({
    queryKey: ['insights', 'reading', userId, dateKey],
    queryFn: () => fetchReadingInsightsData(userId),
    enabled: on(enabled.reading),
  })
  const focusQ = useQuery({
    queryKey: ['insights', 'focus', userId, dateKey],
    queryFn: () => fetchFocusInsightsData(userId),
    enabled: on(enabled.flow),
  })
  const reflectQ = useQuery({
    queryKey: ['insights', 'reflect', userId, dateKey],
    queryFn: () => fetchReflectInsightsData(userId),
    enabled: on(enabled.reflect),
  })

  // Gate on the flag as well: a disabled query keeps its last cached data,
  // which would keep a switched-off module's card on screen.
  const data: ProgressData = {
    habits: habits.insights,
    workouts: enabled.workouts && workoutsQ.data ? workoutPeriod(workoutsQ.data, start) : null,
    reading:
      enabled.reading && readingQ.data ? readingPeriod(readingQ.data, start, dateKey, range) : null,
    focus:
      enabled.flow && focusQ.data
        ? {
            ...focusPeriod(focusQ.data, start),
            heatmap: computeFocusInsights(focusQ.data, dateKey).heatmap,
          }
        : null,
    reflect: enabled.reflect && reflectQ.data ? reflectPeriod(reflectQ.data, start) : null,
  }

  const queries = [workoutsQ, readingQ, focusQ, reflectQ]
  return {
    data,
    isLoading: habits.isLoading || queries.some((q) => q.isLoading),
    isError: habits.isError || queries.some((q) => q.isError),
    refetch: () => {
      habits.refetch()
      for (const q of queries) void q.refetch()
    },
  }
}
