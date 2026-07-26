import { describe, expect, it } from 'vitest'
import { buildWeek } from '@/features/workouts/lib/week'
import type { Workout, WorkoutView } from '@/features/workouts/types'

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
    const { days } = buildWeek(today, [], tz)
    expect(days).toHaveLength(7)
    expect(days[0]).toMatchObject({ weekday: 'MON', dateKey: '2026-07-06', dayOfMonth: 6 })
    expect(days[6]).toMatchObject({ weekday: 'SUN', dateKey: '2026-07-12', dayOfMonth: 12 })
  })

  it('marks today', () => {
    const { days } = buildWeek(today, [], tz)
    expect(days.filter((d) => d.isToday).map((d) => d.dateKey)).toEqual(['2026-07-08'])
  })

  it('labels the month and ISO week', () => {
    expect(buildWeek(today, [], tz).label).toBe('JUL · WEEK 28')
  })

  it('counts due and done workouts per day', () => {
    const oneOff = makeWorkout({ scheduled_date: '2026-07-08' })
    const done = makeWorkout({
      id: 'w2',
      scheduled_date: '2026-07-06',
      completed_at: '2026-07-06T12:00:00Z',
    })
    const { days } = buildWeek(today, [oneOff, done], tz)
    const wed = days.find((d) => d.dateKey === '2026-07-08')
    const mon = days.find((d) => d.dateKey === '2026-07-06')
    expect(wed).toMatchObject({ dueCount: 1, doneCount: 0 })
    expect(mon).toMatchObject({ dueCount: 1, doneCount: 1 })
  })
})
