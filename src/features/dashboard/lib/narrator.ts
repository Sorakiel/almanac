import { STREAK_MILESTONES } from '@/features/habits/lib/milestones'
import type { HabitWithTodayLog } from '@/features/habits/types'
import type { InsightLine } from '@/lib/insight'

function nextMilestone(streak: number): number | undefined {
  return STREAK_MILESTONES.find((m) => m > streak)
}

/**
 * "The Almanac" reading the day: rule-based observations derived purely from the
 * habit data already on screen — no network, no LLM. Returned most-actionable
 * first so the narrator can lead with what matters (an at-risk streak) and rotate
 * through the rest.
 */
export function buildNarratorLines(habits: HabitWithTodayLog[]): InsightLine[] {
  if (habits.length === 0) {
    return [{ id: 'empty', text: 'No habits tracked yet — add the first to begin.', tone: 'info' }]
  }

  const lines: InsightLine[] = []
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = due.filter((h) => h.isComplete).length
  const left = due.length - completed
  const weekRate = Math.round((habits.reduce((s, h) => s + h.rate, 0) / habits.length) * 100)

  // Most urgent: a live streak that today could break.
  const atRisk = habits
    .filter((h) => h.atRisk && h.streak > 0)
    .sort((a, b) => b.streak - a.streak)[0]
  if (atRisk) {
    lines.push({
      id: `risk-${atRisk.id}`,
      text: `${atRisk.streak}-day run on "${atRisk.name}" is at risk — close it today.`,
      tone: 'urgent',
    })
  }

  // Close to a perfect day, or already there.
  if (due.length > 0 && left === 0) {
    lines.push({ id: 'perfect', text: 'Every habit closed today. Momentum kept.', tone: 'good' })
  } else if (completed > 0 && left > 0 && left <= 2) {
    lines.push({
      id: 'almost',
      text: `${left} habit${left > 1 ? 's' : ''} from a perfect day.`,
      tone: 'good',
    })
  }

  // A streak about to cross a milestone.
  const climbing = habits
    .map((h) => ({ h, next: nextMilestone(h.streak) }))
    .filter((x) => x.h.streak > 0 && x.next !== undefined && x.next - x.h.streak <= 3)
    .sort((a, b) => a.next! - a.h.streak - (b.next! - b.h.streak))[0]
  if (climbing) {
    const days = climbing.next! - climbing.h.streak
    lines.push({
      id: `climb-${climbing.h.id}`,
      text: `"${climbing.h.name}" is ${days} day${days > 1 ? 's' : ''} from a ${climbing.next}-day streak.`,
      tone: 'good',
    })
  }

  // Longest active run.
  const topStreak = [...habits].sort((a, b) => b.streak - a.streak)[0]
  if (topStreak && topStreak.streak >= 3) {
    lines.push({
      id: 'top-streak',
      text: `Longest run going: ${topStreak.streak} days on "${topStreak.name}".`,
      tone: 'info',
    })
  }

  // Weekly momentum.
  lines.push({
    id: 'week',
    text: `Consistency this week is running at ${weekRate}%.`,
    tone: weekRate >= 70 ? 'good' : 'info',
  })

  // Strongest and a slipping habit worth a nudge.
  const byRate = [...habits].sort((a, b) => b.rate - a.rate)
  const strongest = byRate[0]
  const weakest = byRate[byRate.length - 1]
  if (strongest && strongest.rate >= 0.6) {
    lines.push({
      id: 'strong',
      text: `Strongest habit: "${strongest.name}" at ${Math.round(strongest.rate * 100)}%.`,
      tone: 'info',
    })
  }
  if (weakest && weakest !== strongest && weakest.rate < 0.4) {
    lines.push({
      id: 'weak',
      text: `"${weakest.name}" is slipping — ${Math.round(weakest.rate * 100)}% lately.`,
      tone: 'info',
    })
  }

  return lines
}
