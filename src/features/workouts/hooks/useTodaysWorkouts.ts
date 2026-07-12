import { useMemo } from 'react'
import { useToday } from '@/hooks/useToday'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { isDoneOn, isDueOn } from '@/features/workouts/lib/recurrence'
import type { WorkoutView } from '@/features/workouts/types'

export interface DueWorkout {
  workout: WorkoutView
  /** Completed on the current local day (recurring workouts reset daily). */
  doneToday: boolean
}

/** Workouts scheduled for today (one-off or recurring), with a per-day done flag. */
export function useTodaysWorkouts(): { due: DueWorkout[] } {
  const { workouts } = useWorkouts()
  const { dateKey, timezone } = useToday()

  const due = useMemo(
    () =>
      workouts
        .filter((w) => isDueOn(w, dateKey))
        .map((w) => ({ workout: w, doneToday: isDoneOn(w, dateKey, timezone) })),
    [workouts, dateKey, timezone],
  )

  return { due }
}
