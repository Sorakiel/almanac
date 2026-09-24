import { describe, expect, it } from 'vitest'
import { nudgeHabit, planToday } from '@/features/dashboard/lib/todayGroups'
import type { HabitWithTodayLog } from '@/features/habits/types'

function habit(id: string, overrides: Partial<HabitWithTodayLog> = {}): HabitWithTodayLog {
  return {
    id,
    user_id: 'u1',
    name: id,
    description: null,
    icon: null,
    color: null,
    frequency: 'daily',
    target_count: 1,
    sort_order: 0,
    archived_at: null,
    time_of_day: 'anytime',
    created_at: '2026-05-01T00:00:00Z',
    todayCount: 0,
    isComplete: false,
    week: [],
    completedRecent: 0,
    windowDays: 7,
    rate: 0,
    dueInDays: 0,
    streak: 0,
    atRisk: false,
    frozenToday: false,
    dueToday: true,
    ...overrides,
  }
}

describe('planToday', () => {
  it('groups open habits by time of day, in day order, dropping empty groups', () => {
    const plan = planToday([
      habit('read', { time_of_day: 'evening' }),
      habit('water', { time_of_day: 'morning' }),
      habit('walk', { time_of_day: 'evening' }),
    ])
    expect(plan.groups.map((g) => g.slot)).toEqual(['morning', 'evening'])
    expect(plan.groups[1]!.habits.map((h) => h.id)).toEqual(['read', 'walk'])
  })

  it('puts weekly budgets under the week whatever their hour', () => {
    const plan = planToday([
      habit('clean', { frequency: 'weekly', time_of_day: 'morning' }),
      habit('gym', { frequency: 'x_per_week', target_count: 3 }),
    ])
    expect(plan.groups).toEqual([{ slot: 'week', habits: expect.any(Array) }])
    expect(plan.groups[0]!.habits).toHaveLength(2)
  })

  it('moves done habits out, and leaves resting ones out of everything', () => {
    const plan = planToday([
      habit('done', { isComplete: true }),
      habit('rest', { dueToday: false }),
      habit('open'),
    ])
    expect(plan.done.map((h) => h.id)).toEqual(['done'])
    expect(plan.groups.flatMap((g) => g.habits).map((h) => h.id)).toEqual(['open'])
    expect(plan.dueCount).toBe(2)
  })

  it('keeps a just-ticked habit in its group until it has settled', () => {
    const plan = planToday([habit('water', { isComplete: true })], new Set(['water']))
    expect(plan.done).toEqual([])
    expect(plan.groups[0]!.habits[0]!.id).toBe('water')
  })
})

describe('nudgeHabit', () => {
  it('picks the longest streak at risk', () => {
    const pick = nudgeHabit([
      habit('a', { atRisk: true, streak: 3 }),
      habit('b', { atRisk: true, streak: 9 }),
      habit('c', { streak: 40 }),
    ])
    expect(pick?.id).toBe('b')
  })

  it('says nothing when no streak is at risk', () => {
    expect(nudgeHabit([habit('a', { streak: 0 })])).toBeNull()
  })
})
