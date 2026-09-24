import { describe, expect, it } from 'vitest'
import { monthGrid } from '@/features/habits/lib/monthGrid'
import type { DayCell } from '@/features/habits/lib/schedule'

const cell = (date: string, over: Partial<DayCell> = {}): DayCell => ({
  date,
  done: false,
  frozen: false,
  status: 'missed',
  ...over,
})

describe('monthGrid', () => {
  it('starts on Monday and covers the whole month', () => {
    // 1 September 2026 is a Tuesday.
    const { leading, days } = monthGrid('2026-09-24', [], '2026-01-01')
    expect(leading).toBe(1)
    expect(days).toHaveLength(30)
    expect(days[0]).toMatchObject({ date: '2026-09-01', day: 1 })
  })

  it('marks done, frozen, today, the future and days before the habit', () => {
    const cells = [cell('2026-09-10', { done: true }), cell('2026-09-11', { frozen: true })]
    const { days } = monthGrid('2026-09-24', cells, '2026-09-05')
    const at = (d: number) => days[d - 1]!
    expect(at(4).state).toBe('void')
    expect(at(10).state).toBe('done')
    expect(at(11).state).toBe('frozen')
    expect(at(12).state).toBe('open')
    expect(at(24)).toMatchObject({ today: true, state: 'open' })
    expect(at(25).state).toBe('future')
  })

  it('handles a month that starts on Monday and on Sunday', () => {
    expect(monthGrid('2026-06-10', [], '2026-01-01').leading).toBe(0)
    expect(monthGrid('2026-11-10', [], '2026-01-01').leading).toBe(6)
  })
})
