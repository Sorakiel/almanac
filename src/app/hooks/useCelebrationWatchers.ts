import { useEffect, useRef } from 'react'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { crossedMilestones } from '@/features/habits/lib/milestones'
import { useToday } from '@/hooks/useToday'
import { celebrate } from '@/lib/celebration'
import type { EvaluatedAchievement } from '@/features/achievements/types'

const PERFECT_KEY = 'almanac:perfect-day' // last celebrated calendar date
const SEEN_ACH_KEY = 'almanac:seen-achievements' // JSON array of unlocked signatures

const achSignature = (a: EvaluatedAchievement): string => `${a.def.id}:${a.tierIndex}`

/**
 * Watches live data and fires celebrations on the transitions worth marking:
 * a perfect day (all habits closed), a streak crossing a milestone, and an
 * achievement (or tier) unlocking. Each is deduped so it fires once, never on
 * reload — perfect-day per calendar date, unlocks by a persisted seen-set.
 * Mounted once in the app shell.
 */
export function useCelebrationWatchers(): void {
  const { habits } = useHabits()
  const { dateKey } = useToday()
  const { achievements } = useAchievements()

  // ── Perfect day ──────────────────────────────────────────────────────────
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const dueCount = due.length
  const doneCount = due.filter((h) => h.isComplete).length
  useEffect(() => {
    if (dueCount === 0 || doneCount < dueCount) return
    if (localStorage.getItem(PERFECT_KEY) === dateKey) return
    localStorage.setItem(PERFECT_KEY, dateKey)
    celebrate({
      kind: 'perfect-day',
      title: 'Perfect day',
      message: 'Every habit closed today. Momentum kept.',
    })
  }, [doneCount, dueCount, dateKey])

  // ── Streak milestones ────────────────────────────────────────────────────
  const prevStreaks = useRef<Map<string, number> | null>(null)
  useEffect(() => {
    const prev = prevStreaks.current
    prevStreaks.current = new Map(habits.map((h) => [h.id, h.streak]))
    if (!prev) return // first pass just seeds the baseline
    for (const h of habits) {
      const before = prev.get(h.id)
      if (before === undefined) continue
      const hit = crossedMilestones(before, h.streak)
      if (hit.length === 0) continue
      const milestone = hit[hit.length - 1]!
      celebrate({
        kind: 'milestone',
        title: `${milestone}-day streak`,
        message: `${h.name} reached ${milestone} days.`,
      })
    }
  }, [habits])

  // ── Achievement unlocks ──────────────────────────────────────────────────
  useEffect(() => {
    if (achievements.length === 0) return
    const unlocked = achievements.filter((a) => a.unlocked)
    const raw = localStorage.getItem(SEEN_ACH_KEY)
    if (raw === null) {
      // First run on this device: adopt the current unlocks silently so we only
      // ever celebrate genuinely new ones from here on.
      localStorage.setItem(SEEN_ACH_KEY, JSON.stringify(unlocked.map(achSignature)))
      return
    }
    const seen = new Set<string>(JSON.parse(raw) as string[])
    const fresh = unlocked.filter((a) => !seen.has(achSignature(a)))
    if (fresh.length === 0) return
    const top = fresh[0]!
    celebrate({
      kind: 'achievement',
      title: top.displayTitle,
      message: top.def.description,
      icon: top.def.icon,
      modal: true,
    })
    localStorage.setItem(SEEN_ACH_KEY, JSON.stringify([...seen, ...unlocked.map(achSignature)]))
  }, [achievements])
}
