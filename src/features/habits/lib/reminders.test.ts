import { describe, expect, it } from 'vitest'
import { formatReminder, parseReminder, planHabitReminders } from '@/features/habits/lib/reminders'
import type { HabitWithTodayLog } from '@/features/habits/types'

const HOUR = 3_600_000
// 09:00 in Moscow.
const NOW = new Date('2026-09-23T06:00:00Z')
const TZ = 'Europe/Moscow'

function habit(overrides: Partial<HabitWithTodayLog>): HabitWithTodayLog {
  return {
    id: 'h',
    name: 'Water',
    reminder_at: 11 * 60,
    archived_at: null,
    dueToday: true,
    isComplete: false,
    ...overrides,
  } as HabitWithTodayLog
}

describe('planHabitReminders', () => {
  it('fires later today while the habit is still owed', () => {
    expect(planHabitReminders([habit({})], TZ, NOW)[0]!.inMs).toBe(2 * HOUR)
  })

  it('waits for tomorrow once today is done or skipped', () => {
    expect(planHabitReminders([habit({ isComplete: true })], TZ, NOW)[0]!.inMs).toBe(26 * HOUR)
    expect(planHabitReminders([habit({ dueToday: false })], TZ, NOW)[0]!.inMs).toBe(26 * HOUR)
  })

  it('rolls a time already past to tomorrow', () => {
    expect(planHabitReminders([habit({ reminder_at: 8 * 60 })], TZ, NOW)[0]!.inMs).toBe(23 * HOUR)
  })

  it('skips habits without a reminder', () => {
    expect(planHabitReminders([habit({ reminder_at: null })], TZ, NOW)).toEqual([])
  })
})

describe('reminder time format', () => {
  it('round-trips minutes and clock text', () => {
    expect(formatReminder(660)).toBe('11:00')
    expect(formatReminder(5)).toBe('00:05')
    expect(parseReminder('07:30')).toBe(450)
    expect(parseReminder('24:00')).toBeNull()
    expect(parseReminder('')).toBeNull()
  })
})
