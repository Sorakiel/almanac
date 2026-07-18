import { describe, expect, it } from 'vitest'
import { computeReflectInsights } from '@/features/insights/lib/computeReflectInsights'
import type { ReflectInsightsRow } from '@/features/insights/api/reflectInsights.api'

const TODAY = '2026-07-18'

function row(date: string, day_rating: number | null = null): ReflectInsightsRow {
  return { date, day_rating }
}

describe('computeReflectInsights', () => {
  it('is empty for no reflections', () => {
    const out = computeReflectInsights([], TODAY)
    expect(out.hasData).toBe(false)
    expect(out.entries30d).toBe(0)
    expect(out.currentStreak).toBe(0)
    expect(out.avgDayRating30d).toBeNull()
  })

  it('counts entries and distinct days in the last 30 days', () => {
    const out = computeReflectInsights(
      [row('2026-07-18'), row('2026-07-18'), row('2026-07-10'), row('2026-05-01')],
      TODAY,
    )
    expect(out.totalEntries).toBe(4)
    // The May entry is outside the 30-day window.
    expect(out.entries30d).toBe(3)
    // Two of those three fall on the same day.
    expect(out.daysJournaled30d).toBe(2)
    expect(out.hasData).toBe(true)
  })

  it('measures the current streak ending today', () => {
    const out = computeReflectInsights(
      [row('2026-07-18'), row('2026-07-17'), row('2026-07-16')],
      TODAY,
    )
    expect(out.currentStreak).toBe(3)
  })

  it('lets the streak run through yesterday when today is blank', () => {
    const out = computeReflectInsights([row('2026-07-17'), row('2026-07-16')], TODAY)
    expect(out.currentStreak).toBe(2)
  })

  it('averages only rated entries in the window, rounded to one decimal', () => {
    const out = computeReflectInsights(
      [row('2026-07-18', 5), row('2026-07-17', 4), row('2026-07-16', null)],
      TODAY,
    )
    expect(out.avgDayRating30d).toBe(4.5)
  })
})
