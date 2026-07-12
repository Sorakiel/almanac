/** Per-habit completion over the window, 0–1. */
export interface HabitRate {
  id: string
  name: string
  color: string | null
  rate: number
}

/** One point on the completion-over-time trend. */
export interface WeekPoint {
  label: string
  rate: number
}

/** Everything the Insights screens render, derived from habits + logs. */
export interface Insights {
  /** Completion over the last 30 days, 0–1. */
  completionRate: number
  /** Percentage-point change vs the previous 30 days (may be negative). */
  completionDelta: number
  /** Longest run of consecutive completed days across all habits. */
  bestStreak: number
  /** Number of active habits. */
  activeHabits: number
  /** Completed habit-days over the last 30 days. */
  totalDone: number
  /** Completion rate per week, oldest→newest. */
  weekly: WeekPoint[]
  /** Per-habit completion over the last 30 days, strongest first. */
  byHabit: HabitRate[]
  /** Strongest / weakest weekday for daily-scheduled habits (null if unknown). */
  bestWeekday: string | null
  worstWeekday: string | null
  /** False when there's nothing to show yet (no habits or no logs). */
  hasData: boolean
}

/** How often an exercise appears across sessions. */
export interface ExerciseFrequency {
  name: string
  sessions: number
}

/** A personal record — the heaviest logged set for an exercise. */
export interface ExercisePR {
  name: string
  weight: number
  reps: number
}

/** Training stats derived from workouts + their logged sets. */
export interface WorkoutInsights {
  totalSessions: number
  completedSessions: number
  /** Sessions completed in the last 30 days (by workout date). */
  completed30d: number
  /** Volume (reps × weight over done sets) in the last 30 days. */
  volume30d: number
  /** Most frequent exercises, most-used first. */
  topExercises: ExerciseFrequency[]
  /** Heaviest set per exercise, strongest first. */
  prs: ExercisePR[]
  hasData: boolean
}
