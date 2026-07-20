/** Streak lengths worth broadcasting to the feed. */
const MILESTONES = new Set([3, 7, 14, 30, 50, 75, 100, 150, 200, 250, 365])

/** Whether a streak length is a shareable milestone (listed, or every 100 days). */
export function isStreakMilestone(days: number): boolean {
  return MILESTONES.has(days) || (days > 0 && days % 100 === 0)
}
