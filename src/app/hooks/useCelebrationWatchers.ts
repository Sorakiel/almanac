import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { crossedMilestones } from '@/features/habits/lib/milestones'
import { useToday } from '@/hooks/useToday'
import { celebrate } from '@/lib/celebration'
import type { EvaluatedAchievement } from '@/features/achievements/types'
import { useT } from '@/hooks/useT'
import { achievementTitle } from '@/features/achievements/lib/text'
import { useBadgesStore } from '@/stores/badges'

const PERFECT_KEY = 'almanac:perfect-day' // last celebrated calendar date
const SEEN_ACH_KEY = 'almanac:seen-achievements' // JSON array of unlocked signatures
/** Long enough to read a badge name and reach for the action. */
const BADGE_TOAST_MS = 5000

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
  const { t } = useT()
  const { dateKey } = useToday()
  const { achievements } = useAchievements()
  const navigate = useNavigate()
  const markUnseen = useBadgesStore((s) => s.markUnseen)

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
      title: t('celebrate.perfectDayTitle'),
      message: t('celebrate.perfectDayMessage'),
    })
  }, [doneCount, dueCount, dateKey, t])

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
        title: t('celebrate.milestoneTitle', { count: milestone }),
        message: t('celebrate.milestoneMessage', { count: milestone, name: h.name }),
      })
    }
  }, [habits, t])

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
    // A quiet toast and a dot on the profile, not a modal: an unlock usually
    // lands the moment the user ticks a habit, and a scene in front of the
    // list interrupts exactly the five-second loop the app is built around.
    markUnseen()
    toast.info(t('badges.new', { name: achievementTitle(t, top.def, top.displayTitle) }), {
      duration: BADGE_TOAST_MS,
      action: { label: t('badges.view'), onClick: () => navigate('/achievements') },
    })
    localStorage.setItem(SEEN_ACH_KEY, JSON.stringify([...seen, ...unlocked.map(achSignature)]))
  }, [achievements, t, navigate, markUnseen])
}
