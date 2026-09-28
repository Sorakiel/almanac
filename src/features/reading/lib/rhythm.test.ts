import { describe, expect, it } from 'vitest'
import {
  dailyAverage,
  daysToFinish,
  finishedThisYear,
  readingStreak,
  unitsPerDay,
} from '@/features/reading/lib/rhythm'

const s = (date: string, units_read: number) => ({ date, units_read })

describe('unitsPerDay', () => {
  it('sums a day across books, oldest first, zero for idle days', () => {
    const out = unitsPerDay(
      [s('2026-09-27', 10), s('2026-09-27', 5), s('2026-09-25', 7)],
      '2026-09-27',
      3,
    )
    expect(out).toEqual([7, 0, 15])
  })
})

describe('dailyAverage', () => {
  it('counts idle days', () => {
    expect(dailyAverage([14, 0, 16, 0])).toBe(8)
    expect(dailyAverage([])).toBe(0)
  })
})

describe('readingStreak', () => {
  it('runs back from today', () => {
    expect(
      readingStreak([s('2026-09-27', 1), s('2026-09-26', 3), s('2026-09-24', 2)], '2026-09-27'),
    ).toBe(2)
  })
  it('keeps yesterday’s streak alive before today’s reading', () => {
    expect(readingStreak([s('2026-09-26', 3), s('2026-09-25', 2)], '2026-09-27')).toBe(2)
  })
  it('ignores sessions with no units (focus-only)', () => {
    expect(readingStreak([s('2026-09-27', 0)], '2026-09-27')).toBe(0)
  })
})

describe('daysToFinish', () => {
  it('rounds up', () => {
    expect(daysToFinish(108, 14)).toBe(8)
  })
  it('is unknown without a pace or a length', () => {
    expect(daysToFinish(108, 0)).toBeNull()
    expect(daysToFinish(null, 14)).toBeNull()
    expect(daysToFinish(0, 14)).toBeNull()
  })
})

describe('finishedThisYear', () => {
  it('counts finished books dated this year only', () => {
    const books = [
      { status: 'finished' as const, finished_on: '2026-08-30' },
      { status: 'finished' as const, finished_on: '2025-12-30' },
      { status: 'reading' as const, finished_on: null },
    ]
    expect(finishedThisYear(books, '2026-09-27')).toBe(1)
  })
})
