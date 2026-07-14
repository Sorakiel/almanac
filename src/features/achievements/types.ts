import type { LucideIcon } from 'lucide-react'

export type AchievementTone = 'accent' | 'teal' | 'amber'

export interface AchievementTier {
  /** Metric threshold to unlock this tier. */
  goal: number
  /** Short tier label — a roman numeral, or ★ for one-offs. */
  label: string
  /** Name shown when this is the current tier (falls back to the base title). */
  title?: string
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tone: AchievementTone
  /** Unit noun for progress copy, e.g. "days", "books". */
  unit?: string
  /** Current value of the tracked metric for a set of stats. */
  metric: (stats: AchievementStats) => number
  /** Ascending thresholds; a single tier makes a one-off badge. */
  tiers: AchievementTier[]
}

/** Aggregates every achievement is derived from — computed once, purely. */
export interface AchievementStats {
  currentStreak: number
  bestStreak: number
  totalCompletions: number
  workoutsCompleted: number
  booksFinished: number
  pagesRead: number
  reflections: number
  /** Distinct life areas the user is active in (habits/workouts/reading/reflect). */
  activeModules: number
  /** Joined during the beta window. */
  betaUser: boolean
}

export interface EvaluatedAchievement {
  def: AchievementDef
  value: number
  /** Highest unlocked tier index, or -1 when locked. */
  tierIndex: number
  unlocked: boolean
  /** Title for the current tier (or the base title). */
  displayTitle: string
  /** Goal of the next tier, or null when maxed out. */
  nextGoal: number | null
  /** Progress 0–1 toward the next tier (1 when maxed). */
  progress: number
}
