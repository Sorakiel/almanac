import { describe, expect, it } from 'vitest'
import { computeFocusInsights } from '@/features/insights/lib/computeFocusInsights'
import type { FocusInsightsRow } from '@/features/insights/api/focusInsights.api'

const TODAY = '2026-07-18'

function row(date: string, minutes: number): FocusInsightsRow {
  return { date, minutes }
}

describe('computeFocusInsights', () => {
  it('is empty for no sessions', () => {
    const out = computeFocusInsights([], TODAY)
    expect(out.hasData).toBe(false)
    expect(out.sessions30d).toBe(0)
    expect(out.minutes30d).toBe(0)
    expect(out.hoursTotal).toBe(0)
    expect(out.currentStreak).toBe(0)
  })

  it('sums minutes and sessions inside the 30-day window', () => {
    const out = computeFocusInsights(
      [row('2026-07-18', 25), row('2026-07-18', 20), row('2026-07-10', 45), row('2026-05-01', 60)],
      TODAY,
    )
    // The May session is outside the 30-day window.
    expect(out.sessions30d).toBe(3)
    expect(out.minutes30d).toBe(90)
    // All-time total including May: 150 min = 2.5h.
    expect(out.hoursTotal).toBe(2.5)
    expect(out.hasData).toBe(true)
  })

  it('counts the current streak of consecutive focus days ending today', () => {
    const out = computeFocusInsights(
      [row('2026-07-18', 15), row('2026-07-17', 25), row('2026-07-16', 30)],
      TODAY,
    )
    expect(out.currentStreak).toBe(3)
  })

  it('lets the streak run through yesterday when today has no focus yet', () => {
    const out = computeFocusInsights([row('2026-07-17', 25), row('2026-07-16', 25)], TODAY)
    expect(out.currentStreak).toBe(2)
  })

  it('buckets minutes by day in the heatmap, newest last', () => {
    const out = computeFocusInsights([row('2026-07-18', 25), row('2026-07-18', 15)], TODAY)
    const today = out.heatmap.at(-1)
    expect(today?.date).toBe(TODAY)
    expect(today?.minutes).toBe(40)
  })
})
