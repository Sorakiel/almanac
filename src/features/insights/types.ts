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

/** A book the reader is partway through, for the "currently reading" list. */
export interface ReadingProgressItem {
  id: string
  title: string
  author: string | null
  /** Completion 0–100, or null when the book's length is unknown. */
  pct: number | null
}

/** Journaling stats derived from the user's reflections. */
export interface ReflectInsights {
  /** Reflections written in the last 30 days. */
  entries30d: number
  /** Distinct days journaled in the last 30 days. */
  daysJournaled30d: number
  /** Current consecutive-day journaling streak (ending today or yesterday). */
  currentStreak: number
  /** All-time reflection count. */
  totalEntries: number
  /** Average day-rating over rated entries in the last 30 days, or null. */
  avgDayRating30d: number | null
  /** Journaled-day rate over the last 30 days, 0–1. */
  consistency30d: number
  hasData: boolean
}

/** One day's focused minutes, for the Deep Work heatmap. */
export interface FocusDay {
  date: string
  minutes: number
}

/** Deep Work stats derived from finished Flow focus sessions. */
export interface FocusInsights {
  /** Focus sessions logged in the last 30 days. */
  sessions30d: number
  /** Minutes focused in the last 30 days. */
  minutes30d: number
  /** Total hours focused all-time, rounded to one decimal. */
  hoursTotal: number
  /** Consecutive-day focus streak ending today or yesterday. */
  currentStreak: number
  /** Daily focused minutes over the last 53 weeks, oldest→newest (heatmap). */
  heatmap: FocusDay[]
  hasData: boolean
}

/** Reading stats derived from books + logged reading sessions. */
export interface ReadingInsights {
  booksReading: number
  booksFinished: number
  /** Books finished in the current calendar year. */
  finishedThisYear: number
  /** Pages read (pages-mode books) in the last 30 days. */
  pages30d: number
  /** Minutes read in the last 30 days. */
  minutes30d: number
  /** Reading sessions logged in the last 30 days. */
  sessions30d: number
  /** In-progress books, most recently added first. */
  currentlyReading: ReadingProgressItem[]
  hasData: boolean
}
