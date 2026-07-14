import { CATALOG } from '@/features/achievements/lib/catalog'
import type { AchievementDef, AchievementStats, EvaluatedAchievement } from '@/features/achievements/types'

/** Resolve one definition against the stats: current tier, next goal, progress. */
export function evaluate(def: AchievementDef, stats: AchievementStats): EvaluatedAchievement {
  const value = def.metric(stats)

  let tierIndex = -1
  for (let i = 0; i < def.tiers.length; i += 1) {
    if (value >= def.tiers[i]!.goal) tierIndex = i
  }

  const current = tierIndex >= 0 ? def.tiers[tierIndex]! : null
  const next = def.tiers[tierIndex + 1] ?? null

  let progress = 1
  let nextGoal: number | null = null
  if (next) {
    const floor = current?.goal ?? 0
    progress = Math.min(1, Math.max(0, (value - floor) / (next.goal - floor)))
    nextGoal = next.goal
  }

  return {
    def,
    value,
    tierIndex,
    unlocked: tierIndex >= 0,
    displayTitle: current?.title ?? def.title,
    nextGoal,
    progress,
  }
}

/** Evaluate the whole catalog, unlocked (highest tier first) before locked. */
export function evaluateAll(stats: AchievementStats): EvaluatedAchievement[] {
  return CATALOG.map((def) => evaluate(def, stats)).sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return b.tierIndex - a.tierIndex
  })
}

export function unlockedCount(list: EvaluatedAchievement[]): number {
  return list.filter((a) => a.unlocked).length
}

/** Total tier levels earned across all achievements. */
export function levelsEarned(list: EvaluatedAchievement[]): number {
  return list.reduce((sum, a) => sum + (a.tierIndex + 1), 0)
}
