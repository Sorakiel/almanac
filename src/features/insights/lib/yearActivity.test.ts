import { describe, expect, it } from 'vitest'
import { buildYearActivity } from '@/features/insights/lib/yearActivity'
import type { Habit } from '@/features/habits/types'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    user_id: 'u1',
    name: 'Habit',
    description: null,
    icon: null,
    color: null,
    frequency: 'daily',
    target_count: 1,
    time_of_day: null,
    sort_order: 0,
    archived_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Habit
}

const WEEK = [
  '2026-01-01',
  '2026-01-02',
  '2026-01-03',
  '2026-01-04',
  '2026-01-05',
  '2026-01-06',
  '2026-01-07',
]

describe('buildYearActivity', () => {
  it('scores a day by the share of due habits completed', () => {
    const habits = [habit({ id: 'a' }), habit({ id: 'b' })]
    const completed = new Map([['a', new Set(['2026-01-01'])]])
    const days = buildYearActivity(habits, completed, new Map(), WEEK, '2026-01-07')

    expect(days[0]).toMatchObject({ date: '2026-01-01', done: 1, due: 2, ratio: 0.5 })
  })

  it('leaves a day the schedule never asked for as null, not zero', () => {
    // 2026-01-03 is a Saturday; a weekdays habit is not due then.
    const habits = [habit({ frequency: 'weekdays' })]
    const days = buildYearActivity(habits, new Map(), new Map(), WEEK, '2026-01-07')

    const saturday = days.find((d) => d.date === '2026-01-03')!
    expect(saturday.due).toBe(0)
    expect(saturday.ratio).toBeNull()
  })

  it('does not count days before the habit existed', () => {
    const habits = [habit({ created_at: '2026-01-05T00:00:00Z' })]
    const days = buildYearActivity(habits, new Map(), new Map(), WEEK, '2026-01-07')

    expect(days[0]!.due).toBe(0)
    expect(days[4]!.due).toBe(1)
  })

  it('keeps a frozen day out of the denominator', () => {
    const habits = [habit({ id: 'a' })]
    const frozen = new Map([['a', new Set(['2026-01-02'])]])
    const days = buildYearActivity(habits, new Map(), frozen, WEEK, '2026-01-07')

    expect(days[1]).toMatchObject({ date: '2026-01-02', due: 0, ratio: null })
  })

  it('reads a fully kept day as 1', () => {
    const habits = [habit({ id: 'a' }), habit({ id: 'b' })]
    const completed = new Map([
      ['a', new Set(['2026-01-04'])],
      ['b', new Set(['2026-01-04'])],
    ])
    const days = buildYearActivity(habits, completed, new Map(), WEEK, '2026-01-07')

    expect(days[3]!.ratio).toBe(1)
  })
})
