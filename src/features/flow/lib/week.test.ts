import { describe, expect, it } from 'vitest'
import { focusMinutesOn, focusWeek } from '@/features/flow/lib/week'
import { minutesAtAngle } from '@/features/flow/lib/duration'

const row = (date: string, minutes: number) => ({
  id: `${date}-${minutes}`,
  date,
  minutes,
  label: null,
  created_at: `${date}T10:00:00Z`,
})

describe('focusWeek', () => {
  it('sums each of the last seven days, today last', () => {
    const rows = [row('2026-09-27', 25), row('2026-09-27', 15), row('2026-09-21', 40)]
    const week = focusWeek(rows, '2026-09-27')
    expect(week).toHaveLength(7)
    expect(week[0]).toEqual({ key: '2026-09-21', minutes: 40, isToday: false })
    expect(week[6]).toEqual({ key: '2026-09-27', minutes: 40, isToday: true })
    expect(focusMinutesOn(rows, '2026-09-27')).toBe(40)
  })
})

describe('minutesAtAngle', () => {
  it('snaps to five minutes round a 120-minute turn', () => {
    expect(minutesAtAngle(Math.PI / 2)).toBe(30)
    expect(minutesAtAngle(Math.PI)).toBe(60)
    expect(minutesAtAngle((Math.PI * 2 * 26) / 120)).toBe(25)
  })

  it('reads the top of the dial as a full turn and never goes under five', () => {
    expect(minutesAtAngle(0)).toBe(120)
    expect(minutesAtAngle(0.01)).toBe(120)
    expect(minutesAtAngle((Math.PI * 2 * 3) / 120)).toBe(5)
  })
})
