import { describe, expect, it } from 'vitest'
import { monthCells, moodFor } from './moods'

describe('monthCells', () => {
  it('lays out September 2026 from Tuesday the 1st', () => {
    const { lead, days } = monthCells('2026-09-27')
    expect(lead).toBe(1)
    expect(days).toHaveLength(30)
    expect(days[0]).toBe('2026-09-01')
    expect(days.at(-1)).toBe('2026-09-30')
  })

  it('needs no lead when the month starts on Monday', () => {
    expect(monthCells('2026-06-15').lead).toBe(0)
  })

  it('puts a Sunday 1st in the last column', () => {
    const { lead, days } = monthCells('2026-02-10')
    expect(lead).toBe(6)
    expect(days).toHaveLength(28)
  })
})

describe('moodFor', () => {
  it('maps the stored scale and rejects the rest', () => {
    expect(moodFor(5)?.key).toBe('great')
    expect(moodFor(null)).toBeNull()
    expect(moodFor(0)).toBeNull()
  })
})
