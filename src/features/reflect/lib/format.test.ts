import { describe, expect, it } from 'vitest'
import { journalStreak, reflectionDateLabel } from '@/features/reflect/lib/format'

describe('reflectionDateLabel', () => {
  // Punctuation between the weekday and day is ICU/locale-dependent (Node omits
  // the comma a browser adds), so assert the parts, not the exact separator.
  it('formats a key as weekday + day + month', () => {
    expect(reflectionDateLabel('2026-07-13')).toMatch(/^Monday.* 13 July$/)
  })

  it('does not drift across month boundaries', () => {
    expect(reflectionDateLabel('2026-03-01')).toMatch(/^Sunday.* 1 March$/)
  })
})

describe('journalStreak', () => {
  it('counts consecutive days ending today', () => {
    const days = new Set(['2026-07-11', '2026-07-12', '2026-07-13'])
    expect(journalStreak(days, '2026-07-13')).toBe(3)
  })

  it('still counts a run ending yesterday when today is blank', () => {
    const days = new Set(['2026-07-11', '2026-07-12'])
    expect(journalStreak(days, '2026-07-13')).toBe(2)
  })

  it('stops at the first gap', () => {
    const days = new Set(['2026-07-09', '2026-07-12', '2026-07-13'])
    expect(journalStreak(days, '2026-07-13')).toBe(2)
  })

  it('is zero when neither today nor yesterday has an entry', () => {
    const days = new Set(['2026-07-10'])
    expect(journalStreak(days, '2026-07-13')).toBe(0)
  })

  it('is zero for an empty journal', () => {
    expect(journalStreak(new Set(), '2026-07-13')).toBe(0)
  })

  it('spans a month boundary', () => {
    const days = new Set(['2026-02-27', '2026-02-28', '2026-03-01'])
    expect(journalStreak(days, '2026-03-01')).toBe(3)
  })
})
