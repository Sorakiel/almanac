/** Streak lengths worth celebrating. Kept here so the flame tiers and the
 *  milestone watcher agree on the same thresholds. */
export const STREAK_MILESTONES = [7, 15, 30, 100] as const

export interface FlameTier {
  /** 0 = pre-milestone (muted), 1–4 climb through the thresholds. */
  level: number
  /** Text-color class for the flame. */
  colorClass: string
  /** Add a glowing halo (higher tiers). */
  glow: boolean
}

/** Visual tier for a streak's flame — hotter and glowier as milestones pass. */
export function flameTier(streak: number): FlameTier {
  if (streak >= 100) return { level: 4, colorClass: 'text-accent', glow: true }
  if (streak >= 30) return { level: 3, colorClass: 'text-accent', glow: true }
  if (streak >= 15) return { level: 2, colorClass: 'text-accent', glow: false }
  if (streak >= 7) return { level: 1, colorClass: 'text-accent', glow: false }
  return { level: 0, colorClass: 'text-muted-strong', glow: false }
}

/** Milestones newly reached going from `prev` to `curr` (empty if none). */
export function crossedMilestones(prev: number, curr: number): number[] {
  return STREAK_MILESTONES.filter((m) => prev < m && curr >= m)
}
