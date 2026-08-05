import { describe, expect, it } from 'vitest'
import { computeAchievementStats } from '@/features/achievements/lib/stats'
import { evaluate } from '@/features/achievements/lib/evaluate'
import { CATALOG } from '@/features/achievements/lib/catalog'
import type { AchievementDef, AchievementStats } from '@/features/achievements/types'
import { Flame } from 'lucide-react'

describe('computeAchievementStats', () => {
  // Streaks and the all-time total now arrive folded from `achievement_stats`
  // (see migration 0026); what is left to fold here is the module tally.
  it('passes through totals and derives active modules', () => {
    const stats = computeAchievementStats({
      totalCompletions: 3,
      currentStreak: 2,
      bestStreak: 2,
      habitsCount: 2,
      workoutsCompleted: 4,
      booksFinished: 1,
      pagesRead: 300,
      chaptersRead: 0,
      notesWritten: 4,
      reflections: 0,
      betaUser: true,
      tonnage: 1250,
      focusMinutes: 90,
      earlyCount: 2,
      lateCount: 1,
      friendsCount: 3,
      accountDays: 45,
    })
    expect(stats.totalCompletions).toBe(3)
    expect(stats.bestStreak).toBe(2)
    expect(stats.activeModules).toBe(3) // habits, workouts, reading (not reflect)
    expect(stats.betaUser).toBe(true)
    expect(stats.tonnage).toBe(1250)
    expect(stats.focusMinutes).toBe(90)
    expect(stats.earlyCount).toBe(2)
    expect(stats.lateCount).toBe(1)
    expect(stats.friendsCount).toBe(3)
    expect(stats.accountDays).toBe(45)
  })

  it('counts reading as active from pages alone', () => {
    const stats = computeAchievementStats({
      totalCompletions: 0,
      currentStreak: 0,
      bestStreak: 0,
      habitsCount: 0,
      workoutsCompleted: 0,
      booksFinished: 0,
      pagesRead: 42,
      chaptersRead: 0,
      notesWritten: 0,
      reflections: 1,
      betaUser: false,
      tonnage: 0,
      focusMinutes: 0,
      earlyCount: 0,
      lateCount: 0,
      friendsCount: 0,
      accountDays: 0,
    })
    expect(stats.activeModules).toBe(2)
  })

  it('counts reading as active from chapters alone', () => {
    const stats = computeAchievementStats({
      totalCompletions: 0,
      currentStreak: 0,
      bestStreak: 0,
      habitsCount: 0,
      workoutsCompleted: 0,
      booksFinished: 0,
      pagesRead: 0,
      chaptersRead: 6,
      notesWritten: 0,
      reflections: 1,
      betaUser: false,
      tonnage: 0,
      focusMinutes: 0,
      earlyCount: 0,
      lateCount: 0,
      friendsCount: 0,
      accountDays: 0,
    })
    expect(stats.activeModules).toBe(2)
  })
})

const STREAK_DEF: AchievementDef = {
  id: 'streak',
  title: 'Streak',
  description: '',
  icon: Flame,
  tone: 'accent',
  metric: (s) => s.bestStreak,
  tiers: [
    { goal: 3, label: 'I' },
    { goal: 7, label: 'II' },
    { goal: 21, label: 'III' },
  ],
}

const baseStats: AchievementStats = {
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,
  workoutsCompleted: 0,
  booksFinished: 0,
  pagesRead: 0,
  chaptersRead: 0,
  notesWritten: 0,
  reflections: 0,
  activeModules: 0,
  betaUser: false,
  tonnage: 0,
  focusMinutes: 0,
  earlyCount: 0,
  lateCount: 0,
  friendsCount: 0,
  accountDays: 0,
}

const NONE = new Set<string>()

describe('evaluate', () => {
  it('is locked below the first tier, with progress toward it', () => {
    const out = evaluate(STREAK_DEF, { ...baseStats, bestStreak: 2 }, NONE)
    expect(out.unlocked).toBe(false)
    expect(out.tierIndex).toBe(-1)
    expect(out.nextGoal).toBe(3)
    expect(out.progress).toBeCloseTo(2 / 3, 3)
  })

  it('picks the highest unlocked tier and scales progress from its floor', () => {
    const out = evaluate(STREAK_DEF, { ...baseStats, bestStreak: 10 }, NONE)
    expect(out.tierIndex).toBe(1) // 7 unlocked, 21 next
    expect(out.nextGoal).toBe(21)
    expect(out.progress).toBeCloseTo((10 - 7) / (21 - 7), 3)
  })

  it('maxes out at the top tier', () => {
    const out = evaluate(STREAK_DEF, { ...baseStats, bestStreak: 40 }, NONE)
    expect(out.tierIndex).toBe(2)
    expect(out.nextGoal).toBeNull()
    expect(out.progress).toBe(1)
  })

  it('unlocks a manual badge only when granted', () => {
    const manual: AchievementDef = {
      id: 'founder',
      title: 'Founder',
      description: '',
      icon: Flame,
      tone: 'amber',
      manual: true,
      metric: () => 0,
      tiers: [{ goal: 1, label: '★', title: 'Founder' }],
    }
    expect(evaluate(manual, baseStats, NONE).unlocked).toBe(false)
    expect(evaluate(manual, baseStats, new Set(['founder'])).unlocked).toBe(true)
  })
})

describe('catalog metrics', () => {
  const defOf = (id: string): AchievementDef => {
    const def = CATALOG.find((d) => d.id === id)
    if (!def) throw new Error(`missing catalog entry: ${id}`)
    return def
  }

  it('rounds down focus minutes to whole hours', () => {
    const metric = defOf('focus').metric
    expect(metric({ ...baseStats, focusMinutes: 119 })).toBe(1)
    expect(metric({ ...baseStats, focusMinutes: 120 })).toBe(2)
  })

  it('rounds tonnage to a whole number', () => {
    const metric = defOf('tonnage').metric
    expect(metric({ ...baseStats, tonnage: 1234.6 })).toBe(1235)
  })
})
