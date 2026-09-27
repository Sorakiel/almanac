import { describe, expect, it } from 'vitest'
import { burstDots } from '@/lib/burst'

describe('burstDots', () => {
  it('makes 12 dots that fly 46–80 px, cycling sizes and colours', () => {
    const dots = burstDots(['a', 'b', 'c'], () => 0.5)
    expect(dots).toHaveLength(12)
    for (const d of dots) {
      const distance = Math.hypot(d.dx, d.dy)
      expect(distance).toBeGreaterThanOrEqual(45)
      expect(distance).toBeLessThanOrEqual(81)
    }
    expect(dots.slice(0, 3).map((d) => d.size)).toEqual([4, 6, 8])
    expect(dots.slice(0, 4).map((d) => d.color)).toEqual(['a', 'b', 'c', 'a'])
  })

  it('spreads the dots all the way round', () => {
    const dots = burstDots(['a'], () => 0)
    expect(dots[0]).toMatchObject({ dx: 46, dy: 0 })
    expect(dots[6]?.dx).toBe(-46)
  })
})
