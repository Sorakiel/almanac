import type { WorkoutView } from '@/features/workouts/types'

export interface WorkoutSummary {
  total: number
  completed: number
  /** Scheduled but not yet completed. */
  planned: number
}

/** Roll up counts for the rail / stat tiles. */
export function summarize(workouts: WorkoutView[]): WorkoutSummary {
  return {
    total: workouts.length,
    completed: workouts.filter((w) => w.status === 'completed').length,
    planned: workouts.filter((w) => w.status === 'scheduled').length,
  }
}

/** Split into the working set (to do) and the finished set (completed). */
export function splitWorkouts(workouts: WorkoutView[]): {
  active: WorkoutView[]
  completed: WorkoutView[]
} {
  return {
    active: workouts.filter((w) => w.status !== 'completed'),
    completed: workouts.filter((w) => w.status === 'completed'),
  }
}
