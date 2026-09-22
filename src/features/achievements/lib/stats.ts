import type { AchievementStats } from '@/features/achievements/types'

export type AchievementStatsInput = Omit<AchievementStats, 'activeModules'> & {
  habitsCount: number
}

/** Fold raw aggregates into the stats every achievement is scored against. */
export function computeAchievementStats({
  habitsCount,
  ...stats
}: AchievementStatsInput): AchievementStats {
  const activeModules = [
    habitsCount > 0,
    stats.workoutsCompleted > 0,
    stats.booksFinished > 0 || stats.pagesRead > 0 || stats.chaptersRead > 0,
    stats.reflections > 0,
  ].filter(Boolean).length

  return { ...stats, activeModules }
}
