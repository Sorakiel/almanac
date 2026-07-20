import { describe, expect, it } from 'vitest'
import { completionRate, computeDayCells, type DayStatus } from '@/features/habits/lib/schedule'
import type { Habit } from '@/features/habits/types'

function habit(over: Partial<Habit>): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'H',
    description: null,
    icon: null,
    color: null,
    frequency: 'daily',
    target_count: 1,
    time_of_day: 'anytime',
    sort_order: 0,
    archived_at: null,
    created_at: '2026-07-01T00:00:00Z',
    ...over,
  } as Habit
}

function statuses(cells: { status: DayStatus }[]): DayStatus[] {
  return cells.map((c) => c.status)
}

describe('computeDayCells — every 3 days', () => {
  const h = habit({ frequency: 'every_n_days', target_count: 3 })
  // 16..20 Jul; created 18th, done 18th, today 20th.
  const window = ['2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20']
  const cells = computeDayCells(
    h,
    new Set(['2026-07-18']),
    new Set(),
    window,
    '2026-07-20',
    '2026-07-18',
  )

  it('marks days between marks and before creation as rest, not missed', () => {
    // 16,17 before creation → rest; 18 done; 19,20 within interval → rest.
    expect(statuses(cells)).toEqual(['rest', 'rest', 'done', 'rest', 'rest'])
  })

  it('marks an overdue past due-day as missed and an open due today', () => {
    // Done on 10th, interval 3 → next due 13th. 13th missed, 16th (today) due.
    const w = ['2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13', '2026-07-16']
    const c = computeDayCells(
      habit({ frequency: 'every_n_days', target_count: 3 }),
      new Set(['2026-07-10']),
      new Set(),
      w,
      '2026-07-16',
      '2026-07-01',
    )
    expect(statuses(c)).toEqual(['done', 'rest', 'rest', 'missed', 'due'])
  })
})

describe('computeDayCells — weekdays + flexible', () => {
  it('rests on weekends, misses undone weekdays', () => {
    // 2026-07-17 Fri, 18 Sat, 19 Sun, 20 Mon. today = Mon 20, none done.
    const w = ['2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20']
    const c = computeDayCells(
      habit({ frequency: 'weekdays' }),
      new Set(),
      new Set(),
      w,
      '2026-07-20',
      '2026-07-01',
    )
    expect(statuses(c)).toEqual(['missed', 'rest', 'rest', 'due'])
  })

  it('never marks a flexible weekly habit day as missed', () => {
    const w = ['2026-07-18', '2026-07-19', '2026-07-20']
    const c = computeDayCells(
      habit({ frequency: 'weekly' }),
      new Set(['2026-07-19']),
      new Set(),
      w,
      '2026-07-20',
      '2026-07-01',
    )
    expect(statuses(c)).toEqual(['rest', 'done', 'rest'])
  })
})

describe('completionRate — counted from creation', () => {
  it('is 100% for a new interval habit done on its one due day', () => {
    const w = ['2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20']
    const rate = completionRate(
      habit({ frequency: 'every_n_days', target_count: 3 }),
      new Set(['2026-07-18']),
      w,
      '2026-07-18',
    )
    // Elapsed since creation = 18,19,20 → expected 1, done 1 → 100%.
    expect(rate).toBe(100)
  })

  it('ignores pre-creation days for a daily habit', () => {
    const w = ['2026-07-18', '2026-07-19', '2026-07-20']
    const rate = completionRate(
      habit({ frequency: 'daily' }),
      new Set(['2026-07-20']),
      w,
      '2026-07-20',
    )
    // Only today existed → expected 1, done 1 → 100%.
    expect(rate).toBe(100)
  })
})
