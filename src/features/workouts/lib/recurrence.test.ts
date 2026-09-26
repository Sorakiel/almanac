import { describe, expect, it } from 'vitest'
import {
  isCompletedOn,
  isDoneOn,
  isDueOn,
  isRecurring,
  recurrenceLabel,
} from '@/features/workouts/lib/recurrence'
import type { Workout } from '@/features/workouts/types'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'

const t: TFunction = (key, vars) => translate('en', key, vars)

/** Build a Workout row with sensible defaults, overriding only what a test needs. */
function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
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
}

describe('isDueOn', () => {
  it('a one-off is due only on its scheduled date', () => {
    const w = makeWorkout({ recurrence: 'none', scheduled_date: '2026-07-13' })
    expect(isDueOn(w, '2026-07-13')).toBe(true)
    expect(isDueOn(w, '2026-07-14')).toBe(false)
  })

  it('daily is due every day', () => {
    const w = makeWorkout({ recurrence: 'daily' })
    expect(isDueOn(w, '2026-07-13')).toBe(true)
    expect(isDueOn(w, '2026-01-01')).toBe(true)
  })

  it('weekdays is due on listed weekday indices (0=Sun)', () => {
    const w = makeWorkout({ recurrence: 'weekdays', recurrence_days: [1, 3, 5] }) // Mon/Wed/Fri
    expect(isDueOn(w, '2026-07-13')).toBe(true) // Monday
    expect(isDueOn(w, '2026-07-14')).toBe(false) // Tuesday
    expect(isDueOn(w, '2026-07-15')).toBe(true) // Wednesday
    expect(isDueOn(w, '2026-07-12')).toBe(false) // Sunday
  })

  it('every_n_days lands on multiples of the interval from the start date', () => {
    const w = makeWorkout({
      recurrence: 'every_n_days',
      scheduled_date: '2026-07-13',
      recurrence_interval: 3,
    })
    expect(isDueOn(w, '2026-07-13')).toBe(true) // day 0
    expect(isDueOn(w, '2026-07-14')).toBe(false) // day 1
    expect(isDueOn(w, '2026-07-16')).toBe(true) // day 3
    expect(isDueOn(w, '2026-07-19')).toBe(true) // day 6
  })

  it('every_n_days is never due before its start date', () => {
    const w = makeWorkout({
      recurrence: 'every_n_days',
      scheduled_date: '2026-07-13',
      recurrence_interval: 2,
    })
    expect(isDueOn(w, '2026-07-11')).toBe(false)
  })
})

describe('isDoneOn', () => {
  it('is false when never completed', () => {
    expect(isDoneOn(makeWorkout(), '2026-07-13', 'UTC')).toBe(false)
  })

  it('matches the completion date in the user timezone', () => {
    // 01:00 UTC on the 13th is still the 12th in New York.
    const w = makeWorkout({ completed_at: '2026-07-13T01:00:00Z' })
    expect(isDoneOn(w, '2026-07-12', 'America/New_York')).toBe(true)
    expect(isDoneOn(w, '2026-07-13', 'America/New_York')).toBe(false)
    expect(isDoneOn(w, '2026-07-13', 'UTC')).toBe(true)
  })
})

describe('recurrenceLabel', () => {
  it('labels the common cadences', () => {
    expect(recurrenceLabel(makeWorkout({ recurrence: 'daily' }), t)).toBe('Every day')
    expect(recurrenceLabel(makeWorkout({ recurrence: 'none' }), t)).toBeNull()
    expect(
      recurrenceLabel(makeWorkout({ recurrence: 'every_n_days', recurrence_interval: 4 }), t),
    ).toBe('Every 4 days')
  })

  it('joins and sorts weekday labels', () => {
    const w = makeWorkout({ recurrence: 'weekdays', recurrence_days: [5, 1, 3] })
    expect(recurrenceLabel(w, t)).toBe('Mon · Wed · Fri')
  })

  it('treats all seven weekdays as "Every day"', () => {
    const w = makeWorkout({ recurrence: 'weekdays', recurrence_days: [0, 1, 2, 3, 4, 5, 6] })
    expect(recurrenceLabel(w, t)).toBe('Every day')
  })
})

describe('isRecurring', () => {
  it('is true for any schedule but a plain one-off', () => {
    expect(isRecurring(makeWorkout({ recurrence: 'none' }))).toBe(false)
    expect(isRecurring(makeWorkout({ recurrence: 'daily' }))).toBe(true)
  })
})

describe('isCompletedOn', () => {
  const finished = '2026-07-12T18:00:00Z'

  it('a recurring workout finished yesterday is not done today', () => {
    const w = makeWorkout({ recurrence: 'daily', completed_at: finished })
    expect(isCompletedOn(w, '2026-07-12', 'UTC')).toBe(true)
    expect(isCompletedOn(w, '2026-07-13', 'UTC')).toBe(false)
  })

  it('a one-off stays done once finished', () => {
    const w = makeWorkout({ completed_at: finished })
    expect(isCompletedOn(w, '2026-07-20', 'UTC')).toBe(true)
    expect(isCompletedOn(makeWorkout(), '2026-07-20', 'UTC')).toBe(false)
  })
})
