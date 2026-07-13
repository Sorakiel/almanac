import { describe, expect, it } from 'vitest'
import { computeInsights } from '@/features/insights/lib/computeInsights'
import { lastNDateKeys } from '@/lib/date'
import type { Habit, HabitLog } from '@/features/habits/types'

const WINDOW = lastNDateKeys('2026-07-13', 60)

function dailyHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'Read',
    description: null,
    icon: null,
    color: null,
    frequency: 'daily',
    target_count: 1,
    sort_order: 0,
    archived_at: null,
    time_of_day: 'anytime',
    created_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

function log(habitId: string, date: string, count = 1): HabitLog {
  return {
    id: `${habitId}-${date}`,
    user_id: 'u1',
    habit_id: habitId,
    date,
    count,
    note: null,
    created_at: `${date}T00:00:00Z`,
  }
}

describe('computeInsights', () => {
  it('reports no data for an empty input', () => {
    const out = computeInsights([], [], WINDOW)
    expect(out.hasData).toBe(false)
    expect(out.bestStreak).toBe(0)
    expect(out.completionRate).toBe(0)
    expect(out.activeHabits).toBe(0)
  })

  it('counts a consecutive run as the best streak', () => {
    const logs = ['2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13'].map((d) =>
      log('h1', d),
    )
    const out = computeInsights([dailyHabit()], logs, WINDOW)
    expect(out.bestStreak).toBe(5)
    expect(out.totalDone).toBe(5)
    expect(out.activeHabits).toBe(1)
    expect(out.hasData).toBe(true)
    // Daily habit over 30 days expects 30 completions; 5 done → ~0.167.
    expect(out.completionRate).toBeCloseTo(5 / 30, 4)
    expect(out.byHabit[0]?.id).toBe('h1')
  })

  it('resets the streak across a gap', () => {
    // Done 09,10 — gap on 11 — 12,13: the longest run is 2, not 4.
    const logs = ['2026-07-09', '2026-07-10', '2026-07-12', '2026-07-13'].map((d) => log('h1', d))
    const out = computeInsights([dailyHabit()], logs, WINDOW)
    expect(out.bestStreak).toBe(2)
    expect(out.totalDone).toBe(4)
  })

  it('ignores logs with count below 1', () => {
    const logs = [log('h1', '2026-07-12', 0), log('h1', '2026-07-13', 1)]
    const out = computeInsights([dailyHabit()], logs, WINDOW)
    expect(out.bestStreak).toBe(1)
    expect(out.totalDone).toBe(1)
  })
})
