import { describe, expect, it } from 'vitest'
import { buildWeek, daysUntilNext } from '@/features/workouts/lib/week'
import type { Workout, WorkoutView } from '@/features/workouts/types'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'

const t: TFunction = (key, vars) => translate('en', key, vars)

function makeWorkout(overrides: Partial<Workout> = {}): WorkoutView {
  const base: Workout = {
    id: 'w1',
    user_id: 'u1',
    name: 'Session',
    created_at: '2026-07-01T00:00:00Z',
    completed_at: null,
    scheduled_date: null,
    recurrence: 'none',
    recurrence_days: null,
    recurrence_interval: null,
    ...overrides,
  }
  return { ...base, status: base.completed_at ? 'completed' : 'scheduled' }
}

describe('buildWeek', () => {
  // 2026-07-08 is a Wednesday.
  const today = '2026-07-08'
  const tz = 'UTC'

  it('anchors the strip on Monday and spans 7 days', () => {
    const { days } = buildWeek(today, [], tz, t)
    expect(days).toHaveLength(7)
    expect(days[0]).toMatchObject({ weekday: 'Mon', dateKey: '2026-07-06', dayOfMonth: 6 })
    expect(days[6]).toMatchObject({ weekday: 'Sun', dateKey: '2026-07-12', dayOfMonth: 12 })
  })

  it('marks today', () => {
    const { days } = buildWeek(today, [], tz, t)
    expect(days.filter((d) => d.isToday).map((d) => d.dateKey)).toEqual(['2026-07-08'])
  })

  it('numbers the ISO week', () => {
    expect(buildWeek(today, [], tz, t).weekNumber).toBe(28)
  })

  it('counts due and done workouts per day', () => {
    const oneOff = makeWorkout({ scheduled_date: '2026-07-08' })
    const done = makeWorkout({
      id: 'w2',
      scheduled_date: '2026-07-06',
      completed_at: '2026-07-06T12:00:00Z',
    })
    const { days } = buildWeek(today, [oneOff, done], tz, t)
    const wed = days.find((d) => d.dateKey === '2026-07-08')
    const mon = days.find((d) => d.dateKey === '2026-07-06')
    expect(wed).toMatchObject({ dueCount: 1, doneCount: 0 })
    expect(mon).toMatchObject({ dueCount: 1, doneCount: 1 })
  })
})

describe('daysUntilNext', () => {
  const today = '2026-07-08' // Wednesday
  const tz = 'UTC'

  it('is 0 when due today and not yet done', () => {
    expect(daysUntilNext(makeWorkout({ recurrence: 'daily' }), today, tz)).toBe(0)
  })

  it('skips today once it is done', () => {
    const w = makeWorkout({ recurrence: 'daily', completed_at: '2026-07-08T09:00:00Z' })
    expect(daysUntilNext(w, today, tz)).toBe(1)
  })

  it('finds the next weekday', () => {
    // 5 = Friday
    expect(
      daysUntilNext(makeWorkout({ recurrence: 'weekdays', recurrence_days: [5] }), today, tz),
    ).toBe(2)
  })

  it('is null for a past one-off', () => {
    expect(daysUntilNext(makeWorkout({ scheduled_date: '2026-07-01' }), today, tz)).toBeNull()
  })
})
