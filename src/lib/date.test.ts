import { describe, expect, it } from 'vitest'
import { isWeekendKey, lastNDateKeys, localDateKey, weekdayOfKey } from '@/lib/date'

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
