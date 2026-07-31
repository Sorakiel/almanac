import { describe, expect, it } from 'vitest'
import {
  isWeekendKey,
  lastNDateKeys,
  localDateKey,
  msUntilDailyTime,
  weekdayOfKey,
} from '@/lib/date'

describe('localDateKey', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(localDateKey('UTC', new Date('2026-07-13T10:00:00Z'))).toBe('2026-07-13')
  })

  it('resolves the LOCAL calendar day, not the UTC day', () => {
    // 01:00 UTC is still the previous evening in New York (UTC-4/5)...
    const instant = new Date('2026-07-13T01:00:00Z')
    expect(localDateKey('America/New_York', instant)).toBe('2026-07-12')
    // ...and already past midnight in Tokyo (UTC+9).
    expect(localDateKey('Asia/Tokyo', instant)).toBe('2026-07-13')
  })

  it('crosses midnight forward for positive offsets', () => {
    // 23:30 UTC on the 13th is 08:30 on the 14th in Tokyo.
    const instant = new Date('2026-07-13T23:30:00Z')
    expect(localDateKey('Asia/Tokyo', instant)).toBe('2026-07-14')
    expect(localDateKey('UTC', instant)).toBe('2026-07-13')
  })
})

describe('weekdayOfKey', () => {
  it('returns 0 for Sunday … 6 for Saturday', () => {
    expect(weekdayOfKey('2026-07-12')).toBe(0) // Sunday
    expect(weekdayOfKey('2026-07-13')).toBe(1) // Monday
    expect(weekdayOfKey('2026-07-18')).toBe(6) // Saturday
  })

  it('is timezone-independent (UTC math on the key)', () => {
    // A pure key computation must not shift near month boundaries.
    expect(weekdayOfKey('2026-01-01')).toBe(4) // Thursday
    expect(weekdayOfKey('2026-12-31')).toBe(4) // Thursday
  })
})

describe('isWeekendKey', () => {
  it('flags Saturday and Sunday only', () => {
    expect(isWeekendKey('2026-07-11')).toBe(true) // Saturday
    expect(isWeekendKey('2026-07-12')).toBe(true) // Sunday
    expect(isWeekendKey('2026-07-13')).toBe(false) // Monday
  })
})

describe('lastNDateKeys', () => {
  it('returns n keys, oldest→newest, ending at endKey', () => {
    expect(lastNDateKeys('2026-07-13', 3)).toEqual(['2026-07-11', '2026-07-12', '2026-07-13'])
  })

  it('spans a month boundary correctly', () => {
    expect(lastNDateKeys('2026-03-02', 4)).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })

  it('handles a single day', () => {
    expect(lastNDateKeys('2026-07-13', 1)).toEqual(['2026-07-13'])
  })
})

describe('msUntilDailyTime at midnight', () => {
  // This drives the day-rollover alarm in useDayKey. If it wakes early, the app
  // keeps writing habit logs to the previous day; if it never wakes, a session
  // left open overnight does the same.
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE

  it('counts down to the next local midnight', () => {
    // 23:30 UTC → half an hour left in the UTC day.
    expect(msUntilDailyTime(0, 0, 'UTC', new Date('2026-07-13T23:30:00Z'))).toBe(30 * MINUTE)
  })

  it('measures midnight in the given zone, not UTC', () => {
    // The same instant is 08:30 on the 14th in Tokyo — 15.5 hours to go.
    const instant = new Date('2026-07-13T23:30:00Z')
    expect(msUntilDailyTime(0, 0, 'Asia/Tokyo', instant)).toBe(15 * HOUR + 30 * MINUTE)
    // ...and 19:30 on the 13th in New York — 4.5 hours to go.
    expect(msUntilDailyTime(0, 0, 'America/New_York', instant)).toBe(4 * HOUR + 30 * MINUTE)
  })

  it('rolls to tomorrow when it is already exactly midnight', () => {
    // The day has just turned, so the next alarm belongs to the following one —
    // never 0, which would spin the timer.
    expect(msUntilDailyTime(0, 0, 'UTC', new Date('2026-07-13T00:00:00Z'))).toBe(24 * HOUR)
  })

  it('always lands on a later calendar day than it started on', () => {
    // The invariant the alarm relies on: waking at the scheduled time (plus the
    // 1s buffer useDayKey adds) must resolve to a NEW local date, in every zone
    // and at every hour — including across a DST shift.
    const zones = ['UTC', 'Europe/Moscow', 'Asia/Tokyo', 'America/New_York', 'Australia/Lord_Howe']
    const instants = [
      '2026-01-15T00:00:01Z',
      '2026-03-08T06:59:00Z', // US DST spring-forward
      '2026-07-13T12:00:00Z',
      '2026-10-25T00:30:00Z', // EU DST fall-back
      '2026-12-31T23:59:00Z', // year boundary
    ]

    for (const zone of zones) {
      for (const iso of instants) {
        const now = new Date(iso)
        const wake = new Date(now.getTime() + msUntilDailyTime(0, 0, zone, now) + 1_000)
        expect(
          localDateKey(zone, wake),
          `${zone} @ ${iso} woke on the same day`,
        ).not.toBe(localDateKey(zone, now))
      }
    }
  })
})
