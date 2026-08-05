import type { AchievementStats } from '@/features/achievements/types'

export interface AchievementStatsInput {
  /** All-time habit check-offs (repeats across habits counted separately). */
  totalCompletions: number
  currentStreak: number
  bestStreak: number
  habitsCount: number
  workoutsCompleted: number
  booksFinished: number
  pagesRead: number
  chaptersRead: number
  notesWritten: number
  reflections: number
  betaUser: boolean
  tonnage: number
  focusMinutes: number
  earlyCount: number
  lateCount: number
  friendsCount: number
  /** Calendar days since the account was created. */
  accountDays: number
}

/** Fold raw aggregates into the stats every achievement is scored against. */
export function computeAchievementStats(input: AchievementStatsInput): AchievementStats {
  const activeModules = [
    input.habitsCount > 0,
    input.workoutsCompleted > 0,
    input.booksFinished > 0 || input.pagesRead > 0 || input.chaptersRead > 0,
    input.reflections > 0,
  ].filter(Boolean).length

  return {
    currentStreak: input.currentStreak,
    bestStreak: input.bestStreak,
    totalCompletions: input.totalCompletions,
    workoutsCompleted: input.workoutsCompleted,
    booksFinished: input.booksFinished,
    pagesRead: input.pagesRead,
    chaptersRead: input.chaptersRead,
    notesWritten: input.notesWritten,
    reflections: input.reflections,
    activeModules,
    betaUser: input.betaUser,
    tonnage: input.tonnage,
    focusMinutes: input.focusMinutes,
    earlyCount: input.earlyCount,
    lateCount: input.lateCount,
    friendsCount: input.friendsCount,
    accountDays: input.accountDays,
  }
}
